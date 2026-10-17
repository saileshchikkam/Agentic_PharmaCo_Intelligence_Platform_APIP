import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import type { Request, Response as ExpressResponse } from 'express';
import { createMedAssistHandler, isLocalRequest, validateIntake, validateQuotes } from '../server/medassist';
import { hospitalSearchUrl, readSuggestions } from '../src/features/medassist/flow';

const intake = {
  fictionalOnly: true, language: 'en',
  answers: { concern: 'Fictional person reports a cough, not chest pain.', duration: 'Since yesterday', impact: null, changes: 'No change' },
};
const quotes = { concern: 'a cough, not chest pain', duration: 'Since yesterday', impact: null, changes: 'No change' };
const goodFetch = (async () => new Response(JSON.stringify({ message: { content: JSON.stringify(quotes) } }))) as typeof fetch;

function context(body: unknown = intake, origin: string | undefined = 'http://localhost:3000', address = '127.0.0.1') {
  const req = { body, socket: { remoteAddress: address }, get: () => origin, is: () => 'application/json' } as unknown as Request;
  const output = { status: 200, body: null as any, headers: {} as Record<string, string> };
  const res = Object.assign(new EventEmitter(), {
    writableEnded: false,
    setHeader(name: string, value: string) { output.headers[name] = value; },
    status(code: number) { output.status = code; return res; },
    json(value: unknown) { output.body = value; res.writableEnded = true; return res; },
  });
  return { req, res: res as unknown as ExpressResponse, output };
}

test('intake requires explicit fictional scope, bounded values, and exact fields', () => {
  assert.deepEqual(validateIntake(intake), intake);
  assert.equal(validateIntake({ ...intake, fictionalOnly: false }), null);
  assert.equal(validateIntake({ ...intake, language: 'xx' }), null);
  assert.equal(validateIntake({ ...intake, answers: { ...intake.answers, concern: ' ' } }), null);
  assert.equal(validateIntake({ ...intake, answers: { ...intake.answers, concern: 'x'.repeat(1201) } }), null);
  assert.equal(validateIntake({ ...intake, answers: { ...intake.answers, urgency: 'low' } }), null);
});

test('quotes preserve negation and language; unknowns and added facts are rejected', () => {
  assert.deepEqual(validateQuotes(quotes, intake.answers), quotes);
  assert.equal(validateQuotes({ ...quotes, concern: 'chest discomfort' }, intake.answers), null);
  assert.equal(validateQuotes({ ...quotes, impact: 'mild' }, intake.answers), null);
  assert.equal(validateQuotes({ ...quotes, urgency: 'low' }, intake.answers), null);
  const te = { ...intake.answers, concern: 'కల్పిత వ్యక్తికి దగ్గు ఉంది; chest pain లేదు.' };
  assert.ok(validateQuotes({ ...quotes, concern: te.concern }, te));
});

test('remote clients and unrelated browser origins cannot use local inference', () => {
  assert.ok(isLocalRequest('::ffff:127.0.0.1', 'http://localhost:3000'));
  assert.equal(isLocalRequest('192.168.1.20', 'http://localhost:3000'), false);
  assert.equal(isLocalRequest('127.0.0.1', 'https://unrelated.example'), false);
});

test('successful endpoint uses one bounded local provider and returns no clinical assessment', async () => {
  let called = false;
  const handler = createMedAssistHandler({ fetchImpl: (async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:11434/api/chat');
    const body = JSON.parse(options!.body as string);
    assert.equal(body.stream, false);
    assert.equal(body.options.temperature, 0);
    assert.equal(body.keep_alive, 0);
    assert.equal(body.format.additionalProperties, false);
    called = true;
    return goodFetch(url, options);
  }) as typeof fetch });
  const { req, res, output } = context();
  await handler(req, res);
  assert.ok(called);
  assert.equal(output.status, 200);
  assert.deepEqual(output.body.suggestions, quotes);
  assert.equal(output.body.assessment.urgency, 'not_assessed');
  assert.equal(output.headers['Cache-Control'], 'no-store');
});

