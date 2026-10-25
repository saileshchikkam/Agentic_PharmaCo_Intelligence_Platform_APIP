from models.medassist_v2.research_adapter.demo import interview
from models.medassist_v2.research_adapter.schemas import NextRequest
from ..core.exceptions import ComponentUnavailable, EvidenceRejected


class ModelAAdapter:
    """Uses the already verified service; does not load, copy or fit any artifact."""
    def __init__(self, service):
        self._service = service

    @property
    def evidence_ids(self):
        return frozenset(self._service.definitions) if self._service is not None else None

    def interview(self, request):
        if self._service is None:
            raise ComponentUnavailable('MODEL_A_UNAVAILABLE')
        try:
            request = NextRequest.model_validate(request.model_dump() if isinstance(request, NextRequest) else request)
        except (ValueError, TypeError):
            raise EvidenceRejected('INVALID_INTERVIEW_REQUEST') from None
        try:
            return interview(self._service, request)
        except Exception:
            raise ComponentUnavailable('MODEL_A_INFERENCE_UNAVAILABLE') from None
