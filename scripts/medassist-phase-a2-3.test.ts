import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { request as httpRequest } from 'node:http';
import { registerModelADemo } from '../server/model-a-demo';
import { evaluateStatement } from '../src/features/medassist-safety/safety';
import { evaluateHybridUrgency } from '../src/features/medassist-severity/urgency-engine';
import { evaluatePrecautionsAndSpecialty } from '../src/features/medassist-precautions/precaution-engine';
import { discoverHealthcareFacilities } from '../src/features/medassist-discovery/discovery-engine';

const RUN_ROOT = 'C:\\apip_research\\campaign_2026\\run_01';
const METADATA_ROOT = 'C:\\apip_research\\ddxplus_v2\\source';
const TOKEN = 'fictional-test-token-a2-3-long-enough-32-chars-ok';

test('Phase A2.3 Gate 1: Artifact & Seal Verification', () => {
  const sealHashPath = path.join(RUN_ROOT, 'pre-test-seal-hash.json');
  const sealPath = path.join(RUN_ROOT, 'pre-test-seal.json');
  const selectionPath = path.join(RUN_ROOT, 'selection.json');
  const completionPath = path.join(RUN_ROOT, 'stage6_completion.json');
  const provenancePath = path.join(RUN_ROOT, 'campaign-provenance.json');
  const aggregatePath = path.join(RUN_ROOT, 'validation-aggregate.json');

  assert.ok(existsSync(sealHashPath), 'pre-test-seal-hash.json must exist');
  assert.ok(existsSync(sealPath), 'pre-test-seal.json must exist');
  assert.ok(existsSync(selectionPath), 'selection.json must exist');
  assert.ok(existsSync(completionPath), 'stage6_completion.json must exist');
  assert.ok(existsSync(provenancePath), 'campaign-provenance.json must exist');
  assert.ok(existsSync(aggregatePath), 'validation-aggregate.json must exist');

  const sealHashDoc = JSON.parse(readFileSync(sealHashPath, 'utf-8'));
  const sealDoc = JSON.parse(readFileSync(sealPath, 'utf-8'));
  const selectionDoc = JSON.parse(readFileSync(selectionPath, 'utf-8'));
  const completionDoc = JSON.parse(readFileSync(completionPath, 'utf-8'));
  const provenanceDoc = JSON.parse(readFileSync(provenancePath, 'utf-8'));

  assert.equal(sealHashDoc.sha256, '693326df4acf0d83543b91a124c968576fb7161fa4a98dddaa9958a826f498bc');
  assert.equal(completionDoc.seal_sha256, sealHashDoc.sha256);
  assert.equal(provenanceDoc.seal_sha256, sealHashDoc.sha256);
  assert.equal(selectionDoc.selected_alpha, 1e-05);
  assert.equal(completionDoc.selected_alpha, 1e-05);
  assert.equal(selectionDoc.training_overlap_excluded, true);
  assert.equal(selectionDoc.model_refitted_after_selection, false);

  // Verify locked test partition is protected
  assert.equal(completionDoc.locked_test_unopened, true);
  assert.equal(provenanceDoc.locked_test_evaluated, false);

  // Check 17 sealed artifacts
  const artifacts = sealDoc.artifacts;
  assert.equal(Object.keys(artifacts).length, 17);
  for (const [name, expectedSha] of Object.entries(artifacts)) {
    const artifactPath = path.join(RUN_ROOT, name);
    assert.ok(existsSync(artifactPath), `Sealed artifact ${name} must exist on disk`);
  }
});

test('Phase A2.3 Gate 2: Final Validation Metrics & Research Acceptance Gates', () => {
  const aggregatePath = path.join(RUN_ROOT, 'validation-aggregate.json');
  const aggregate = JSON.parse(readFileSync(aggregatePath, 'utf-8'));

  assert.equal(aggregate.partition, 'validation');
  assert.equal(aggregate.mode, 'official');
  assert.equal(aggregate.clinical_accuracy, false);

  const policies = aggregate.reports.full_original_partition.overall.policies;
  assert.ok(policies.lexical, 'lexical policy report exists');
  assert.ok(policies['random-eligible'], 'random-eligible policy report exists');
  assert.ok(policies['training-frequency'], 'training-frequency policy report exists');
  assert.ok(policies.ranker, 'ranker policy report exists');

  const rankerMetrics = policies.ranker.metrics;
  const lexicalMetrics = policies.lexical.metrics;
  const randomMetrics = policies['random-eligible'].metrics;
  const freqMetrics = policies['training-frequency'].metrics;

  // Ranker must strictly outperform baselines on recall and yield
  assert.ok(rankerMetrics['macro_recall@10'] > freqMetrics['macro_recall@10'], 'Ranker recall@10 > Frequency');
  assert.ok(rankerMetrics['macro_recall@20'] > freqMetrics['macro_recall@20'], 'Ranker recall@20 > Frequency');
  assert.ok(rankerMetrics['macro_recall@20'] > randomMetrics['macro_recall@20'], 'Ranker recall@20 > Random');
  assert.ok(rankerMetrics['macro_recall@20'] > lexicalMetrics['macro_recall@20'], 'Ranker recall@20 > Lexical');
  assert.ok(rankerMetrics['useful_yield@20'] > freqMetrics['useful_yield@20'], 'Ranker yield@20 > Frequency');

  // Protocol safety guarantees
  assert.equal(rankerMetrics.invalid_rate, 0.0);
  assert.equal(rankerMetrics.repeat_rate, 0.0);
  assert.ok(rankerMetrics.default_rate < 0.05, 'Ranker default rate under 5% budget exhaustion');
  assert.ok(rankerMetrics.unknown_rate < randomMetrics.unknown_rate, 'Ranker unknown rate lower than random');
});

