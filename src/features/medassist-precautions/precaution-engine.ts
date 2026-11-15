/**
 * Phase B2: Symptom-Specific Precautions and Healthcare Specialty Intelligence Engine (TypeScript).
 *
 * Deterministic recommendation of safe precautions, specialty routing,
 * and Phase B3 care facility navigation preparation.
 */
import type { UrgencyAssessment, UrgencyLevel } from '../medassist-severity/severity-contracts';
import type {
  FacilityNavigationContract,
  FacilityTierId,
  PrecautionGuidance,
  SpecialtyId,
  SpecialtyRecommendation,
  SymptomPrecautionRecord,
  UrgencyGuidanceDetails,
} from './precaution-contracts';
import {
  FACILITY_TIERS_META,
  PRECAUTIONS_KB,
  SPECIALTIES_META,
} from './precautions-data';

export interface PrecautionEngineOptions {
  age?: number | null;
  isPregnant?: boolean;
}

export function evaluatePrecautionsAndSpecialty(
  assessment: UrgencyAssessment,
  options?: PrecautionEngineOptions,
): PrecautionGuidance {
  const age = options?.age ?? null;
  const isPregnant = options?.isPregnant ?? false;

  const confirmedSymptoms = assessment.confirmed_symptoms.map(s => s.trim().toLowerCase());
  const symptomSet = new Set(confirmedSymptoms);

  // 1. Match Precautions
  const matchedPrecautions = matchPrecautions(
    symptomSet,
    assessment.relevant_risk_factors,
    age,
    isPregnant,
  );

  // 2. Build Urgency Guidance Details
  const effectiveUrgency: UrgencyLevel = assessment.assessed_urgency ?? 'unable_to_assess';
  const urgencyGuidance = buildUrgencyGuidance(
    effectiveUrgency,
    assessment.emergency_override,
    assessment.emergency_trigger,
  );

  // 3. Recommend Specialty
  const specialtyRecommendation = recommendSpecialty(
    assessment,
    symptomSet,
    age,
    isPregnant,
  );

  // 4. Build Phase B3 Facility Navigation Contract
  const facilityNavigationContract = buildFacilityNavigationContract(
    specialtyRecommendation,
    effectiveUrgency,
    assessment.emergency_override,
  );

  const disclaimers = [
    'Research-only demonstrator: not certified medical triage, diagnosis, or clinical advice.',
    'No drug prescriptions, pharmaceutical dosages, or diagnostic conclusions are provided.',
    'In case of life-threatening symptoms, immediately contact emergency services (112 / 108).',
    'Specialty recommendations and facility tiers are based on service capabilities without commercial or brand bias.',
  ];

  return {
    schema_version: 'medassist.precautions.v1',
    research_only: true,
    clinical_claim: false,
    urgency_assessment: assessment,
    urgency_guidance: urgencyGuidance,
    symptom_precautions: matchedPrecautions,
    specialty_recommendation: specialtyRecommendation,
    facility_navigation_contract: facilityNavigationContract,
    disclaimers,
  };
}

function matchPrecautions(
  symptomSet: Set<str>,
  riskFactors: string[],
  age: number | null,
  isPregnant: boolean,
): SymptomPrecautionRecord[] {
  const matched: SymptomPrecautionRecord[] = [];
  const matchedIds = new Set<string>();

  for (const record of PRECAUTIONS_KB) {
    if (record.category === 'pediatric_pregnancy') {
      const hasPedFactor = riskFactors.some(rf => rf.toLowerCase().includes('pediatric') || rf.toLowerCase().includes('ped'));
      const isPed = (age !== null && age < 5) || hasPedFactor;
      const hasPregFactor = riskFactors.some(rf => rf.toLowerCase().includes('pregnant') || rf.toLowerCase().includes('maternal'));
      const isPreg = isPregnant || hasPregFactor;

      if ((isPed || isPreg) && !matchedIds.has(record.precaution_id)) {
        matched.push(record);
        matchedIds.add(record.precaution_id);
      }
      continue;
    }

    const recordTriggers = new Set(record.symptom_ids.map(t => t.toLowerCase()));
    let hasMatch = false;

    for (const sym of symptomSet) {
      if (recordTriggers.has(sym)) {
        hasMatch = true;
        break;
      }
      for (const trig of recordTriggers) {
        if (trig.length >= 4 && (sym.includes(trig) || trig.includes(sym))) {
          hasMatch = true;
          break;
        }
      }
      if (hasMatch) break;
    }

    if (hasMatch && !matchedIds.has(record.precaution_id)) {
      matched.push(record);
      matchedIds.add(record.precaution_id);
    }
  }

  // Fallback if none matched
  if (matched.length === 0) {
    for (const precId of ['PREC_FEVER_GENERAL', 'PREC_HEADACHE_NEURO']) {
      const rec = PRECAUTIONS_KB.find(p => p.precaution_id === precId);
      if (rec && !matchedIds.has(rec.precaution_id)) {
        matched.push(rec);
        matchedIds.add(rec.precaution_id);
      }
    }
  }

  return matched;
}

