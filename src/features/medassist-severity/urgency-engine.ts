/**
 * Phase B1: Hybrid Urgency Assessment Engine (TypeScript).
 *
 * Deterministic rule-based assessment that separates self-reported severity
 * from assessed clinical urgency while strictly enforcing emergency overrides.
 */
import type {
  SeverityLevel,
  UrgencyAssessment,
  UrgencyLevel,
  RuleProvenance,
  NavigationRequirement,
} from './severity-contracts';

export interface EvaluateUrgencyInput {
  confirmedSymptoms: string[];
  selfReportedSeverity: SeverityLevel | null;
  symptomSeverities?: Record<string, SeverityLevel>;
  age: number | null;
  sourceSex?: 'M' | 'F';
  emergencyDetected?: boolean;
  emergencyTrigger?: string;
  contradictionsPresent?: boolean;
}

export function evaluateHybridUrgency(input: EvaluateUrgencyInput): UrgencyAssessment {
  const {
    confirmedSymptoms,
    selfReportedSeverity,
    symptomSeverities = {},
    age,
    emergencyDetected = false,
    emergencyTrigger,
    contradictionsPresent = false,
  } = input;

  const provenance: RuleProvenance[] = [];
  const riskFactors: string[] = [];
  const limitations: string[] = [
    'Fictional research-only evaluation; not an approved clinical triage or diagnostic tool.',
    'Emergency warning sign matcher operates strictly on known triggers; absence of trigger is not medical clearance.',
    'Self-reported severity reflects personal discomfort and does not substitute for clinical vitals.',
    'Clinical deployment requires certified medical sign-off by a qualified professional.',
  ];

  // 1. SAFETY PRECEDENCE: Emergency warning signs override everything immediately
  if (emergencyDetected) {
    provenance.push({
      rule_id: 'RULE_EMERGENCY_OVERRIDE',
      description: 'Immediate Emergency Safety Override: explicit breathing emergency, cardiac distress or ambulance request.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'NHS Shortness of breath triage guidance & India ERSS 112 protocol.',
      clinical_claim: false,
    });
    return {
      schema_version: 'medassist.urgency-assessment.v1',
      research_only: true,
      clinical_claim: false,
      status: 'assessed',
      self_reported_severity: selfReportedSeverity,
      symptom_severities: symptomSeverities,
      assessed_urgency: 'extreme',
      confirmed_symptoms: confirmedSymptoms,
      relevant_risk_factors: riskFactors,
      emergency_override: true,
      emergency_trigger: emergencyTrigger ?? 'explicit_emergency_warning_sign',
      rule_provenance: provenance,
      assessment_limitations: limitations,
      navigation_requirements: {
        tier: 'emergency_services',
        rationale: 'Immediate emergency warning signs detected. Contact local emergency services (112 / 911).',
        requires_emergency_call: true,
        requires_facility_search_consent: false,
      },
    };
  }

  // 2. FAIL-CLOSED: Unresolved contradictions
  if (contradictionsPresent) {
    provenance.push({
      rule_id: 'RULE_ABSTAIN_CONTRADICTION',
      description: 'Unresolved evidence contradictions present. Urgency assessment abstains.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'APIP fail-closed evidence safety architecture.',
      clinical_claim: false,
    });
    return {
      schema_version: 'medassist.urgency-assessment.v1',
      research_only: true,
      clinical_claim: false,
      status: 'unable_to_assess',
      self_reported_severity: selfReportedSeverity,
      symptom_severities: symptomSeverities,
      assessed_urgency: 'unable_to_assess',
      abstention_reason: 'unresolved_evidence_contradictions',
      confirmed_symptoms: confirmedSymptoms,
      relevant_risk_factors: riskFactors,
      emergency_override: false,
      rule_provenance: provenance,
      assessment_limitations: limitations,
      navigation_requirements: {
        tier: 'clarification_needed',
        rationale: 'Patient evidence contains conflicting or contradictory statements. Clarification required.',
        requires_emergency_call: false,
        requires_facility_search_consent: false,
      },
    };
  }

  // 3. FAIL-CLOSED: Missing / Empty evidence or demographics
  if (!confirmedSymptoms.length || age === null || age < 0) {
    provenance.push({
      rule_id: 'RULE_ABSTAIN_NO_EVIDENCE',
      description: 'Missing positive symptoms or missing demographic context.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'APIP evidence completeness criteria.',
      clinical_claim: false,
    });
    return {
      schema_version: 'medassist.urgency-assessment.v1',
      research_only: true,
      clinical_claim: false,
      status: 'unable_to_assess',
      self_reported_severity: selfReportedSeverity,
      symptom_severities: symptomSeverities,
      assessed_urgency: 'unable_to_assess',
      abstention_reason: !confirmedSymptoms.length ? 'no_confirmed_symptoms' : 'missing_demographic_context',
      confirmed_symptoms: confirmedSymptoms,
      relevant_risk_factors: riskFactors,
      emergency_override: false,
      rule_provenance: provenance,
      assessment_limitations: limitations,
      navigation_requirements: {
        tier: 'clarification_needed',
        rationale: 'Insufficient confirmed evidence to evaluate clinical urgency.',
        requires_emergency_call: false,
        requires_facility_search_consent: false,
      },
    };
  }

  // 4. VULNERABLE POPULATION & HIGH-RISK COMBINATIONS
  const symptomSet = new Set(confirmedSymptoms.map(s => s.toLowerCase()));
  const hasFever = symptomSet.has('e_91') || symptomSet.has('fever') || symptomSet.has('body hot');
  const hasPain = symptomSet.has('e_53') || symptomSet.has('pain') || symptomSet.has('headache');
  const hasDizziness = symptomSet.has('e_76') || symptomSet.has('dizzy') || symptomSet.has('dizziness') || symptomSet.has('feeling giddy');
  const hasVomitingDiarrhea = symptomSet.has('e_51') || symptomSet.has('diarrhea') || symptomSet.has('vomiting');

  let ageRiskUrgency: UrgencyLevel | null = null;

  // Pediatric age < 2 with fever
  if (age < 2 && hasFever) {
    riskFactors.push('pediatric_under_2_with_fever');
    provenance.push({
      rule_id: 'RULE_PED_FEVER_HIGH_RISK',
      description: 'Infants and young children under 2 years with confirmed fever require minimum High urgency.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'NICE Clinical Guideline CG160: Fever in under 5s.',
      clinical_claim: false,
    });
    ageRiskUrgency = 'high';
  }

  // Geriatric age >= 65 with fever and pain or dizziness
  if (age >= 65 && hasFever && (hasPain || hasDizziness)) {
    riskFactors.push('geriatric_65_plus_with_systemic_symptoms');
    provenance.push({
      rule_id: 'RULE_GERIATRIC_SYSTEMIC_ESCALATION',
      description: 'Older adults (65+) with fever and systemic pain/dizziness require minimum High urgency.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'Emergency Severity Index (ESI) Implementation Handbook v4.',
      clinical_claim: false,
    });
    ageRiskUrgency = 'high';
  }

  // Check symptom-specific severities
  const anySymptomExtreme = Object.values(symptomSeverities).some(s => s === 'extreme');
  const anySymptomHigh = Object.values(symptomSeverities).some(s => s === 'high');

  let effectiveSeverity = selfReportedSeverity;
  if (anySymptomExtreme && effectiveSeverity !== 'extreme') {
    effectiveSeverity = 'extreme';
    riskFactors.push('symptom_specific_extreme_severity');
  } else if (anySymptomHigh && (effectiveSeverity === 'low' || effectiveSeverity === 'medium' || effectiveSeverity === 'not_sure' || effectiveSeverity === null)) {
    effectiveSeverity = 'high';
    riskFactors.push('symptom_specific_high_severity');
  }

  // 5. BASELINE URGENCY COMPUTATION
  let assessed: UrgencyLevel;
  let tier: NavigationRequirement['tier'];
  let rationale: string;

  if (effectiveSeverity === 'extreme') {
    assessed = 'extreme';
    provenance.push({
      rule_id: 'RULE_INTENSITY_EXTREME_ESCALATION',
      description: 'Patient-Reported Extreme Functional Impact.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'Visual Analog Scale & Patient-Reported Functional Impairment Metrics.',
      clinical_claim: false,
    });
    tier = 'urgent_evaluation';
    rationale = 'Patient reported extreme discomfort difficult to tolerate with active symptoms. Prompt medical evaluation advised.';
  } else if (effectiveSeverity === 'high') {
    assessed = 'high';
    provenance.push({
      rule_id: 'RULE_INTENSITY_HIGH_FUNCTIONAL',
      description: 'Patient-Reported High Functional Impact.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'Patient-Reported Outcomes Measurement Information System (PROMIS).',
      clinical_claim: false,
    });
    tier = 'urgent_evaluation';
    rationale = 'Symptoms significantly interfering with normal functioning. Same-day clinical assessment recommended.';
  } else if (effectiveSeverity === 'medium') {
    assessed = 'medium';
    provenance.push({
      rule_id: 'RULE_INTENSITY_MEDIUM_MODERATE',
      description: 'Moderate Discomfort Interfering with Activities.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'General Practice Clinical Assessment Guidelines.',
      clinical_claim: false,
    });
    tier = 'routine_clinical_evaluation';
    rationale = 'Moderate discomfort interfering with daily activities. Outpatient clinical review advised.';
  } else if (effectiveSeverity === 'low') {
    if (confirmedSymptoms.length === 1 && !(hasFever && hasVomitingDiarrhea)) {
      assessed = 'low';
      provenance.push({
        rule_id: 'RULE_INTENSITY_LOW_MILD',
        description: 'Mild Discomfort with Normal Functioning.',
        approval_status: 'provisional_research_rule_unreviewed',
        source_reference: 'Primary Care Self-Care & Monitoring Framework.',
        clinical_claim: false,
      });
      tier = 'self_monitoring_and_followup';
      rationale = 'Mild symptoms with preserved functional capability. Supportive self-care and monitoring advised.';
    } else {
      assessed = 'medium';
      provenance.push({
        rule_id: 'RULE_INTENSITY_MEDIUM_MODERATE',
        description: 'Moderate Discomfort Interfering with Activities.',
        approval_status: 'provisional_research_rule_unreviewed',
        source_reference: 'General Practice Clinical Assessment Guidelines.',
        clinical_claim: false,
      });
      tier = 'routine_clinical_evaluation';
      rationale = 'Multiple symptoms present despite low individual discomfort. Continued observation and clinical guidance recommended.';
    }
  } else {
    // not_sure or null
    provenance.push({
      rule_id: 'RULE_UNSURE_FALLBACK',
      description: 'Severity Uncertainty Conservative Assessment.',
      approval_status: 'provisional_research_rule_unreviewed',
      source_reference: 'Conservative Triage Decision Rules under Uncertainty.',
      clinical_claim: false,
    });
    if (hasFever && (hasPain || hasDizziness)) {
      assessed = 'high';
      tier = 'urgent_evaluation';
      rationale = 'Uncertainty in severity with systemic signs; conservative clinical assessment advised.';
    } else if (confirmedSymptoms.length > 1) {
      assessed = 'medium';
      tier = 'routine_clinical_evaluation';
      rationale = 'Severity uncertain with multiple confirmed symptoms; routine evaluation recommended.';
    } else {
      assessed = 'low';
      tier = 'self_monitoring_and_followup';
      rationale = 'Severity uncertain with single isolated symptom; supportive care and observation recommended.';
    }
  }

  // Apply age risk floor
  if (ageRiskUrgency) {
    const urgencyRanks: Record<UrgencyLevel, number> = {
      low: 1,
      medium: 2,
      high: 3,
      extreme: 4,
      unable_to_assess: 0,
    };
    if (urgencyRanks[assessed] < urgencyRanks[ageRiskUrgency]) {
      assessed = ageRiskUrgency;
      tier = 'urgent_evaluation';
      rationale = `Evaluated urgency upgraded to ${assessed} due to high-risk demographic factors.`;
    }
  }

  return {
    schema_version: 'medassist.urgency-assessment.v1',
    research_only: true,
    clinical_claim: false,
    status: 'assessed',
    self_reported_severity: selfReportedSeverity,
    symptom_severities: symptomSeverities,
    assessed_urgency: assessed,
    confirmed_symptoms: confirmedSymptoms,
    relevant_risk_factors: riskFactors,
    emergency_override: false,
    rule_provenance: provenance,
    assessment_limitations: limitations,
    navigation_requirements: {
      tier,
      rationale,
      requires_emergency_call: false,
      requires_facility_search_consent: false,
    },
  };
}
