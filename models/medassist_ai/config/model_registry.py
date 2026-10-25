from dataclasses import dataclass
from types import MappingProxyType
from .settings import GROQ_MODEL


@dataclass(frozen=True)
class Component:
    name: str
    canonical_reference: str
    execution: str
    responsibility: str


class ModelRegistry:
    """Metadata only. Registration never deserializes or authorizes a component."""
    def __init__(self):
        self.components = MappingProxyType({c.name: c for c in (
            Component('groq', GROQ_MODEL, 'existing guarded backend only', 'unaccepted extraction proposals'),
            Component('model_a', 'models/medassist_v2/research_adapter', 'existing verified service', 'follow-up selection'),
            Component('jayanth', 'app/ml/model.joblib', 'disabled', 'isolated disease research'),
            Component('model_b', 'models/medassist_ai/model_b', 'disabled', 'future urgency research'),
            Component('safety', 'models/medassist_ai/safety/provisional-rules.v1.json', 'provisional explicit-statement guard', 'no clinically approved red-flag protocol'),
            Component('hospital', 'models/medassist_ai/hospital/maps_search.py', 'external Maps search handoff only', 'consented location, no verified facilities'),
        )})

    def get(self, name):
        return self.components[name]
