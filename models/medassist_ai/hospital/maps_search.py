"""Location-only external Maps search handoff; no verified facility results or routing claims."""
from time import time
from urllib.parse import urlencode
from .interface import UnavailableHospital
from ..core.schemas import NavigationConsent
from ..core.exceptions import EvidenceRejected


class MapsSearchHospital(UnavailableHospital):
    def search(self, consent, *, emergency=False):
        super().search(consent)  # strict existing scoped-consent and coordinate contract
        request = NavigationConsent.model_validate(consent.model_dump() if isinstance(consent, NavigationConsent) else consent)
        if request.consent.expires_at > time()*1000+120000:
            raise EvidenceRejected('SHORT_LIVED_LOCATION_CONSENT_REQUIRED')
        location = f'{request.location.latitude:.3f},{request.location.longitude:.3f}'
        term = 'hospital emergency departments' if emergency else 'hospitals'
        return {'schema_version': 'medassist.navigation-handoff.v1', 'status': 'search_handoff',
            'provider': 'google_maps', 'url': 'https://www.google.com/maps/search/?'+urlencode({'api': '1', 'query': f'{term} near {location}'}),
            'facilities': [], 'verified_facility_provider': False,
            'availability': 'unknown', 'suitability': 'not_verified',
            'network_status': 'external_search_not_checked', 'includes_symptoms': False}