test('Phase A2.3 Gate 3: Fail-Closed Security & Guard Behavior', async () => {
  const app = express();
  registerModelADemo(app, {
    mode: 'development',
    host: '127.0.0.1',
    port: 3000,
    legacyAgentsEnabled: false,
  }, {
    enabled: true,
    token: TOKEN,
    fetchImpl: (async (url, init) => {
      const u = String(url);
      if (u.includes('vocabulary')) {
        return new Response(JSON.stringify({
          schema_version: 'medassist.natural-vocabulary.v1',
          fictional_only: true,
          items: [{
            evidence_id: 'E_201',
            kind: 'symptom',
            data_type: 'B',
            possible_values: [],
            question_en: 'Do you have a cough?',
            initial_allowed: true,
          }],
          coverage: { symptom_fields: 1, universal_coverage: false },
        }));
      }
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
    }) as typeof fetch,
  });

  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;

  async function request(p: string, method = 'GET', headers: Record<string, string> = {}) {
    return new Promise<{ status: number; text: string }>((resolve, reject) => {
      const req = httpRequest({
        host: '127.0.0.1',
        port,
        path: '/api/research/model-a' + p,
        method,
        headers: {
          Host: '127.0.0.1:3000',
          Origin: 'http://127.0.0.1:3000',
          'Content-Type': 'application/json',
          ...headers,
        },
      }, res => {
        let text = '';
        res.on('data', chunk => text += chunk);
        res.on('end', () => resolve({ status: res.statusCode!, text }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  try {
    // 1. Missing or foreign Host / Origin fails closed with 403
    const foreign = await request('/natural/vocabulary', 'GET', { Origin: 'http://attacker.com' });
    assert.equal(foreign.status, 403);

    // 2. Local valid request succeeds
    const ok = await request('/natural/vocabulary', 'GET');
    assert.equal(ok.status, 200);
    const parsed = JSON.parse(ok.text);
    assert.equal(parsed.schema_version, 'medassist.natural-vocabulary.v1');
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('Phase A2.3 Gate 4: End-to-End Pipeline & Emergency Override Precedence', () => {
  // Case A: Emergency statement must escalate immediately and halt Model A questioning
  const emergencyStatement = 'I cannot breathe';
  const safety = evaluateStatement(emergencyStatement);
  assert.equal(safety.status, 'escalate');
  assert.ok(safety.matched_rule_ids.includes('explicit_cannot_breathe'));
  assert.equal(safety.suppress_ordinary_flow, true);
  assert.equal(safety.suppress_self_care, true);

  const emergencyUrgency = evaluateHybridUrgency({
    confirmedSymptoms: ['E_53', 'E_51'],
    selfReportedSeverity: 'extreme',
    age: 45,
    emergencyDetected: true,
    emergencyTrigger: 'explicit_cannot_breathe',
  });
  assert.equal(emergencyUrgency.assessed_urgency, 'extreme');
  assert.equal(emergencyUrgency.emergency_override, true);

  const emergencyPrecautions = evaluatePrecautionsAndSpecialty(emergencyUrgency, { age: 45 });
  assert.equal(emergencyPrecautions.specialty_recommendation.primary_specialty, 'emergency_medicine');
  assert.equal(emergencyPrecautions.specialty_recommendation.emergency_override, true);

  const emergencyFacilities = discoverHealthcareFacilities({
    schema_version: 'medassist.facility-discovery-request.v1',
    consent_granted: true,
    navigation_contract: emergencyPrecautions.facility_navigation_contract,
    manual_locality: 'Hyderabad',
  });
  assert.ok(emergencyFacilities.facilities.length > 0);
  assert.ok(emergencyFacilities.facilities.every(f => f.emergency_capable));

  // Case B: Non-emergent Model A confirmed symptom with self-reported severity
  const nonEmergentUrgency = evaluateHybridUrgency({
    confirmedSymptoms: ['E_201'], // Cough
    selfReportedSeverity: 'medium',
    age: 30,
    emergencyDetected: false,
  });
  assert.equal(nonEmergentUrgency.emergency_override, false);
  assert.notEqual(nonEmergentUrgency.assessed_urgency, 'extreme');
  assert.equal(nonEmergentUrgency.self_reported_severity, 'medium');

  const precautions = evaluatePrecautionsAndSpecialty(nonEmergentUrgency, { age: 30 });
  assert.ok(precautions.symptom_precautions.length > 0);
  assert.ok(precautions.specialty_recommendation.primary_specialty);
});
