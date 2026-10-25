"""Fictional transcripts only. Optional preserved-model tests never open patient archives."""
import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from fastapi.testclient import TestClient
from pydantic import ValidationError

from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.loader import normalise_catalogue
from models.medassist_v2.research_adapter.protocol_integrity import protocol as portable_protocol
from models.medassist_v2.research_adapter.app import create_app, from_environment
from models.medassist_v2.research_adapter.schemas import NextRequest, NextResponse
from models.medassist_v2.research_adapter.service import ArtifactUnavailable, ModelA, checked_bytes, load_preserved
from models.medassist_v2.simulator import OfflineCase
from models.medassist_v2.training.data import file_hash
from models.medassist_v2.training.fictional import FictionalDataset, NonLearningEstimator
from models.medassist_v2.training.flow import hasher, tokens_many
from models.medassist_v2.validation import InvalidRecord, read_json

TOKEN = 'fictional-test-token-not-a-secret-' * 2
URL = '/research/model-a/v1/next'


def answer(eid, state='confirmed', value=True):
    return {'evidence_id': eid, 'state': state, 'value': value}


def payload(initial='E_0', answers=None, age=35, sex='F'):
    return {'schema_version': 'model-a.request.v1', 'fictional_case': True,
            'context': {'age': age, 'source_sex': sex}, 'initial': answer(initial),
            'answers': answers or []}


def client(service=None, enabled=True, token=TOKEN):
    return TestClient(create_app(service=service, enabled=enabled, token=token),
                      base_url='http://127.0.0.1', client=('127.0.0.1', 43210),
                      headers={'Authorization': 'Bearer '+TOKEN})


class AdapterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = portable_protocol()
        cls.fixture = FictionalDataset(cls.p)
        cls.service = ModelA(cls.p, normalise_catalogue(cls.fixture.source)['evidences'],
                             NonLearningEstimator(cls.p, 1e-5))

    def test_versioned_output_and_pending_not_answered(self):
        with client(self.service) as api:
            response = api.post(URL, json=payload())
        self.assertEqual(response.status_code, 200)
        out = NextResponse.model_validate(response.json())
        self.assertEqual(out.status, 'question')
        self.assertEqual(out.state.questions_answered, 0)
        self.assertEqual(out.state.pending_question_id, out.question.evidence_id)
        self.assertEqual(out.evidence.origin, 'developer_fictional_fixture')
        self.assertFalse(out.evidence.human_clinical_review)

    def test_frozen_mask_and_reference_token_parity(self):
        for state, value in [('unknown', None), ('confirmed', False), ('confirmed', True)]:
            request = NextRequest.model_validate(payload(answers=[answer('E_53', state, value)]))
            view = self.service.view(request)
            eligible = ref.eligible_questions(view, self.p)
            self.assertEqual('E_54' in eligible, value is True)
            self.assertFalse(set(ref.ORPHANS) & set(eligible))
            self.assertNotIn('E_53', eligible)
            self.assertEqual(list(tokens_many(view, eligible, self.p)),
                             [ref.feature_tokens(view, eid, self.p) for eid in eligible])

    def test_unknown_negative_default_empty_and_mixed_preserved(self):
        for event in [answer('E_53', 'unknown', None), answer('E_53', value=False),
                      answer('E_204', value=0), answer('E_55', value=[]),
                      answer('E_55', value=['NA', 'a'])]:
            prior = [answer('E_53')] if event['evidence_id'] == 'E_55' else []
            req = NextRequest.model_validate(payload(answers=prior+[event]))
            out = self.service.next(req)
            self.assertEqual(out.status, 'question')
            self.assertEqual(out.evidence.answers[-1].model_dump(), event)
        unknown = self.service.view(NextRequest.model_validate(payload(answers=[answer('E_53', 'unknown', None)])))
        negative = self.service.view(NextRequest.model_validate(payload(answers=[answer('E_53', value=False)])))
        self.assertNotEqual(ref.feature_tokens(unknown, 'E_1', self.p), ref.feature_tokens(negative, 'E_1', self.p))

    def test_invalid_dependency_duplicate_and_quarantine_abstain(self):
        examples = [[answer('E_54', value=[])], [answer('E_53', value=False), answer('E_54', value=[])],
                    [answer('E_53'), answer('E_53')], [answer('E_0')], [answer('E_69')], [answer('E_999')]]
        for events in examples:
            result = self.service.next(NextRequest.model_validate(payload(answers=events)))
            self.assertEqual(result.status, 'abstained')
            self.assertIsNone(result.question)
            self.assertIsNone(result.evidence)

    def test_typed_values_reject_bool_category_and_unknown_value(self):
        result = self.service.next(NextRequest.model_validate(payload(answers=[answer('E_204', value=False)])))
        self.assertEqual(result.status, 'abstained')
        with self.assertRaises(ValidationError):
            NextRequest.model_validate(payload(answers=[answer('E_53', 'unknown', False)]))

    def test_negative_binary_initial_abstains_but_followup_false_is_preserved(self):
        req = payload(); req['initial']['value'] = False
        with client(self.service) as api:
            response = api.post(URL, json=req)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['reason'], 'negative_binary_initial_unsupported')
        self.assertIsNone(response.json()['question'])
        followup = self.service.next(NextRequest.model_validate(payload(answers=[answer('E_53',value=False)])))
        self.assertEqual(followup.evidence.answers[0].value, False)

    def test_exponent_overflow_is_rejected_without_input_echo(self):
        raw = json.dumps(payload()).replace('"age": 35', '"age": 1e999')
        with client(self.service) as api:
            response = api.post(URL, content=raw, headers={'Content-Type':'application/json'})
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json(), {'detail':'invalid_request_schema'})

    def test_contradictions_and_user_stop(self):
        req = payload(answers=[answer('E_53', 'contradiction', None)])
        out = self.service.next(NextRequest.model_validate(req))
        self.assertEqual(out.reason, 'unresolved_contradiction')
        self.assertIsNone(out.question)
        req = payload(); req['stop'] = 'user_stopped'
        self.assertEqual(self.service.next(NextRequest.model_validate(req)).reason, 'user_stopped')

    def test_budget_and_no_eligible_questions(self):
        # Exhaustion is also tested with a small, software-only catalogue.
        tiny = ModelA(self.p, {eid:self.service.definitions[eid] for eid in ('E_0', 'E_1')},
                      NonLearningEstimator(self.p, 1e-5))
        out = tiny.next(NextRequest.model_validate(payload(answers=[answer('E_1', 'unknown', None)])))
        self.assertEqual(out.reason, 'no_eligible_questions')
        # Twenty valid root questions exercise the frozen stopping budget, with no data records.
        definitions = {f'E_{i}': {'kind':'symptom', 'data_type':'B', 'question_en':'Fictional?', 'possible_values':[]}
                       for i in range(21)}
        bounded = ModelA(self.p, definitions, NonLearningEstimator(self.p, 1e-5))
        req = payload(answers=[answer(f'E_{i}', 'unknown', None) for i in range(1,21)])
        result = bounded.next(NextRequest.model_validate(req))
        self.assertEqual(result.reason, 'question_budget')
        self.assertEqual(result.state.remaining_budget, 0)

    def test_no_missing_context_imputation_or_extra_fields(self):
        variants = []
        for key in ('age', 'source_sex'):
            req = payload(); req['context'][key] = None; variants.append(req)
        req = payload(); req['diagnosis'] = 'private-input-must-not-echo'; variants.append(req)
        req = payload(); req['fictional_case'] = False; variants.append(req)
        req = payload(); req['fictional_case'] = 1; variants.append(req)
        req = payload(age=True); variants.append(req)
        with client(self.service) as api:
            for req in variants:
                response = api.post(URL, json=req)
                self.assertEqual(response.status_code, 422)
                self.assertEqual(response.json(), {'detail':'invalid_request_schema'})

    def test_api_is_opt_in_authenticated_local_and_browser_blocked(self):
        with client(self.service, enabled=False) as api:
            self.assertEqual(api.post(URL, json=payload()).status_code, 503)
        with client(self.service) as api:
            self.assertEqual(api.post(URL, json=payload(), headers={'Authorization':'bad'}).status_code, 401)
            self.assertEqual(api.post(URL, json=payload(), headers={'Origin':'http://localhost'}).status_code, 403)
            self.assertEqual(api.post(URL, json=payload(), headers={'Host':'attacker.example'}).status_code, 403)
            self.assertEqual(api.get('/api/medassist/structure').status_code, 404)
            self.assertEqual(api.get('/openapi.json').status_code, 404)
        remote = TestClient(create_app(service=self.service, enabled=True, token=TOKEN),
                            base_url='http://127.0.0.1', client=('192.0.2.1', 123))
        with remote:
            self.assertEqual(remote.post(URL, json=payload()).status_code, 403)

    def test_unavailable_and_bad_environment_fail_closed(self):
        with client() as api:
            self.assertEqual(api.post(URL, json=payload()).status_code, 503)
        with patch.dict(os.environ, {'MEDASSIST_A_ENABLE_RESEARCH':'0'}), \
             patch('models.medassist_v2.research_adapter.app.load_preserved') as load:
            from_environment(); load.assert_not_called()
        with patch.dict(os.environ, {'MEDASSIST_A_ENABLE_RESEARCH':'1', 'MEDASSIST_A_TOKEN':TOKEN}), \
             patch('models.medassist_v2.research_adapter.app.load_preserved', side_effect=ArtifactUnavailable('private-path')):
            with TestClient(from_environment(), base_url='http://127.0.0.1', client=('127.0.0.1', 123),
                            headers={'Authorization':'Bearer '+TOKEN}) as api:
                response = api.post(URL, json=payload())
                self.assertEqual(response.status_code, 503)
                self.assertNotIn('private-path', response.text)

    def test_duplicate_json_nonfinite_and_body_limit(self):
        with client(self.service) as api:
            for raw in ['{"fictional_case":true,"fictional_case":false}', '{"age":NaN}']:
                self.assertEqual(api.post(URL, content=raw, headers={'Content-Type':'application/json'}).status_code, 422)
            self.assertEqual(api.post(URL, content=b'x'*65537).status_code, 413)

    def test_missing_corrupt_or_path_escape_artifact_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            for name in ['missing.pkl', '../escape.pkl']:
                with self.assertRaises(InvalidRecord):
                    checked_bytes(root, name, '0'*64, 100)
            (root/'fixture.pkl').write_bytes(b'not-a-pickle')
            with self.assertRaises(InvalidRecord):
                checked_bytes(root, 'fixture.pkl', '0'*64, 100)
            with self.assertRaises(ArtifactUnavailable):
                load_preserved(str(root/'missing'), str(root/'metadata'))

    def test_invalid_model_output_abstains(self):
        broken = copy.copy(self.service)
        broken.policy = lambda _view: 'E_999'
        self.assertEqual(broken.next(NextRequest.model_validate(payload())).reason, 'inference_unavailable')

    def test_exported_contracts_match_and_output_invariants(self):
        directory = ref.HERE/'research_adapter'
        for name,contract in [('request.schema.json',NextRequest),('response.schema.json',NextResponse)]:
            self.assertEqual(json.loads((directory/name).read_text()),contract.model_json_schema())
        bad = self.service.next(NextRequest.model_validate(payload())).model_dump()
        bad['question'] = None
        with self.assertRaises(ValidationError):
            NextResponse.model_validate(bad)

    def test_existing_application_does_not_import_research_adapter(self):
        repo = ref.HERE.parents[1]
        for path in [repo/'server.ts', *(repo/'server').glob('*.ts')]:
            self.assertNotIn('research_adapter',path.read_text(encoding='utf-8'))


