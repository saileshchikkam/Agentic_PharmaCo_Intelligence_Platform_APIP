import unittest
from unittest.mock import Mock
from models.medassist_ai.core.orchestrator import MedAssistOrchestrator
from models.medassist_ai.providers.groq_provider import GroqProvider
from models.medassist_ai.core.exceptions import ComponentUnavailable
from models.medassist_ai.config.model_registry import ModelRegistry
from models.medassist_ai.config.settings import Settings
from .fixtures import service, payload, handoff
from models.medassist_ai.model_a.adapter import ModelAAdapter


class OrchestratorTests(unittest.TestCase):
    def test_registry_is_metadata_only_and_immutable(self):
        registry = ModelRegistry()
        self.assertEqual(registry.get('groq').canonical_reference, 'qwen/qwen3.8-27b')
        with self.assertRaises(TypeError): registry.components['new'] = None
        with self.assertRaises(ValueError): Settings(groq_model='other')

    def test_only_model_a_questions_and_optional_disease_isolated(self):
        disease = Mock(); disease.predict.side_effect = RuntimeError('private path')
        model = ModelAAdapter(service())
        flow = MedAssistOrchestrator(model, disease=disease)
        result = flow.interview(payload())
        self.assertEqual(len(result.handoff.items), 223)
        disease.predict.assert_not_called()
        summary = flow.research_summary(result.handoff, include_disease=True)
        self.assertEqual(summary['disease']['status'], 'unavailable')
        self.assertNotIn('private', str(summary))
        self.assertEqual(summary['model_b']['status'], 'unable_to_assess')
        self.assertEqual(summary['safety']['status'], 'unavailable')

    def test_provider_does_not_confirm_or_log_text(self):
        raw = {'schema_version':'medassist.sparse-extraction.v1','observations':[{
            'evidence_id':'E_201','state':'present','quote':'cough'}],'unmapped':[], 'instruction_attempt':False}
        transport = Mock(return_value=raw)
        provider = GroqProvider(transport)
        flow = MedAssistOrchestrator(Mock(), conversation=provider)
        proposal = flow.propose('cough')
        self.assertFalse(proposal['accepted'])
        flow.model_a.interview.assert_not_called()
        self.assertNotIn('cough', str(provider.metrics))
        self.assertEqual(provider.metrics['requests'], 1)
        transport.side_effect = RuntimeError('private-key')
        with self.assertRaisesRegex(ComponentUnavailable, '^CONVERSATION_PROVIDER_UNAVAILABLE$'): flow.propose('cough')
        self.assertEqual(provider.metrics['failures'], 1)

    def test_missing_provider_and_model_a_fail_closed(self):
        with self.assertRaises(ComponentUnavailable): MedAssistOrchestrator(Mock()).propose('cough')
        with self.assertRaises(ComponentUnavailable): GroqProvider().extract('cough')
        with self.assertRaises(ComponentUnavailable): ModelAAdapter(None).interview(payload())

    def test_optional_model_failure_never_suppresses_independent_safety(self):
        broken=Mock();broken.assess.side_effect=RuntimeError('sensitive error')
        safety=Mock();safety.check.return_value={'status':'unavailable','reason':'review_required'}
        flow=MedAssistOrchestrator(Mock(),model_b=broken,safety=safety)
        result=flow.research_summary(handoff())
        safety.check.assert_called_once()
        self.assertEqual(result['model_b']['status'],'unable_to_assess')
        self.assertEqual(result['safety']['reason'],'review_required')
