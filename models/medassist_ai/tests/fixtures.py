from models.medassist_v2.tests.test_research_adapter import payload, answer
from models.medassist_v2 import questioning_protocol as ref
from models.medassist_v2.training.fictional import FictionalDataset, NonLearningEstimator
from models.medassist_v2.loader import normalise_catalogue
from models.medassist_v2.research_adapter.service import ModelA
from models.medassist_v2.research_adapter.schemas import NextRequest
from models.medassist_v2.research_adapter.demo import interview


def service():
    protocol = ref.load_protocol()
    definitions = {key: value for key, value in normalise_catalogue(FictionalDataset(protocol).source)['evidences'].items()
                   if key.startswith('E_')}
    # Complete authored software catalogue; no official dataset records read.
    for n in range(223):
        definitions.setdefault(f'E_{n}', {'kind':'symptom', 'data_type':'B',
                                        'question_en':'Fictional software question?', 'possible_values':[]})
    return ModelA(protocol, definitions,
                  NonLearningEstimator(protocol, 1e-5))


def handoff():
    return interview(service(), NextRequest.model_validate(payload(answers=[answer('E_53', 'unknown', None)]))).handoff
