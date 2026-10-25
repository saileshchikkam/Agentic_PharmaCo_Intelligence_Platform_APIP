import test from 'node:test';
import assert from 'node:assert/strict';
import { GroqProvider, selectedGroqModel } from '../server/medassist-ai';
import { createGroqTransport } from '../server/groq-extraction';

const positive={schema_version:'medassist.sparse-extraction.v1',observations:[{
  evidence_id:'E_201',state:'present',quote:'cough'}],unmapped:[],instruction_attempt:false};

test('modular Groq class reuses qualified transport, records only safe metrics and locks model identity',async()=>{
  let attempts=0;
  const transport=createGroqTransport({key:'fictional-not-secret',model:selectedGroqModel,prompt:'fixture',schema:{},evaluationHash:'a'.repeat(64),
    fetchImpl:(async()=>{attempts++;return Response.json({choices:[{message:{content:JSON.stringify(positive)}}]},
      {headers:{'x-ratelimit-limit-requests':'1000','x-ratelimit-remaining-tokens':'7000','x-private-header':'never-copy'}});}) as typeof fetch});
  const provider=new GroqProvider(()=>transport);
  const proposal=await provider.extract('cough');
  assert.equal(proposal.envelope.provenance.accepted,false);
  assert.equal(attempts,1);assert.equal(provider.metrics.requests,1);
  assert.equal(provider.metrics.rate_limits['x-ratelimit-limit-requests'],'1000');
  assert.ok(!JSON.stringify(provider.metrics).includes('cough'));
  assert.ok(!JSON.stringify(provider.metrics).includes('fictional-not-secret'));
  assert.ok(!JSON.stringify(provider.metrics).includes('x-private-header'));
  const copy=provider.metrics;copy.rate_limits['x-ratelimit-limit-requests']='changed';
  assert.equal(provider.metrics.rate_limits['x-ratelimit-limit-requests'],'1000');
  assert.throws(()=>new GroqProvider(()=>({...transport,model:'other'})),/SELECTED_GROQ_MODEL_REQUIRED/);
  await assert.rejects(()=>provider.extract(''),/INVALID_EXTRACTION_INPUT/);
});

test('modular provider preserves generic failure and single-call accounting without retry',async()=>{
  const provider=new GroqProvider(()=>createGroqTransport({key:'fixture',model:selectedGroqModel,prompt:'fixture',schema:{},evaluationHash:'b'.repeat(64),
    fetchImpl:(async()=>new Response('private upstream error',{status:402})) as typeof fetch}));
  await assert.rejects(()=>provider.extract('cough'),/^Error: GROQ_UNAVAILABLE_OR_INVALID$/);
  assert.equal(provider.metrics.failures,1);assert.equal(provider.metrics.requests,1);
  assert.ok(!JSON.stringify(provider.metrics).includes('private'));
});
