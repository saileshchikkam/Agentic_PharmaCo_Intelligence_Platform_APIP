"""Phase B2: Symptom-Specific Precautions and Healthcare Specialty Intelligence Contracts.

Versioned, research-only output contract for downstream Phase B2 (precautions & specialty)
and Phase B3 (care navigation). Non-clinical demonstration only.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

from models.medassist_ai.severity.contracts import UrgencyAssessment, UrgencyLevel


class SymptomCategory(str, Enum):
    """The 11 core symptom categories covered by the precautions knowledge base."""
    RESPIRATORY = "respiratory"
    FEVER_GENERAL = "fever_general"
    HEADACHE_NEUROLOGICAL = "headache_neurological"
    DIGESTIVE_ABDOMINAL = "digestive_abdominal"
    SKIN_DERMATOLOGICAL = "skin_dermatological"
    ENT = "ent"
    EYE_OPHTHALMOLOGICAL = "eye_ophthalmological"
    MUSCULOSKELETAL = "musculoskeletal"
    DENTAL_ORAL = "dental_oral"
    URINARY_RENAL = "urinary_renal"
    PEDIATRIC_PREGNANCY = "pediatric_pregnancy"


class SpecialtyId(str, Enum):
    """Standardized medical specialties."""
    GENERAL_MEDICINE = "general_medicine"
    FAMILY_MEDICINE = "family_medicine"
    PULMONOLOGY = "pulmonology"
    ENT = "ent"
    DERMATOLOGY = "dermatology"
    OPHTHALMOLOGY = "ophthalmology"
    ORTHOPAEDICS = "orthopaedics"
    GASTROENTEROLOGY = "gastroenterology"
    DENTISTRY = "dentistry"
    PAEDIATRICS = "paediatrics"
    OBSTETRICS_GYNAECOLOGY = "obstetrics_gynaecology"
    EMERGENCY_MEDICINE = "emergency_medicine"


class FacilityTierId(str, Enum):
    """The 10 healthcare facility tiers supported in Phase B2 & Phase B3."""
    CLINICS_POLYCLINICS = "clinics_polyclinics"
    PRIMARY_HEALTH_CENTRES = "primary_health_centres"
    COMMUNITY_HEALTH_CENTRES = "community_health_centres"
    SMALL_PRIVATE_HOSPITALS = "small_private_hospitals"
    GOVERNMENT_GENERAL_DISTRICT_HOSPITALS = "government_general_district_hospitals"
    PRIVATE_MULTISPECIALTY_HOSPITALS = "private_multispecialty_hospitals"
    SUPERSPECIALTY_TERTIARY_HOSPITALS = "superspecialty_tertiary_hospitals"
    MEDICAL_COLLEGE_HOSPITALS = "medical_college_hospitals"
    DIAGNOSTIC_CENTRES = "diagnostic_centres"
    EMERGENCY_DEPARTMENTS_TRAUMA = "emergency_departments_trauma"


class SymptomPrecautionRecord(BaseModel):
    """Structured precaution record for a specific symptom or symptom cluster."""
    precaution_id: str
    symptom_ids: List[str]
    category: SymptomCategory
    title: str
    applicability_conditions: List[str] = Field(default_factory=list)
    exclusion_criteria: List[str] = Field(default_factory=list)
    guidance: List[str] = Field(default_factory=list)
    warning_signs: List[str] = Field(default_factory=list)
    what_to_avoid: List[str] = Field(default_factory=list)
    urgent_assessment_required: bool = False
    authoritative_references: List[str] = Field(default_factory=list)
    clinical_review_status: Literal[
        "provisional_research_rule_unreviewed",
        "clinically_reviewed_approved",
    ] = "provisional_research_rule_unreviewed"
    content_version: str = "1.0.0"


class SpecialtyRecommendation(BaseModel):
    """Deterministic healthcare specialty recommendation with emergency override."""
    primary_specialty: SpecialtyId
    primary_specialty_name: str
    alternative_specialty: Optional[SpecialtyId] = None
    alternative_specialty_name: Optional[str] = None
    rationale: str
    emergency_override: bool = False
    confidence_factor: float = 1.0


class FacilityNavigationContract(BaseModel):
    """Phase B3 preparation contract defining facility requirements without size/brand bias."""
    schema_version: Literal["medassist.facility-navigation.v1"] = "medassist.facility-navigation.v1"
    research_only: Literal[True] = True
    clinical_claim: Literal[False] = False
    required_service: str
    alternative_service: Optional[str] = None
    required_capabilities: List[str] = Field(default_factory=list)
    urgency_level: UrgencyLevel
    emergency_department_required: bool = False
    facility_verification_requirements: List[str] = Field(default_factory=list)
    explicit_exclusions: List[str] = Field(default_factory=list)
    eligible_facility_tiers: List[FacilityTierId] = Field(default_factory=list)


class UrgencyGuidanceDetails(BaseModel):
    """Tailored safe guidance for a specific urgency tier."""
    urgency_level: UrgencyLevel
    title: str
    recommended_timeframe: str
    monitoring_advice: List[str] = Field(default_factory=list)
    preparation_for_doctor: List[str] = Field(default_factory=list)
    immediate_actions: List[str] = Field(default_factory=list)
    what_to_avoid: List[str] = Field(default_factory=list)
    emergency_first_aid: Optional[List[str]] = None
    critical_information_for_responders: Optional[List[str]] = None


class PrecautionGuidance(BaseModel):
    """Complete Phase B2 Precaution and Specialty Intelligence output contract."""
    schema_version: Literal["medassist.precautions.v1"] = "medassist.precautions.v1"
    research_only: Literal[True] = True
    clinical_claim: Literal[False] = False
    urgency_assessment: UrgencyAssessment
    urgency_guidance: UrgencyGuidanceDetails
    symptom_precautions: List[SymptomPrecautionRecord] = Field(default_factory=list)
    specialty_recommendation: SpecialtyRecommendation
    facility_navigation_contract: FacilityNavigationContract
    disclaimers: List[str] = Field(default_factory=list)
