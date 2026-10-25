import time
import unittest
from unittest.mock import Mock
from urllib.parse import urlparse, parse_qs
from models.medassist_ai.safety.provisional import ProvisionalSafety
from models.medassist_ai.hospital.maps_search import MapsSearchHospital
from models.medassist_ai.core.orchestrator import MedAssistOrchestrator
from models.medassist_ai.core.exceptions import EvidenceRejected


class SafetyNavigationTests(unittest.TestCase):
    def test_emergency_precedes_missing_or_broken_models(self):
        question, language, disease, urgency = Mock(), Mock(), Mock(), Mock()
        language.extract.side_effect = RuntimeError('unavailable')
        for flow in (MedAssistOrchestrator(question), MedAssistOrchestrator(question, conversation=language,
                     disease=disease, model_b=urgency)):
            result = flow.propose('The fictional person cannot breathe')
            self.assertEqual(result['safety']['status'], 'escalate')
            self.assertTrue(result['safety']['suppress_self_care'])
            self.assertFalse(result['safety']['clinical_validation'])
            self.assertEqual(result['model_b_status'], 'unable_to_assess')
        for component in (question.interview, language.extract, disease.predict, urgency.assess):
            component.assert_not_called()

    def test_rule_scope_negation_and_no_clearance(self):
        guard = ProvisionalSafety()
        for text in ('I need an ambulance', 'I can’t breathe.', 'I need urgent help', 'This is a medical emergency'):
            self.assertEqual(guard.check(text)['status'], 'escalate')
        for text in ('cough', 'I can breathe', 'I do not need an ambulance', 'maybe fever', ''):
            result = guard.check(text)
            self.assertEqual(result['status'], 'not_assessed')
            self.assertFalse(result['negative_safety_conclusion'])
            self.assertIsNone(result['guidance'])
        self.assertEqual(guard.check({})['status'], 'unavailable')
        language = Mock(); language.extract.return_value = {'accepted': False}
        self.assertEqual(MedAssistOrchestrator(Mock(), conversation=language).propose('cough'), {'accepted': False})
        language.extract.assert_called_once_with('cough')

    def test_maps_handoff_is_consent_scoped_and_has_no_facilities(self):
        request = {'schema_version': 'medassist.navigation-request.v1', 'consent': {'granted': True,
            'purpose': 'nearby_hospital_search', 'expires_at': time.time()*1000+60000},
            'location': {'latitude': 0, 'longitude': 0}}
        result = MapsSearchHospital().search(request, emergency=True)
        self.assertEqual(result['status'], 'search_handoff')
        self.assertEqual(result['facilities'], [])
        self.assertFalse(result['verified_facility_provider'])
        self.assertEqual(urlparse(result['url']).hostname, 'www.google.com')
        self.assertEqual(parse_qs(urlparse(result['url']).query)['query'], ['hospital emergency departments near 0.000,0.000'])
        with self.assertRaises(EvidenceRejected): MapsSearchHospital().search({**request, 'text': 'private symptom'})
        request['consent']['expires_at'] = 0
        with self.assertRaises(EvidenceRejected): MapsSearchHospital().search(request)
