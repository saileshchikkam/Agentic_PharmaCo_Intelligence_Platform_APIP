import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import express from 'express';
import {request as httpRequest} from 'node:http';
import {understand,constrainContext,questionCompatibility} from '../src/features/medassist-conversation/understanding';
import {normalizeProposalQuotes,type NaturalVocabulary} from '../src/features/medassist-conversation/natural';
import {registerModelADemo} from '../server/model-a-demo';
const metadata=JSON.parse(readFileSync('models/medassist_ai/docs/symptom-schema-metadata.json','utf8'));
const vocabulary:NaturalVocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:metadata.items.filter((d:any)=>!d.quarantined).map((d:any)=>({...d,value_labels:Object.fromEntries(Object.entries(d.value_labels??{}).filter(([,value])=>typeof value==='string')),initial_allowed:d.kind==='symptom'&&!d.parent})),coverage:{symptom_fields:110,universal_coverage:false}};
const question=(id:string)=>{const d=vocabulary.items.find(d=>d.evidence_id===id)!;return{...d,allows_unknown:true as const,unknown_value:null};};

test('the 115-case semantic expectations are frozen independently of extractor execution',()=>{
 const root='models/medassist_ai/evaluation/symptom-understanding-v1/',bytes=readFileSync(root+'suite.json');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),readFileSync(root+'suite.sha256','utf8').split(' ')[0]);
 const suite=JSON.parse(bytes.toString());assert.equal(suite.cases.length,115);assert.equal(suite.clinical_labels,false);
 for(const c of suite.cases){
  const r=understand(c.text,vocabulary,c.question_id?question(c.question_id):null,c.prior_context);
  const actual=r.proposal.observations.map(({evidence_id,state,value})=>({evidence_id,state,value}));
  assert.deepEqual(actual,c.expected.observations,c.id);assert.equal(r.compatibility.status,c.expected.compatibility,c.id);
  for(const kind of c.expected.annotation_kinds)assert.ok(r.annotations.some(a=>a.context===kind),c.id);
  for(const a of r.annotations)assert.equal(c.text.slice(a.start,a.end),a.quote,c.id);
 }
});
test('context gates reject or quarantine adversarial mocked LLM outputs without changing expected labels',()=>{
 const fixture=JSON.parse(readFileSync('models/medassist_ai/evaluation/symptom-understanding-v1/mock-provider-cases.json','utf8'));
 fixture.cases.push(...JSON.parse(readFileSync('models/medassist_ai/evaluation/symptom-understanding-v1/additional-adversarial-cases.json','utf8')).cases);
 const rows=fixture.cases.map((c:any)=>{
  const output=constrainContext(normalizeProposalQuotes(c.response),c.text,vocabulary,c.question_id?question(c.question_id):null,c.prior_context);
  const actual=output?.observations.map(o=>o.evidence_id)??null;
  assert.deepEqual(actual,c.expected_evidence_ids,c.id);
  return{id:c.id,passed:true,accepted_evidence_ids:actual};
 });
 const path='models/medassist_ai/evaluation/symptom-understanding-v1/mocked-llm-final.json';
 if(!existsSync(path))writeFileSync(path,JSON.stringify({fictional_only:true,model_calls:0,method:'manually authored mocked provider outputs + real validation/context gates',cases:rows.length,passed:rows.length,clinical_accuracy:false,rows},null,2)+'\n',{flag:'wx'});
});
test('supplementary canonical examples cover the remaining 15 mapped fields',()=>{
 const fixture=JSON.parse(readFileSync('models/medassist_ai/evaluation/symptom-understanding-v1/supplementary-coverage.json','utf8'));
 const rows=fixture.cases.map((c:any)=>{
  const result=understand(c.text,vocabulary),ids=result.proposal.observations.map(o=>o.evidence_id);
  assert.deepEqual(ids,c.expected_evidence_ids,c.id);
  return{id:c.id,passed:true,evidence_ids:ids};
 });
 const path='models/medassist_ai/evaluation/symptom-understanding-v1/supplementary-results.json';
 if(!existsSync(path))writeFileSync(path,JSON.stringify({fictional_only:true,cases:rows.length,passed:rows.length,independent_holdout:false,cloud_calls:0,rows},null,2)+'\n',{flag:'wx'});
});
test('unsupported qualifiers, historical actors and unknown words do not become positive evidence',()=>{
 for(const text of ['I coughed last year.','I was coughing in the past.','My brother has a fever and my head hurts.']){
  const r=understand(text,vocabulary);assert.ok(!r.proposal.observations.some(o=>o.evidence_id==='E_201'));
 }
 for(const text of ['I read about cough on a website.','I have a cough or a fever.','I have not only a cough.'])assert.equal(understand(text,vocabulary).proposal.observations.length,0,text);
 assert.equal(understand('I think I have a cough.',vocabulary).proposal.observations[0]?.state,'unknown');
 assert.equal(understand('This wording is unfamiliar.',vocabulary).complete,false,'uncovered language still reaches the constrained provider boundary');
 assert.equal(understand('My brother has a fever and my head hurts.',vocabulary).proposal.observations[0]?.evidence_id,'E_53');
 assert.equal(questionCompatibility('anus',question('E_55'),vocabulary,['lower back pain']).status,'ambiguous');
 assert.equal(questionCompatibility('I also have pain in my anus.',question('E_55'),vocabulary,['lower back pain']).status,'valid');
 assert.equal(questionCompatibility('posterior aspect of the ankle',question('E_57'),vocabulary).status,'ambiguous');
 assert.equal(questionCompatibility('severe',question('E_56'),vocabulary).status,'ambiguous');
 for(const id of ['E_201','E_55','E_56']){
  const conflict=understand('Yes and no',vocabulary,question(id));
  assert.equal(conflict.compatibility.status,'contradictory');assert.equal(conflict.proposal.observations[0]?.state,'contradiction');assert.equal(conflict.proposal.observations[0]?.value,null);
 }
 for(const text of ['I used to have pain in my right ankle.','My brother has pain in his right ankle.']) {
  const result=understand(text,vocabulary,question('E_55'));
  assert.equal(result.compatibility.status,'ambiguous');assert.equal(result.proposal.observations.length,0);
 }
});
test('real local HTTP boundary reuses deterministic supported language without Groq, preserves replay and validates v2',async()=>{
 const before=process.env.APIP_ENABLE_GROQ_MODEL_A;process.env.APIP_ENABLE_GROQ_MODEL_A='1';let cloudCalls=0;
 const app=express();registerModelADemo(app,{mode:'development',host:'127.0.0.1',port:3000,legacyAgentsEnabled:false},{enabled:true,token:'fictional-understanding-unit-token-123456789',
  fetchImpl:(async()=>Response.json(vocabulary)) as typeof fetch,
  cloudFactory:(()=>({qualified:true,provider:'groq-cloud',model:'qwen/qwen3.8-27b',timeoutMs:15000,
   extractNatural:async(text:string)=>{cloudCalls++;return{schema_version:'medassist.natural-extraction.v1',observations:[],unmapped:[{quote:text,kind:'unsupported'}],instruction_attempt:false};}})) as any});
 const server=await new Promise<ReturnType<typeof app.listen>>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const port=(server.address() as {port:number}).port,session=randomUUID();
 const send=(path:string,body?:unknown,id=randomUUID())=>new Promise<{status:number;body:any;headers:any}>((resolve,reject)=>{
  const req=httpRequest({host:'127.0.0.1',port,path:'/api/research/model-a'+path,method:body?'POST':'GET',headers:{Host:'127.0.0.1:3000',Origin:'http://127.0.0.1:3000','Content-Type':'application/json','X-Conversation-ID':session,'X-Request-ID':id}},res=>{
   let raw='';res.on('data',chunk=>raw+=chunk);res.on('end',()=>resolve({status:res.statusCode!,body:JSON.parse(raw),headers:res.headers}));
  });req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
 });
 try{
  assert.equal((await send('/natural/vocabulary')).status,200);
  for(const text of ['I have a cough.',"I've been coughing for three days.",'I am not coughing.','I used to cough, but it stopped.','My brother is coughing.','I have stomach pain.','My head hurts.',"I've had lower back pain for three days.",'I think I have a tumor in my breast.','I have a lump in my breast.',"I have diarrhea and nausea, but I haven't vomited."]){
   const id=randomUUID(),body={schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text,question_id:null,prior_context:[]};
   const first=await send('/natural/extract',body,id);assert.equal(first.status,200,text);assert.equal(first.headers['x-extraction-method'],'deterministic.v1');
   const second=await send('/natural/extract',body,id);assert.equal(second.headers['x-idempotent-replay'],'1');assert.equal(second.headers['x-extraction-method'],'deterministic.v1');assert.deepEqual(first.body,second.body);
  }
  assert.equal(cloudCalls,0);
  const follow=await send('/natural/extract',{schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text:'anus',question_id:'E_55',prior_context:['My lower back hurts.']});
  assert.equal(follow.status,200);assert.equal(follow.body.observations.length,0);
  const safety=await send('/natural/extract',{schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text:'I cannot breathe',question_id:null,prior_context:[]});assert.equal(safety.status,409);assert.equal(cloudCalls,0);
  const fallback=await send('/natural/extract',{schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text:'This wording is unfamiliar.',question_id:null,prior_context:[]});assert.equal(fallback.status,200);assert.equal(cloudCalls,1);assert.equal(fallback.headers['x-extraction-method'],'groq_validated.v1');
  const invalid=await send('/natural/extract',{schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text:'cough',question_id:null,prior_context:['x'.repeat(301)]});assert.equal(invalid.status,422);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));if(before===undefined)delete process.env.APIP_ENABLE_GROQ_MODEL_A;else process.env.APIP_ENABLE_GROQ_MODEL_A=before;}
});
