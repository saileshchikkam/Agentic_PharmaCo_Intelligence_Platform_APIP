"""Phase B1: Patient-Reported Severity and Hybrid Urgency Assessment Contracts.

Versioned, research-only output contract for downstream Phase B2 (Model B triage)
and Phase B3 (care navigation). Non-clinical demonstration only.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class SeverityLevel(str, Enum):
    """Patient-reported discomfort intensity."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"
    NOT_SURE = "not_sure"


class UrgencyLevel(str, Enum):
    """Assessed hybrid clinical urgency level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"
    UNABLE_TO_ASSESS = "unable_to_assess"


class RuleProvenance(BaseModel):
    rule_id: str
    description: str
    approval_status: Literal["provisional_research_rule_unreviewed", "clinically_reviewed_approved"] = "provisional_research_rule_unreviewed"
    source_reference: str
    clinical_claim: Literal[False] = False


class NavigationRequirement(BaseModel):
    tier: Literal["emergency_services", "urgent_evaluation", "routine_clinical_evaluation", "self_monitoring_and_followup", "clarification_needed"]
    rationale: str
    requires_emergency_call: bool = False
    requires_facility_search_consent: bool = False


class UrgencyAssessment(BaseModel):
    schema_version: Literal["medassist.urgency-assessment.v1"] = "medassist.urgency-assessment.v1"
    research_only: Literal[True] = True
    clinical_claim: Literal[False] = False
    status: Literal["assessed", "unable_to_assess"]

    # Explicit separation of self-reported severity vs assessed urgency
    self_reported_severity: Optional[SeverityLevel] = None
    symptom_severities: Dict[str, SeverityLevel] = Field(default_factory=dict)
    assessed_urgency: Optional[UrgencyLevel] = None
    abstention_reason: Optional[str] = None

    confirmed_symptoms: List[str] = Field(default_factory=list)
    relevant_risk_factors: List[str] = Field(default_factory=list)

    emergency_override: bool = False
    emergency_trigger: Optional[str] = None

    rule_provenance: List[RuleProvenance] = Field(default_factory=list)
    assessment_limitations: List[str] = Field(default_factory=list)
    navigation_requirements: NavigationRequirement

    @model_validator(mode="after")
    def validate_urgency_coherence(self) -> UrgencyAssessment:
        if self.status == "unable_to_assess":
            if self.assessed_urgency is not None and self.assessed_urgency != UrgencyLevel.UNABLE_TO_ASSESS:
                raise ValueError("unable_to_assess_status_cannot_have_numeric_urgency")
            if not self.abstention_reason:
                raise ValueError("abstention_reason_required_for_unable_to_assess")
        elif self.status == "assessed":
            if self.assessed_urgency is None or self.assessed_urgency == UrgencyLevel.UNABLE_TO_ASSESS:
                raise ValueError("assessed_status_must_have_definite_urgency")

        # Emergency warning signs must override ordinary severity assessment
        if self.emergency_override:
            if self.assessed_urgency != UrgencyLevel.EXTREME:
                raise ValueError("emergency_override_must_yield_extreme_urgency")
            if not self.emergency_trigger:
                raise ValueError("emergency_trigger_required_when_override_is_true")
        return self
