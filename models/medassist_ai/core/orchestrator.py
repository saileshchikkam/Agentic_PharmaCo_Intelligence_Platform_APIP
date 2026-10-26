from copy import deepcopy
from .exceptions import ComponentUnavailable
from ..evidence.validator import EvidenceValidator
from ..model_b.disabled_provider import DisabledModelB
from ..safety.interface import UnavailableSafety
from ..hospital.maps_search import MapsSearchHospital
from ..safety.provisional import ProvisionalSafety


class MedAssistOrchestrator:
    def __init__(self, model_a, *, conversation=None, model_b=None, disease=None,
                 safety=None, hospital=None, validator=None):
        self.model_a = model_a
        self.conversation = conversation
        self.model_b = model_b if model_b is not None else DisabledModelB()
        self.disease = disease
        self.safety = safety if safety is not None else ProvisionalSafety()
        self.hospital = hospital if hospital is not None else MapsSearchHospital()
        catalogue_ids = getattr(model_a, 'evidence_ids', None)
        self.validator = validator if validator is not None else EvidenceValidator(
            catalogue_ids if isinstance(catalogue_ids, frozenset) else None)

    def propose(self, text):
        # The explicit emergency guard precedes even missing/failed language services.
        safety = ProvisionalSafety().check(text)
        if safety['suppress_ordinary_flow']:
            return {'accepted': False, 'safety': safety, 'model_b_status': 'unable_to_assess'}
        if self.conversation is None:
            raise ComponentUnavailable('EXISTING_CONVERSATION_BOUNDARY_REQUIRED')
        return self.conversation.extract(text)

    def interview(self, request):
        # Only structured confirmed user inputs reach this method. No LLM or
        # disease/safety/urgency call can select or replace a follow-up question.
        result = self.model_a.interview(request)
        if result.handoff is not None:
            self.validator.validate(result.handoff)
        return result

    def navigate(self, consent, *, emergency=False):
        # Navigation has its own consent boundary; never receives a handoff or disease/urgency score.
        return self.hospital.search(consent, emergency=emergency)

    def research_summary(self, raw, *, include_disease=False):
        # Separate opt-in developer API, never inserted into DemoResult/chat.
        evidence = self.validator.validate(raw)
        # A failed experimental model must not suppress the independent safety seam.
        try:
            safety = self.safety.check(evidence.model_copy(deep=True))
        except Exception:
            safety = {'status': 'unavailable', 'reason': 'safety_provider_unavailable'}
        try:
            urgency = self.model_b.assess(evidence.model_copy(deep=True)).model_dump()
        except Exception:
            urgency = DisabledModelB().assess(evidence).model_dump()
        out = {'model_b': urgency, 'safety': safety,
               'disease': {'status': 'unavailable', 'reason': 'not_requested'}}
        if include_disease and self.disease is not None:
            try:
                out['disease'] = self.disease.predict(evidence.model_copy(deep=True)).model_dump()
            except Exception:
                out['disease'] = {'status': 'unavailable', 'reason': 'disease_research_unavailable'}
        return deepcopy(out)
