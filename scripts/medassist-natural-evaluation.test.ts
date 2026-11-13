import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { understand } from '../src/features/medassist-conversation/understanding';
import { evaluateStatement } from '../src/features/medassist-safety/safety';
import type { NaturalVocabulary } from '../src/features/medassist-conversation/natural';
import type { EvaluationCase } from './generate_natural_understanding_v2_suite';

const metadata = JSON.parse(readFileSync('models/medassist_ai/docs/symptom-schema-metadata.json', 'utf8'));
const vocabulary: NaturalVocabulary = {
  schema_version: 'medassist.natural-vocabulary.v1',
  fictional_only: true,
  items: metadata.items.filter((d: any) => !d.quarantined).map((d: any) => ({
    ...d,
    value_labels: Object.fromEntries(Object.entries(d.value_labels ?? {}).filter(([, value]) => typeof value === 'string')),
    initial_allowed: d.kind === 'symptom' && !d.parent
  })),
  coverage: { symptom_fields: 110, universal_coverage: false }
};

test('v2 evaluation suite integrity matches sha256 receipt', () => {
  const root = 'models/medassist_ai/evaluation/natural-symptom-understanding-v2/';
  const bytes = readFileSync(root + 'suite.json');
  const expectedHash = readFileSync(root + 'suite.sha256', 'utf8').split(/\s+/)[0];
  const actualHash = createHash('sha256').update(bytes).digest('hex');
  assert.equal(actualHash, expectedHash);
  const suite = JSON.parse(bytes.toString());
  assert.equal(suite.cases.length, 240);
  assert.equal(suite.clinical_labels, false);
});

test('run comprehensive evaluation across all 240 v2 cases', () => {
  const root = 'models/medassist_ai/evaluation/natural-symptom-understanding-v2/';
  const suite: { cases: EvaluationCase[] } = JSON.parse(readFileSync(root + 'suite.json', 'utf8'));

  let totalCases = suite.cases.length;
  let passedObservations = 0;
  let passedSafety = 0;
  let criticalNegationInversions = 0;
  let otherPersonLeakage = 0;
  let unconfirmedModelALeakage = 0;
  let missedEmergencyCases = 0;

  const categoryStats: Record<string, { total: number; passed: number; failed: string[] }> = {};

  const failureDetails: Array<{ id: string; category: string; text: string; expected: any; actual: any; reason: string }> = [];

  for (const c of suite.cases) {
    if (!categoryStats[c.category]) {
      categoryStats[c.category] = { total: 0, passed: 0, failed: [] };
    }
    categoryStats[c.category].total++;

    // 1. Safety check
    const safety = evaluateStatement(c.text);
    const safetyTriggered = safety.status === 'escalate';
    if (safetyTriggered === c.expected.emergency_escalation) {
      passedSafety++;
    } else {
      if (c.expected.emergency_escalation && !safetyTriggered) {
        missedEmergencyCases++;
        failureDetails.push({
          id: c.id,
          category: c.category,
          text: c.text,
          expected: { emergency_escalation: true },
          actual: { emergency_escalation: false },
          reason: 'MISSED_EMERGENCY_SAFEGUARD'
        });
      }
    }

    // 2. Natural understanding check
    const r = understand(c.text, vocabulary);
    const actualObs = safetyTriggered && safety.suppress_ordinary_flow
      ? []
      : r.proposal.observations.map(({ evidence_id, state, value }) => ({ evidence_id, state, value }));
    const expectedObs = c.expected.observations;

    // Check for critical negation inversion: expected false, got true or vice-versa
    for (const exp of expectedObs) {
      const act = actualObs.find(a => a.evidence_id === exp.evidence_id);
      if (act && typeof exp.value === 'boolean' && typeof act.value === 'boolean' && exp.value !== act.value) {
        criticalNegationInversions++;
      }
    }

    // Check for other person leakage: subject is other_person but produced confirmed positive observations for patient
    if (c.subject === 'other_person' && actualObs.some(a => a.state === 'confirmed' && a.value === true)) {
      otherPersonLeakage++;
    }

    // Check if unconfirmed evidence can leak to Model A without explicit confirmation
    // In APIP architecture, only confirmed evidence is eligible; unmapped or unconfirmed must not be tagged eligible
    if (!c.model_a_eligible_when_confirmed && actualObs.some(a => a.state === 'confirmed' && a.value === true && !c.expected.observations.some(e => e.evidence_id === a.evidence_id && e.value === true))) {
      unconfirmedModelALeakage++;
    }

    // Compare actual vs expected observations
    const obsMatch = JSON.stringify(actualObs.sort((a, b) => a.evidence_id.localeCompare(b.evidence_id))) ===
                     JSON.stringify(expectedObs.slice().sort((a, b) => a.evidence_id.localeCompare(b.evidence_id)));

    if (obsMatch && (safetyTriggered === c.expected.emergency_escalation || !c.expected.emergency_escalation)) {
      passedObservations++;
      categoryStats[c.category].passed++;
    } else {
      categoryStats[c.category].failed.push(c.id);
      if (!failureDetails.some(f => f.id === c.id)) {
        failureDetails.push({
          id: c.id,
          category: c.category,
          text: c.text,
          expected: expectedObs,
          actual: actualObs,
          reason: 'OBSERVATIONS_MISMATCH'
        });
      }
    }
  }

  const results = {
    evaluated_at: new Date().toISOString(),
    total_cases: totalCases,
    passed_cases: passedObservations,
    accuracy_percentage: ((passedObservations / totalCases) * 100).toFixed(2),
    critical_negation_inversions: criticalNegationInversions,
    other_person_leakage: otherPersonLeakage,
    unconfirmed_model_a_leakage: unconfirmedModelALeakage,
    missed_emergency_cases: missedEmergencyCases,
    category_breakdown: categoryStats,
    failures: failureDetails
  };

  console.log('=== EVALUATION SUMMARY ===');
  console.log(`Total: ${totalCases}, Passed: ${passedObservations} (${results.accuracy_percentage}%)`);
  console.log(`Critical Negation Inversions: ${criticalNegationInversions}`);
  console.log(`Other Person Leakage: ${otherPersonLeakage}`);
  console.log(`Missed Emergency Cases: ${missedEmergencyCases}`);
  console.log(`Category Breakdown:`, JSON.stringify(categoryStats, null, 2));
  console.log(`First 10 Failures:`, JSON.stringify(failureDetails.slice(0, 10), null, 2));

  writeFileSync('models/medassist_ai/evaluation/natural-symptom-understanding-v2/evaluation-report.json', JSON.stringify(results, null, 2));
});
