"""Read-only trusted-artifact loading and the existing frozen Policy, without oracles."""
import copy
import hashlib
import json
import pickle
import threading
from pathlib import Path

import numpy as np
from sklearn.linear_model import SGDClassifier
from threadpoolctl import threadpool_limits

from .. import questioning_protocol as ref
from ..loader import DatasetLoader, normalise_catalogue
from ..storage import external_path
from ..training.data import environment, file_hash, implementation_hashes
from ..training.flow import Policy
from .protocol_integrity import protocol, historical_digest
from ..validation import InvalidRecord, read_json, require, validate_value
from .schemas import Evidence, NextRequest, NextResponse, Question, QuestioningState

LIMITATIONS = [
    'Fictional coded research inputs only; questions are not clinically reviewed for patient use.',
    'Selects synthetic evidence-collection questions, not diagnosis, urgency, severity or care advice.',
    'No free-text interpretation, clinical safety rules, treatment or home-care assessment.',
    'Required source AGE/SEX and encoded vocabulary differ from APIP clinical intake.',
    'Unobserved evidence is unknown; this output is not validated input for a clinical Model B.',
]


class ArtifactUnavailable(ValueError):
    """Value-free error; private filesystem details must never enter HTTP responses."""


def checked_bytes(root, name, digest, maximum):
    """Hash the exact bounded byte snapshot later parsed/unpickled, never reopen it."""
    require(Path(name).name == name and '/' not in name and '\\' not in name, 'artifact_name')
    path = root / name
    require(not path.is_symlink() and path.resolve().parent == root and path.is_file(), 'artifact_path')
    with path.open('rb') as stream:
        data = stream.read(maximum + 1)
    require(len(data) <= maximum and hashlib.sha256(data).hexdigest() == digest, 'artifact_digest')
    return data


def load_preserved(run_root, metadata_root):
    """Verify 17 run artifacts; read evidence metadata only, never patient archives/ledger.

    Trust anchor: reviewed repository Task 4B receipt. Pickle is trusted local code,
    not a format for uploads. Source archive hashes are prior attestations, not
    re-read here; the metadata used by inference is independently verified now.
    """
    try:
        p = protocol()
        environment(p)
        root, source_root = external_path(run_root), external_path(metadata_root)
        require(not (root == source_root or root.is_relative_to(source_root)
                     or source_root.is_relative_to(root)), 'root_overlap')
        receipt = read_json(ref.HERE / 'task4b-aggregate.json')
        seal_bytes = checked_bytes(root, 'pre-test-seal.json', receipt['seal_sha256'], 1024 * 1024)
        seal = json.loads(seal_bytes)
        require(read_json(root / 'pre-test-seal-hash.json')['sha256'] == receipt['seal_sha256'], 'seal_receipt')
        require(seal['run_root'] == str(root) and seal['mode'] == 'official', 'seal_root_mode')
        require(seal['protocol_sha256'] == historical_digest()
                and seal['implementation'] == implementation_hashes(), 'frozen_code_changed')
        require(seal['source_hashes'] == receipt['source_hashes']
                and seal['artifacts'] == receipt['artifact_hashes']
                and len(seal['artifacts']) == 17, 'published_receipt_changed')
        require(not (root / 'fit-failure.json').exists(), 'fit_failed')
        for name, digest in seal['artifacts'].items():
            require(Path(name).name == name and not (root / name).is_symlink()
                    and (root / name).resolve().parent == root, 'artifact_path')
            require(file_hash(root / name) == digest, 'sealed_artifact_changed')
        selection = json.loads(checked_bytes(root, 'selection.json', seal['artifacts']['selection.json'], 1024 * 1024))
        require(selection['selected_alpha'] == seal['selected_alpha'] == 1e-5, 'wrong_selected_model')
        source = DatasetLoader(source_root)._metadata('release_evidences.json')
        ref.validate_metadata(source, p)
        # No other alpha is deserialized. Hash-before-unpickle on these same bytes.
        data = checked_bytes(root, 'model-1e-05.pkl', seal['artifacts']['model-1e-05.pkl'], 16 * 1024 * 1024)
        model = pickle.loads(data)
        require(type(model) is SGDClassifier and model.alpha == 1e-5
                and model.n_features_in_ == 65536 and model.classes_.tolist() == [0, 1]
                and np.isfinite(model.coef_).all() and np.isfinite(model.intercept_).all(), 'model_shape')
        service = ModelA(p, normalise_catalogue(source)['evidences'], model)
        service.value_labels = {eid: {str(v): source.get(eid,{}).get('value_meaning',{}).get(str(v),{}).get('en')
                                    for v in d['possible_values']
                                    if isinstance(source.get(eid,{}).get('value_meaning',{}).get(str(v),{}).get('en'),str)}
                                for eid,d in service.definitions.items()}
        return service
    except Exception:
        raise ArtifactUnavailable('artifact_unavailable_or_integrity_failed') from None


