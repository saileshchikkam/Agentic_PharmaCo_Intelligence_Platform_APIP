"""Limited authored entry mapping; no official data rows or clinical predictions."""
import copy
import unittest

from models.medassist_v2.research_adapter.conversation import ENTRY_OPTIONS, conversation_vocabulary
from models.medassist_v2.research_adapter.schemas import NextRequest
from models.medassist_v2.research_adapter.demo import interview
from models.medassist_v2.tests import test_demo_workflow as fixtures
from models.medassist_v2.tests.test_research_adapter import client


class ConversationTests(unittest.TestCase):
    def setUp(self):
        fixtures.DemoTests.setUpClass()
        self.service = copy.copy(fixtures.DemoTests.service)
        self.service.definitions = copy.deepcopy(self.service.definitions)
        self.service.catalogue = copy.deepcopy(self.service.catalogue)
        for eid, _label, wording in ENTRY_OPTIONS:
            self.service.definitions[eid] = dict(kind='symptom', data_type='B', question_en=wording, possible_values=[])
            self.service.catalogue[eid] = dict(data_type='B', question_en=wording, possible_values=[])

    def test_verified_vocabulary_transport(self):
        with client(self.service) as api:
            r = api.get('/research/model-a/v1/demo/vocabulary')
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json()['mode'], 'limited_structured_input')
            self.assertEqual(len(r.json()['initials']), 3)
            self.assertNotIn('pickle', r.text)

    def test_metadata_drift_fails_closed(self):
        for key, value in [('question_en', 'invented'), ('kind', 'antecedent'), ('data_type', 'C')]:
            original = self.service.definitions['E_201'][key]
            self.service.definitions['E_201'][key] = value
            with self.assertRaises(ValueError): conversation_vocabulary(self.service)
            with client(self.service) as api:
                self.assertEqual(api.get('/research/model-a/v1/demo/vocabulary').status_code, 503)
            self.service.definitions['E_201'][key] = original

    def test_missing_artifact_and_origin(self):
        with client() as api:
            self.assertEqual(api.get('/research/model-a/v1/demo/vocabulary').status_code, 503)
        with client(self.service) as api:
            self.assertEqual(api.get('/research/model-a/v1/demo/vocabulary', headers={'Origin':'http://localhost'}).status_code, 403)

    def test_confirmed_initial_reuses_selector_handoff(self):
        request = NextRequest.model_validate({'schema_version':'model-a.request.v1','fictional_case':True,
            'context':{'age':35,'source_sex':'F'},'initial':{'evidence_id':'E_201','state':'confirmed','value':True}})
        result = interview(self.service, request)
        self.assertEqual(result.selection.status, 'question')
        self.assertNotEqual(result.selection.question.evidence_id, 'E_201')
        self.assertEqual(result.handoff.schema_version, 'model-a-to-b.evidence.v1')
        self.assertEqual(result.handoff.model_b_status, 'not_enabled')
