import io
import json
import os
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from .groq_access import accessible_models, backend_key, request_json


class Response(io.BytesIO):
    headers = {'x-ratelimit-limit-tokens': '8000', 'private-account-header': 'not-exported'}


class GroqAccessTests(unittest.TestCase):
    def test_missing_key_fails_without_network_or_registry(self):
        with patch.dict(os.environ, {}, clear=True), patch('pathlib.Path.is_file', return_value=False):
            with self.assertRaisesRegex(ValueError, 'BACKEND_KEY_NOT_CONFIGURED'):
                backend_key()

    def test_key_is_backend_only_and_not_part_of_public_metadata(self):
        with patch.dict(os.environ, {'GROQ_API_KEY': 'fictional-unit-test-token'}, clear=True):
            self.assertEqual(backend_key(), 'fictional-unit-test-token')
        class Opener:
            def open(self, request, timeout):
                self.request = request
                self.assertions(request)
                return Response(json.dumps({'data': [{'id': 'openai/gpt-oss-120b', 'active': True}]}).encode())
            @staticmethod
            def assertions(request):
                assert request.full_url == 'https://api.groq.com/openai/v1/models'
                assert request.data is None
                assert request.get_header('Authorization') == 'Bearer fictional-unit-test-token'
        with patch('urllib.request.build_opener', return_value=Opener()):
            self.assertEqual(accessible_models('fictional-unit-test-token'), ['openai/gpt-oss-120b'])

    def test_endpoint_allowlist_and_redacted_provider_errors(self):
        with self.assertRaisesRegex(ValueError, 'GROQ_ENDPOINT_NOT_ALLOWED'):
            request_json('fixture', 'https://another-host.example')
        class Opener:
            def open(self, request, timeout):
                raise HTTPError(request.full_url, 403, 'private-error-body', {}, io.BytesIO(b'private body'))
        with patch('urllib.request.build_opener', return_value=Opener()):
            with self.assertRaises(ValueError) as caught:
                request_json('fixture', 'models')
            self.assertEqual(str(caught.exception), 'GROQ_HTTP_403')

    def test_frozen_user_approved_cases_match_candidate_annotations(self):
        from pathlib import Path
        import hashlib
        root = Path(__file__).parent / 'groq-v1'
        candidate = (root / 'suite-candidate.json').read_bytes()
        review = json.loads((root / 'review.json').read_text())
        self.assertEqual(review['status'], 'approved_by_user')
        self.assertEqual(review['suite_sha256'], hashlib.sha256(candidate).hexdigest())
        frozen = (root / 'suite.json').read_bytes()
        self.assertEqual(json.loads(frozen)['cases'], json.loads(candidate)['cases'])
        self.assertEqual(hashlib.sha256(frozen).hexdigest(), (root / 'suite.sha256').read_text().split()[0])


if __name__ == '__main__':
    unittest.main()
