import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNaturalSeverity } from '../src/features/medassist-severity/severity-understanding';
import { evaluateHybridUrgency } from '../src/features/medassist-severity/urgency-engine';
import { SEVERITY_OPTIONS, type SeverityLevel } from '../src/features/medassist-severity/severity-contracts';

test('1. All five severity options parse and map to correct levels', () => {
  // Option 1: Low
  const t1 = parseNaturalSeverity('Low');
  assert.equal(t1.overall, 'low');
  const t1b = parseNaturalSeverity('Mild discomfort; normal activities are possible.');
  assert.equal(t1b.overall, 'low');

  // Option 2: Medium
  const t2 = parseNaturalSeverity('Medium');
  assert.equal(t2.overall, 'medium');
  const t2b = parseNaturalSeverity('Symptoms interfere with daily activities.');
  assert.equal(t2b.overall, 'medium');

  // Option 3: High
  const t3 = parseNaturalSeverity('High');
  assert.equal(t3.overall, 'high');
  const t3b = parseNaturalSeverity('Symptoms significantly affect normal functioning.');
  assert.equal(t3b.overall, 'high');

  // Option 4: Extreme
  const t4 = parseNaturalSeverity('Extreme');
  assert.equal(t4.overall, 'extreme');
  const t4b = parseNaturalSeverity('Symptoms are extremely difficult to tolerate.');
  assert.equal(t4b.overall, 'extreme');

  // Option 5: Not sure
  const t5 = parseNaturalSeverity('Not sure');
  assert.equal(t5.overall, 'not_sure');
  const t5b = parseNaturalSeverity('Unable to confidently describe severity.');
  assert.equal(t5b.overall, 'not_sure');
});

test('2. Multiple symptoms with different intensity are preserved individually', () => {
  const parsed = parseNaturalSeverity('my cough is mild, but my headache is extreme');
  assert.equal(parsed.symptom_severities['E_201'], 'low');
  assert.equal(parsed.symptom_severities['E_53'], 'extreme');
  assert.equal(parsed.overall, 'extreme'); // Highest severity reflected in overall

  const assessment = evaluateHybridUrgency({
    confirmedSymptoms: ['E_201', 'E_53'],
    selfReportedSeverity: 'medium', // Patient says general discomfort is medium
    symptomSeverities: parsed.symptom_severities, // But headache is extreme
    age: 32,
    sourceSex: 'F',
  });
  assert.equal(assessment.self_reported_severity, 'medium');
  assert.equal(assessment.symptom_severities['E_53'], 'extreme');
  assert.equal(assessment.assessed_urgency, 'extreme');
  assert.ok(assessment.relevant_risk_factors.includes('symptom_specific_extreme_severity'));
});

test('3. Emergency override strictly enforced: Low self-reported severity NEVER downgrades emergency', () => {
  const assessment = evaluateHybridUrgency({
    confirmedSymptoms: ['E_201'],
    selfReportedSeverity: 'low', // Patient says Low discomfort
    age: 45,
    sourceSex: 'M',
    emergencyDetected: true,
    emergencyTrigger: 'i cannot breathe',
  });
  // Self-reported severity is faithfully preserved
  assert.equal(assessment.self_reported_severity, 'low');
  // But assessed urgency MUST be extreme
  assert.equal(assessment.assessed_urgency, 'extreme');
  assert.equal(assessment.emergency_override, true);
  assert.equal(assessment.emergency_trigger, 'i cannot breathe');
  assert.equal(assessment.navigation_requirements.tier, 'emergency_services');
  assert.equal(assessment.navigation_requirements.requires_emergency_call, true);
  assert.ok(assessment.rule_provenance.some(r => r.rule_id === 'RULE_EMERGENCY_OVERRIDE'));
});

test('4. Missing information causes fail-closed abstention', () => {
  // Empty symptoms
  const emptySymptoms = evaluateHybridUrgency({
    confirmedSymptoms: [],
    selfReportedSeverity: 'high',
    age: 28,
  });
  assert.equal(emptySymptoms.status, 'unable_to_assess');
  assert.equal(emptySymptoms.assessed_urgency, 'unable_to_assess');
  assert.equal(emptySymptoms.abstention_reason, 'no_confirmed_symptoms');

  // Missing age
  const missingAge = evaluateHybridUrgency({
    confirmedSymptoms: ['E_201'],
    selfReportedSeverity: 'high',
    age: null,
  });
  assert.equal(missingAge.status, 'unable_to_assess');
  assert.equal(missingAge.abstention_reason, 'missing_demographic_context');
});

