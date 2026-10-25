from time import time
from typing import Protocol
from ..core.schemas import NavigationConsent
from ..core.exceptions import EvidenceRejected


class HospitalProvider(Protocol):
    def search(self, consent: NavigationConsent, *, emergency=False) -> dict: ...


class UnavailableHospital:
    def search(self, consent, *, emergency=False):
        try:
            consent = NavigationConsent.model_validate(consent.model_dump() if isinstance(consent, NavigationConsent) else consent)
            if consent.consent.expires_at <= time()*1000:
                raise ValueError('expired')
        except (ValueError, TypeError):
            raise EvidenceRejected('LOCATION_CONSENT_REQUIRED') from None
        return {'status': 'unavailable', 'reason': 'verified_facility_provider_required'}
