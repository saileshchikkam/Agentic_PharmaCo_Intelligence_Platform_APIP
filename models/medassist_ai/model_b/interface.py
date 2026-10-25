from enum import Enum
from typing import Literal, Protocol
from models.medassist_v2.research_adapter.schemas import Contract
from models.medassist_v2.research_adapter.handoff import EvidenceHandoff
from pydantic import model_validator


class UrgencyLevel(str, Enum):
    # Stable technical slots only. Clinical meanings/actions await human review.
    LEVEL_1 = 'level_1'
    LEVEL_2 = 'level_2'
    LEVEL_3 = 'level_3'
    LEVEL_4 = 'level_4'


class ModelBResult(Contract):
    status: Literal['unable_to_assess', 'research_assessment'] = 'unable_to_assess'
    urgency: UrgencyLevel | None = None
    reason: str = 'model_b_not_trained_or_validated'
    model_version: str | None = None
    evidence_schema: Literal['model-a-to-b.evidence.v1'] = 'model-a-to-b.evidence.v1'
    provenance: str = 'disabled_model_b'
    validation_metadata: str = 'not_available'

    @model_validator(mode='after')
    def separate_abstention(self):
        if self.status == 'unable_to_assess' and self.urgency is not None:
            raise ValueError('abstention_cannot_have_urgency')
        if self.status == 'research_assessment' and (self.urgency is None or not self.model_version
                or self.validation_metadata == 'not_available' or self.provenance == 'disabled_model_b'):
            raise ValueError('reviewed_version_and_validation_required')
        return self


class ModelBInterface(Protocol):
    def assess(self, evidence: EvidenceHandoff) -> ModelBResult: ...