test('5. Contradictory answers cause fail-closed abstention without guessing', () => {
  const contradicted = evaluateHybridUrgency({
    confirmedSymptoms: ['E_201'],
    selfReportedSeverity: 'medium',
    age: 30,
    contradictionsPresent: true,
  });
  assert.equal(contradicted.status, 'unable_to_assess');
  assert.equal(contradicted.assessed_urgency, 'unable_to_assess');
  assert.equal(contradicted.abstention_reason, 'unresolved_evidence_contradictions');
  assert.ok(contradicted.rule_provenance.some(r => r.rule_id === 'RULE_ABSTAIN_CONTRADICTION'));
});

test('6. Spelling mistakes and informal language parse reliably', () => {
  // Typos
  assert.equal(parseNaturalSeverity('extremly unbarable').overall, 'extreme');
  assert.equal(parseNaturalSeverity('modrate disscomfort').overall, 'medium');
  assert.equal(parseNaturalSeverity('sever pain').overall, 'high');
  assert.equal(parseNaturalSeverity('interfers with daily activities').overall, 'medium');

  // Colloquial & Indian English
  assert.equal(parseNaturalSeverity('thoda thoda discomfort, manageable').overall, 'low');
  assert.equal(parseNaturalSeverity('bahut zyada paining badly').overall, 'high');
  assert.equal(parseNaturalSeverity('too much paining, hard to function').overall, 'high');
  assert.equal(parseNaturalSeverity('just a little bit uncomfortable').overall, 'low');
});

test('7. Negations, corrections, and other-person attribution', () => {
  // Negation correction
  const corr1 = parseNaturalSeverity('not extreme, just mild');
  assert.equal(corr1.overall, 'low');
  assert.equal(corr1.is_negation_inversion, true);

  const corr2 = parseNaturalSeverity('not severe, it is moderate');
  assert.equal(corr2.overall, 'medium');

  // Other person attribution
  const other = parseNaturalSeverity('my brother has extreme pain');
  assert.equal(other.is_other_person, true);
  assert.equal(other.overall, null); // Not attributed to the patient
});

test('8. Age-related risk scenarios enforce minimum urgency floors', () => {
  // Pediatric < 2 with fever
  const ped = evaluateHybridUrgency({
    confirmedSymptoms: ['E_91'], // fever
    selfReportedSeverity: 'low', // Parent says mild
    age: 1, // 1 year old
    sourceSex: 'F',
  });
  assert.equal(ped.self_reported_severity, 'low');
  assert.equal(ped.assessed_urgency, 'high'); // Upgraded to High due to infant fever
  assert.ok(ped.relevant_risk_factors.includes('pediatric_under_2_with_fever'));

  // Geriatric >= 65 with fever and pain
  const geri = evaluateHybridUrgency({
    confirmedSymptoms: ['E_91', 'E_53'],
    selfReportedSeverity: 'low',
    age: 70,
    sourceSex: 'M',
  });
  assert.equal(geri.self_reported_severity, 'low');
  assert.equal(geri.assessed_urgency, 'high'); // Upgraded to High
  assert.ok(geri.relevant_risk_factors.includes('geriatric_65_plus_with_systemic_symptoms'));
});

test('9. Downstream Phase B2/B3 contract adherence', () => {
  const result = evaluateHybridUrgency({
    confirmedSymptoms: ['E_201'],
    selfReportedSeverity: 'low',
    age: 25,
    sourceSex: 'F',
  });
  assert.equal(result.schema_version, 'medassist.urgency-assessment.v1');
  assert.equal(result.research_only, true);
  assert.equal(result.clinical_claim, false);
  assert.ok(Array.isArray(result.rule_provenance));
  assert.ok(result.rule_provenance.length > 0);
  assert.ok(Array.isArray(result.assessment_limitations));
  assert.ok(result.navigation_requirements);
  assert.equal(typeof result.navigation_requirements.tier, 'string');
});
