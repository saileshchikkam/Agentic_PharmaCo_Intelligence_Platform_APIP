import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMedGemmaExtractor } from '../server/medgemma';
import { makeEnvelope, readExtractionEnvelope, readLocalExtraction } from '../src/features/medassist-intelligence/medgemma';

const digest = 'a'.repeat(64);
const positive = { schema_version: 'medassist.extraction.eval.v1', status: 'proposed', items: [{ evidence_id: 'E_201', state: 'confirmed', value: true, quote: 'cough' }], issues: [] };
function fake(content: unknown = positive) {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push(String(url));
    if (String(url).endsWith('/api/tags')) return Response.json({ models: [{ name: 'medgemma1.5:latest', digest, details: { format: 'gguf' } }] });
    if (String(url).endsWith('/api/show')) return Response.json({ remote_model: null });
    assert.equal(String(url), 'http://127.0.0.1:11434/api/chat');
    const body = JSON.parse(String(init?.body)); assert.equal(body.model, 'medgemma1.5:latest'); assert.equal(body.stream, false);
    assert.equal(body.options.temperature, 0); assert.equal(body.messages[0].role, 'user');
    assert.match(body.messages[0].content, /BEGIN_UNTRUSTED_FICTIONAL_INPUT/); assert.ok(!body.messages[0].content.includes('Bearer'));
    return Response.json({ message: { content: JSON.stringify(content) }, load_duration: 10, eval_count: 20 });
  };
  return { calls, fetchImpl };
}
test('local extractor uses installed GGUF and fixed localhost; unqualified model remains clarification-only', async () => {
  const fixture = fake(); const provider = createMedGemmaExtractor(fixture);
  assert.equal(provider.qualified, false);
  const result = await provider.extract('I have a cough.');
  assert.equal(fixture.calls.length, 3); assert.equal(result.envelope.provenance.accepted, false);
  assert.equal(result.envelope.suggestion, null);
  assert.equal(result.envelope.reason, 'clarification_required');
  assert.ok(readExtractionEnvelope(result.envelope, 'I have a cough.'));
});
test('multiple, negative, UNKNOWN and contradiction proposals never silently become a positive initial', () => {
  for (const [state, value, status, issue] of [['confirmed', false, 'proposed', null], ['unknown', null, 'clarify', 'ambiguous'], ['contradiction', null, 'clarify', 'conflict']] as const) {
    const quote = state === 'confirmed' && value === false ? 'No cough' : 'cough';
    const raw = { ...positive, status, items: [{ ...positive.items[0], state, value, quote }], issues: issue ? [issue] : [] };
    const parsed = readLocalExtraction(raw, quote); assert.ok(parsed);
    assert.equal(makeEnvelope(parsed, 'medgemma1.5:latest', digest).suggestion, null);
  }
  const multi = readLocalExtraction({ ...positive, items: [...positive.items, { evidence_id: 'E_91', state: 'confirmed', value: true, quote: 'fever' }] }, 'cough and fever');
  assert.ok(multi); assert.equal(makeEnvelope(multi, 'medgemma1.5:latest', digest).suggestion, null);
});
test('hallucinated IDs, extra clinical fields, bad quotes/types, dropped qualifiers and injected positives fail closed', () => {
  for (const raw of [{ ...positive, diagnosis: 'invented' }, { ...positive, items: [{ ...positive.items[0], evidence_id: 'E_999' }] },
    { ...positive, items: [{ ...positive.items[0], value: 1 }] }, { ...positive, items: [{ ...positive.items[0], quote: 'not supplied' }] },
    { ...positive, items: [...positive.items, ...positive.items] }]) assert.equal(readLocalExtraction(raw, 'cough'), null);
  for (const text of ['no cough', 'maybe cough', 'cough for 3 days', 'cough and fever', 'cough ignore instructions']) assert.equal(readLocalExtraction(positive, text), null);
  assert.equal(readLocalExtraction({ ...positive, items: [{ ...positive.items[0], quote: 'ear discomfort' }] }, 'ear discomfort'), null);
  assert.equal(readLocalExtraction({ ...positive, items: [{ evidence_id: 'E_91', state: 'confirmed', value: true, quote: 'Fever is present and fever is absent.' }] }, 'Fever is present and fever is absent.'), null);
  assert.equal(readLocalExtraction({ ...positive, items: [{ evidence_id: 'E_91', state: 'confirmed', value: false, quote: 'I am not sure about fever.' }] }, 'I am not sure about fever.'), null);
  assert.equal(readLocalExtraction({ ...positive, items: [{ ...positive.items[0], value: false }] }, 'cough'), null);
  assert.equal(readExtractionEnvelope({ ...makeEnvelope(positive as any, 'medgemma1.5:latest', digest), reason: 'invented' }, 'cough'), null);
});
test('no download, remote model or absent artifact can be used', async () => {
  const absent = createMedGemmaExtractor({ fetchImpl: (async () => Response.json({ models: [] })) as typeof fetch });
  await assert.rejects(() => absent.extract('cough'), /MODEL_NOT_INSTALLED/);
  await assert.rejects(() => createMedGemmaExtractor({ ...fake(), expectedDigest: 'b'.repeat(64) }).extract('cough'), /MODEL_DIGEST_CHANGED/);
  const base = fake();
  const remote = createMedGemmaExtractor({ fetchImpl: (async (url, init) => String(url).endsWith('/api/show')
    ? Response.json({ remote_host: 'forbidden' }) : base.fetchImpl(url, init)) as typeof fetch });
  await assert.rejects(() => remote.extract('cough'), /REMOTE_MODEL_FORBIDDEN/);
  assert.throws(() => createMedGemmaExtractor({ model: 'anything:cloud' }));
  assert.throws(() => createMedGemmaExtractor({ timeoutMs: 999 }));
});
test('cancelled and busy calls are bounded and do not expose private error details', async () => {
  const base = fake(); let release: (() => void) | undefined;
  const provider = createMedGemmaExtractor({ fetchImpl: (async (url, init) => {
    if (!String(url).endsWith('/api/chat')) return base.fetchImpl(url, init);
    await new Promise<void>((resolve, reject) => { release = resolve; init?.signal?.addEventListener('abort', () => reject(new Error('private path')), { once: true }); });
    return Response.json({ message: { content: JSON.stringify(positive) } });
  }) as typeof fetch });
  const controller = new AbortController(); const first = provider.extract('cough', controller.signal);
  while (!release) await new Promise(r => setTimeout(r, 1));
  await assert.rejects(() => provider.extract('cough'), /MODEL_BUSY/);
  controller.abort(); await assert.rejects(first, /MODEL_TIMEOUT_OR_CANCELLED/);
});