type str = string;

function buildUrgencyGuidance(
  urgency: UrgencyLevel,
  emergencyOverride: boolean,
  emergencyTrigger?: string,
): UrgencyGuidanceDetails {
  if (emergencyOverride || urgency === 'extreme') {
    return {
      urgency_level: 'extreme',
      title: 'Immediate Emergency Services Notification Required',
      recommended_timeframe: 'IMMEDIATE: Call emergency services (112 / 108 in India or local ambulance) or proceed immediately to the nearest 24x7 Emergency Department.',
      monitoring_advice: [
        'Monitor breathing rate and depth continuously.',
        'Keep patient conscious and responsive; talk to them calmly.',
        'Watch for loss of consciousness, seizures, or sudden worsening of color (cyanosis / pallor).',
      ],
      preparation_for_doctor: [
        'Locate government identity card and any health insurance papers.',
        'Gather all active prescription medications, blister packs, and supplements into a clear bag.',
        'Have exact timeline of symptom onset and changes ready to tell paramedics.',
      ],
      immediate_actions: [
        'Immediately call 112 / 108 or have a bystander call.',
        'Sit upright or in a position of greatest breathing ease; loosen tight clothing around neck and waist.',
        'Unlock the front door and turn on porch lights so emergency responders can enter without delay.',
        'Keep patient calm, warm, and resting without physical movement.',
      ],
      what_to_avoid: [
        'DO NOT exert physically, walk around, or climb stairs.',
        'DO NOT consume food, hot drinks, or water if choking, vomiting, or having acute chest pain.',
        'DO NOT drive yourself or transport in private vehicle if emergency ambulance is dispatchable.',
        'DO NOT administer unprescribed medications or sedatives.',
      ],
      emergency_first_aid: [
        'Ensure an open airway and keep calm.',
        'If conscious and experiencing crushing chest pain without known aspirin allergy, adopt a semi-seated W-position.',
        'If breathing stops or responsiveness is lost, begin cardiopulmonary resuscitation (CPR) if trained, or follow dispatcher instructions.',
      ],
      critical_information_for_responders: [
        `Emergency trigger noted: ${emergencyTrigger ?? 'Critical clinical escalation signs'}.`,
        'Exact time when acute emergency symptoms began.',
        'Known chronic medical conditions (e.g. cardiac, respiratory, diabetic, kidney).',
        'Current medications, blood thinners, and drug allergies.',
      ],
    };
  }

  if (urgency === 'high') {
    return {
      urgency_level: 'high',
      title: 'Same-Day Urgent Clinical Assessment Required',
      recommended_timeframe: 'Seek medical evaluation today (within 2 to 4 hours) at a Community Health Centre (CHC), District Hospital, or urgent outpatient clinic.',
      monitoring_advice: [
        'Check body temperature and pulse every 2 hours.',
        'Observe for any signs of breathing difficulty, chest tightness, or confusion.',
        'Monitor ability to tolerate fluids without vomiting.',
      ],
      preparation_for_doctor: [
        'Bring a complete list of current medications and allergies.',
        'Note the precise progression of symptoms and highest temperature recorded.',
        'Bring recent lab or clinic reports if available.',
      ],
      immediate_actions: [
        'Rest quietly in a well-supported, comfortable position.',
        'Arrange safe transportation accompanied by a family member or friend.',
        'Keep oral hydration frequent in small sips.',
      ],
      what_to_avoid: [
        'DO NOT drive yourself or operate machinery while experiencing intense symptoms.',
        'DO NOT delay medical assessment until tomorrow.',
        'DO NOT take unprescribed prescription drugs (antibiotics/steroids).',
      ],
    };
  }

  if (urgency === 'medium') {
    return {
      urgency_level: 'medium',
      title: 'Timely Outpatient Clinical Consultation Recommended',
      recommended_timeframe: 'Schedule an appointment with a general practitioner or appropriate specialist within 24 to 48 hours.',
      monitoring_advice: [
        'Check temperature and symptoms morning and evening.',
        'Observe for new or worsening warning signs (such as high fever, severe pain, or dehydration).',
        'Log symptom changes in a notebook or mobile phone.',
      ],
      preparation_for_doctor: [
        'Write down when symptoms started and what remedies provided relief.',
        'List all prescription, OTC medications, and vitamins you take regularly.',
        'Write down questions you want to ask the physician.',
      ],
      immediate_actions: [
        'Rest comfortably and stay hydrated with water, ORS, or warm broths.',
        'Follow safe symptom-specific comfort precautions.',
        'Book an outpatient appointment at a nearby clinic or hospital.',
      ],
      what_to_avoid: [
        'Avoid strenuous physical workouts or exhausting activities.',
        'Avoid taking multiple combination cold/pain medicines with identical active ingredients.',
        'Do not ignore symptoms if they become noticeably worse.',
      ],
    };
  }

  if (urgency === 'low') {
    return {
      urgency_level: 'low',
      title: 'Supportive Self-Care & Non-Pharmacological Comfort Guidance',
      recommended_timeframe: 'Monitor symptoms at home over the next 24 to 72 hours; consult a primary care clinician if symptoms persist beyond 3-5 days or worsen.',
      monitoring_advice: [
        'Observe body temperature and overall comfort level once or twice daily.',
        'Ensure normal urine output (pale yellow color) and regular bowel movements.',
        'Watch for any unexpected escalation in discomfort.',
      ],
      preparation_for_doctor: [
        'Keep a simple timeline of when symptoms began and their daily pattern.',
        'Record any over-the-counter soothing measures tried.',
      ],
      immediate_actions: [
        'Ensure adequate sleep and resting periods.',
        'Maintain continuous hydration with oral fluids (water, soups, electrolyte fluids).',
        'Wear comfortable, loose-fitting cotton clothing.',
      ],
      what_to_avoid: [
        'Avoid heavy physical exertion and sleep deprivation.',
        'Do not self-prescribe antibiotics or unverified medications.',
        'Avoid active and passive tobacco smoke and alcohol consumption.',
      ],
    };
  }

  return {
    urgency_level: 'unable_to_assess',
    title: 'Incomplete Evidence — Professional Medical Evaluation Recommended',
    recommended_timeframe: 'Consult a licensed medical professional in person for physical examination and objective assessment.',
    monitoring_advice: [
      'Monitor for any red-flag emergency symptoms (chest pain, breathing difficulty, severe headache).',
      'Observe whether symptoms are improving, staying the same, or progressing.',
    ],
    preparation_for_doctor: [
      'List all symptoms clearly with their chronological onset.',
      'Bring all prescription medications and medical history documents.',
    ],
    immediate_actions: [
      'Rest in a quiet, safe environment.',
      'Seek in-person medical evaluation at a local primary care clinic or healthcare centre.',
    ],
    what_to_avoid: [
      'Do not assume absence of danger simply because symptoms cannot be fully classified online.',
      'Do not start medications without clinical examination.',
    ],
  };
}

