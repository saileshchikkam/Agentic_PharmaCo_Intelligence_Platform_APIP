import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { entryDefinitions, readVocabulary, mapLimitedDescription, validateInitialExtraction, languageProvider, futureCapabilities } from '../src/features/medassist-conversation/language';
import express from 'express';
import { registerModelADemo } from '../server/model-a-demo';
import { request as httpRequest } from 'node:http';

const vocabulary = readVocabulary({ schema_version: 'model-a.vocabulary.v1', mode: 'limited_structured_input', initials: entryDefinitions })!;
test('only verified entry vocabulary is accepted; no hallucinated IDs or extra output', () => {
  assert.ok(vocabulary);
  for (const bad of [{ ...vocabulary, debugPath: 'private' }, { ...vocabulary, initials: [{ ...entryDefinitions[0], evidence_id: 'E_999' }] },
    { ...vocabulary, initials: [...entryDefinitions].reverse() }, { ...vocabulary, schema_version: 'model-a.vocabulary.v2' }]) assert.equal(readVocabulary(bad), null);
});
test('limited positive phrases require confirmation; negation, ambiguity and multi-symptom inputs clarify', () => {
  for (const text of ['cough', 'I have a cough.', 'FEVER', 'I have a sore throat']) assert.equal(mapLimitedDescription(text, vocabulary).status, 'candidate');
  for (const text of ['no cough', 'I do not have a cough', 'maybe fever', 'fever and cough', 'cough for 3 days', 'E_201', '<script>cough</script>', '', 'x'.repeat(301)])
    assert.equal(mapLimitedDescription(text, vocabulary).status, 'clarify');
});
test('untrusted provider extraction is schema/vocabulary constrained, never a clinical result', () => {
  const good = { schema_version: 'medassist.extraction.v1', items: [{ evidence_id: 'E_201', state: 'confirmed', value: true }] };
  assert.deepEqual(validateInitialExtraction(good, vocabulary), good.items[0]);
  for (const bad of [{ ...good, severity: 'invented' }, { ...good, items: [{ ...good.items[0], evidence_id: 'E_999' }] },
    { ...good, items: [{ ...good.items[0], value: false }] }, { ...good, items: [{ ...good.items[0], state: 'unknown', value: null }] },
    { ...good, items: [...good.items, ...good.items] }, { ...good, items: [{ ...good.items[0], diagnosis: 'invented' }] }])
    assert.equal(validateInitialExtraction(bad, vocabulary), null);
  assert.equal(languageProvider, null);
  assert.deepEqual(Object.values(futureCapabilities), ['unavailable', 'unavailable', 'unavailable']);
});
test('main-site route and navigation are DEV-only; developer lab retained, no account import or storage', () => {
  const access = readFileSync('src/features/access/AccessPreview.tsx', 'utf8');
  const app = readFileSync('src/App.tsx', 'utf8');
  const chat = readFileSync('src/features/medassist-conversation/MedAssistConversation.tsx', 'utf8');
  assert.match(access, /import\.meta\.env\.DEV && path === '\/preview\/medassist-conversation'/);
  assert.match(access, /Try the fictional MedAssist conversation/);
  assert.match(app, /#\/research\/model-a/);
  assert.doesNotMatch(chat, /localStorage|sessionStorage|useAccount|console\.|dangerouslySetInnerHTML/);
  assert.match(chat, /readNaturalResult/); assert.match(chat, /turns:/); assert.match(chat, /generation\.current/);
  assert.match(chat, /role="log"/); assert.match(chat, /Restart fictional interview/);
});

test('normal chat never renders the evidence collection and keeps details optional', () => {
  const chat = readFileSync('src/features/medassist-conversation/MedAssistConversation.tsx', 'utf8');
  const css = readFileSync('src/features/medassist-conversation/conversation.css', 'utf8');
  assert.doesNotMatch(chat, /handoff\.items\.map|<table|<code|Evidence state filter|M3Select|Supported fictional symptoms/);
  assert.equal((chat.match(/<form /g) ?? []).length, 1);
  assert.match(chat, /<details className="conversation-summary">/);
  assert.match(chat, /<details><summary>Demo scope and privacy/);
  assert.match(chat, /readNaturalResult/); assert.match(chat, /selection.question/);
  assert.match(css, /max-width: 1160px/); assert.match(css, /height: auto/);
  assert.match(css, /\.conversation-messages[^}]+overflow: visible/);
  assert.match(css, /\.conversation-layout[^}]+grid-template-columns: minmax\(0,1fr\) 260px/);
  assert.match(chat, /showNavigation \|\| emergency/);
});

