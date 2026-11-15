"""Unit tests for Phase B2: Precautions and Healthcare Specialty Intelligence Engine."""
import unittest

from models.medassist_ai.severity.contracts import (
    NavigationRequirement,
    RuleProvenance,
    SeverityLevel,
    UrgencyAssessment,
    UrgencyLevel,
)
from models.medassist_ai.precautions.contracts import (
    FacilityTierId,
    PrecautionGuidance,
    SpecialtyId,
    SymptomCategory,
)
from models.medassist_ai.precautions.engine import (
    PrecautionsEngine,
    evaluate_precautions_and_specialty,
)


class TestPrecautionsEngine(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = PrecautionsEngine()

    def _create_mock_assessment(
        self,
        urgency: UrgencyLevel,
        symptoms: list[str],
        severity: SeverityLevel = SeverityLevel.LOW,
        emergency_override: bool = False,
        emergency_trigger: str | None = None,
        risk_factors: list[str] | None = None,
    ) -> UrgencyAssessment:
        provenance = [
            RuleProvenance(
                rule_id="RULE_TEST",
                description="Test rule",
                approval_status="provisional_research_rule_unreviewed",
                source_reference="Unit test",
                clinical_claim=False,
            )
        ]
        tier = "emergency_services" if urgency == UrgencyLevel.EXTREME else "routine_clinical_evaluation"
        nav = NavigationRequirement(
            tier=tier,
            rationale="Test nav",
            requires_emergency_call=(urgency == UrgencyLevel.EXTREME),
            requires_facility_search_consent=False,
        )
        return UrgencyAssessment(
            schema_version="medassist.urgency-assessment.v1",
            research_only=True,
            clinical_claim=False,
            status="assessed",
            self_reported_severity=severity,
            symptom_severities={},
            assessed_urgency=urgency,
            confirmed_symptoms=symptoms,
            relevant_risk_factors=risk_factors or [],
            emergency_override=emergency_override,
            emergency_trigger=emergency_trigger,
            rule_provenance=provenance,
            assessment_limitations=["Unit test"],
            navigation_requirements=nav,
        )

    def test_all_11_symptom_categories_present(self) -> None:
        """Verify all 11 symptom categories exist in the knowledge base."""
        categories = {p.category for p in self.engine.precautions_by_id.values()}
        expected_categories = {
            SymptomCategory.RESPIRATORY,
            SymptomCategory.FEVER_GENERAL,
            SymptomCategory.HEADACHE_NEUROLOGICAL,
            SymptomCategory.DIGESTIVE_ABDOMINAL,
            SymptomCategory.SKIN_DERMATOLOGICAL,
            SymptomCategory.ENT,
            SymptomCategory.EYE_OPHTHALMOLOGICAL,
            SymptomCategory.MUSCULOSKELETAL,
            SymptomCategory.DENTAL_ORAL,
            SymptomCategory.URINARY_RENAL,
            SymptomCategory.PEDIATRIC_PREGNANCY,
        }
        self.assertEqual(categories, expected_categories)
        self.assertEqual(len(self.engine.precautions_by_id), 11)

    def test_all_10_facility_tiers_present(self) -> None:
        """Verify all 10 facility tiers are properly classified."""
        tiers = set(self.engine.facility_tiers_by_id.keys())
        expected_tiers = {
            FacilityTierId.CLINICS_POLYCLINICS.value,
            FacilityTierId.PRIMARY_HEALTH_CENTRES.value,
            FacilityTierId.COMMUNITY_HEALTH_CENTRES.value,
            FacilityTierId.SMALL_PRIVATE_HOSPITALS.value,
            FacilityTierId.GOVERNMENT_GENERAL_DISTRICT_HOSPITALS.value,
            FacilityTierId.PRIVATE_MULTISPECIALTY_HOSPITALS.value,
            FacilityTierId.SUPERSPECIALTY_TERTIARY_HOSPITALS.value,
            FacilityTierId.MEDICAL_COLLEGE_HOSPITALS.value,
            FacilityTierId.DIAGNOSTIC_CENTRES.value,
            FacilityTierId.EMERGENCY_DEPARTMENTS_TRAUMA.value,
        }
        self.assertEqual(tiers, expected_tiers)
        self.assertEqual(len(self.engine.facility_tiers_by_id), 10)

    def test_respiratory_case_low_urgency(self) -> None:
        """Test cough case with low urgency."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.LOW,
            symptoms=["E_201", "cough"],
            severity=SeverityLevel.LOW,
        )
        guidance = self.engine.evaluate(assessment, age=30)
        self.assertIsInstance(guidance, PrecautionGuidance)
        self.assertEqual(guidance.schema_version, "medassist.precautions.v1")

        # Check matched precaution
        prec_ids = [p.precaution_id for p in guidance.symptom_precautions]
        self.assertIn("PREC_RESP_COUGH", prec_ids)

        # Check specialty
        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.PULMONOLOGY)
        self.assertEqual(guidance.specialty_recommendation.alternative_specialty, SpecialtyId.FAMILY_MEDICINE)
        self.assertFalse(guidance.specialty_recommendation.emergency_override)

        # Check facility navigation contract
        nav = guidance.facility_navigation_contract
        self.assertEqual(nav.schema_version, "medassist.facility-navigation.v1")
        self.assertFalse(nav.emergency_department_required)
        self.assertIn(FacilityTierId.CLINICS_POLYCLINICS, nav.eligible_facility_tiers)
        self.assertIn(FacilityTierId.PRIMARY_HEALTH_CENTRES, nav.eligible_facility_tiers)

    def test_emergency_override_precedence(self) -> None:
        """Test emergency override forces Extreme urgency and Emergency Medicine."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.EXTREME,
            symptoms=["E_201", "cough"],
            severity=SeverityLevel.LOW,
            emergency_override=True,
            emergency_trigger="severe_respiratory_distress",
        )
        guidance = self.engine.evaluate(assessment, age=45)

        # Specialty must be Emergency Medicine
        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.EMERGENCY_MEDICINE)
        self.assertTrue(guidance.specialty_recommendation.emergency_override)

        # Facility contract must require Emergency Department
        nav = guidance.facility_navigation_contract
        self.assertTrue(nav.emergency_department_required)
        self.assertIn(FacilityTierId.EMERGENCY_DEPARTMENTS_TRAUMA, nav.eligible_facility_tiers)
        self.assertNotIn(FacilityTierId.CLINICS_POLYCLINICS, nav.eligible_facility_tiers)
        self.assertNotIn(FacilityTierId.DIAGNOSTIC_CENTRES, nav.eligible_facility_tiers)

        # First aid steps and responder info must be present
        self.assertIsNotNone(guidance.urgency_guidance.emergency_first_aid)
        self.assertIsNotNone(guidance.urgency_guidance.critical_information_for_responders)

    def test_pediatric_patient_routing(self) -> None:
        """Test pediatric patient under 5 routes to Paediatrics."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.MEDIUM,
            symptoms=["E_91", "fever"],
            severity=SeverityLevel.MEDIUM,
            risk_factors=["pediatric_under_2_with_fever"],
        )
        guidance = self.engine.evaluate(assessment, age=2)

        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.PAEDIATRICS)
        prec_ids = [p.precaution_id for p in guidance.symptom_precautions]
        self.assertIn("PREC_PEDIATRIC_PREGNANCY", prec_ids)

    def test_gastroenterology_routing(self) -> None:
        """Test digestive symptoms route to Gastroenterology."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.MEDIUM,
            symptoms=["E_51", "diarrhea", "E_148", "nausea"],
            severity=SeverityLevel.MEDIUM,
        )
        guidance = self.engine.evaluate(assessment, age=35)
        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.GASTROENTEROLOGY)
        prec_ids = [p.precaution_id for p in guidance.symptom_precautions]
        self.assertIn("PREC_DIGESTIVE_ABDOMINAL", prec_ids)

    def test_dermatology_routing(self) -> None:
        """Test skin lesions route to Dermatology."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.LOW,
            symptoms=["E_129", "rash or skin lesions"],
            severity=SeverityLevel.LOW,
        )
        guidance = self.engine.evaluate(assessment, age=28)
        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.DERMATOLOGY)
        prec_ids = [p.precaution_id for p in guidance.symptom_precautions]
        self.assertIn("PREC_SKIN_DERMATOLOGICAL", prec_ids)

    def test_dental_routing(self) -> None:
        """Test dental pain routes to Dentistry."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.LOW,
            symptoms=["toothache", "gum swelling"],
            severity=SeverityLevel.LOW,
        )
        guidance = self.engine.evaluate(assessment, age=40)
        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.DENTISTRY)
        prec_ids = [p.precaution_id for p in guidance.symptom_precautions]
        self.assertIn("PREC_DENTAL_ORAL", prec_ids)

    def test_ophthalmology_routing(self) -> None:
        """Test red eyes and tearing route to Ophthalmology."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.LOW,
            symptoms=["E_74", "red eyes", "E_127", "excessive tears"],
            severity=SeverityLevel.LOW,
        )
        guidance = self.engine.evaluate(assessment, age=50)
        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.OPHTHALMOLOGY)
        prec_ids = [p.precaution_id for p in guidance.symptom_precautions]
        self.assertIn("PREC_EYE_OPHTHALMIC", prec_ids)

    def test_ent_routing(self) -> None:
        """Test sore throat and nasal congestion route to ENT."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.LOW,
            symptoms=["E_97", "sore throat", "E_181", "nasal congestion"],
            severity=SeverityLevel.LOW,
        )
        guidance = self.engine.evaluate(assessment, age=25)
        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.ENT)
        prec_ids = [p.precaution_id for p in guidance.symptom_precautions]
        self.assertIn("PREC_ENT_UPPER_AIRWAY", prec_ids)

    def test_musculoskeletal_routing(self) -> None:
        """Test back pain and diffuse muscle pain route to Orthopaedics."""
        assessment = self._create_mock_assessment(
            urgency=UrgencyLevel.MEDIUM,
            symptoms=["E_144", "diffuse muscle pain", "back pain"],
            severity=SeverityLevel.MEDIUM,
        )
        guidance = self.engine.evaluate(assessment, age=48)
        self.assertEqual(guidance.specialty_recommendation.primary_specialty, SpecialtyId.ORTHOPAEDICS)
        prec_ids = [p.precaution_id for p in guidance.symptom_precautions]
        self.assertIn("PREC_MUSCULOSKELETAL", prec_ids)

    def test_authoritative_references_and_unreviewed_status(self) -> None:
        """Verify all precautions have authoritative references and provisional status."""
        for prec_id, record in self.engine.precautions_by_id.items():
            self.assertEqual(record.clinical_review_status, "provisional_research_rule_unreviewed")
            self.assertTrue(len(record.authoritative_references) >= 2, f"Precaution {prec_id} missing references")
            self.assertTrue(len(record.guidance) >= 3, f"Precaution {prec_id} missing guidance")
            self.assertTrue(len(record.warning_signs) >= 3, f"Precaution {prec_id} missing warning signs")
            self.assertTrue(len(record.what_to_avoid) >= 3, f"Precaution {prec_id} missing what to avoid")


if __name__ == "__main__":
    unittest.main()
