import unittest
from models.medassist_ai.evidence.validator import EvidenceValidator
from models.medassist_ai.evidence.mapper import EvidenceMapper
from models.medassist_ai.core.exceptions import EvidenceRejected
from .fixtures import handoff, service


class EvidenceTests(unittest.TestCase):
    def test_canonical_contract_provenance_and_missing_distinctions(self):
        evidence=EvidenceValidator().validate(handoff())
        self.assertEqual(evidence.schema_version,'model-a-to-b.evidence.v1')
        self.assertEqual(len(evidence.items),223)
        self.assertIn('unknown',{i.status for i in evidence.items})
        self.assertIn('not_asked',{i.status for i in evidence.items})
        self.assertIn('unsupported',{i.status for i in evidence.items})
        self.assertEqual(len(EvidenceMapper().confirmed_observations(evidence)),1)

    def test_rejects_mutations_versions_incomplete_and_fake_provenance(self):
        for kind in ['version','missing','duplicate','provenance']:
            raw=handoff().model_dump()
            if kind=='version':raw['schema_version']='v2'
            if kind=='missing':raw['items'].pop()
            if kind=='duplicate':raw['items'][-1]=raw['items'][0]
            if kind=='provenance':raw['items'][0]['provenance']['source']='llm'
            with self.assertRaises(EvidenceRejected):EvidenceValidator().validate(raw)

    def test_membership_uses_injected_catalogue_not_guessed_id_range(self):
        raw=handoff().model_dump()
        raw['items'][-1]['evidence_id']='E_999'
        with self.assertRaises(EvidenceRejected):EvidenceValidator(service().definitions).validate(raw)
