"""Canonical evidence models are reused, never forked."""
from typing import Literal
from pydantic import Field
from models.medassist_v2.research_adapter.schemas import Contract
from models.medassist_v2.research_adapter.handoff import EvidenceHandoff


class ResearchOutput(Contract):
    status: Literal['unavailable', 'research_only']
    reason: str | None = None
    disease_label: str | None = None
    clinical_diagnosis: Literal[False] = False
    # No precaution text or uncalibrated probability is passed to the chat.


class LocationConsent(Contract):
    granted: Literal[True]
    purpose: Literal['nearby_hospital_search']
    # Matches existing TypeScript contract: Unix milliseconds.
    expires_at: float = Field(allow_inf_nan=False)


class Coordinates(Contract):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)


class NavigationConsent(Contract):
    schema_version: Literal['medassist.navigation-request.v1']
    consent: LocationConsent
    location: Coordinates
