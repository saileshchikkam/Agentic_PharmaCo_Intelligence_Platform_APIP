"""Versioned transport contracts, separate from the immutable research protocol."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictFloat, StrictInt, StrictStr, field_validator, model_validator

Scalar = StrictBool | StrictInt | StrictFloat | StrictStr
Value = Scalar | list[Scalar] | None


class Contract(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True, allow_inf_nan=False)


class Context(Contract):
    age: StrictInt | StrictFloat = Field(ge=0)
    source_sex: Literal['M', 'F']


class Answer(Contract):
    evidence_id: str = Field(pattern=r'^E_[0-9]{1,3}$', max_length=8)
    state: Literal['confirmed', 'unknown', 'contradiction']
    value: Value

    @model_validator(mode='after')
    def check_state(self):
        if (self.state == 'confirmed') != (self.value is not None):
            raise ValueError('answer_state_value_mismatch')
        if isinstance(self.value, list) and len(self.value) > 223:
            raise ValueError('answer_value_limit')
        if isinstance(self.value, str) and len(self.value) > 256:
            raise ValueError('answer_value_limit')
        return self


class NextRequest(Contract):
    schema_version: Literal['model-a.request.v1']
    fictional_case: Literal[True]
    context: Context
    initial: Answer
    answers: list[Answer] = Field(default_factory=list, max_length=20)
    stop: Literal['user_stopped', 'unresolved_contradiction'] | None = None

    @field_validator('fictional_case', mode='before')
    @classmethod
    def explicit_fictional_opt_in(cls, value):
        if value is not True:
            raise ValueError('explicit_fictional_opt_in_required')
        return value


class Question(Contract):
    evidence_id: str
    question_en: str
    data_type: Literal['B', 'C', 'M']
    possible_values: list[Scalar]
    allows_unknown: Literal[True] = True
    unknown_value: None = None


class Evidence(Contract):
    schema_version: Literal['model-a.evidence.v1'] = 'model-a.evidence.v1'
    origin: Literal['developer_fictional_fixture'] = 'developer_fictional_fixture'
    context: Context
    initial: Answer
    answers: list[Answer]
    unobserved_semantics: Literal['unknown_not_negative'] = 'unknown_not_negative'
    human_clinical_review: Literal[False] = False


class QuestioningState(Contract):
    answered_question_ids: list[str]
    pending_question_id: str | None
    questions_answered: int
    remaining_budget: int
    stopping_reason: str | None


class NextResponse(Contract):
    schema_version: Literal['model-a.response.v1'] = 'model-a.response.v1'
    research_only: Literal[True] = True
    status: Literal['question', 'abstained']
    reason: str | None
    question: Question | None
    state: QuestioningState | None
    evidence: Evidence | None
    limitations: list[str]

    @model_validator(mode='after')
    def consistent_result(self):
        if self.status == 'question':
            if self.question is None or self.state is None or self.evidence is None or self.reason is not None:
                raise ValueError('invalid_question_result')
            if (self.state.pending_question_id != self.question.evidence_id
                    or self.question.evidence_id in self.state.answered_question_ids):
                raise ValueError('invalid_pending_question')
        elif self.question is not None or self.reason is None:
            raise ValueError('invalid_abstention_result')
        return self
