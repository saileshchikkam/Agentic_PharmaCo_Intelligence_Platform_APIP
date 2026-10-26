"""Primary-author development fixtures; no independent clinical performance claim."""
import json
from pathlib import Path
import unittest
from unittest.mock import Mock
from models.medassist_ai.safety.provisional import ProvisionalSafety
from models.medassist_ai.core.orchestrator import MedAssistOrchestrator

class EmergencyContextTests(unittest.TestCase):
    def test_development_actions(self):
        rows=json.loads(Path('models/medassist_ai/evaluation/emergency-recognition-v2/development.json').read_text(encoding='utf8'))['cases']
        for row in rows:
            with self.subTest(row=row['id']):
                result=ProvisionalSafety().check(row['text']);self.assertEqual(result['status'],row['expected_action']);self.assertFalse(result['negative_safety_conclusion']);self.assertFalse(result['clinical_validation'])
    def test_urgent_third_party_does_not_invoke_models_or_become_self_evidence(self):
        q=Mock();language=Mock();b=Mock();d=Mock();out=MedAssistOrchestrator(q,conversation=language,model_b=b,disease=d).propose('I think my father is having a stroke now')
        self.assertFalse(out['accepted']);self.assertEqual(out['safety']['status'],'escalate');self.assertTrue(all(m['subject']=='other' for m in out['safety']['mentions']))
        q.interview.assert_not_called();language.extract.assert_not_called();b.assess.assert_not_called();d.predict.assert_not_called()
    def test_ambiguous_context_blocks_missing_or_offline_language(self):
        language=Mock();language.extract.side_effect=RuntimeError('offline');out=MedAssistOrchestrator(Mock(),conversation=language).propose('heart attack')
        self.assertEqual(out['safety']['status'],'clarify');language.extract.assert_not_called()
    def test_scope_clarification_never_clears_established_emergency(self):
        g=ProvisionalSafety();pending=g.check('heart attack');self.assertEqual(g.resolve(pending,'unsure')['status'],'escalate');self.assertEqual(g.resolve(pending,'non_current')['status'],'not_assessed');self.assertEqual(g.resolve(g.check('I am having a stroke'),'non_current')['status'],'escalate')
