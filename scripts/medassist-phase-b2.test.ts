/**
 * MedAssist Phase B2: Symptom Precautions & Specialty Intelligence Test Suite.
 *
 * Verifies all 11 symptom categories, 12 specialties, 10 facility tiers,
 * emergency overrides, and Phase B3 facility navigation contract generation.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import type { UrgencyAssessment } from '../src/features/medassist-severity/severity-contracts';
import {
  evaluatePrecautionsAndSpecialty,
  FACILITY_TIERS_META,
  PRECAUTIONS_KB,
  SPECIALTIES_META,
  type PrecautionGuidance,
} from '../src/features/medassist-precautions';

function createMockAssessment(overrides: Partial<UrgencyAssessment> = {}): UrgencyAssessment {
  const isExtreme = overrides.assessed_urgency === 'extreme' || overrides.emergency_override;
  return {
    schema_version: 'medassist.urgency-assessment.v1',
    research_only: true,
    clinical_claim: false,
    status: 'assessed',
    self_reported_severity: 'low',
    symptom_severities: {},
    assessed_urgency: 'low',
    confirmed_symptoms: ['cough'],
    relevant_risk_factors: [],
    emergency_override: false,
    rule_provenance: [
      {
        rule_id: 'RULE_TEST',
        description: 'Test rule',
        approval_status: 'provisional_research_rule_unreviewed',
        source_reference: 'Unit test',
        clinical_claim: false,
      },
    ],
    assessment_limitations: ['Unit test'],
    navigation_requirements: {
      tier: isExtreme ? 'emergency_services' : 'routine_clinical_evaluation',
      rationale: 'Test rationale',
      requires_emergency_call: isExtreme,
      requires_facility_search_consent: false,
    },
    ...overrides,
  };
}

test('Phase B2: All 11 symptom categories present with valid structure', () => {
  const categories = new Set(PRECAUTIONS_KB.map(p => p.category));
  const expectedCategories = [
    'respiratory',
    'fever_general',
    'headache_neurological',
    'digestive_abdominal',
    'skin_dermatological',
    'ent',
    'eye_ophthalmological',
    'musculoskeletal',
    'dental_oral',
    'urinary_renal',
    'pediatric_pregnancy',
  ];

  for (const cat of expectedCategories) {
    assert.ok(categories.has(cat as any), `Missing category: ${cat}`);
  }
  assert.equal(PRECAUTIONS_KB.length, 11);

  for (const record of PRECAUTIONS_KB) {
    assert.equal(record.clinical_review_status, 'provisional_research_rule_unreviewed');
    assert.ok(record.authoritative_references.length >= 2, `${record.precaution_id} missing references`);
    assert.ok(record.guidance.length >= 3, `${record.precaution_id} missing guidance`);
    assert.ok(record.warning_signs.length >= 3, `${record.precaution_id} missing warning signs`);
    assert.ok(record.what_to_avoid.length >= 3, `${record.precaution_id} missing what to avoid`);
  }
});

test('Phase B2: All 10 healthcare facility tiers present and categorized', () => {
  const tierIds = Object.keys(FACILITY_TIERS_META);
  const expectedTiers = [
    'clinics_polyclinics',
    'primary_health_centres',
    'community_health_centres',
    'small_private_hospitals',
    'government_general_district_hospitals',
    'private_multispecialty_hospitals',
    'superspecialty_tertiary_hospitals',
    'medical_college_hospitals',
    'diagnostic_centres',
    'emergency_departments_trauma',
  ];

  assert.equal(tierIds.length, 10);
  for (const t of expectedTiers) {
    assert.ok(tierIds.includes(t), `Missing facility tier: ${t}`);
  }
});

test('Phase B2: All 12 medical specialties defined with metadata', () => {
  const specialtyIds = Object.keys(SPECIALTIES_META);
  const expectedSpecialties = [
    'general_medicine',
    'family_medicine',
    'pulmonology',
    'ent',
    'dermatology',
    'ophthalmology',
    'orthopaedics',
    'gastroenterology',
    'dentistry',
    'paediatrics',
    'obstetrics_gynaecology',
    'emergency_medicine',
  ];

  assert.equal(specialtyIds.length, 12);
  for (const spec of expectedSpecialties) {
    assert.ok(specialtyIds.includes(spec), `Missing specialty: ${spec}`);
  }
});

test('Phase B2: Respiratory Low urgency evaluation', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'low',
    confirmed_symptoms: ['e_201', 'cough'],
    self_reported_severity: 'low',
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 29 });
  assert.equal(guidance.schema_version, 'medassist.precautions.v1');
  assert.equal(guidance.facility_navigation_contract.schema_version, 'medassist.facility-navigation.v1');

  // Matched precaution
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_RESP_COUGH'));

  // Specialty recommendation
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'pulmonology');
  assert.equal(guidance.specialty_recommendation.alternative_specialty, 'family_medicine');
  assert.equal(guidance.specialty_recommendation.emergency_override, false);

  // Facility navigation contract
  const nav = guidance.facility_navigation_contract;
  assert.equal(nav.emergency_department_required, false);
  assert.ok(nav.eligible_facility_tiers.includes('clinics_polyclinics'));
  assert.ok(nav.eligible_facility_tiers.includes('primary_health_centres'));
});

test('Phase B2: Emergency override precedence & first-aid steps', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'extreme',
    confirmed_symptoms: ['e_201', 'cough'],
    emergency_override: true,
    emergency_trigger: 'severe_respiratory_arrest',
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 52 });

  // Specialty must be Emergency Medicine
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'emergency_medicine');
  assert.equal(guidance.specialty_recommendation.emergency_override, true);

  // Facility contract must require Emergency Department and exclude clinics
  const nav = guidance.facility_navigation_contract;
  assert.equal(nav.emergency_department_required, true);
  assert.ok(nav.eligible_facility_tiers.includes('emergency_departments_trauma'));
  assert.ok(!nav.eligible_facility_tiers.includes('clinics_polyclinics'));
  assert.ok(!nav.eligible_facility_tiers.includes('diagnostic_centres'));

  // Immediate actions, first aid, and critical info for responders
  assert.ok(guidance.urgency_guidance.emergency_first_aid && guidance.urgency_guidance.emergency_first_aid.length > 0);
  assert.ok(guidance.urgency_guidance.critical_information_for_responders && guidance.urgency_guidance.critical_information_for_responders.length > 0);
});

test('Phase B2: Pediatric patient routing (age < 5)', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'medium',
    confirmed_symptoms: ['e_91', 'fever'],
    relevant_risk_factors: ['pediatric_under_2_with_fever'],
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 3 });
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'paediatrics');
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_PEDIATRIC_PREGNANCY'));
});

test('Phase B2: Gastroenterology routing', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'medium',
    confirmed_symptoms: ['e_51', 'diarrhea', 'e_148', 'nausea'],
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 32 });
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'gastroenterology');
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_DIGESTIVE_ABDOMINAL'));
});

test('Phase B2: Dermatology routing', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'low',
    confirmed_symptoms: ['e_129', 'rash or skin lesions'],
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 24 });
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'dermatology');
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_SKIN_DERMATOLOGICAL'));
});

test('Phase B2: ENT routing', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'low',
    confirmed_symptoms: ['e_97', 'sore throat', 'e_181', 'nasal congestion'],
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 26 });
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'ent');
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_ENT_UPPER_AIRWAY'));
});

test('Phase B2: Ophthalmology routing', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'low',
    confirmed_symptoms: ['e_74', 'red eyes', 'e_127', 'excessive tears'],
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 41 });
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'ophthalmology');
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_EYE_OPHTHALMIC'));
});

test('Phase B2: Musculoskeletal routing', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'medium',
    confirmed_symptoms: ['e_144', 'diffuse muscle pain', 'back pain'],
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 50 });
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'orthopaedics');
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_MUSCULOSKELETAL'));
});

test('Phase B2: Dental routing', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'low',
    confirmed_symptoms: ['toothache', 'gum swelling'],
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 38 });
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'dentistry');
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_DENTAL_ORAL'));
});

test('Phase B2: Urinary routing', () => {
  const assessment = createMockAssessment({
    assessed_urgency: 'medium',
    confirmed_symptoms: ['painful urination', 'burning micturition'],
  });

  const guidance = evaluatePrecautionsAndSpecialty(assessment, { age: 34 });
  assert.equal(guidance.specialty_recommendation.primary_specialty, 'general_medicine');
  const precIds = guidance.symptom_precautions.map(p => p.precaution_id);
  assert.ok(precIds.includes('PREC_URINARY_RENAL'));
});
