import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { request as httpRequest } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createGroqTransport } from '../server/groq-extraction';
import { naturalIdempotency } from '../server/medassist-idempotency';
import { SubmissionLedger, retryAfterMs, friendlyError } from '../src/features/medassist-conversation/reliability';
import { anchors, readProposal, normalizeProposalQuotes, type NaturalVocabulary } from '../src/features/medassist-conversation/natural';
const vocabulary: NaturalVocabulary = { schema_version: 'medassist.natural-vocabulary.v1', fictional_only: true,
  items: Object.keys(anchors).map(evidence_id => ({ evidence_id, kind: 'symptom', data_type: 'B', question_en: anchors[evidence_id].label, possible_values: [], initial_allowed: true })),
  coverage: { symptom_fields: 110, universal_coverage: false } };
const make = (observations: unknown[], unmapped: unknown[] = []) => ({ schema_version: 'medassist.natural-extraction.v1', observations, unmapped, instruction_attempt: false });
const fact = (id: string, quote: string, value: boolean | null = true, state = 'confirmed') => ({ evidence_id: id, quote, value, state });
const output = () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(make([fact('E_201', 'cough')])) } }], usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 } });
const provider = (fetchImpl: typeof fetch) => createGroqTransport({ key: 'fictional-secret', model: 'qwen/qwen3.8-27b', prompt: 'fixture', schema: {}, evaluationHash: 'a'.repeat(64), fetchImpl });