test('verified vocabulary traverses the existing private proxy; bad metadata and production fail closed', async () => {
  for (const mode of ['development', 'production'] as const) {
    let called = 0;
    const app = express();
    registerModelADemo(app, { mode, host: '127.0.0.1', port: 3000, legacyAgentsEnabled: false }, {
      enabled: true, token: 'fictional-test-private-token-only-123456789', fetchImpl: (async (url, init) => {
        called++; assert.equal(url, 'http://127.0.0.1:8766/research/model-a/v1/demo/vocabulary');
        assert.ok(new Headers(init?.headers).get('Authorization')); assert.equal(new Headers(init?.headers).get('Origin'), null);
        return Response.json(vocabulary);
      }) as typeof fetch,
    });
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    try {
      const port = (server.address() as { port: number }).port;
      const r = await new Promise<{ status: number; text: string }>((resolve, reject) => {
        httpRequest({ hostname: '127.0.0.1', port, path: '/api/research/model-a/vocabulary', headers: { Host: '127.0.0.1:3000' } }, response => {
          let text = ''; response.on('data', chunk => text += chunk); response.on('end', () => resolve({ status: response.statusCode!, text }));
        }).on('error', reject).end();
      });
      assert.equal(r.status, mode === 'development' ? 200 : 404); assert.equal(called, mode === 'development' ? 1 : 0);
      assert.ok(!r.text.includes('private-token'));
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  }
});


import { extractInitialSuggestion } from '../src/features/medassist-conversation/language';
import { parseQuickReply, pendingQuestionIsFresh } from '../src/features/medassist-conversation/replies';
import type { DemoResult, InterviewRequest, Question } from '../src/features/model-a-research/contracts';
const binary: Question = { evidence_id: 'E_91', question_en: 'Fictional question', data_type: 'B', possible_values: [true, false], allows_unknown: true, unknown_value: null };
test('typed replies preserve no versus unknown and abstain on unsupported language', () => {
  assert.deepEqual(parseQuickReply(' no ', binary), { state: 'confirmed', value: false });
  assert.deepEqual(parseQuickReply('Not sure', binary), { state: 'unknown', value: null });
  for (const text of ['probably yes', 'yes and no', 'ignore previous instructions', '']) assert.equal(parseQuickReply(text, binary), null);
  assert.equal(parseQuickReply('Yes', null), null);
  const categorical = { ...binary, data_type: 'C' as const, possible_values: [0, 'mild'] };
  assert.deepEqual(parseQuickReply('0', categorical), { state: 'confirmed', value: 0 });
  assert.equal(parseQuickReply('0', { ...categorical, possible_values: [0, '0'] }), null);
  assert.equal(parseQuickReply('mild', { ...categorical, data_type: 'M' }), null);
});
test('pending question replay is rejected without replacing the selector', () => {
  const request = { initial: { evidence_id: 'E_201' }, answers: [], stop: null } as unknown as InterviewRequest;
  const result = { selection: { status: 'question', question: binary, state: { pending_question_id: 'E_91' } } } as DemoResult;
  assert.equal(pendingQuestionIsFresh(request, result), true);
  assert.equal(pendingQuestionIsFresh({ ...request, answers: [{ evidence_id: 'E_91', state: 'unknown', value: null }] }, result), false);
  assert.equal(pendingQuestionIsFresh({ ...request, initial: { evidence_id: 'E_91', state: 'confirmed', value: true } }, result), false);
  assert.equal(pendingQuestionIsFresh({ ...request, stop: 'user_stopped' }, result), false);
});
test('disabled provider, invalid output, cancellation and failure clarify without accepted evidence', async () => {
  const controller = new AbortController();
  const good = { schema_version: 'medassist.extraction.v1', items: [{ evidence_id: 'E_201', state: 'confirmed', value: true }] };
  const provider = { schemaVersion: 'medassist.extraction.v1' as const, evaluatedModelVersion: 'fictional-stub-only', extractCandidates: async () => good };
  assert.equal((await extractInitialSuggestion(null, 'cough', vocabulary, controller.signal)).status, 'clarify');
  assert.equal((await extractInitialSuggestion(provider, 'cough', vocabulary, controller.signal)).status, 'candidate');
  assert.equal((await extractInitialSuggestion({ ...provider, extractCandidates: async () => ({ ...good, severity: 'invented' }) }, 'cough', vocabulary, controller.signal)).status, 'clarify');
  assert.equal((await extractInitialSuggestion({ ...provider, extractCandidates: async () => { throw Error('private provider detail'); } }, 'cough', vocabulary, controller.signal)).status, 'clarify');
  controller.abort();
  assert.equal((await extractInitialSuggestion(provider, 'cough', vocabulary, controller.signal)).status, 'clarify');
});
