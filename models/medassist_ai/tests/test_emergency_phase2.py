"""Separate primary-author development software cases, not clinical validation."""
import json
from pathlib import Path
import unittest
from unittest.mock import Mock
from models.medassist_ai.safety.provisional import ProvisionalSafety
from models.medassist_ai.core.orchestrator import MedAssistOrchestrator

class Phase2SafetyTests(unittest.TestCase):
    def test_new_development(self):
        rows=json.loads(Path('models/medassist_ai/evaluation/emergency-recognition-phase2/development.json').read_text(encoding='utf8'))['cases']
        for row in rows:
            with self.subTest(case=row['id']):
                d=ProvisionalSafety().check(row['text']);self.assertEqual(d['status'],row['expected_action']);self.assertFalse(d['clinical_validation']);self.assertFalse(d['negative_safety_conclusion'])
    def test_third_party_precedes_all_models_without_self_evidence(self):
        a=Mock();language=Mock();b=Mock();disease=Mock()
        for text in ['My grandmother is fighting for air.','I cannot wake my grandfather.','My brother has new trouble getting words out.']:
            out=MedAssistOrchestrator(a,conversation=language,model_b=b,disease=disease).propose(text)
            self.assertFalse(out['accepted']);self.assertEqual(out['safety']['status'],'escalate');self.assertTrue(all(m['subject']=='other' for m in out['safety']['mentions']))
        for call in [a.interview,language.extract,b.assess,disease.predict]: call.assert_not_called()
    def test_remote_or_hypothetical_context_is_not_current_positive(self):
        for text in ['My grandfather had a stroke in 2009.','Imagine a character who is unconscious.']:
            d=ProvisionalSafety().check(text);self.assertEqual(d['status'],'not_assessed');self.assertFalse(d['negative_safety_conclusion'])
    def test_noncurrent_answer_never_clears_emergency(self):
        g=ProvisionalSafety();d=g.check('My grandfather is unconscious.');self.assertEqual(g.resolve(d,'non_current')['status'],'escalate')
