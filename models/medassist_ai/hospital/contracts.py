"""Phase B3: Symptom-Matched Healthcare Facility Discovery Contracts.

Versioned, research-only output contract for MedAssist Phase B3 facility discovery
and Google Maps Platform integration. Non-clinical demonstration only.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator

from models.medassist_ai.precautions.contracts import FacilityNavigationContract, FacilityTierId
from models.medassist_ai.severity.contracts import UrgencyLevel


class CapabilityVerificationStatus(str, Enum):
    """Healthcare capability verification status for candidate facilities."""
    VERIFIED_REGISTRY = "verified_registry"
    PROVISIONAL_MATCH = "provisional_match"
    UNVERIFIED_CANDIDATE = "unverified_candidate"


class DiscoveredFacility(BaseModel):
    """Structured record of an appropriate candidate healthcare facility."""
    facility_id: str
    name: str
    facility_category: FacilityTierId
    facility_category_display: str
    relevant_specialties: List[str] = Field(default_factory=list)
    capability_verification_status: CapabilityVerificationStatus
    verification_source: str
    verification_timestamp: str
    emergency_capable: bool = False
    address: str
    phone_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    open_now: Optional[bool] = None
    is_24x7: bool = False
    opening_hours_text: Optional[str] = None
    distance_meters: Optional[int] = None
    distance_text: Optional[str] = None
    travel_duration_seconds: Optional[int] = None
    travel_duration_text: Optional[str] = None
    maps_url: str
    directions_url: str
    ranking_score: float = 0.0
    ranking_reasons: List[str] = Field(default_factory=list)


class FacilityDiscoveryRequest(BaseModel):
    """Patient-privacy preserving facility discovery query."""
    schema_version: Literal["medassist.facility-discovery-request.v1"] = "medassist.facility-discovery-request.v1"
    consent_granted: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    manual_locality: Optional[str] = None
    navigation_contract: FacilityNavigationContract
    search_radius_meters: int = 10000

    @model_validator(mode="after")
    def validate_location_presence(self) -> FacilityDiscoveryRequest:
        if not self.consent_granted:
            raise ValueError("explicit_user_consent_required")
        has_coords = self.latitude is not None and self.longitude is not None
        has_locality = self.manual_locality is not None and len(self.manual_locality.strip()) > 0
        if not has_coords and not has_locality:
            raise ValueError("either_coordinates_or_manual_locality_required")
        return self


class FacilityDiscoveryResponse(BaseModel):
    """Complete Phase B3 facility discovery result."""
    schema_version: Literal["medassist.facility-discovery.v1"] = "medassist.facility-discovery.v1"
    research_only: Literal[True] = True
    clinical_claim: Literal[False] = False
    provider: Literal["google_maps_platform_v1", "simulated_fixture"]
    provider_status: Literal[
        "live_api_active",
        "simulated_fixtures",
        "live_api_pending_credentials",
        "live_api_failed"
    ]
    location_type: Literal["device_coordinates", "manual_locality"]
    approximate_location: str
    searched_service: str
    urgency_level: UrgencyLevel
    emergency_department_required: bool
    facilities: List[DiscoveredFacility] = Field(default_factory=list)
    exclusions_applied: List[str] = Field(default_factory=list)
    disclaimers: List[str] = Field(default_factory=list)
