import unittest
from fastapi.testclient import TestClient
from models.medassist_v2.research_adapter.app import create_app
from models.medassist_v2.research_adapter.demo import interview
from models.medassist_v2.research_adapter.schemas import NextRequest
from models.medassist_v2.tests.test_research_adapter import TOKEN
from models.medassist_ai.model_a.adapter import ModelAAdapter
from .fixtures import service, payload, answer


class ModelAAdapterTests(unittest.TestCase):
    def test_frozen_function_parity_unknown_and_export(self):
        model = service(); request = payload(answers=[answer('E_53','unknown',None)])
        result = ModelAAdapter(model).interview(request)
        self.assertEqual(result.model_dump(), interview(model, NextRequest.model_validate(request)).model_dump())
        self.assertEqual(len(result.handoff.items), 223)
        self.assertEqual(next(i for i in result.handoff.items if i.evidence_id=='E_53').status, 'unknown')

    def test_optional_existing_http_boundary_preserves_response_and_guards(self):
        app = create_app(service=service(), enabled=True, token=TOKEN, modular_enabled=True)
        with TestClient(app, base_url='http://127.0.0.1', client=('127.0.0.1',12345),
                        headers={'Authorization':'Bearer '+TOKEN}) as api:
            response = api.post('/research/model-a/v1/demo/interview', json=payload())
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['schema_version'], 'model-a.demo.v1')
            self.assertEqual(len(response.json()['handoff']['items']), 223)
            self.assertNotIn('disease', response.json())
            self.assertEqual(api.post('/research/model-a/v1/demo/interview',json=payload(),headers={'Origin':'http://localhost'}).status_code,403)