function recommendSpecialty(
  assessment: UrgencyAssessment,
  symptomSet: Set<string>,
  age: number | null,
  isPregnant: boolean,
): SpecialtyRecommendation {
  // 1. Emergency override: absolute priority
  if (assessment.emergency_override || assessment.assessed_urgency === 'extreme') {
    return {
      primary_specialty: 'emergency_medicine',
      primary_specialty_name: SPECIALTIES_META.emergency_medicine.name,
      alternative_specialty: 'general_medicine',
      alternative_specialty_name: SPECIALTIES_META.general_medicine.name,
      rationale: 'Assessed urgency is Extreme or emergency safety warning signs were detected. Immediate Emergency Medicine evaluation and resuscitation takes absolute clinical precedence.',
      emergency_override: true,
      confidence_factor: 1.0,
    };
  }

  // 2. Pediatric context: age < 18
  const isPediatric = (age !== null && age < 18) || assessment.relevant_risk_factors.some(rf => rf.toLowerCase().includes('pediatric'));
  if (isPediatric) {
    return {
      primary_specialty: 'paediatrics',
      primary_specialty_name: SPECIALTIES_META.paediatrics.name,
      alternative_specialty: 'family_medicine',
      alternative_specialty_name: SPECIALTIES_META.family_medicine.name,
      rationale: `Patient is a child or adolescent (age ${age !== null ? age : '<18'}). Specialized paediatric evaluation is indicated for safe age-specific diagnosis and dosing.`,
      emergency_override: false,
      confidence_factor: 0.95,
    };
  }

  // 3. Pregnancy / Obstetric context
  if (isPregnant || assessment.relevant_risk_factors.some(rf => rf.toLowerCase().includes('pregnant') || rf.toLowerCase().includes('maternal'))) {
    return {
      primary_specialty: 'obstetrics_gynaecology',
      primary_specialty_name: SPECIALTIES_META.obstetrics_gynaecology.name,
      alternative_specialty: 'family_medicine',
      alternative_specialty_name: SPECIALTIES_META.family_medicine.name,
      rationale: 'Maternal or pregnancy context requires specialized obstetric & gynaecological evaluation for fetal and maternal safety.',
      emergency_override: false,
      confidence_factor: 0.95,
    };
  }

  // 4. Multi-symptom mapping
  const hasMatch = (triggers: string[]) => triggers.some(t => symptomSet.has(t));

  // Pulmonary
  if (hasMatch(['e_201', 'cough', 'coughing', 'e_203', 'intense coughing fits', 'e_212', 'hoarse voice', 'wheezing'])) {
    return {
      primary_specialty: 'pulmonology',
      primary_specialty_name: SPECIALTIES_META.pulmonology.name,
      alternative_specialty: 'family_medicine',
      alternative_specialty_name: SPECIALTIES_META.family_medicine.name,
      rationale: 'Confirmed respiratory symptoms (cough, coughing fits, or airway involvement) indicate Pulmonology or General Practice assessment.',
      emergency_override: false,
      confidence_factor: 0.9,
    };
  }

  // Dermatology
  if (hasMatch(['e_129', 'rash', 'rash or skin lesions', 'skin lesions', 'e_151', 'swelling', 'itching'])) {
    return {
      primary_specialty: 'dermatology',
      primary_specialty_name: SPECIALTIES_META.dermatology.name,
      alternative_specialty: 'general_medicine',
      alternative_specialty_name: SPECIALTIES_META.general_medicine.name,
      rationale: 'Confirmed dermatological signs (rash, skin lesions, or localized swelling) indicate specialized skin evaluation.',
      emergency_override: false,
      confidence_factor: 0.9,
    };
  }

  // ENT
  if (hasMatch(['e_97', 'sore throat', 'e_181', 'nasal congestion or clear runny nose', 'e_182', 'green or yellow nasal discharge', 'e_103', 'loss of smell', 'earache', 'throat pain'])) {
    return {
      primary_specialty: 'ent',
      primary_specialty_name: SPECIALTIES_META.ent.name,
      alternative_specialty: 'family_medicine',
      alternative_specialty_name: SPECIALTIES_META.family_medicine.name,
      rationale: 'Confirmed upper airway, nasal, or pharyngeal complaints indicate Ear, Nose & Throat (ENT) examination.',
      emergency_override: false,
      confidence_factor: 0.9,
    };
  }

  // Ophthalmology
  if (hasMatch(['e_74', 'red eyes', 'e_127', 'excessive tears', 'e_170', 'severe eye itching', 'eye redness'])) {
    return {
      primary_specialty: 'ophthalmology',
      primary_specialty_name: SPECIALTIES_META.ophthalmology.name,
      alternative_specialty: 'general_medicine',
      alternative_specialty_name: SPECIALTIES_META.general_medicine.name,
      rationale: 'Confirmed ocular symptoms (red eyes, excessive tearing, eye itching) indicate dedicated ophthalmological evaluation.',
      emergency_override: false,
      confidence_factor: 0.9,
    };
  }

  // Gastroenterology
  if (hasMatch(['e_51', 'diarrhea', 'e_148', 'nausea', 'e_211', 'repeated vomiting', 'e_30', 'abdominal bloating', 'stomach pain', 'abdominal pain'])) {
    return {
      primary_specialty: 'gastroenterology',
      primary_specialty_name: SPECIALTIES_META.gastroenterology.name,
      alternative_specialty: 'general_medicine',
      alternative_specialty_name: SPECIALTIES_META.general_medicine.name,
      rationale: 'Confirmed gastrointestinal symptoms (diarrhea, repeated vomiting, or abdominal distress) indicate Gastroenterology or Internal Medicine evaluation.',
      emergency_override: false,
      confidence_factor: 0.9,
    };
  }

  // Orthopaedics
  if (hasMatch(['e_144', 'diffuse muscle pain', 'body aches', 'back pain', 'joint pain', 'muscle pain'])) {
    return {
      primary_specialty: 'orthopaedics',
      primary_specialty_name: SPECIALTIES_META.orthopaedics.name,
      alternative_specialty: 'general_medicine',
      alternative_specialty_name: SPECIALTIES_META.general_medicine.name,
      rationale: 'Confirmed musculoskeletal or body pain complaints indicate Orthopaedic or General Medicine review.',
      emergency_override: false,
      confidence_factor: 0.85,
    };
  }

  // Dental
  if (hasMatch(['toothache', 'dental pain', 'mouth ulcer', 'gum swelling', 'bleeding gums', 'tooth pain'])) {
    return {
      primary_specialty: 'dentistry',
      primary_specialty_name: SPECIALTIES_META.dentistry.name,
      alternative_specialty: 'ent',
      alternative_specialty_name: SPECIALTIES_META.ent.name,
      rationale: 'Confirmed oral or dental symptoms indicate direct dental examination.',
      emergency_override: false,
      confidence_factor: 0.95,
    };
  }

  // Default General Medicine
  return {
    primary_specialty: 'general_medicine',
    primary_specialty_name: SPECIALTIES_META.general_medicine.name,
    alternative_specialty: 'family_medicine',
    alternative_specialty_name: SPECIALTIES_META.family_medicine.name,
    rationale: 'Generalized or multi-system presentation (fever, malaise, or constitutional symptoms) is best evaluated initially by General Medicine / Internal Medicine.',
    emergency_override: false,
    confidence_factor: 0.85,
  };
}