test('synchronous submissions survive double-click, Enter plus Send, rerender and retry with one identity', () => {
  const ledger = new SubmissionLedger(), first = ledger.begin('message')!;
  assert.ok(first.fresh); assert.equal(ledger.begin('message'), null); assert.equal(ledger.begin('other'), null);
  ledger.finish('message', false, first.id);
  const retry = ledger.begin('message')!; assert.equal(retry.id, first.id); assert.equal(retry.fresh, false);
  ledger.finish('message', true, retry.id); assert.equal(ledger.begin('message'), null);
  const previous = ledger.conversationId; ledger.reset(); assert.notEqual(ledger.conversationId, previous);
  const fresh = ledger.begin('message')!; ledger.finish('message', false, first.id);
  assert.equal(ledger.begin('other'), null, 'late prior-session completion cannot unlock the new session');
  assert.notEqual(fresh.id, first.id);
});
test('retry-after seconds and dates are honored; invalid metadata is ignored', () => {
  assert.equal(retryAfterMs('2'), 2000); assert.equal(retryAfterMs('0.25'), 250);
  assert.equal(retryAfterMs('Thu, 01 Jan 1970 00:00:03 GMT', 1000), 2000);
  assert.equal(retryAfterMs('-1'), null); assert.equal(retryAfterMs('untrusted'), null);
});
test('temporary 429 retries once and does not permanently latch the provider', async () => {
  let calls = 0; const p = provider((async () => ++calls === 1 ? new Response('{}', { status: 429, headers: { 'retry-after': '0' } }) : output()) as typeof fetch);
  assert.equal((await p.extractNatural('cough', vocabulary, null)).observations.length, 1);
  assert.equal(calls, 2); assert.deepEqual(p.diagnostics.attempts.map(a => a.status), [429, 200]); assert.equal(p.diagnostics.blocked, null);
});
test('long 429 cooldown makes no immediate retry and carries its exact source', async () => {
  let calls = 0; const p = provider((async () => { calls++; return new Response('{}', { status: 429, headers: { 'retry-after': '60' } }); }) as typeof fetch);
  for (let i = 0; i < 2; i++) await assert.rejects(() => p.extractNatural('cough', vocabulary, null), (e: any) => e.category === 'RATE_LIMITED' && e.retryAfterMs > 59000);
  assert.equal(calls, 1); assert.equal(p.diagnostics.blocked, null);
});
test('authentication, payment and explicit exhausted daily allowance never retry', async () => {
  for (const [status, headers, category] of [[401, {}, 'AUTH_FAILURE'], [403, {}, 'AUTH_FAILURE'], [402, {}, 'QUOTA_EXHAUSTED'], [429, { 'x-ratelimit-remaining-requests': '0' }, 'QUOTA_EXHAUSTED']] as const) {
    let calls = 0; const p = provider((async () => { calls++; return new Response('private-body', { status, headers }); }) as typeof fetch);
    for (let i = 0; i < 2; i++) await assert.rejects(() => p.extractNatural('cough', vocabulary, null), (e: any) => e.category === category);
    assert.equal(calls, 1); assert.ok(!JSON.stringify(p.diagnostics).includes('private-body')); assert.ok(!friendlyError(category).includes(category));
  }
});
test('5xx retry is bounded to two; successful recovery retains safe metadata only', async () => {
  let calls = 0; const p = provider((async () => ++calls === 1 ? new Response('{}', { status: 503, headers: { 'retry-after': '0' } }) : output()) as typeof fetch);
  await p.extractNatural('cough', vocabulary, null); assert.equal(calls, 2); assert.deepEqual(p.diagnostics.attempts[1].usage, { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 });
  assert.ok(!JSON.stringify(p.diagnostics).includes('fictional-secret')); assert.ok(!JSON.stringify(p.diagnostics).includes('cough'));
  calls = 0; const bad = provider((async () => { calls++; return new Response('{}', { status: 500, headers: { 'retry-after': '0' } }); }) as typeof fetch);
  await assert.rejects(() => bad.extractNatural('cough', vocabulary, null), (e: any) => e.category === 'PROVIDER_UNAVAILABLE'); assert.equal(calls, 2);
});
test('invalid JSON, schema mismatch and truncation fail closed without generation retries', async () => {
  for (const response of [new Response('not-json'), Response.json({ choices: [{ message: { content: '{}' } }] }), Response.json({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] })]) {
    let calls = 0; const p = provider((async () => { calls++; return response; }) as typeof fetch);
    await assert.rejects(() => p.extractNatural('cough', vocabulary, null), (e: any) => e.category === 'INVALID_STRUCTURED_OUTPUT'); assert.equal(calls, 1);
  }
});
test('cancelled/timeout request never produces accepted evidence', async () => {
  const c = new AbortController(); c.abort(); let calls = 0;
  const p = provider((async () => { calls++; return output(); }) as typeof fetch);
  await assert.rejects(() => p.extractNatural('cough', vocabulary, null, c.signal), (e: any) => e.category === 'PROVIDER_TIMEOUT'); assert.equal(calls, 0);
});
test('long fictional cases preserve supported facts, unsupported qualifiers, explicit negatives and missing values', () => {
  const cases = [
    ["Hi, I've been coughing for three days. I also have a mild fever and feel tired, especially at night.", make([fact('E_201', "I've been coughing for three days"), fact('E_91', 'I also have a mild fever')], [{ quote: 'feel tired', kind: 'ambiguous' }, { quote: 'three days', kind: 'duration' }])],
    ["I've had stomach pain since yesterday evening. I feel like vomiting, but I haven't actually vomited.", make([fact('E_53', "I've had stomach pain since yesterday evening"), fact('E_148', 'I feel like vomiting')], [{ quote: "I haven't actually vomited", kind: 'unsupported' }])],
    ["My head has been hurting since this morning, and bright lights make it worse. I don't have a fever.", make([fact('E_53', 'My head has been hurting since this morning'), fact('E_91', "I don't have a fever", false)], [{ quote: 'bright lights make it worse', kind: 'unsupported' }])]
  ] as const;
  for (const [text, proposal] of cases) assert.ok(readProposal(proposal, text, vocabulary, null));
  const source = "I have a cough but I don't have a fever";
  const broad = make([fact('E_201', source), fact('E_91', "I don't have a fever", false)]);
  assert.equal(readProposal(broad, source, vocabulary, null), null);
  assert.ok(readProposal(normalizeProposalQuotes(broad), source, vocabulary, null));
  assert.equal(readProposal(make([fact('E_91', 'fever')]), 'no cough and fever', vocabulary, null), null);
  assert.ok(readProposal(make([fact('E_201', 'not sure about cough', null, 'unknown')]), 'not sure about cough', vocabulary, null));
});
test('recorded qualified-vomiting mismatch is quarantined without changing pain, nausea or polarity', () => {
  const text = "I've had stomach pain since yesterday evening. I feel like vomiting, but I haven't actually vomited.";
  const raw = make([fact('E_53', "I've had stomach pain since yesterday evening"), fact('E_148', 'I feel like vomiting'), fact('E_211', "I haven't actually vomited", false)]);
  assert.equal(readProposal(raw, text, vocabulary, null), null);
  const normalized = readProposal(normalizeProposalQuotes(raw), text, vocabulary, null)!;
  assert.ok(normalized); assert.deepEqual(normalized.observations.map(o => o.evidence_id), ['E_53', 'E_148']);
  assert.deepEqual(normalized.unmapped, [{ quote: "I haven't actually vomited", kind: 'unsupported' }]);
  const hallucination = make([fact('E_211', "I haven't actually vomited", true)]);
  assert.equal(readProposal(normalizeProposalQuotes(hallucination), text, vocabulary, null), null);
  const injected = make([{ ...fact('E_211', "I haven't actually vomited", false), diagnosis: 'forbidden' }]);
  assert.equal(readProposal(normalizeProposalQuotes(injected), text, vocabulary, null), null);
  const falseQuote = make([fact('E_211', 'no vomiting', false)]);
  assert.equal(readProposal(normalizeProposalQuotes(falseQuote), text, vocabulary, null), null);
  const explicit = "I haven't had a fever";
  assert.ok(readProposal(make([fact('E_91', explicit, false)]), explicit, vocabulary, null));
});
test('HTTP replay coalesces overlap and completed successes; conflicts and failures cannot commit twice', async () => {
  const app = express(); app.use(express.json(), naturalIdempotency()); let calls = 0, fail = false;
  app.post('/natural/interview', async (_req, res) => { calls++; await new Promise(r => setTimeout(r, 20)); res.status(fail ? 504 : 200).json(fail ? { error: 'PROVIDER_TIMEOUT' } : { accepted: true }); });
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const port = (server.address() as { port: number }).port, conversation = randomUUID();
  const post = (id: string, text = 'fictional') => new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port, path: '/natural/interview', method: 'POST', headers: { 'content-type': 'application/json', 'X-Conversation-ID': conversation, 'X-Request-ID': id } }, res => {
      let body = ''; res.on('data', chunk => body += chunk); res.on('end', () => resolve({ status: res.statusCode!, body }));
    }); req.on('error', reject); req.end(JSON.stringify({ text }));
  });
  try {
    const id = randomUUID(), replies = await Promise.all([post(id), post(id)]);
    assert.deepEqual(replies.map(r => r.status), [200, 200]); assert.equal(calls, 1);
    assert.equal((await post(id)).status, 200); assert.equal(calls, 1);
    assert.equal((await post(id, 'different')).status, 409); assert.equal(calls, 1);
    fail = true; const retry = randomUUID(); assert.equal((await post(retry)).status, 504);
    fail = false; assert.equal((await post(retry)).status, 200); assert.equal((await post(retry)).status, 200); assert.equal(calls, 3);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
