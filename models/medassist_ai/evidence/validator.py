from pydantic import ValidationError
from models.medassist_v2.research_adapter.handoff import EvidenceHandoff
from ..core.exceptions import EvidenceRejected


class EvidenceValidator:
    def __init__(self, catalogue_ids=None):
        self._catalogue_ids = frozenset(catalogue_ids) if catalogue_ids is not None else None

    def validate(self, raw) -> EvidenceHandoff:
        try:
            # Revalidate even typed instances to catch in-place mutations.
            value = raw.model_dump() if isinstance(raw, EvidenceHandoff) else raw
            result = EvidenceHandoff.model_validate(value)
            # IDs are catalogue-owned, not a guessed contiguous numeric range.
            # Uniqueness/provenance are canonical schema checks; ingress membership
            # remains the frozen service's responsibility.
            if len(result.items) != 223:
                raise ValueError('incomplete_export')
            if self._catalogue_ids is not None and {i.evidence_id for i in result.items} != self._catalogue_ids:
                raise ValueError('catalogue_membership')
            return result
        except (ValidationError, ValueError, TypeError):
            raise EvidenceRejected('INVALID_CANONICAL_EVIDENCE') from None
