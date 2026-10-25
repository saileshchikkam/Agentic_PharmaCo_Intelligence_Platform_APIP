import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import express from 'express';
import { registerModelADemo } from '../server/model-a-demo';
import { createGroqTransport } from '../server/groq-extraction';
import { readDemoResult, readFixtures, readHandoff, readRequest, type DemoResult, type InterviewRequest } from '../src/features/model-a-research/contracts';
import { appendAnswer, endInterview, exportEvidence } from '../src/features/model-a-research/flow';

const token = 'fictional-unit-test-token-not-a-secret-1234';
const request: InterviewRequest = { schema_version: 'model-a.request.v1', fictional_case: true, context: { age: 35, source_sex: 'F' },
  initial: { evidence_id: 'E_0', state: 'confirmed', value: true }, answers: [], stop: null };
const result: DemoResult = { schema_version: 'model-a.demo.v1', selection: {
  schema_version: 'model-a.response.v1', research_only: true, status: 'question', reason: null,
  question: { evidence_id: 'E_53', question_en: 'Authored software question?', data_type: 'B', possible_values: [], allows_unknown: true, unknown_value: null },
  state: { answered_question_ids: [], pending_question_id: 'E_53', questions_answered: 0, remaining_budget: 20, stopping_reason: null },
  evidence: { schema_version: 'model-a.evidence.v1', origin: 'developer_fictional_fixture', context: request.context, initial: request.initial,
    answers: [], unobserved_semantics: 'unknown_not_negative', human_clinical_review: false }, limitations: ['Fictional software fixture only.'] },
  handoff: { schema_version: 'model-a-to-b.evidence.v1', research_only: true, intended_use: 'fictional_demo_evidence_only', producer: 'model-a.adapter.v1',
    protocol_id: 'medassist-v2-adaptive-questioning-v1', context: request.context, context_origin: 'developer_fictional_fixture', initial_evidence_id: 'E_0',
    items: [{ evidence_id: 'E_0', data_type: 'B', status: 'observed_positive', value: true, unsupported_reason: null,
      provenance: { source: 'developer_fictional_fixture', disclosure: 'initial', turn: 0 } },
    { evidence_id: 'E_53', data_type: 'B', status: 'not_asked', value: null, unsupported_reason: null,
      provenance: { source: 'not_disclosed', disclosure: 'none', turn: null } }],
    missing_item_semantics: 'unspecified_never_negative', model_b_status: 'not_enabled', human_clinical_review: false } };
const fixtures = { schema_version: 'model-a.fixtures.v1', fictional_only: true, fixtures: [{ fixture_id: 'unit', label: 'Authored fixture', request }] };

test('versioned transport, request defaults, export and disabled Model B', () => {
  assert.ok(readRequest(request)); assert.ok(readFixtures(fixtures)); assert.ok(readDemoResult(result));
  assert.equal(readRequest({ ...request, context: { age: null, source_sex: 'F' } }), null);
  assert.equal(readRequest({ ...request, fictional_case: 1 }), null);
  assert.equal(readDemoResult({ ...result, debugPath: 'private' }), null);
  assert.equal(readHandoff({ ...result.handoff, severity: 'invented' }), null);
  const exported = JSON.parse(exportEvidence(result));
  assert.equal(exported.schema_version, 'model-a-to-b.evidence.v1'); assert.equal(exported.model_b_status, 'not_enabled');
  assert.equal(exported.items[1].status, 'not_asked'); assert.equal(exported.items[1].value, null);
});

test('answer transitions preserve false/UNKNOWN, prevent repeats, end interview', () => {
  const negative = appendAnswer(request, result, 'confirmed', false);
  const unknown = appendAnswer(request, result, 'unknown', null);
  assert.equal(negative.answers[0].value, false); assert.equal(unknown.answers[0].value, null);
  assert.equal(unknown.answers[0].state, 'unknown'); assert.equal(request.answers.length, 0);
  assert.throws(() => appendAnswer(negative, result, 'confirmed', true));
  assert.throws(() => appendAnswer(request, result, 'unknown', false));
  assert.throws(() => appendAnswer(endInterview(request), result, 'confirmed', true));
  assert.equal(appendAnswer(request, result, 'contradiction', null).answers[0].state, 'contradiction');
});