class ModelA:
    def __init__(self, p, definitions, model):
        self.p = p
        self.definitions = copy.deepcopy(definitions)
        self.catalogue = {eid: {k: d[k] for k in ('data_type', 'question_en', 'possible_values')}
                          for eid, d in self.definitions.items()}
        self.policy = Policy('ranker', p, model=model)
        self.lock = threading.Lock()

    @staticmethod
    def abstain(reason):
        # Invalid transcripts are never echoed or promoted to Model B evidence.
        return NextResponse(status='abstained', reason=reason, question=None,
                            state=None, evidence=None, limitations=LIMITATIONS)

    def view(self, request):
        """Replay supplied disclosures, validating chronological eligibility at each step."""
        initial = request.initial
        self.check_answer(initial)
        require(initial.state == 'confirmed' and self.definitions[initial.evidence_id]['kind'] == 'symptom',
                'unsupported_initial')
        # A source binary INITIAL_EVIDENCE is an explicitly encoded true symptom.
        # False is valid as a later disclosed answer, not as this initial premise.
        require(self.definitions[initial.evidence_id]['data_type'] != 'B' or initial.value is True,
                'negative_binary_initial_unsupported')
        require(initial.evidence_id not in ref.EDGES, 'conditional_initial_unsupported')
        view = {'schema_version': 'medassist-selector-v2-task2',
                'presenting_complaint': {'initial_evidence_id': initial.evidence_id},
                'disclosed_context': request.context.model_dump(), 'question_catalogue': self.catalogue,
                'asked_questions': [], 'revealed_answers': [initial.model_dump()],
                'unknown_answers': [], 'answer_history': [initial.model_dump()],
                'contradictions': [], 'stopping_reason': None}
        for answer in request.answers:
            self.check_answer(answer)
            require(answer.evidence_id != initial.evidence_id and answer.evidence_id not in view['asked_questions'],
                    'duplicate_question')
            require(answer.evidence_id in ref.eligible_questions(view, self.p), 'invalid_dependency_or_stopped_history')
            event = answer.model_dump()
            view['asked_questions'].append(answer.evidence_id)
            view['revealed_answers'].append(event)
            view['answer_history'].append(event)
            if answer.state == 'unknown':
                view['unknown_answers'].append(answer.evidence_id)
            elif answer.state == 'contradiction':
                view['contradictions'].append({'evidence_id': answer.evidence_id, 'status': 'unresolved'})
        if request.stop:
            view['stopping_reason'] = request.stop
        ref.checked_view(view)
        return view

    def check_answer(self, answer):
        eid = answer.evidence_id
        require(eid in self.definitions and eid not in ref.ORPHANS, 'unsupported_evidence')
        if answer.state == 'confirmed':
            validate_value(answer.value, self.definitions[eid])

    def next(self, request: NextRequest):
        try:
            view = self.view(request)
        except InvalidRecord as exc:
            # All frozen validator messages are value-free category codes.
            return self.abstain(str(exc))
        stop = ('unresolved_contradiction' if view['contradictions'] else view['stopping_reason'])
        if not stop and len(request.answers) >= 20:
            stop = 'question_budget'
        eligible = ref.eligible_questions(view, self.p)
        if not stop and not eligible:
            stop = 'no_eligible_questions'
        question = None
        if not stop:
            try:
                # threadpool_limits changes process state: serialize calls in this single-worker prototype.
                with self.lock, threadpool_limits(limits=1):
                    eid = self.policy(view)
                require(eid in eligible, 'invalid_policy_output')
                d = self.catalogue[eid]
                question = Question(evidence_id=eid, **d)
            except Exception:
                return self.abstain('inference_unavailable')
        return NextResponse(status='abstained' if stop else 'question', reason=stop, question=question,
                            state=QuestioningState(answered_question_ids=list(view['asked_questions']),
                                                  pending_question_id=question.evidence_id if question else None,
                                                  questions_answered=len(request.answers),
                                                  remaining_budget=20-len(request.answers), stopping_reason=stop),
                            evidence=Evidence(context=request.context, initial=request.initial, answers=request.answers),
                            limitations=LIMITATIONS)
