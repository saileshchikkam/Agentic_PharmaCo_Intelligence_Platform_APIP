"""Metadata-backed fictional software tests; no fitting, records or clinical labels."""
import json
from pathlib import Path
import unittest
from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.research_adapter.service import ModelA
from models.medassist_v2.research_adapter.natural import candidates, interview, NaturalRequest, Turn
from models.medassist_v2.research_adapter.schemas import Answer, NextRequest
from models.medassist_v2.training.fictional import NonLearningEstimator


class UnderstandingCandidates(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=ref.load_protocol()
        metadata=json.loads(Path('models/medassist_ai/docs/symptom-schema-metadata.json').read_text())
        definitions={d['evidence_id']:{k:d[k] for k in ('kind','data_type','question_en','possible_values')} for d in metadata['items']}
        cls.service=ModelA(cls.p,definitions,NonLearningEstimator(cls.p,1e-5))

    def request(self,initial='E_201',extra=None):
        return NaturalRequest(context={'age':35,'source_sex':'F'},initial=Answer(evidence_id=initial,state='confirmed',value=True),initial_disclosures=extra or [])

    def test_significant_breathing_root_has_audited_respiratory_pool(self):
        result=interview(self.service,self.request('E_66'))
        self.assertIsNotNone(result['result']['selection']['question'])
        self.assertIn('E_201',result['audit']['candidate_ids'])
        self.assertNotIn('E_66',result['audit']['candidate_ids'])
        self.assertEqual(result['audit']['filter_version'],'topical-candidates.v2')

    def test_negative_unknown_parents_do_not_unlock_children_or_lose_evidence(self):
        for state,value in [('confirmed',False),('unknown',None)]:
            request=self.request(extra=[Answer(evidence_id='E_53',state=state,value=value)])
            result=interview(self.service,request)
            self.assertFalse(set(ref.EDGES)&set(result['audit']['candidate_ids']))
            item=next(i for i in result['result']['handoff']['items'] if i['evidence_id']=='E_53')
            self.assertEqual(item['status'],'observed_negative' if value is False else 'unknown')

    def test_eight_routine_turns_no_repeats_and_no_quarantined_questions(self):
        request=self.request();seen=[]
        for _ in range(8):
            result=interview(self.service,request);q=result['result']['selection']['question']
            self.assertNotIn(q['evidence_id'],seen);self.assertNotIn(q['evidence_id'],ref.ORPHANS)
            seen.append(q['evidence_id']);request.turns.append(Turn(answer=Answer(evidence_id=q['evidence_id'],state='unknown',value=None)))
        result=interview(self.service,request)
        self.assertEqual(result['progress']['answered'],8);self.assertIsNone(result['result']['selection']['question'])
        self.assertEqual(result['result']['selection']['reason'],'question_budget')
        self.assertEqual(len(result['result']['handoff']['items']),223)
        self.assertEqual(result['result']['handoff']['model_b_status'],'not_enabled')

    def test_clarification_is_not_a_model_turn_and_wrong_question_is_rejected(self):
        request=self.request('E_53');first=interview(self.service,request)
        self.assertEqual(first['progress']['answered'],0)
        self.assertEqual(interview(self.service,request)['result']['selection']['question'],first['result']['selection']['question'])
        bad=next(eid for eid in ['E_54','E_55','E_56'] if eid!=first['result']['selection']['question']['evidence_id'])
        request.turns.append(Turn(answer=Answer(evidence_id=bad,state='unknown',value=None)))
        with self.assertRaises(Exception):interview(self.service,request)


if __name__=='__main__':unittest.main()
