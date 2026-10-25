"""Small explicit fictional entry vocabulary; no language model or clinical mapping."""
from typing import Literal

from .. import questioning_protocol as ref
from .schemas import Contract


class InitialOption(Contract):
    evidence_id: str
    label: str
    question_en: str


class ConversationVocabulary(Contract):
    schema_version: Literal['model-a.vocabulary.v1'] = 'model-a.vocabulary.v1'
    mode: Literal['limited_structured_input'] = 'limited_structured_input'
    initials: list[InitialOption]


# Exact public metadata wording, not inferred aliases or a clinical ontology.
ENTRY_OPTIONS = (
    ('E_201', 'Cough', 'Do you have a cough?'),
    ('E_91', 'Fever', 'Do you have a fever (either felt or measured with a thermometer)?'),
    ('E_97', 'Sore throat', 'Do you have a sore throat?'),
)


def conversation_vocabulary(service):
    options = []
    for eid, label, wording in ENTRY_OPTIONS:
        definition = service.definitions.get(eid)
        if (definition is None or definition['kind'] != 'symptom'
                or definition['data_type'] != 'B' or definition['question_en'] != wording
                or eid in ref.ORPHANS or eid in ref.EDGES):
            raise ValueError('entry_vocabulary_unavailable')
        options.append(InitialOption(evidence_id=eid, label=label, question_en=wording))
    return ConversationVocabulary(initials=options)
