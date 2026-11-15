"""Unit tests for MedAssist Phase B3: Healthcare Facility Discovery & Ranking Engine."""
import unittest

from models.medassist_ai.hospital.contracts import (
    CapabilityVerificationStatus,
    DiscoveredFacility,
    FacilityDiscoveryRequest,
    FacilityDiscoveryResponse,
)
from models.medassist_ai.hospital.discovery_engine import FacilityDiscoveryEngine
from models.medassist_ai.hospital.maps_provider import GoogleMapsFacilityProvider
from models.medassist_ai.precautions.contracts import FacilityNavigationContract, FacilityTierId
from models.medassist_ai.severity.contracts import UrgencyLevel


class TestFacilityDiscoveryEngine(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = FacilityDiscoveryEngine()

    def _create_mock_nav_contract(
        self,
        required_service: str = "Pulmonology & Respiratory Medicine",
        alternative_service: str | None = "Family Medicine & General Practice",
        urgency: UrgencyLevel = UrgencyLevel.LOW,
        emergency_required: bool = False,
        eligible_tiers: list[FacilityTierId] | None = None,
    ) -> FacilityNavigationContract:
        default_tiers = (
            [
                FacilityTierId.EMERGENCY_DEPARTMENTS_TRAUMA,
                FacilityTierId.GOVERNMENT_GENERAL_DISTRICT_HOSPITALS,
                FacilityTierId.PRIVATE_MULTISPECIALTY_HOSPITALS,
                FacilityTierId.MEDICAL_COLLEGE_HOSPITALS,
            ]
            if emergency_required
            else [
                FacilityTierId.CLINICS_POLYCLINICS,
                FacilityTierId.PRIMARY_HEALTH_CENTRES,
                FacilityTierId.COMMUNITY_HEALTH_CENTRES,
                FacilityTierId.SMALL_PRIVATE_HOSPITALS,
                FacilityTierId.GOVERNMENT_GENERAL_DISTRICT_HOSPITALS,
                FacilityTierId.PRIVATE_MULTISPECIALTY_HOSPITALS,
                FacilityTierId.SUPERSPECIALTY_TERTIARY_HOSPITALS,
                FacilityTierId.MEDICAL_COLLEGE_HOSPITALS,
            ]
        )
        return FacilityNavigationContract(
            schema_version="medassist.facility-navigation.v1",
            research_only=True,
            clinical_claim=False,
            required_service=required_service,
            alternative_service=alternative_service,
            required_capabilities=["outpatient_consultation"],
            urgency_level=urgency,
            emergency_department_required=emergency_required,
            facility_verification_requirements=["verified_specialist_consultation"],
            explicit_exclusions=["diagnostic_centres_without_consulting_physicians"],
            eligible_facility_tiers=eligible_tiers or default_tiers,
        )

    def test_small_clinic_outranks_large_hospital_for_low_urgency(self) -> None:
        """A nearby single-doctor clinic must rank ahead of a large hospital when both

        offer the service and the clinic is more accessible for low urgency.
        """
        nav = self._create_mock_nav_contract(
            required_service="Pulmonology & Respiratory Medicine",
            urgency=UrgencyLevel.LOW,
            emergency_required=False,
        )
        request = FacilityDiscoveryRequest(
            schema_version="medassist.facility-discovery-request.v1",
            consent_granted=True,
            latitude=17.385,
            longitude=78.486,
            navigation_contract=nav,
        )
        response = self.engine.discover_and_rank(request)
        self.assertIsInstance(response, FacilityDiscoveryResponse)
        self.assertTrue(len(response.facilities) >= 2)

        # The first ranked facility must be the accessible clinic (Dr. Rao Chest Clinic)
        top_facility = response.facilities[0]
        self.assertEqual(top_facility.facility_id, "FAC_CLINIC_01")
        self.assertEqual(top_facility.facility_category, FacilityTierId.CLINICS_POLYCLINICS)

        # Verify it ranks higher than CareWell Multi-Speciality (FAC_PVT_MULTI_01)
        # and Apex Super-Speciality (FAC_SUPER_01)
        facility_ids = [f.facility_id for f in response.facilities]
        idx_clinic = facility_ids.index("FAC_CLINIC_01")
        if "FAC_PVT_MULTI_01" in facility_ids:
            idx_multi = facility_ids.index("FAC_PVT_MULTI_01")
            self.assertLess(idx_clinic, idx_multi)
        if "FAC_SUPER_01" in facility_ids:
            idx_super = facility_ids.index("FAC_SUPER_01")
            self.assertLess(idx_clinic, idx_super)

    def test_emergency_department_filtering(self) -> None:
        """In emergency, routine clinics and diagnostic centres must be excluded."""
        nav = self._create_mock_nav_contract(
            required_service="Emergency Medicine & Trauma Care",
            urgency=UrgencyLevel.EXTREME,
            emergency_required=True,
        )
        request = FacilityDiscoveryRequest(
            schema_version="medassist.facility-discovery-request.v1",
            consent_granted=True,
            latitude=17.385,
            longitude=78.486,
            navigation_contract=nav,
        )
        response = self.engine.discover_and_rank(request)
        self.assertTrue(response.emergency_department_required)

        # Routine clinic and diagnostic centre must NOT be in the results
        fac_ids = [f.facility_id for f in response.facilities]
        self.assertNotIn("FAC_CLINIC_01", fac_ids)
        self.assertNotIn("FAC_DIAGNOSTIC_01", fac_ids)
        self.assertNotIn("FAC_PHC_01", fac_ids)

        # Emergency capable facilities must be present
        self.assertIn("FAC_EMERGENCY_01", fac_ids)
        self.assertIn("FAC_GOVT_DIST_01", fac_ids)

        # All returned facilities must have emergency_capable=True
        for f in response.facilities:
            self.assertTrue(f.emergency_capable, f"Facility {f.name} lacks emergency capability")

    def test_wrong_specialty_facility_rejection(self) -> None:
        """Facilities with unrelated specialties (e.g. Dentistry for Pulmonology) are excluded."""
        nav = self._create_mock_nav_contract(
            required_service="Pulmonology & Respiratory Medicine",
            alternative_service=None,
            urgency=UrgencyLevel.MEDIUM,
        )
        request = FacilityDiscoveryRequest(
            schema_version="medassist.facility-discovery-request.v1",
            consent_granted=True,
            manual_locality="Hyderabad Central",
            navigation_contract=nav,
        )
        response = self.engine.discover_and_rank(request)
        fac_ids = [f.facility_id for f in response.facilities]

        # Dental clinic, Eye clinic, and Dermatology clinic must NOT be present
        self.assertNotIn("FAC_DENTAL_01", fac_ids)
        self.assertNotIn("FAC_EYE_CLINIC_01", fac_ids)
        self.assertNotIn("FAC_DERM_CLINIC_01", fac_ids)

    def test_alternative_specialty_matching(self) -> None:
        """Facilities matching the alternative specialty are included when primary is not exclusive."""
        nav = self._create_mock_nav_contract(
            required_service="Paediatrics & Child Health",
            alternative_service="Family Medicine & General Practice",
            urgency=UrgencyLevel.LOW,
        )
        request = FacilityDiscoveryRequest(
            schema_version="medassist.facility-discovery-request.v1",
            consent_granted=True,
            manual_locality="Secunderabad",
            navigation_contract=nav,
        )
        response = self.engine.discover_and_rank(request)
        fac_ids = [f.facility_id for f in response.facilities]

        # PHC Shantinagar offers Family Medicine & Paediatrics
        self.assertIn("FAC_PHC_01", fac_ids)

    def test_duplicate_facility_removal(self) -> None:
        """Duplicate candidates are deduplicated by stable ID."""
        nav = self._create_mock_nav_contract()
        request = FacilityDiscoveryRequest(
            schema_version="medassist.facility-discovery-request.v1",
            consent_granted=True,
            manual_locality="Near Metro",
            navigation_contract=nav,
        )
        # Pass duplicated candidates
        duplicated = list(self.engine.fixtures) + list(self.engine.fixtures)
        response = self.engine.discover_and_rank(request, candidate_facilities=duplicated)

        # Check unique IDs in result
        seen = set()
        for f in response.facilities:
            self.assertNotIn(f.facility_id, seen)
            seen.add(f.facility_id)

    def test_missing_credentials_graceful_fallback(self) -> None:
        """When no API key is provided, GoogleMapsFacilityProvider falls back to simulated fixtures."""
        provider = GoogleMapsFacilityProvider(api_key="")
        nav = self._create_mock_nav_contract()
        request = FacilityDiscoveryRequest(
            schema_version="medassist.facility-discovery-request.v1",
            consent_granted=True,
            manual_locality="Jubilee Hills",
            navigation_contract=nav,
        )
        response = provider.discover(request)
        self.assertEqual(response.provider, "simulated_fixture")
        self.assertEqual(response.provider_status, "simulated_fixtures")
        self.assertTrue(len(response.facilities) > 0)


if __name__ == "__main__":
    unittest.main()
