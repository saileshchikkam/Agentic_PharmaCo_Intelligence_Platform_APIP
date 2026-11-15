/**
 * Phase B1: Patient-Reported Severity and Hybrid Urgency Assessment Contracts.
 *
 * Versioned, research-only output contracts for MedAssist Phase B1, B2 (Model B triage),
 * and B3 (care navigation). Non-clinical demonstration only.
 */

export type SeverityLevel = 'low' | 'medium' | 'high' | 'extreme' | 'not_sure';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'extreme' | 'unable_to_assess';

export interface SeverityOption {
  value: SeverityLevel;
  label: string;
  description: string;
}

export const SEVERITY_OPTIONS: SeverityOption[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Mild discomfort; normal activities are possible.',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Symptoms interfere with daily activities.',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Symptoms significantly affect normal functioning.',
  },
  {
    value: 'extreme',
    label: 'Extreme',
    description: 'Symptoms are extremely difficult to tolerate.',
  },
  {
    value: 'not_sure',
    label: 'Not sure',
    description: 'Unable to confidently describe severity.',
  },
];

export interface RuleProvenance {
  rule_id: string;
  description: string;
  approval_status: 'provisional_research_rule_unreviewed' | 'clinically_reviewed_approved';
  source_reference: string;
  clinical_claim: false;
}

export interface NavigationRequirement {
  tier: 'emergency_services' | 'urgent_evaluation' | 'routine_clinical_evaluation' | 'self_monitoring_and_followup' | 'clarification_needed';
  rationale: string;
  requires_emergency_call: boolean;
  requires_facility_search_consent: boolean;
}

export interface UrgencyAssessment {
  schema_version: 'medassist.urgency-assessment.v1';
  research_only: true;
  clinical_claim: false;
  status: 'assessed' | 'unable_to_assess';
  self_reported_severity: SeverityLevel | null;
  symptom_severities: Record<string, SeverityLevel>;
  assessed_urgency: UrgencyLevel | null;
  abstention_reason?: string;
  confirmed_symptoms: string[];
  relevant_risk_factors: string[];
  emergency_override: boolean;
  emergency_trigger?: string;
  rule_provenance: RuleProvenance[];
  assessment_limitations: string[];
  navigation_requirements: NavigationRequirement;
}
