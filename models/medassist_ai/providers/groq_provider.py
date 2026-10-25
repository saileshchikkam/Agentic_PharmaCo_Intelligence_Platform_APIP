from copy import deepcopy
from time import perf_counter
from ..config.settings import GROQ_MODEL
from ..core.exceptions import ComponentUnavailable
from ..evidence.mapper import EvidenceMapper


class GroqProvider:
    """Injected bridge to existing backend extraction, not a second HTTP client.

    Production application transport remains server/groq-extraction.ts. No key,
    prompt implementation, benchmark or provider fallback is duplicated here.
    """
    model = GROQ_MODEL

    def __init__(self, transport=None):
        self._transport = transport
        self._metrics = {'model': self.model, 'requests': 0, 'failures': 0, 'last_latency_ms': None}

    @property
    def metrics(self):
        return deepcopy(self._metrics)

    def extract(self, text):
        if not isinstance(text, str) or not text.strip() or len(text) > 300:
            raise ComponentUnavailable('INVALID_EXTRACTION_INPUT')
        if self._transport is None:
            raise ComponentUnavailable('EXISTING_BACKEND_BRIDGE_REQUIRED')
        self._metrics['requests'] += 1
        at = perf_counter()
        try:
            return EvidenceMapper().proposal(self._transport(text), text)
        except Exception:
            self._metrics['failures'] += 1
            raise ComponentUnavailable('CONVERSATION_PROVIDER_UNAVAILABLE') from None
        finally:
            self._metrics['last_latency_ms'] = round((perf_counter()-at)*1000, 3)
