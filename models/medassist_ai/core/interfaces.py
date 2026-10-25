from typing import Protocol
from models.medassist_v2.research_adapter.schemas import NextRequest
from models.medassist_v2.research_adapter.demo import DemoResult


class ConversationalProvider(Protocol):
    model: str

    def extract(self, text: str) -> dict: ...


class QuestionProvider(Protocol):
    def interview(self, request: NextRequest) -> DemoResult: ...
