import time
from copy import deepcopy
import unittest
from models.medassist_ai.model_b.disabled_provider import DisabledModelB
from models.medassist_ai.model_b.interface import ModelBResult, UrgencyLevel
from models.medassist_ai.hospital.interface import UnavailableHospital
from models.medassist_ai.core.exceptions import EvidenceRejected


class DisabledTests(unittest.TestCase):
    def test_abstention_independent_of_four_technical_target_slots(self):
        self.assertEqual(len(UrgencyLevel),4)
        result=DisabledModelB().assess(None)
        self.assertEqual(result.status,'unable_to_assess');self.assertIsNone(result.urgency)
        with self.assertRaises(ValueError):ModelBResult(urgency=UrgencyLevel.LEVEL_1)
        with self.assertRaises(ValueError):ModelBResult(status='research_assessment',urgency=UrgencyLevel.LEVEL_1)

    def test_hospital_requires_scoped_live_consent_without_symptoms(self):
        request={'schema_version':'medassist.navigation-request.v1','consent':{'granted':True,
                 'purpose':'nearby_hospital_search','expires_at':time.time()*1000+60000},'location':{'latitude':10,'longitude':20}}
        self.assertEqual(UnavailableHospital().search(request)['status'],'unavailable')
        for group,field,value in [('consent','granted',False),('consent','expires_at',0),('location','latitude',float('nan'))]:
            invalid=deepcopy(request);invalid[group][field]=value
            with self.assertRaises(EvidenceRejected):UnavailableHospital().search(invalid)
        with self.assertRaises(EvidenceRejected):UnavailableHospital().search({**request,'text':'cough'})