function buildFacilityNavigationContract(
  specialtyRec: SpecialtyRecommendation,
  urgency: UrgencyLevel,
  emergencyOverride: boolean,
): FacilityNavigationContract {
  const specMeta = SPECIALTIES_META[specialtyRec.primary_specialty];
  const baseCaps = [...specMeta.required_capabilities];

  const isEmergency = emergencyOverride || urgency === 'extreme';
  if (isEmergency) {
    const emergencyCaps = [
      'emergency_resuscitation',
      'advanced_cardiac_life_support',
      'emergency_airway_management',
      '24x7_emergency_services',
      'trauma_stabilization',
    ];
    for (const cap of emergencyCaps) {
      if (!baseCaps.includes(cap)) {
        baseCaps.push(cap);
      }
    }
  }

  const eligibleTiers: FacilityTierId[] = [];
  for (const [tierId, tierMeta] of Object.entries(FACILITY_TIERS_META) as [FacilityTierId, (typeof FACILITY_TIERS_META)[FacilityTierId]][]) {
    if (isEmergency) {
      if (tierMeta.emergency_capable && tierMeta.eligible_urgencies.includes('extreme')) {
        eligibleTiers.push(tierId);
      }
    } else {
      if (tierMeta.eligible_urgencies.includes(urgency)) {
        eligibleTiers.push(tierId);
      }
    }
  }

  const verificationReqs = [
    'verified_specialist_consultation',
    'active_operating_hours',
  ];
  if (isEmergency || urgency === 'high') {
    verificationReqs.unshift('24x7_operation');
    verificationReqs.push('inpatient_bed_availability');
  }

  let exclusions: string[] = [];
  if (isEmergency) {
    exclusions = [
      'outpatient_only_clinics_without_emergency_resuscitation',
      'diagnostic_imaging_centres_without_resuscitation_capacity',
      'primary_health_centres_lacking_24x7_trauma_care',
    ];
  } else if (urgency === 'high') {
    exclusions = [
      'standalone_diagnostic_centres_without_consulting_physicians',
    ];
  }

  return {
    schema_version: 'medassist.facility-navigation.v1',
    research_only: true,
    clinical_claim: false,
    required_service: specialtyRec.primary_specialty_name,
    alternative_service: specialtyRec.alternative_specialty_name,
    required_capabilities: baseCaps,
    urgency_level: urgency,
    emergency_department_required: isEmergency,
    facility_verification_requirements: verificationReqs,
    explicit_exclusions: exclusions,
    eligible_facility_tiers: eligibleTiers,
  };
}
