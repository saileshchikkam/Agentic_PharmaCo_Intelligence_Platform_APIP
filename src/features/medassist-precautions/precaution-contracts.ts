/**
 * Phase B2: Symptom-Specific Precautions and Healthcare Specialty Intelligence Contracts.
 *
 * Versioned, research-only output contracts for MedAssist Phase B2 (precautions & specialty)
 * and Phase B3 (facility care navigation). Non-clinical demonstration only.
 */
import type { UrgencyAssessment, UrgencyLevel } from '../medassist-severity/severity-contracts';

export type SymptomCategory =
  | 'respiratory'
  | 'fever_general'
  | 'headache_neurological'
  | 'digestive_abdominal'
  | 'skin_dermatological'
  | 'ent'
  | 'eye_ophthalmological'
  | 'musculoskeletal'
  | 'dental_oral'
  | 'urinary_renal'
  | 'pediatric_pregnancy';

export type SpecialtyId =
  | 'general_medicine'
  | 'family_medicine'
  | 'pulmonology'
  | 'ent'
  | 'dermatology'
  | 'ophthalmology'
  | 'orthopaedics'
  | 'gastroenterology'
  | 'dentistry'
  | 'paediatrics'
  | 'obstetrics_gynaecology'
  | 'emergency_medicine';

export type FacilityTierId =
  | 'clinics_polyclinics'
  | 'primary_health_centres'
  | 'community_health_centres'
  | 'small_private_hospitals'
  | 'government_general_district_hospitals'
  | 'private_multispecialty_hospitals'
  | 'superspecialty_tertiary_hospitals'
  | 'medical_college_hospitals'
  | 'diagnostic_centres'
  | 'emergency_departments_trauma';

export interface SymptomPrecautionRecord {
  precaution_id: string;
  symptom_ids: string[];
  category: SymptomCategory;
  title: string;
  applicability_conditions: string[];
  exclusion_criteria: string[];
  guidance: string[];
  warning_signs: string[];
  what_to_avoid: string[];
  urgent_assessment_required: boolean;
  authoritative_references: string[];
  clinical_review_status: 'provisional_research_rule_unreviewed' | 'clinically_reviewed_approved';
  content_version: string;
}

export interface SpecialtyRecommendation {
  primary_specialty: SpecialtyId;
  primary_specialty_name: string;
  alternative_specialty: SpecialtyId | null;
  alternative_specialty_name: string | null;
  rationale: string;
  emergency_override: boolean;
  confidence_factor: number;
}

export interface FacilityNavigationContract {
  schema_version: 'medassist.facility-navigation.v1';
  research_only: true;
  clinical_claim: false;
  required_service: string;
  alternative_service: string | null;
  required_capabilities: string[];
  urgency_level: UrgencyLevel;
  emergency_department_required: boolean;
  facility_verification_requirements: string[];
  explicit_exclusions: string[];
  eligible_facility_tiers: FacilityTierId[];
}

export interface UrgencyGuidanceDetails {
  urgency_level: UrgencyLevel;
  title: string;
  recommended_timeframe: string;
  monitoring_advice: string[];
  preparation_for_doctor: string[];
  immediate_actions: string[];
  what_to_avoid: string[];
  emergency_first_aid?: string[];
  critical_information_for_responders?: string[];
}

export interface PrecautionGuidance {
  schema_version: 'medassist.precautions.v1';
  research_only: true;
  clinical_claim: false;
  urgency_assessment: UrgencyAssessment;
  urgency_guidance: UrgencyGuidanceDetails;
  symptom_precautions: SymptomPrecautionRecord[];
  specialty_recommendation: SpecialtyRecommendation;
  facility_navigation_contract: FacilityNavigationContract;
  disclaimers: string[];
}
