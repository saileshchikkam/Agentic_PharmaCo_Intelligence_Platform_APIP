"""Fictional interactive transport/lifecycle; never opens patient records or trains."""
import unittest

from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.loader import normalise_catalogue
from models.medassist_v2.research_adapter.demo import DemoResult, demo_fixtures, interview
from models.medassist_v2.research_adapter.handoff import EvidenceHandoff
from models.medassist_v2.research_adapter.schemas import NextRequest
from models.medassist_v2.research_adapter.service import ModelA
from models.medassist_v2.tests.test_research_adapter import answer, client, payload
from models.medassist_v2.training.fictional import FictionalDataset, NonLearningEstimator


class DemoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=ref.load_protocol();data=FictionalDataset(cls.p)
        definitions={eid:d for eid,d in normalise_catalogue(data.source)['evidences'].items() if eid.startswith('E_')}
        cls.service=ModelA(cls.p,definitions,NonLearningEstimator(cls.p,1e-5))

    def test_fixtures_and_interactive_lifecycle(self):
        with client(self.service) as api:
            response=api.get('/research/model-a/v1/demo/fixtures')
            self.assertEqual(response.status_code,200)
            request=response.json()['fixtures'][0]['request']
            for state,value in [('confirmed',True),('confirmed',False),('unknown',None)]:
                response=api.post('/research/model-a/v1/demo/interview',json=request)
                self.assertEqual(response.status_code,200)
                result=DemoResult.model_validate(response.json());q=result.selection.question
                self.assertNotIn(q.evidence_id,[a['evidence_id'] for a in request['answers']])
                self.assertNotIn(q.evidence_id,ref.ORPHANS)
                pending=next(i for i in result.handoff.items if i.evidence_id==q.evidence_id)
                self.assertEqual(pending.status,'not_asked')
                # Fixture policy is lexical; choose a supported value for each selected type.
                if state=='confirmed' and q.data_type!='B':
                    value=q.possible_values[0] if q.data_type=='C' else []
                request['answers'].append(answer(q.evidence_id,state,value))
            request['stop']='user_stopped'
            result=DemoResult.model_validate(api.post('/research/model-a/v1/demo/interview',json=request).json())
            self.assertEqual(result.selection.reason,'user_stopped')
            self.assertIsNone(result.selection.question)
            self.assertEqual(result.handoff.schema_version,'model-a-to-b.evidence.v1')
            self.assertEqual(result.handoff.model_b_status,'not_enabled')
            EvidenceHandoff.model_validate_json(result.handoff.model_dump_json())

    def test_typed_and_missingness_evidence_export(self):
        events=[answer('E_53'),answer('E_55',value=['NA','a']),answer('E_204',value=0),answer('E_129',value=False),answer('E_151','unknown',None)]
        result=interview(self.service,NextRequest.model_validate(payload(answers=events)))
        items={i.evidence_id:i for i in result.handoff.items}
        self.assertEqual(items['E_55'].value,['NA','a'])
        self.assertEqual(items['E_204'].status,'observed_value')
        self.assertEqual(items['E_129'].status,'observed_negative')
        self.assertEqual(items['E_151'].status,'unknown')
        self.assertEqual(items['E_1'].status,'not_asked')
        self.assertEqual(items['E_69'].status,'unsupported')

    def test_invalid_initial_dependencies_duplicate_and_oov_abstain(self):
        for events in [[answer('E_54',value=[])],[answer('E_69')],[answer('E_999')],[answer('E_53'),answer('E_53')]]:
            result=interview(self.service,NextRequest.model_validate(payload(answers=events)))
            self.assertEqual(result.selection.status,'abstained');self.assertIsNone(result.handoff)
        request=payload();request['initial']['value']=False
        self.assertIsNone(interview(self.service,NextRequest.model_validate(request)).handoff)

    def test_contradiction_stops_and_exports_without_resolution(self):
        result=interview(self.service,NextRequest.model_validate(payload(answers=[answer('E_53','contradiction',None)])))
        self.assertEqual(result.selection.reason,'unresolved_contradiction')
        self.assertIsNone(result.selection.question)
        self.assertEqual(next(i.status for i in result.handoff.items if i.evidence_id=='E_53'),'contradiction')

    def test_unavailable_local_isolation_and_contract_versions(self):
        with client() as api:
            self.assertEqual(api.get('/research/model-a/v1/demo/fixtures').status_code,503)
            self.assertEqual(api.post('/research/model-a/v1/demo/interview',json=payload()).status_code,503)
        with client(self.service) as api:
            self.assertEqual(api.get('/research/model-a/v1/demo/fixtures',headers={'Origin':'http://localhost'}).status_code,403)
            bad=payload();bad['schema_version']='model-a.request.v2'
            self.assertEqual(api.post('/research/model-a/v1/demo/interview',json=bad).status_code,422)

    def test_deterministic_fixture_selection(self):
        request=demo_fixtures(self.service).fixtures[0].request
        self.assertEqual(interview(self.service,request).model_dump(),interview(self.service,request).model_dump())


if __name__=='__main__':unittest.main()
