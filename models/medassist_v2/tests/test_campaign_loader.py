"""Lightweight unit tests for the new-campaign Model A loader and guarded wiring.

Uses tiny in-memory/tempdir synthetic fixtures and fictional transcripts only.
Never runs heavy validation, opens locked-test partitions, or alters research runs.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import pickle
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from fastapi.testclient import TestClient

from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.loader import DatasetLoader
from models.medassist_v2.research_adapter import campaign_loader
from models.medassist_v2.research_adapter.app import from_environment
from models.medassist_v2.research_adapter.campaign_loader import (
    EXPECTED_SEALED_ARTIFACTS,
    HISTORICAL_TASK4B_SEAL_SHA256,
    LOADER_VERSION,
    check_campaign_completion_gate,
    load_campaign_model,
)
from models.medassist_v2.research_adapter.protocol_integrity import (
    CANONICAL_SHA256,
    HISTORICAL_SHA256,
    authenticated_bytes,
)
from models.medassist_v2.research_adapter.schemas import NextRequest, NextResponse
from models.medassist_v2.research_adapter.service import ArtifactUnavailable, load_preserved
from models.medassist_v2.training.data import file_hash, implementation_hashes
from models.medassist_v2.training.fictional import FictionalDataset
from models.medassist_v2.training.flow import estimator, hasher

TOKEN = 'fictional-campaign-test-token-not-a-secret-' * 2


def _write_json(path: Path, data: object) -> str:
    raw = (json.dumps(data, sort_keys=True, allow_nan=False, indent=2) + '\n').encode('utf-8')
    path.write_bytes(raw)
    return hashlib.sha256(raw).hexdigest()


def _create_synthetic_sealed_bundle(
    root: Path,
    metadata_root: Path,
    *,
    campaign_id: str = 'campaign-2026-v1',
    selected_alpha: float = 1e-5,
):
    raw_proto = authenticated_bytes(ref.PROTOCOL)
    active_proto_sha = hashlib.sha256(raw_proto).hexdigest()
    rep = 'CRLF' if b'\r' in raw_proto else 'LF'
    p = ref.validate_protocol(json.loads(raw_proto.decode('utf-8')))

    fixture = FictionalDataset(p)
    evidences_bytes = (
        json.dumps(fixture.source, sort_keys=True, allow_nan=False, indent=2) + '\n'
    ).encode('utf-8')
    (metadata_root / 'release_evidences.json').write_bytes(evidences_bytes)
    source_hashes = {
        'release_evidences.json': hashlib.sha256(evidences_bytes).hexdigest(),
        'release_conditions.json': '1' * 64,
        'release_train_patients.zip': '2' * 64,
        'release_validate_patients.zip': '3' * 64,
        'release_test_patients.zip': '4' * 64,
    }

    impl = implementation_hashes()
    resolved_run = str(root.resolve())

    # Fit a tiny 2-row SGDClassifier matching the frozen 65,536-dim schema in milliseconds.
    x = hasher(p).transform([['fictional=1'], ['fictional=2']])
    y = np.array([0, 1])
    fit_results = []
    for alpha in p['ranking_model']['alpha_grid']:
        model = estimator(p, alpha)
        model.partial_fit(x, y, classes=np.array([0, 1]))
        name = f'model-{alpha}.pkl'
        model_bytes = pickle.dumps(model)
        (root / name).write_bytes(model_bytes)
        fit_results.append({
            'alpha': alpha,
            'artifact': name,
            'sha256': hashlib.sha256(model_bytes).hexdigest(),
            'status': 'complete',
        })

    _write_json(root / 'run.json', {
        'mode': 'official',
        'protocol_sha256': active_proto_sha,
        'implementation': impl,
        'source_hashes': source_hashes,
    })
    (root / 'training-reference.sqlite').write_bytes(b'ref-sqlite')
    _write_json(root / 'training-reference.json', {'ok': True})
    (root / 'cohorts.sqlite').write_bytes(b'cohorts-sqlite')
    _write_json(root / 'cohorts.json', {'test_rows_opened': 0})
    (root / 'pairs-features.jsonl').write_bytes(b'{}')
    (root / 'pairs-targets.jsonl').write_bytes(b'0\n')
    (root / 'pair-lineage.jsonl').write_bytes(b'{}')
    _write_json(root / 'pairs.json', {'pairs': 1})
    _write_json(root / 'frequency.json', {'counts': {}})
    _write_json(root / 'fit-results.json', fit_results)

    scores = [
        {
            'alpha': 1e-5,
            'recall20': 0.80 if selected_alpha == 1e-5 else 0.70,
            'recall10': 0.60,
            'yield20': 0.30,
            'positive_cases': 10,
        },
        {
            'alpha': 1e-4,
            'recall20': 0.80 if selected_alpha == 1e-4 else 0.72,
            'recall10': 0.60,
            'yield20': 0.30,
            'positive_cases': 10,
        },
        {
            'alpha': 1e-3,
            'recall20': 0.71,
            'recall10': 0.55,
            'yield20': 0.25,
            'positive_cases': 10,
        },
    ]
    _write_json(root / 'selection.json', {
        'partition': 'validation',
        'training_overlap_excluded': True,
        'scores': scores,
        'selected_alpha': selected_alpha,
        'model_refitted_after_selection': False,
    })
    (root / 'validation-trajectories.sqlite').write_bytes(b'val-cache')
    _write_json(root / 'validation-aggregate.json', {
        'partition': 'validation',
        'mode': 'official',
        'clinical_accuracy': False,
        'reports': {'full_original_partition': {'overall': {}}},
    })

    artifacts = {name: file_hash(root / name) for name in EXPECTED_SEALED_ARTIFACTS}
    seal = {
        'mode': 'official',
        'run_root': resolved_run,
        'protocol_sha256': active_proto_sha,
        'implementation': impl,
        'source_hashes': source_hashes,
        'artifacts': artifacts,
        'selected_alpha': selected_alpha,
    }
    seal_sha = _write_json(root / 'pre-test-seal.json', seal)
    _write_json(root / 'pre-test-seal-hash.json', {'sha256': seal_sha})
    _write_json(root / 'campaign-provenance.json', {
        'campaign_id': campaign_id,
        'mode': 'official',
        'run_root': resolved_run,
        'active_protocol_representation': rep,
        'canonical_protocol_sha256': CANONICAL_SHA256,
        'historical_protocol_sha256': HISTORICAL_SHA256,
        'active_protocol_sha256': active_proto_sha,
        'implementation_hashes': impl,
        'selected_alpha': selected_alpha,
        'seal_sha256': seal_sha,
        'locked_test_evaluated': False,
    })
    return p, source_hashes, seal_sha


def _resigned_seal_with_tamper(root: Path) -> str:
    """Recompute seal + provenance hashes after an attacker swaps a non-unpickle artifact."""
    seal = json.loads((root / 'pre-test-seal.json').read_text(encoding='utf-8'))
    seal['artifacts'] = {name: file_hash(root / name) for name in EXPECTED_SEALED_ARTIFACTS}
    seal_sha = _write_json(root / 'pre-test-seal.json', seal)
    _write_json(root / 'pre-test-seal-hash.json', {'sha256': seal_sha})
    prov = json.loads((root / 'campaign-provenance.json').read_text(encoding='utf-8'))
    prov['seal_sha256'] = seal_sha
    _write_json(root / 'campaign-provenance.json', prov)
    return seal_sha


class CampaignLoaderTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        base = Path(self.tmp.name).resolve()
        self.run_root = base / 'run_01'
        self.meta_root = base / 'source'
        self.run_root.mkdir()
        self.meta_root.mkdir()
        self.p, self.source_hashes, self.seal_sha = _create_synthetic_sealed_bundle(
            self.run_root, self.meta_root
        )

    def test_valid_sealed_campaign_loads_with_distinct_provenance_and_inference(self):
        with patch.object(DatasetLoader, '_metadata', return_value=FictionalDataset(self.p).source):
            service = load_campaign_model(
                self.run_root,
                self.meta_root,
                campaign_id='campaign-2026-v1',
                expected_source_hashes=self.source_hashes,
            )
        self.assertEqual(service.provenance['campaign_id'], 'campaign-2026-v1')
        self.assertEqual(service.provenance['loader_version'], LOADER_VERSION)
        self.assertFalse(service.provenance['historical_task4b'])
        self.assertEqual(service.provenance['seal_sha256'], self.seal_sha)
        self.assertEqual(service.provenance['selected_alpha'], 1e-5)

        initial = next(
            eid
            for eid, d in service.definitions.items()
            if d['kind'] == 'symptom' and d['data_type'] == 'B' and eid not in ref.EDGES
        )
        req = NextRequest.model_validate({
            'schema_version': 'model-a.request.v1',
            'fictional_case': True,
            'context': {'age': 35, 'source_sex': 'F'},
            'initial': {'evidence_id': initial, 'state': 'confirmed', 'value': True},
            'answers': [{'evidence_id': 'E_53', 'state': 'unknown', 'value': None}],
        })
        out = service.next(req)
        NextResponse.model_validate(out.model_dump())
        self.assertEqual(out.status, 'question')
        self.assertEqual(out.state.pending_question_id, out.question.evidence_id)
        self.assertEqual(out.state.questions_answered, 1)
        self.assertEqual(out.evidence.answers[0].state, 'unknown')
        self.assertFalse(out.evidence.human_clinical_review)

    def test_missing_or_incomplete_campaign_rejected_without_unpickle(self):
        with patch.object(campaign_loader, '_restricted_unpickle_model') as unpickle:
            with self.assertRaises(ArtifactUnavailable):
                load_campaign_model(
                    self.run_root.parent / 'missing_dir',
                    self.meta_root,
                    expected_source_hashes=self.source_hashes,
                )
            for missing_name in ('selection.json', 'validation-aggregate.json', 'pre-test-seal.json', 'campaign-provenance.json'):
                backup = (self.run_root / missing_name).read_bytes()
                (self.run_root / missing_name).unlink()
                gate = check_campaign_completion_gate(
                    self.run_root,
                    self.meta_root,
                    expected_source_hashes=self.source_hashes,
                )
                self.assertFalse(gate['ready'])
                self.assertEqual(gate['status'], 'PREPARED / WAITING FOR SEAL')
                self.assertIn(missing_name, gate['missing_files'])
                with self.assertRaises(ArtifactUnavailable):
                    load_campaign_model(
                        self.run_root,
                        self.meta_root,
                        expected_source_hashes=self.source_hashes,
                    )
                (self.run_root / missing_name).write_bytes(backup)
            unpickle.assert_not_called()

    def test_incorrect_model_hash_rejected_before_unpickle(self):
        (self.run_root / 'model-1e-05.pkl').write_bytes(b'corrupted-model-bytes')
        with patch.object(campaign_loader, '_restricted_unpickle_model') as unpickle:
            with self.assertRaises(ArtifactUnavailable):
                load_campaign_model(
                    self.run_root,
                    self.meta_root,
                    expected_source_hashes=self.source_hashes,
                )
            unpickle.assert_not_called()

    def test_disallowed_pickle_global_rejected_even_if_self_signed(self):
        class ExploitPayload:
            def __reduce__(self):
                return (os.getpid, ())

        (self.run_root / 'model-1e-05.pkl').write_bytes(pickle.dumps(ExploitPayload()))
        _resigned_seal_with_tamper(self.run_root)
        with self.assertRaises(ArtifactUnavailable):
            load_campaign_model(
                self.run_root,
                self.meta_root,
                expected_source_hashes=self.source_hashes,
            )

    def test_incorrect_source_provenance_rejected(self):
        bad_sources = dict(self.source_hashes)
        bad_sources['release_test_patients.zip'] = 'f' * 64
        with self.assertRaises(ArtifactUnavailable):
            load_campaign_model(
                self.run_root,
                self.meta_root,
                expected_source_hashes=bad_sources,
            )

        # Also reject tampered metadata file even if request matches sealed dict
        (self.meta_root / 'release_evidences.json').write_bytes(b'{"tampered": true}')
        with self.assertRaises(ArtifactUnavailable):
            load_campaign_model(
                self.run_root,
                self.meta_root,
                expected_source_hashes=self.source_hashes,
            )

    def test_wrong_campaign_id_and_locked_test_flag_rejected(self):
        with self.assertRaises(ArtifactUnavailable):
            load_campaign_model(
                self.run_root,
                self.meta_root,
                campaign_id='wrong-campaign-id',
                expected_source_hashes=self.source_hashes,
            )

        prov = json.loads((self.run_root / 'campaign-provenance.json').read_text(encoding='utf-8'))
        prov['locked_test_evaluated'] = True
        _write_json(self.run_root / 'campaign-provenance.json', prov)
        with self.assertRaises(ArtifactUnavailable):
            load_campaign_model(
                self.run_root,
                self.meta_root,
                expected_source_hashes=self.source_hashes,
            )

        prov['locked_test_evaluated'] = False
        prov['seal_sha256'] = HISTORICAL_TASK4B_SEAL_SHA256
        _write_json(self.run_root / 'campaign-provenance.json', prov)
        with self.assertRaises(ArtifactUnavailable):
            load_campaign_model(
                self.run_root,
                self.meta_root,
                expected_source_hashes=self.source_hashes,
            )

    def test_disabled_by_default_and_no_unexpected_clinical_activation(self):
        # Default (disabled): loads neither preserved nor campaign loader.
        with patch.dict(os.environ, {}, clear=True), \
             patch('models.medassist_v2.research_adapter.app.load_preserved') as p_load, \
             patch('models.medassist_v2.research_adapter.app.load_campaign_model') as c_load:
            app = from_environment()
            p_load.assert_not_called()
            c_load.assert_not_called()
            with TestClient(app, base_url='http://127.0.0.1', client=('127.0.0.1', 123)) as api:
                self.assertEqual(api.get('/research/model-a/v1/health').status_code, 503)

        # Specifying campaign ID without MEDASSIST_A_ENABLE_CAMPAIGN=1 stays disabled & does not fall back.
        with patch.dict(
            os.environ,
            {
                'MEDASSIST_A_ENABLE_RESEARCH': '1',
                'MEDASSIST_A_TOKEN': TOKEN,
                'MEDASSIST_A_CAMPAIGN_ID': 'campaign-2026-v1',
                'MEDASSIST_A_RUN_ROOT': str(self.run_root),
                'MEDASSIST_A_METADATA_ROOT': str(self.meta_root),
            },
            clear=True,
        ), patch('models.medassist_v2.research_adapter.app.load_preserved') as p_load, \
           patch('models.medassist_v2.research_adapter.app.load_campaign_model') as c_load:
            app = from_environment()
            p_load.assert_not_called()
            c_load.assert_not_called()
            with TestClient(
                app,
                base_url='http://127.0.0.1',
                client=('127.0.0.1', 123),
                headers={'Authorization': 'Bearer ' + TOKEN},
            ) as api:
                self.assertEqual(api.get('/research/model-a/v1/health').status_code, 503)

    def test_app_connects_campaign_loader_when_explicitly_enabled_and_fails_closed(self):
        # Incomplete campaign under explicit opt-in fails closed with no path leak.
        (self.run_root / 'pre-test-seal.json').unlink()
        with patch.dict(
            os.environ,
            {
                'MEDASSIST_A_ENABLE_RESEARCH': '1',
                'MEDASSIST_A_TOKEN': TOKEN,
                'MEDASSIST_A_ENABLE_CAMPAIGN': '1',
                'MEDASSIST_A_CAMPAIGN_ID': 'campaign-2026-v1',
                'MEDASSIST_A_RUN_ROOT': str(self.run_root),
                'MEDASSIST_A_METADATA_ROOT': str(self.meta_root),
            },
            clear=True,
        ):
            app = from_environment()
            with TestClient(
                app,
                base_url='http://127.0.0.1',
                client=('127.0.0.1', 123),
                headers={'Authorization': 'Bearer ' + TOKEN},
            ) as api:
                resp = api.get('/research/model-a/v1/health')
                self.assertEqual(resp.status_code, 503)
                self.assertNotIn(str(self.run_root), resp.text)

    def test_app_health_and_interview_with_mocked_trusted_source_hashes(self):
        with patch.dict(
            os.environ,
            {
                'MEDASSIST_A_ENABLE_RESEARCH': '1',
                'MEDASSIST_A_TOKEN': TOKEN,
                'MEDASSIST_A_ENABLE_CAMPAIGN': '1',
                'MEDASSIST_A_CAMPAIGN_ID': 'campaign-2026-v1',
                'MEDASSIST_A_RUN_ROOT': str(self.run_root),
                'MEDASSIST_A_METADATA_ROOT': str(self.meta_root),
            },
            clear=True,
        ), patch('models.medassist_v2.research_adapter.campaign_loader.trusted_source_hashes', return_value=self.source_hashes), \
           patch.object(DatasetLoader, '_metadata', return_value=FictionalDataset(self.p).source):
            app = from_environment()
            with TestClient(
                app,
                base_url='http://127.0.0.1',
                client=('127.0.0.1', 123),
                headers={'Authorization': 'Bearer ' + TOKEN},
            ) as api:
                health = api.get('/research/model-a/v1/health')
                self.assertEqual(health.status_code, 200)
                self.assertEqual(
                    health.json(),
                    {
                        'research_only': True,
                        'available': True,
                        'campaign_id': 'campaign-2026-v1',
                        'loader_version': LOADER_VERSION,
                    },
                )
                fixtures_resp = api.get('/research/model-a/v1/demo/fixtures')
                self.assertEqual(fixtures_resp.status_code, 200)
                fixture_req = fixtures_resp.json()['fixtures'][0]['request']
                next_resp = api.post('/research/model-a/v1/next', json=fixture_req)
                self.assertEqual(next_resp.status_code, 200)
                parsed = NextResponse.model_validate(next_resp.json())
                self.assertEqual(parsed.status, 'question')
                self.assertTrue(parsed.research_only)
                self.assertFalse(parsed.evidence.human_clinical_review)

    def test_historical_preserved_loader_unmodified_and_rejects_missing(self):
        with self.assertRaises(ArtifactUnavailable):
            load_preserved(str(self.run_root / 'missing'), str(self.meta_root))


if __name__ == '__main__':
    unittest.main()
