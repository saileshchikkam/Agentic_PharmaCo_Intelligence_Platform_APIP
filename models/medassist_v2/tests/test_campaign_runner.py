"""Targeted verification tests for the new-campaign entry point.

Ensures authentic LF and CRLF protocol representations are accepted, tampering
is rejected, historical implementation hashes remain byte-identical, and locked
test records remain unopened.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch

from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.campaign_runner import authenticate_protocol, preflight, resume_post_fit
from models.medassist_v2.research_adapter import protocol_integrity as integrity
from models.medassist_v2.training.data import implementation_hashes


class CampaignRunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.root = Path(self.temp_dir.name)
        self.protocol_path = self.root / integrity.NAME
        self.pin_path = self.root / (integrity.NAME.replace('.json', '.sha256'))
        self.lf_bytes = integrity.authenticated_bytes().replace(b'\r\n', b'\n')
        self.pin_path.write_text(f"{integrity.HISTORICAL_SHA256}  {integrity.NAME}\n", encoding='utf-8')

    def test_authentic_lf_protocol_accepted(self):
        self.protocol_path.write_bytes(self.lf_bytes)
        p, rep, canonical_sha, historical_sha = authenticate_protocol(self.protocol_path)
        self.assertEqual(rep, 'LF')
        self.assertEqual(canonical_sha, integrity.CANONICAL_SHA256)
        self.assertEqual(historical_sha, integrity.HISTORICAL_SHA256)
        self.assertEqual(p['protocol_id'], 'medassist-v2-adaptive-questioning-v1')

    def test_authentic_crlf_protocol_accepted(self):
        crlf_bytes = self.lf_bytes.replace(b'\n', b'\r\n')
        self.protocol_path.write_bytes(crlf_bytes)
        p, rep, canonical_sha, historical_sha = authenticate_protocol(self.protocol_path)
        self.assertEqual(rep, 'CRLF')
        self.assertEqual(canonical_sha, integrity.CANONICAL_SHA256)
        self.assertEqual(historical_sha, integrity.HISTORICAL_SHA256)
        self.assertEqual(p['protocol_id'], 'medassist-v2-adaptive-questioning-v1')

    def test_modified_protocol_content_rejected(self):
        tampered = self.lf_bytes.replace(b'"version": 1', b'"version": 2')
        self.protocol_path.write_bytes(tampered)
        with self.assertRaises(Exception):
            authenticate_protocol(self.protocol_path)

    def test_substituted_pin_rejected(self):
        self.protocol_path.write_bytes(self.lf_bytes)
        fake_pin = "0" * 64 + f"  {integrity.NAME}\n"
        self.pin_path.write_text(fake_pin, encoding='utf-8')
        with self.assertRaises(Exception):
            authenticate_protocol(self.protocol_path)

    def test_mixed_line_endings_rejected(self):
        # Create invalid mixed line endings (CRLF mixed with bare LF)
        mixed = self.lf_bytes.replace(b'\n', b'\r\n', 5)
        self.protocol_path.write_bytes(mixed)
        with self.assertRaises(Exception):
            authenticate_protocol(self.protocol_path)

    def test_historical_implementation_hashes_unchanged(self):
        # Verify that the 13 historical training files are byte-for-byte identical
        hashes = implementation_hashes()
        self.assertEqual(len(hashes), 13)
        expected = {
            'training/campaign.py': '3a9a199aa99eb646a138633599b95a69aa8edfe11b81592f171c319ef73c431b',
            'training/data.py': '3f06366415adbb6baae0c5a89535b0dac75bd92914cffe43d9704b7c933f1523',
            'training/runner.py': '567ed1b52e76b622359de1e1e5ba5f74d472410583c57f4c3ed6308361a8120f',
            'questioning_protocol.py': '4f2f55a52bf4ba106259fba2512ba425db91010ddf8d68ca372460aa7059ab6b',
        }
        for name, digest in expected.items():
            self.assertEqual(hashes[name], digest)

    def test_preflight_does_not_fit_or_open_test(self):
        mock_dataset = MagicMock()
        mock_dataset.receipt = {'release_evidences.json': '0' * 64}
        with patch('models.medassist_v2.campaign_runner.OfficialDataset', return_value=mock_dataset):
            res = preflight('fictional-external-source-root')
        self.assertEqual(res['status'], 'preflight_passed')
        self.assertEqual(res['verified_source_files'], 1)
        self.assertEqual(res['official_patient_rows_decoded'], 0)
        self.assertEqual(res['official_models_fitted'], 0)
        self.assertEqual(res['official_outcomes_evaluated'], 0)
        self.assertTrue(res['locked_test_unopened'])

        configured_source = os.environ.get('MEDASSIST_A_METADATA_ROOT')
        if configured_source:
            real_res = preflight(configured_source)
            self.assertEqual(real_res['status'], 'preflight_passed')
            self.assertEqual(real_res['official_patient_rows_decoded'], 0)
            self.assertTrue(real_res['locked_test_unopened'])


if __name__ == '__main__':
    unittest.main()
