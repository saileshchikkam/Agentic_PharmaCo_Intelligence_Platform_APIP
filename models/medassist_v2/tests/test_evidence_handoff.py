"""Authored fictional evidence semantics, no clinical labels, training or patient I/O."""
import copy
import json
import unittest
from unittest.mock import patch

from pydantic import ValidationError

from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.loader import normalise_catalogue
from models.medassist_v2.research_adapter.handoff import EvidenceHandoff, EvidenceItem, build_handoff
from models.medassist_v2.research_adapter.schemas import Evidence, NextRequest
from models.medassist_v2.research_adapter.service import ModelA
from models.medassist_v2.tests.test_research_adapter import answer, payload
from models.medassist_v2.training.fictional import FictionalDataset, NonLearningEstimator
from models.medassist_v2.validation import InvalidRecord


class HandoffTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = ref.load_protocol()
        data = FictionalDataset(cls.p)
        definitions = {eid:d for eid,d in normalise_catalogue(data.source)['evidences'].items() if eid.startswith('E_')}
        cls.service = ModelA(cls.p, definitions, NonLearningEstimator(cls.p,1e-5))

    def handoff(self, events=None):
        request = NextRequest.model_validate(payload(answers=events))
        evidence = Evidence(context=request.context,initial=request.initial,answers=request.answers)
        with patch.object(self.service,'policy',side_effect=AssertionError('no_prediction_allowed')):
            return build_handoff(self.service,evidence)

    def test_positive_negative_unknown_not_asked_unsupported_are_distinct(self):
        result = self.handoff([answer('E_53'),answer('E_129',value=False),answer('E_151','unknown',None)])
        items = {item.evidence_id:item for item in result.items}
        self.assertEqual(items['E_53'].status,'observed_positive')
        self.assertIs(items['E_53'].value,True)
        self.assertEqual(items['E_129'].status,'observed_negative')
        self.assertIs(items['E_129'].value,False)
        self.assertEqual(items['E_151'].status,'unknown')
        self.assertEqual(items['E_1'].status,'not_asked')
        self.assertEqual(items['E_69'].status,'unsupported')
        for eid in ['E_151','E_1','E_69']:
            self.assertIsNone(items[eid].value)
        self.assertEqual(items['E_151'].provenance.source,'developer_fictional_fixture')
        self.assertEqual(items['E_1'].provenance.source,'not_disclosed')
        self.assertEqual(items['E_69'].unsupported_reason,'quarantined_question')
        self.assertEqual(len(result.items),len(self.service.definitions))

    def test_categorical_default_empty_and_mixed_sets_are_values_not_negatives(self):
        for event in [answer('E_204',value=0),answer('E_55',value=[]),answer('E_55',value=['NA','a'])]:
            parents = [answer('E_53')] if event['evidence_id']=='E_55' else []
            result = self.handoff(parents+[event])
            item = next(item for item in result.items if item.evidence_id==event['evidence_id'])
            self.assertEqual(item.status,'observed_value')
            self.assertEqual(item.value,event['value'])

    def test_contradictions_remain_null_not_negative(self):
        item = next(item for item in self.handoff([answer('E_53','contradiction',None)]).items if item.evidence_id=='E_53')
        self.assertEqual(item.status,'contradiction')
        self.assertIsNone(item.value)

    def test_unknown_cannot_be_false_or_have_negative_status(self):
        source = next(item for item in self.handoff([answer('E_53','unknown',None)]).items if item.evidence_id=='E_53').model_dump()
        for edits in [{'value':False},{'status':'observed_negative'},{'status':'observed_value','value':0}]:
            item = copy.deepcopy(source);item.update(edits)
            with self.assertRaises(ValidationError):EvidenceItem.model_validate(item)

    def test_provenance_uniqueness_and_no_clinical_fields(self):
        result = self.handoff([answer('E_53')]).model_dump()
        self.assertEqual(result['model_b_status'],'not_enabled')
        self.assertFalse(result['human_clinical_review'])
        for field in ['severity','diagnosis','treatment']:
            bad = copy.deepcopy(result);bad[field]='not-permitted'
            with self.assertRaises(ValidationError):EvidenceHandoff.model_validate(bad)
        bad = copy.deepcopy(result);bad['items'].append(bad['items'][0])
        with self.assertRaises(ValidationError):EvidenceHandoff.model_validate(bad)
        bad = copy.deepcopy(result)
        next(i for i in bad['items'] if i['evidence_id']=='E_53')['provenance']['turn']=2
        with self.assertRaises(ValidationError):EvidenceHandoff.model_validate(bad)

    def test_invalid_vocabulary_and_dependencies_produce_no_handoff(self):
        for events in [[answer('E_999')],[answer('E_69')],[answer('E_54',value=[])]]:
            with self.assertRaises(InvalidRecord):self.handoff(events)

    def test_contract_export_and_repeatability(self):
        exported = json.loads((ref.HERE/'research_adapter/handoff.schema.json').read_text())
        self.assertEqual(exported,EvidenceHandoff.model_json_schema())
        self.assertEqual(self.handoff().model_dump(),self.handoff().model_dump())

    def test_initial_premise_cannot_be_relabelled_negative(self):
        bad = self.handoff().model_dump()
        initial = next(item for item in bad['items'] if item['evidence_id']==bad['initial_evidence_id'])
        initial.update(status='observed_negative',value=False)
        with self.assertRaises(ValidationError):EvidenceHandoff.model_validate(bad)


if __name__=='__main__':
    unittest.main()