test('invalid and cross-origin requests never call the provider', async () => {
  let count = 0;
  const handler = createMedAssistHandler({ fetchImpl: (async () => { count++; throw Error(); }) as typeof fetch });
  for (const ctx of [context({ ...intake, fictionalOnly: false }), context(intake, 'https://unrelated.example')]) {
    await handler(ctx.req, ctx.res);
    assert.ok([400, 403].includes(ctx.output.status));
  }
  assert.equal(count, 0);
});

test('unsupported or malformed model output is rejected instead of falling back', async () => {
  for (const content of ['broken json', JSON.stringify({ ...quotes, concern: 'a diagnosis' }), JSON.stringify({ ...quotes, urgency: 'low' })]) {
    const handler = createMedAssistHandler({ fetchImpl: (async () => new Response(JSON.stringify({ message: { content } }))) as typeof fetch });
    const { req, res, output } = context();
    await handler(req, res);
    assert.equal(output.status, 502);
    assert.equal(output.body.error.code, 'INVALID_MODEL_OUTPUT');
    assert.equal(output.body.suggestions, undefined);
  }
});

test('timeouts abort provider work and release the concurrency slot', async () => {
  const handler = createMedAssistHandler({ timeoutMs: 10, fetchImpl: ((_url, options) => new Promise((_resolve, reject) => {
    options!.signal!.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
  })) as typeof fetch });
  for (let i = 0; i < 2; i++) {
    const { req, res, output } = context();
    await handler(req, res);
    assert.equal(output.status, 504);
    assert.equal(output.body.error.code, 'MODEL_TIMEOUT');
  }
});

test('provider failures remain explicit with no cloud call or fabricated result', async () => {
  let calls = 0;
  const handler = createMedAssistHandler({ fetchImpl: (async () => { calls++; return new Response('unavailable', { status: 503 }); }) as typeof fetch });
  const { req, res, output } = context();
  await handler(req, res);
  assert.equal(calls, 1);
  assert.equal(output.status, 503);
  assert.equal(output.body.error.code, 'MODEL_UNAVAILABLE');
  assert.equal(output.body.suggestions, undefined);
});

test('concurrent requests are rejected while an existing request completes', async () => {
  let release!: (response: Response) => void;
  const handler = createMedAssistHandler({ fetchImpl: (() => new Promise((resolve) => { release = resolve; })) as typeof fetch });
  const first = context();
  const pending = handler(first.req, first.res);
  const second = context(); await handler(second.req, second.res);
  assert.equal(second.output.body.error.code, 'MODEL_BUSY');
  release(await goodFetch('http://localhost')); await pending;
  assert.equal(first.output.status, 200);
});

test('local calls are limited to six per minute and recover after the window', async () => {
  let clock = 100;
  const handler = createMedAssistHandler({ fetchImpl: goodFetch, now: () => clock });
  for (let i = 0; i < 6; i++) { const c = context(); await handler(c.req, c.res); assert.equal(c.output.status, 200); }
  const limited = context(); await handler(limited.req, limited.res);
  assert.equal(limited.output.body.error.code, 'RATE_LIMITED');
  clock += 61000;
  const next = context(); await handler(next.req, next.res); assert.equal(next.output.status, 200);
});

test('Maps uses only the explicit location; arbitrary input stays encoded in a fixed HTTPS URL', () => {
  const url = new URL(hospitalSearchUrl('విజయవాడ & hospital=other')!);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('query'), 'hospitals near విజయవాడ & hospital=other');
  assert.equal(url.searchParams.size, 2);
  assert.equal(hospitalSearchUrl(' '), null);
  assert.equal(hospitalSearchUrl('x'.repeat(181)), null);
});

test('the client also rejects hallucinated quotes and unsupported provider results', () => {
  assert.ok(readSuggestions({ suggestions: quotes, model: 'qwen3.5:2b', provider: 'ollama-local' }, intake.answers));
  assert.equal(readSuggestions({ suggestions: { ...quotes, impact: 'fine' }, model: 'x', provider: 'ollama-local' }, intake.answers), null);
  assert.equal(readSuggestions({ suggestions: quotes, model: 'x', provider: 'cloud' }, intake.answers), null);
});
