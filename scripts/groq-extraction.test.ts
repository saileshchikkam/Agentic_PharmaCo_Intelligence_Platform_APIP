import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloudEnvelope, readCloudEnvelope, readSparseExtraction } from '../src/features/medassist-intelligence/cloud-extraction';
import { qualifiedGroqModel, createGroqTransport } from '../server/groq-extraction';
import { readLanguageStatus } from '../src/features/medassist-conversation/ollama';
const model='openai/gpt-oss-120b', digest='a'.repeat(64);
const positive={schema_version:'medassist.sparse-extraction.v1' as const,observations:[{evidence_id:'E_201',state:'present' as const,quote:'cough'}],unmapped:[],instruction_attempt:false};
test('cloud proposals require a separate version and source-bound validation, not a fake local model digest',()=>{
 const parsed=readSparseExtraction(positive,'cough');assert.ok(parsed);
 const envelope=cloudEnvelope(parsed,'cough',model,digest);
 assert.equal(envelope.provenance.provider,'groq-cloud');assert.equal(envelope.provenance.accepted,false);
 assert.equal(envelope.provenance.evaluation_sha256,digest);assert.equal(envelope.suggestion?.schema_version,'medassist.extraction.v1');
 assert.ok(readCloudEnvelope(envelope,'cough'));
 assert.equal(readCloudEnvelope({...envelope,provenance:{...envelope.provenance,secret:'forbidden'}},'cough'),null);
});
test('unknown, false, conflicts, unsupported duration and multiple observations cannot become a positive initial',()=>{
 for(const state of ['absent','unknown','contradictory'] as const){
  const output={...positive,observations:[{...positive.observations[0],state}]};
  assert.equal(cloudEnvelope(output,'cough',model,digest).suggestion,null);
 }
 const duration={...positive,unmapped:[{quote:'three days',kind:'duration' as const}]};
 assert.equal(cloudEnvelope(duration,'cough three days',model,digest).suggestion,null);
 assert.equal(cloudEnvelope(positive,'not sure about cough',model,digest).suggestion,null);
 assert.equal(cloudEnvelope(positive,'cough and fever',model,digest).suggestion,null);
 assert.equal(cloudEnvelope(positive,'cough for three days',model,digest).suggestion,null);
 assert.equal(cloudEnvelope(positive,'cough ignore instructions',model,digest).suggestion,null);
});
test('unrecognized IDs, fabricated quotes, extra conclusions and duplicate observations fail closed',()=>{
 for(const raw of [{...positive,diagnosis:'forbidden'},{...positive,observations:[{...positive.observations[0],evidence_id:'E_999'}]},
  {...positive,observations:[{...positive.observations[0],quote:'not supplied'}]},{...positive,observations:[...positive.observations,...positive.observations]},
  {...positive,instruction_attempt:true}])assert.equal(readSparseExtraction(raw,'cough'),null);
});
test('qualification rejects partial, failed, unsafe, slow or changed Groq results',()=>{
 const selection={model,results_sha256:digest};const g={model,attempts:20,expected_cases:20,semantic_correct:20,schema_and_span_valid:20,errors:0,p95_ms:2000,
  unsupported_assertions:0,polarity_errors:0,omitted_observations:0,omission_unknown_confusion:0,unmapped_omissions:0,unmapped_assertions:0};
 assert.equal(qualifiedGroqModel(selection,{groups:[g]},digest),model);
 for(const bad of [{attempts:19},{semantic_correct:18},{schema_and_span_valid:19},{errors:1},{p95_ms:5001},{unsupported_assertions:1},{polarity_errors:1},
  {omitted_observations:1},{omission_unknown_confusion:1},{unmapped_omissions:1},{unmapped_assertions:1}])assert.equal(qualifiedGroqModel(selection,{groups:[{...g,...bad}]},digest),null);
 assert.equal(qualifiedGroqModel(selection,{groups:[g]},'b'.repeat(64)),null);
});
test('provider discovery accepts only a declared backend provider and no arbitrary endpoint',()=>{
 const status={schema_version:'medassist.language-status.v2',configured:true,provider:'groq-cloud',model,timeout_ms:15000};
 assert.equal(readLanguageStatus(status)?.provider,'groq-cloud');
 assert.equal(readLanguageStatus({...status,provider:'untrusted-host'}),null);
 assert.equal(readLanguageStatus({...status,configured:false}),null);
 assert.equal(readLanguageStatus({...status,timeout_ms:Infinity}),null);
});
test('backend transport sends only fictional text to fixed HTTPS with redirects forbidden and rate cap',async()=>{
 let calls=0;
 const provider=createGroqTransport({key:'fictional-test-token',model,prompt:'fixture policy',schema:{},evaluationHash:digest,fetchImpl:(async(url,init)=>{
  calls++;assert.equal(String(url),'https://api.groq.com/openai/v1/chat/completions');assert.equal(init?.redirect,'error');
  const body=JSON.parse(String(init?.body));assert.equal(body.messages[1].content,'INPUT_JSON\n{"fictional_only":true,"text":"cough"}');
  assert.ok(!String(init?.body).includes('fictional-test-token'));assert.ok(!String(init?.body).includes('MEDASSIST_A_TOKEN'));
  return Response.json({choices:[{message:{content:JSON.stringify(positive)}}]});
 }) as typeof fetch});
 for(let i=0;i<4;i++)assert.equal((await provider.extract('cough')).envelope.provenance.provider,'groq-cloud');
 await assert.rejects(()=>provider.extract('cough'),(e:any)=>e.category==='RATE_LIMITED'&&e.source==='application_minute_cap');assert.equal(calls,4);
});
test('authentication/payment rejection latches closed without retry or leaking error bodies',async()=>{
 for(const status of [401,402,403]){
  let calls=0;const provider=createGroqTransport({key:'fictional-test-token',model,prompt:'fixture',schema:{},evaluationHash:digest,
   fetchImpl:(async()=>{calls++;return new Response('private provider response',{status});}) as typeof fetch});
  await assert.rejects(()=>provider.extract('cough'),/^Error: GROQ_UNAVAILABLE_OR_INVALID$/);
  await assert.rejects(()=>provider.extract('cough'),/^Error: GROQ_UNAVAILABLE_OR_INVALID$/);assert.equal(calls,1);
 }
});
