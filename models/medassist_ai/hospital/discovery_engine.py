"""Phase B3: Symptom-Matched Healthcare Facility Discovery and Ranking Engine.

Deterministic capability matching, exclusion filtering, and 5-priority accessibility
ranking across all 10 healthcare facility tiers. Non-clinical research demonstrator.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from models.medassist_ai.hospital.contracts import (
    CapabilityVerificationStatus,
    DiscoveredFacility,
    FacilityDiscoveryRequest,
    FacilityDiscoveryResponse,
)
from models.medassist_ai.precautions.contracts import FacilityNavigationContract, FacilityTierId
from models.medassist_ai.severity.contracts import UrgencyLevel

_MODULE_DIR = Path(__file__).resolve().parent
_FIXTURES_PATH = _MODULE_DIR / "facility_fixtures.json"


class FacilityDiscoveryEngine:
    """Intelligent facility discovery and ranking engine."""

    def __init__(self, fixtures_path: Optional[Path] = None) -> None:
        path = fixtures_path or _FIXTURES_PATH
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.fixtures: List[DiscoveredFacility] = [
            DiscoveredFacility(**item) for item in data.get("fixtures", [])
        ]

    def discover_and_rank(
        self,
        request: FacilityDiscoveryRequest,
        candidate_facilities: Optional[List[DiscoveredFacility]] = None,
        provider: str = "simulated_fixture",
        provider_status: str = "simulated_fixtures",
    ) -> FacilityDiscoveryResponse:
        nav = request.navigation_contract
        urgency = nav.urgency_level
        emergency_required = nav.emergency_department_required or (urgency == UrgencyLevel.EXTREME)
        req_service = nav.required_service.strip().lower()
        alt_service = (nav.alternative_service or "").strip().lower()

        candidates = list(candidate_facilities if candidate_facilities is not None else self.fixtures)
        exclusions_applied: List[str] = []
        eligible_facilities: List[DiscoveredFacility] = []
        seen_ids: Set[str] = set()

        for fac in candidates:
            # 1. Deduplicate by stable ID
            if fac.facility_id in seen_ids:
                continue
            seen_ids.add(fac.facility_id)

            # 2. Category eligibility check
            eligible_tier_values = [t.value if isinstance(t, FacilityTierId) else str(t) for t in nav.eligible_facility_tiers]
            fac_tier_val = fac.facility_category.value if isinstance(fac.facility_category, FacilityTierId) else str(fac.facility_category)
            if eligible_tier_values and fac_tier_val not in eligible_tier_values:
                exclusions_applied.append(f"Excluded {fac.name}: facility tier '{fac_tier_val}' not in eligible tiers")
                continue

            # 3. Emergency capability filter
            if emergency_required:
                if not fac.emergency_capable:
                    exclusions_applied.append(f"Excluded {fac.name}: lacks 24x7 emergency department resuscitation")
                    continue
                if fac_tier_val in ["clinics_polyclinics", "diagnostic_centres"]:
                    exclusions_applied.append(f"Excluded {fac.name}: outpatient-only tier excluded during emergency")
                    continue

            # 4. Specialty matching
            fac_specialties = [s.lower() for s in fac.relevant_specialties]
            service_matched = False
            match_reason = ""

            if emergency_required:
                # In emergency, Emergency Medicine or acute trauma capability matches
                if any("emergency" in s or "trauma" in s for s in fac_specialties):
                    service_matched = True
                    match_reason = "24x7 Emergency & Trauma Resuscitation capability"
            else:
                # Check match against primary required service or alternative
                for spec in fac_specialties:
                    if (req_service in spec or spec in req_service or
                        any(token in spec for token in req_service.split() if len(token) > 4)):
                        service_matched = True
                        match_reason = f"Primary service match: {fac.name} offers {spec}"
                        break
                if not service_matched and alt_service:
                    for spec in fac_specialties:
                        if (alt_service in spec or spec in alt_service or
                            any(token in spec for token in alt_service.split() if len(token) > 4)):
                            service_matched = True
                            match_reason = f"Alternative service match: {fac.name} offers {spec}"
                            break

            if not service_matched:
                exclusions_applied.append(f"Excluded {fac.name}: does not offer required service '{nav.required_service}' or alternative '{nav.alternative_service}'")
                continue

            # 5. Diagnostic centre restriction: not a substitute for clinical consultation or emergency
            if fac_tier_val == "diagnostic_centres" and not any("diagnostic" in req_service for _ in [0]):
                exclusions_applied.append(f"Excluded {fac.name}: diagnostic centre is not a substitute for medical consultation")
                continue

            # 6. Rank scoring per the 5 priorities
            score = 1000.0
            reasons: List[str] = [match_reason]

            # Priority 1: Clinical Capability & Verification
            if fac.capability_verification_status == CapabilityVerificationStatus.VERIFIED_REGISTRY:
                score += 300.0
                reasons.append("Verified facility registry credentials")
            elif fac.capability_verification_status == CapabilityVerificationStatus.PROVISIONAL_MATCH:
                score += 150.0
                reasons.append("Provisional match on registered specialty")

            # Priority 2: Urgency & Availability (Open now, 24x7)
            if emergency_required:
                if fac.is_24x7:
                    score += 400.0
                    reasons.append("24x7 continuous emergency availability")
            else:
                if fac.open_now is True:
                    score += 200.0
                    reasons.append("Currently open for consultations")
                elif fac.open_now is False:
                    score -= 100.0
                    reasons.append("Currently closed; scheduled opening applies")

            # Priority 3 & 4: Travel Duration & Road Distance (accessibility)
            duration_secs = fac.travel_duration_seconds or 1800
            dist_meters = fac.distance_meters or 5000

            # Accessibility penalty for travel time (e.g. -1 point per 10 seconds of travel time)
            score -= (duration_secs / 10.0)
            # Distance penalty (e.g. -1 point per 50 meters)
            score -= (dist_meters / 50.0)

            # Priority 5: Tier Appropriateness without commercial/size bias
            # Rule: A nearby single-doctor clinic must rank ahead of a large hospital when both are
            # equally appropriate and available and the clinic is more accessible.
            if not emergency_required and urgency in [UrgencyLevel.LOW, UrgencyLevel.MEDIUM]:
                if fac_tier_val in ["clinics_polyclinics", "primary_health_centres"]:
                    score += 150.0
                    reasons.append("Accessible primary care clinic prioritized for routine/outpatient consultation")
                elif fac_tier_val in ["superspecialty_tertiary_hospitals", "private_multispecialty_hospitals"]:
                    score -= 50.0
                    reasons.append("Tertiary/multi-specialty facility reserved for higher acuity")

            fac_copy = fac.model_copy()
            fac_copy.ranking_score = round(score, 2)
            fac_copy.ranking_reasons = reasons
            eligible_facilities.append(fac_copy)

        # Sort descending by ranking score
        eligible_facilities.sort(key=lambda f: f.ranking_score, reverse=True)

        location_str = request.manual_locality or (
            f"{request.latitude:.3f}, {request.longitude:.3f}" if request.latitude is not None and request.longitude is not None else "Unknown"
        )
        location_type = "manual_locality" if request.manual_locality else "device_coordinates"

        disclaimers = [
            "Research-only demonstrator: facility directory information does not constitute a certified medical referral or guarantee of immediate bed availability.",
            "In a real medical emergency, immediately dial 112 / 108 or go to the nearest 24x7 Emergency Department; do not delay for navigation.",
            "Facilities are evaluated based on clinical capabilities and travel accessibility without commercial bias or hospital size preference.",
        ]

        return FacilityDiscoveryResponse(
            schema_version="medassist.facility-discovery.v1",
            research_only=True,
            clinical_claim=False,
            provider="simulated_fixture" if provider_status != "live_api_active" else "google_maps_platform_v1",
            provider_status="live_api_active" if provider_status == "live_api_active" else "simulated_fixtures",
            location_type=location_type,
            approximate_location=location_str,
            searched_service=nav.required_service,
            urgency_level=urgency,
            emergency_department_required=emergency_required,
            facilities=eligible_facilities,
            exclusions_applied=exclusions_applied,
            disclaimers=disclaimers,
        )


def discover_healthcare_facilities(request: FacilityDiscoveryRequest) -> FacilityDiscoveryResponse:
    """Convenience helper function to run FacilityDiscoveryEngine."""
    engine = FacilityDiscoveryEngine()
    return engine.discover_and_rank(request)
