"""Rule-based hybrid urgency assessment engine for MedAssist Phase B1.

Evaluates patient-reported severity alongside confirmed objective symptoms,
age risk factors, and explicit emergency warning signs with strict safety precedence.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Set

from .contracts import (
    NavigationRequirement,
    RuleProvenance,
    SeverityLevel,
    UrgencyAssessment,
    UrgencyLevel,
)

RULES_PATH = Path(__file__).parent / "rules.json"


def _load_rules_metadata() -> Dict[str, dict]:
    try:
        data = json.loads(RULES_PATH.read_text(encoding="utf-8"))
        return {r["rule_id"]: r for r in data.get("rules", [])}
    except Exception:
        return {}


RULES_META = _load_rules_metadata()


def _make_provenance(rule_id: str) -> RuleProvenance:
    meta = RULES_META.get(rule_id, {})
    return RuleProvenance(
        rule_id=rule_id,
        description=meta.get("description", rule_id),
        approval_status=meta.get("approval_status", "provisional_research_rule_unreviewed"),
        source_reference=meta.get("source_reference", "APIP MedAssist Research Safety Protocol"),
        clinical_claim=False,
    )


def evaluate_hybrid_urgency(
    *,
    confirmed_symptoms: List[str],
    self_reported_severity: Optional[SeverityLevel] = None,
    symptom_severities: Optional[Dict[str, SeverityLevel]] = None,
    age: Optional[int] = None,
    source_sex: Optional[str] = None,
    emergency_detected: bool = False,
    emergency_trigger: Optional[str] = None,
    contradictions_present: bool = False,
    vitals_confirmed: Optional[Dict[str, float]] = None,
) -> UrgencyAssessment:
    """Evaluate patient severity and objective findings into a structured urgency assessment.

    Emergency warning signs strictly take precedence over ordinary severity assessment.
    Self-reported 'low' severity CANNOT downgrade an emergency or high-risk presentation.
    """
    symptom_severities = symptom_severities or {}
    provenance: List[RuleProvenance] = []
    risk_factors: List[str] = []
    limitations = [
        "Fictional research-only evaluation; not an approved clinical triage or diagnostic tool.",
        "Emergency warning sign matcher operates strictly on known triggers; absence of trigger is not medical clearance.",
        "Self-reported severity reflects personal discomfort and does not substitute for clinical vitals.",
        "Clinical deployment requires certified medical sign-off by a qualified professional.",
    ]

    # --- SAFETY PRECEDENCE: Emergency warning signs override everything ---
    if emergency_detected:
        provenance.append(_make_provenance("RULE_EMERGENCY_OVERRIDE"))
        return UrgencyAssessment(
            status="assessed",
            self_reported_severity=self_reported_severity,
            symptom_severities=symptom_severities,
            assessed_urgency=UrgencyLevel.EXTREME,
            confirmed_symptoms=confirmed_symptoms,
            relevant_risk_factors=risk_factors,
            emergency_override=True,
            emergency_trigger=emergency_trigger or "explicit_emergency_warning_sign",
            rule_provenance=provenance,
            assessment_limitations=limitations,
            navigation_requirements=NavigationRequirement(
                tier="emergency_services",
                rationale="Immediate emergency warning signs detected. Contact local emergency services (112 / 911).",
                requires_emergency_call=True,
                requires_facility_search_consent=False,
            ),
        )

    # --- FAIL-CLOSED: Unresolved contradiction check ---
    if contradictions_present:
        provenance.append(_make_provenance("RULE_ABSTAIN_CONTRADICTION"))
        return UrgencyAssessment(
            status="unable_to_assess",
            self_reported_severity=self_reported_severity,
            symptom_severities=symptom_severities,
            assessed_urgency=UrgencyLevel.UNABLE_TO_ASSESS,
            abstention_reason="unresolved_evidence_contradictions",
            confirmed_symptoms=confirmed_symptoms,
            relevant_risk_factors=risk_factors,
            emergency_override=False,
            rule_provenance=provenance,
            assessment_limitations=limitations,
            navigation_requirements=NavigationRequirement(
                tier="clarification_needed",
                rationale="Patient evidence contains conflicting or contradictory statements. Clarification required.",
            ),
        )

    # --- FAIL-CLOSED: Missing / Empty Evidence Check ---
    if not confirmed_symptoms or age is None or age < 0:
        provenance.append(_make_provenance("RULE_ABSTAIN_NO_EVIDENCE"))
        reason = "no_confirmed_symptoms" if not confirmed_symptoms else "missing_demographic_context"
        return UrgencyAssessment(
            status="unable_to_assess",
            self_reported_severity=self_reported_severity,
            symptom_severities=symptom_severities,
            assessed_urgency=UrgencyLevel.UNABLE_TO_ASSESS,
            abstention_reason=reason,
            confirmed_symptoms=confirmed_symptoms,
            relevant_risk_factors=risk_factors,
            emergency_override=False,
            rule_provenance=provenance,
            assessment_limitations=limitations,
            navigation_requirements=NavigationRequirement(
                tier="clarification_needed",
                rationale="Insufficient confirmed evidence to evaluate clinical urgency.",
            ),
        )

    # --- VULNERABLE POPULATION & HIGH-RISK COMBINATIONS ---
    symptom_set: Set[str] = {s.lower() for s in confirmed_symptoms}
    has_fever = any(s in symptom_set for s in ("e_91", "fever", "body hot", "high temperature"))
    has_pain = any(s in symptom_set for s in ("e_53", "pain", "headache", "chest pain", "abdominal pain"))
    has_dizziness = any(s in symptom_set for s in ("e_76", "dizzy", "dizziness", "lightheaded", "feeling giddy"))
    has_vomiting_diarrhea = any(s in symptom_set for s in ("e_51", "diarrhea", "vomiting", "loose motion"))

    age_risk_urgency: Optional[UrgencyLevel] = None

    # Pediatric age < 2 with fever
    if age < 2 and has_fever:
        risk_factors.append("pediatric_under_2_with_fever")
        provenance.append(_make_provenance("RULE_PED_FEVER_HIGH_RISK"))
        age_risk_urgency = UrgencyLevel.HIGH

    # Geriatric age >= 65 with fever and (pain or dizziness)
    if age >= 65 and has_fever and (has_pain or has_dizziness):
        risk_factors.append("geriatric_65_plus_with_systemic_symptoms")
        provenance.append(_make_provenance("RULE_GERIATRIC_SYSTEMIC_ESCALATION"))
        age_risk_urgency = UrgencyLevel.HIGH

    # Check for symptom-specific extreme severity
    any_symptom_extreme = any(sev == SeverityLevel.EXTREME for sev in symptom_severities.values())
    any_symptom_high = any(sev == SeverityLevel.HIGH for sev in symptom_severities.values())

    effective_severity = self_reported_severity
    if any_symptom_extreme and effective_severity not in (SeverityLevel.EXTREME,):
        effective_severity = SeverityLevel.EXTREME
        risk_factors.append("symptom_specific_extreme_severity")
    elif any_symptom_high and effective_severity in (SeverityLevel.LOW, SeverityLevel.MEDIUM, SeverityLevel.NOT_SURE, None):
        effective_severity = SeverityLevel.HIGH
        risk_factors.append("symptom_specific_high_severity")

    # --- BASELINE URGENCY COMPUTATION FROM SEVERITY & SYMPTOM LOAD ---
    assessed: UrgencyLevel
    tier: Literal["urgent_evaluation", "routine_clinical_evaluation", "self_monitoring_and_followup"]
    rationale: str

    if effective_severity == SeverityLevel.EXTREME:
        assessed = UrgencyLevel.EXTREME
        provenance.append(_make_provenance("RULE_INTENSITY_EXTREME_ESCALATION"))
        tier = "urgent_evaluation"
        rationale = "Patient reported extreme discomfort difficult to tolerate with active symptoms. Prompt medical evaluation advised."

    elif effective_severity == SeverityLevel.HIGH:
        assessed = UrgencyLevel.HIGH
        provenance.append(_make_provenance("RULE_INTENSITY_HIGH_FUNCTIONAL"))
        tier = "urgent_evaluation"
        rationale = "Symptoms significantly interfering with normal functioning. Same-day clinical assessment recommended."

    elif effective_severity == SeverityLevel.MEDIUM:
        assessed = UrgencyLevel.MEDIUM
        provenance.append(_make_provenance("RULE_INTENSITY_MEDIUM_MODERATE"))
        tier = "routine_clinical_evaluation"
        rationale = "Moderate discomfort interfering with daily activities. Outpatient clinical review advised."

    elif effective_severity == SeverityLevel.LOW:
        # Isolated mild symptom vs multi-system involvement
        if len(confirmed_symptoms) == 1 and not (has_fever and has_vomiting_diarrhea):
            assessed = UrgencyLevel.LOW
            provenance.append(_make_provenance("RULE_INTENSITY_LOW_MILD"))
            tier = "self_monitoring_and_followup"
            rationale = "Mild symptoms with preserved functional capability. Supportive self-care and monitoring advised."
        else:
            assessed = UrgencyLevel.MEDIUM
            provenance.append(_make_provenance("RULE_INTENSITY_MEDIUM_MODERATE"))
            tier = "routine_clinical_evaluation"
            rationale = "Multiple symptoms present despite low individual discomfort. Continued observation and clinical guidance recommended."

    else:  # NOT_SURE or None
        provenance.append(_make_provenance("RULE_UNSURE_FALLBACK"))
        if has_fever and (has_pain or has_dizziness):
            assessed = UrgencyLevel.HIGH
            tier = "urgent_evaluation"
            rationale = "Uncertainty in severity with systemic signs; conservative clinical assessment advised."
        elif len(confirmed_symptoms) > 1:
            assessed = UrgencyLevel.MEDIUM
            tier = "routine_clinical_evaluation"
            rationale = "Severity uncertain with multiple confirmed symptoms; routine evaluation recommended."
        else:
            assessed = UrgencyLevel.LOW
            tier = "self_monitoring_and_followup"
            rationale = "Severity uncertain with single isolated symptom; supportive care and observation recommended."

    # Apply age risk floor (age-based risk cannot be downgraded by low self-reported severity)
    if age_risk_urgency is not None:
        urgency_ranks = {
            UrgencyLevel.LOW: 1,
            UrgencyLevel.MEDIUM: 2,
            UrgencyLevel.HIGH: 3,
            UrgencyLevel.EXTREME: 4,
        }
        if urgency_ranks.get(assessed, 0) < urgency_ranks[age_risk_urgency]:
            assessed = age_risk_urgency
            tier = "urgent_evaluation"
            rationale = f"Evaluated urgency upgraded to {assessed.value} due to high-risk demographic factors."

    return UrgencyAssessment(
        status="assessed",
        self_reported_severity=self_reported_severity,
        symptom_severities=symptom_severities,
        assessed_urgency=assessed,
        confirmed_symptoms=confirmed_symptoms,
        relevant_risk_factors=risk_factors,
        emergency_override=False,
        rule_provenance=provenance,
        assessment_limitations=limitations,
        navigation_requirements=NavigationRequirement(
            tier=tier,
            rationale=rationale,
            requires_emergency_call=False,
            requires_facility_search_consent=False,
        ),
    )