test('typed categorical and multichoice controls do not coerce values or drop empty sets', () => {
  const c = structuredClone(result); c.selection.question!.data_type = 'C'; c.selection.question!.possible_values = [0, 'NA'];
  assert.equal(appendAnswer(request, c, 'confirmed', 0).answers[0].value, 0);
  assert.throws(() => appendAnswer(request, c, 'confirmed', '0'));
  const m = structuredClone(c); m.selection.question!.data_type = 'M';
  assert.deepEqual(appendAnswer(request, m, 'confirmed', []).answers[0].value, []);
  assert.deepEqual(appendAnswer(request, m, 'confirmed', [0, 'NA']).answers[0].value, [0, 'NA']);
  assert.throws(() => appendAnswer(request, m, 'confirmed', [0, 0]));
});

async function listen(options: Parameters<typeof registerModelADemo>[2], mode: 'development' | 'production' = 'development') {
  const app = express(); registerModelADemo(app, { mode, host: '127.0.0.1', port: 3000, legacyAgentsEnabled: false }, options);
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const port = (server.address() as { port: number }).port;
  async function send(path = '/interview', body = JSON.stringify(request), headers: Record<string, string> = {}, method = 'POST') {
    return new Promise<{ status: number; text: string }>((resolve, reject) => {
      const req = httpRequest({ host: '127.0.0.1', port, path: '/api/research/model-a' + path, method,
        headers: { Host: '127.0.0.1:3000', Origin: 'http://127.0.0.1:3000', 'Content-Type': 'application/json', ...headers } }, res => {
        let text = ''; res.on('data', chunk => text += chunk); res.on('end', () => resolve({ status: res.statusCode!, text }));
      }); req.on('error', reject); req.end(method === 'GET' ? undefined : body);
    });
  }
  return { send, close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
}

test('local proxy calls fixed adapter, keeps token server-side, validates response', async () => {
  let calls = 0;
  const fetchImpl = (async (url, init) => {
    calls++; assert.match(String(url), /^http:\/\/127\.0\.0\.1:8766\/research\/model-a\/v1\/demo\//);
    assert.equal((init!.headers as Record<string, string>).Authorization, `Bearer ${token}`);
    assert.equal((init!.headers as Record<string, string>).Origin, undefined);
    return new Response(JSON.stringify(String(url).endsWith('fixtures') ? fixtures : result));
  }) as typeof fetch;
  const api = await listen({ enabled: true, token, fetchImpl });
  try {
    const reply = await api.send(); assert.equal(reply.status, 200); assert.ok(readDemoResult(JSON.parse(reply.text))); assert.ok(!reply.text.includes(token));
    assert.equal((await api.send('/fixtures', '', {}, 'GET')).status, 200);
    assert.equal((await api.send('/interview', '{}')).status, 422);
    assert.equal((await api.send('/interview', JSON.stringify(request), { Origin: 'http://attacker.example' })).status, 403);
    assert.equal((await api.send('/interview', JSON.stringify(request), { Host: 'attacker.example' })).status, 403);
    assert.equal(calls, 2);
  } finally { await api.close(); }
});

test('production, disabled and missing-token routes never contact adapter', async () => {
  for (const [mode, enabled, secret] of [['production', true, token], ['development', false, token], ['development', true, '']] as const) {
    const api = await listen({ enabled, token: secret, fetchImpl: (() => { throw new Error('must_not_fetch'); }) as typeof fetch }, mode);
    try { assert.equal((await api.send()).status, 404); } finally { await api.close(); }
  }
});

test('overlapping fixture reads do not consume the inference slot', async () => {
  const api = await listen({ enabled: true, token, fetchImpl: (async () => {
    await new Promise(resolve => setTimeout(resolve, 10)); return new Response(JSON.stringify(fixtures));
  }) as typeof fetch });
  try {
    const replies = await Promise.all([api.send('/fixtures', '', {}, 'GET'), api.send('/fixtures', '', {}, 'GET')]);
    assert.deepEqual(replies.map(reply => reply.status), [200, 200]);
  } finally { await api.close(); }
});

test('unavailable, corrupted/private, oversized and timed-out adapter fail closed', async () => {
  for (const fetchImpl of [
    (async () => new Response('private-backend-path', { status: 503 })),
    (async () => new Response(JSON.stringify({ ...result, privatePath: 'must-not-echo' }))),
    (async () => new Response('x'.repeat(262145))),
  ] as typeof fetch[]) {
    const api = await listen({ enabled: true, token, fetchImpl });
    try { const reply = await api.send(); assert.ok([502, 503].includes(reply.status)); assert.ok(!reply.text.includes('private')); } finally { await api.close(); }
  }
  const api = await listen({ enabled: true, token, timeoutMs: 5, fetchImpl: ((_url, init) => new Promise((_resolve, reject) => {
    init!.signal!.addEventListener('abort', () => reject(new Error('abort')), { once: true });
  })) as typeof fetch });
  try { assert.equal((await api.send()).status, 504); } finally { await api.close(); }
});

test('an unqualified installed model cannot trigger live language generation or initial evidence', async () => {
  const before = process.env.APIP_ENABLE_MEDGEMMA;
  process.env.APIP_ENABLE_MEDGEMMA = '1';
  const api = await listen({ enabled: true, token, fetchImpl: (async () => { throw Error('adapter must not run'); }) as typeof fetch });
  try {
    const reply = await api.send('/extract', JSON.stringify({schema_version:'medassist.extract-request.v1',fictional_only:true,text:'I have a cough.'}));
    assert.equal(reply.status,422); assert.equal(JSON.parse(reply.text).error,'LOCAL_LANGUAGE_NOT_QUALIFIED');
  } finally { await api.close(); if (before === undefined) delete process.env.APIP_ENABLE_MEDGEMMA; else process.env.APIP_ENABLE_MEDGEMMA=before; }
});

test('failed explicit Groq qualification never falls back or returns private startup details', async () => {
  const before=process.env.APIP_ENABLE_GROQ_MODEL_A;process.env.APIP_ENABLE_GROQ_MODEL_A='1';let constructed=0;
  const api=await listen({enabled:true,token,cloudFactory:()=>{constructed++;throw Error('private-backend-configuration');}});
  try{
    const reply=await api.send('/extract',JSON.stringify({schema_version:'medassist.extract-request.v1',fictional_only:true,text:'fictional cough'}));
    assert.equal(constructed,1);assert.equal(reply.status,503);assert.ok(!reply.text.includes('private'));
  }finally{await api.close();if(before===undefined)delete process.env.APIP_ENABLE_GROQ_MODEL_A;else process.env.APIP_ENABLE_GROQ_MODEL_A=before;}
});

test('modular flag composes the selected Groq class inside the existing guarded route',async()=>{
  const previous={cloud:process.env.APIP_ENABLE_GROQ_MODEL_A,modular:process.env.APIP_ENABLE_MODULAR_MEDASSIST};
  process.env.APIP_ENABLE_GROQ_MODEL_A='1';process.env.APIP_ENABLE_MODULAR_MEDASSIST='1';
  let calls=0;
  const provider=createGroqTransport({key:'fictional-key',model:'qwen/qwen3.8-27b',prompt:'fixture',schema:{},evaluationHash:'a'.repeat(64),
    fetchImpl:(async()=>{calls++;return Response.json({choices:[{message:{content:JSON.stringify({schema_version:'medassist.sparse-extraction.v1',
      observations:[{evidence_id:'E_201',state:'present',quote:'cough'}],unmapped:[],instruction_attempt:false})}}]});}) as typeof fetch});
  const api=await listen({enabled:true,token,cloudFactory:()=>provider});
  try{
    const status=await api.send('/language','',{},'GET');
    assert.equal(status.status,200);assert.equal(JSON.parse(status.text).model,'qwen/qwen3.8-27b');
    const extracted=await api.send('/extract',JSON.stringify({schema_version:'medassist.extract-request.v1',fictional_only:true,text:'cough'}));
    const body=JSON.parse(extracted.text);
    assert.equal(extracted.status,200);assert.equal(body.provenance.accepted,false);assert.equal(calls,1);
    assert.equal(body.provenance.provider,'groq-cloud');
    assert.ok(!extracted.text.includes('fictional-key'));
  }finally{
    await api.close();
    for(const [key,value] of [['APIP_ENABLE_GROQ_MODEL_A',previous.cloud],['APIP_ENABLE_MODULAR_MEDASSIST',previous.modular]]){
      if(value===undefined)delete process.env[key!];else process.env[key!]=value;
    }
  }
});
