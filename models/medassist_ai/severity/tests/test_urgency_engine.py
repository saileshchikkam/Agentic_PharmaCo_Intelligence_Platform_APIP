"""Comprehensive unit tests for MedAssist Phase B1 Hybrid Urgency Assessment Engine.

Validates:
- All 5 severity options (Low, Medium, High, Extreme, Not sure)
- Emergency safety precedence and override
- Non-downgrading of emergency when patient reports 'low'
- Fail-closed behavior on missing or contradictory evidence
- Demographic risk floor (pediatric fever and geriatric systemic illness)
- Separation of self-reported severity from assessed urgency
"""
import unittest

from models.medassist_ai.severity.contracts import (
    SeverityLevel,
    UrgencyLevel,
    UrgencyAssessment,
)
from models.medassist_ai.severity.urgency_engine import evaluate_hybrid_urgency


class UrgencyEngineTests(unittest.TestCase):
    def test_all_five_severity_options(self):
        # 1. Low
        low_res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201"],  # cough
            self_reported_severity=SeverityLevel.LOW,
            age=30,
            source_sex="M",
        )
        self.assertEqual(low_res.status, "assessed")
        self.assertEqual(low_res.self_reported_severity, SeverityLevel.LOW)
        self.assertEqual(low_res.assessed_urgency, UrgencyLevel.LOW)
        self.assertFalse(low_res.emergency_override)

        # 2. Medium
        med_res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201"],
            self_reported_severity=SeverityLevel.MEDIUM,
            age=30,
            source_sex="M",
        )
        self.assertEqual(med_res.assessed_urgency, UrgencyLevel.MEDIUM)

        # 3. High
        high_res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201", "E_91"],
            self_reported_severity=SeverityLevel.HIGH,
            age=30,
            source_sex="M",
        )
        self.assertEqual(high_res.assessed_urgency, UrgencyLevel.HIGH)

        # 4. Extreme
        ext_res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201", "E_91"],
            self_reported_severity=SeverityLevel.EXTREME,
            age=30,
            source_sex="M",
        )
        self.assertEqual(ext_res.assessed_urgency, UrgencyLevel.EXTREME)

        # 5. Not sure
        unsure_res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201"],
            self_reported_severity=SeverityLevel.NOT_SURE,
            age=30,
            source_sex="M",
        )
        self.assertEqual(unsure_res.status, "assessed")
        self.assertEqual(unsure_res.assessed_urgency, UrgencyLevel.LOW)

    def test_emergency_override_precedence(self):
        """CRITICAL: Patient reporting Low severity must NEVER downgrade an emergency."""
        res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201"],
            self_reported_severity=SeverityLevel.LOW,
            age=40,
            source_sex="F",
            emergency_detected=True,
            emergency_trigger="cannot breathe properly",
        )
        self.assertEqual(res.status, "assessed")
        # Self-reported severity is faithfully preserved as LOW
        self.assertEqual(res.self_reported_severity, SeverityLevel.LOW)
        # But assessed urgency is EXTREME due to emergency override
        self.assertEqual(res.assessed_urgency, UrgencyLevel.EXTREME)
        self.assertTrue(res.emergency_override)
        self.assertEqual(res.emergency_trigger, "cannot breathe properly")
        self.assertTrue(res.navigation_requirements.requires_emergency_call)
        self.assertEqual(res.navigation_requirements.tier, "emergency_services")

    def test_missing_or_empty_evidence_abstains(self):
        """Missing confirmed symptoms or missing age context must abstain fail-closed."""
        # No confirmed symptoms
        res1 = evaluate_hybrid_urgency(
            confirmed_symptoms=[],
            self_reported_severity=SeverityLevel.HIGH,
            age=35,
        )
        self.assertEqual(res1.status, "unable_to_assess")
        self.assertEqual(res1.assessed_urgency, UrgencyLevel.UNABLE_TO_ASSESS)
        self.assertEqual(res1.abstention_reason, "no_confirmed_symptoms")

        # Missing age
        res2 = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201"],
            self_reported_severity=SeverityLevel.HIGH,
            age=None,
        )
        self.assertEqual(res2.status, "unable_to_assess")
        self.assertEqual(res2.abstention_reason, "missing_demographic_context")

    def test_contradictory_evidence_abstains(self):
        """Contradictions in evidence must cause abstention without picking sides."""
        res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201"],
            self_reported_severity=SeverityLevel.MEDIUM,
            age=25,
            contradictions_present=True,
        )
        self.assertEqual(res.status, "unable_to_assess")
        self.assertEqual(res.assessed_urgency, UrgencyLevel.UNABLE_TO_ASSESS)
        self.assertEqual(res.abstention_reason, "unresolved_evidence_contradictions")

    def test_pediatric_fever_escalation(self):
        """Infants < 2 with fever must be evaluated at minimum High urgency."""
        # Patient/parent reports LOW discomfort, but infant has fever
        res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_91"],  # fever
            self_reported_severity=SeverityLevel.LOW,
            age=1,  # 1 year old
            source_sex="F",
        )
        self.assertEqual(res.self_reported_severity, SeverityLevel.LOW)
        # Upgraded to HIGH by age floor
        self.assertEqual(res.assessed_urgency, UrgencyLevel.HIGH)
        self.assertIn("pediatric_under_2_with_fever", res.relevant_risk_factors)

    def test_geriatric_systemic_escalation(self):
        """Elderly patients (>=65) with fever and pain/dizziness must escalate to High."""
        res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_91", "E_53"],  # fever + pain
            self_reported_severity=SeverityLevel.LOW,
            age=72,
            source_sex="M",
        )
        self.assertEqual(res.self_reported_severity, SeverityLevel.LOW)
        self.assertEqual(res.assessed_urgency, UrgencyLevel.HIGH)
        self.assertIn("geriatric_65_plus_with_systemic_symptoms", res.relevant_risk_factors)

    def test_multiple_symptoms_with_different_intensity(self):
        """Symptom-specific extreme severity escalates overall presentation."""
        res = evaluate_hybrid_urgency(
            confirmed_symptoms=["E_201", "E_53"],
            self_reported_severity=SeverityLevel.MEDIUM,
            symptom_severities={"E_201": SeverityLevel.LOW, "E_53": SeverityLevel.EXTREME},
            age=35,
            source_sex="M",
        )
        self.assertEqual(res.self_reported_severity, SeverityLevel.MEDIUM)
        # Evaluated urgency reflects the extreme pain
        self.assertEqual(res.assessed_urgency, UrgencyLevel.EXTREME)
        self.assertIn("symptom_specific_extreme_severity", res.relevant_risk_factors)


if __name__ == "__main__":
    unittest.main()