@unittest.skipUnless(os.environ.get('MEDASSIST_A_RUN_ROOT') and os.environ.get('MEDASSIST_A_METADATA_ROOT'),
                     'preserved local artifacts must be explicitly configured')
class PreservedModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(os.environ['MEDASSIST_A_RUN_ROOT']).resolve()
        cls.receipt = read_json(ref.HERE/'task4b-aggregate.json')
        cls.before = {n: file_hash(cls.root/n) for n in cls.receipt['artifact_hashes']}
        cls.service = load_preserved(str(cls.root), os.environ['MEDASSIST_A_METADATA_ROOT'])
        cls.initial = next(eid for eid,d in cls.service.definitions.items()
                           if d['kind']=='symptom' and d['data_type']=='B' and eid not in ref.EDGES)

    @classmethod
    def tearDownClass(cls):
        assert {n: file_hash(cls.root/n) for n in cls.before} == cls.before
        assert cls.before == cls.receipt['artifact_hashes']

    def test_real_model_reference_parity_repeatability_and_schema(self):
        for age in [0,4,16,35,75]:
            for sex in ['M','F']:
                for state,value in [('unknown',None),('confirmed',False),('confirmed',True)]:
                    req = NextRequest.model_validate(payload(self.initial, [answer('E_53',state,value)],age,sex))
                    view = self.service.view(req)
                    candidates = ref.eligible_questions(view,self.service.p)
                    xs = hasher(self.service.p).transform([ref.feature_tokens(view,eid,self.service.p) for eid in candidates])
                    expected = candidates[int(np.argmax(self.service.policy.model.decision_function(xs)))]
                    out = self.service.next(req)
                    self.assertEqual(out.question.evidence_id, expected)
                    self.assertEqual(out.model_dump(), self.service.next(req).model_dump())
                    NextResponse.model_validate(out.model_dump())

    def test_fictional_simulator_view_and_policy_match(self):
        raw = {'AGE':35,'SEX':'F','INITIAL_EVIDENCE':self.initial,
               'EVIDENCES':[self.initial,'E_53'], 'PATHOLOGY':'FICTIONAL_ONLY',
               'DIFFERENTIAL_DIAGNOSIS':[['FICTIONAL_ONLY',1.0]]}
        catalogue = {'catalogue_id':'fixture', 'evidences':self.service.definitions}
        staged = OfflineCase(raw,catalogue,'train').start(disclose_demographics=True,question_budget=20)
        events = []
        for _ in range(5):
            req = NextRequest.model_validate(payload(self.initial,events))
            actual = self.service.next(req).question.evidence_id
            self.assertEqual(actual,self.service.policy(staged.view()))
            staged.ask(actual)
            disclosed = next(a for a in staged.view()['revealed_answers'] if a['evidence_id']==actual)
            events.append({k:disclosed[k] for k in ('evidence_id','state','value')})
        from models.medassist_v2.research_adapter.handoff import build_handoff
        result = self.service.next(NextRequest.model_validate(payload(self.initial,events)))
        handoff = build_handoff(self.service,result.evidence)
        self.assertEqual(len(handoff.items),223)
        self.assertEqual(sum(item.status=='unsupported' for item in handoff.items),5)
        pending = next(item for item in handoff.items if item.evidence_id==result.question.evidence_id)
        self.assertEqual(pending.status,'not_asked')

    def test_model_bytes_corruption_stops_before_unpickle(self):
        from models.medassist_v2.research_adapter import service as module
        original = module.checked_bytes
        def corrupt(root,name,digest,maximum):
            if name.endswith('.pkl'):
                raise InvalidRecord('artifact_digest')
            return original(root,name,digest,maximum)
        with patch.object(module,'checked_bytes',side_effect=corrupt), patch.object(module.pickle,'loads') as unpickle:
            with self.assertRaises(ArtifactUnavailable):
                load_preserved(str(self.root),os.environ['MEDASSIST_A_METADATA_ROOT'])
            unpickle.assert_not_called()

    def test_demo_uses_actual_frozen_ranker_and_exports_unchanged_contract(self):
        from models.medassist_v2.research_adapter.demo import demo_fixtures, interview
        req=demo_fixtures(self.service).fixtures[0].request
        result=interview(self.service,req)
        self.assertEqual(result.selection.question.evidence_id,self.service.policy(self.service.view(req)))
        self.assertEqual(result.handoff.schema_version,'model-a-to-b.evidence.v1')
        self.assertEqual(len(result.handoff.items),223)


if __name__ == '__main__':
    unittest.main()
