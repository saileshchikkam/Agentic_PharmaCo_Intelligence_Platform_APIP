import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import express from 'express';
import {request as httpRequest} from 'node:http';
import {evaluateStatement,normalizeSafetyText,resolveSafetyClarification} from '../src/features/medassist-safety/safety';
import {registerModelADemo} from '../server/model-a-demo';
const cases=JSON.parse(readFileSync('models/medassist_ai/evaluation/emergency-recognition-v2/development.json','utf8')).cases as {id:string;text:string;expected_action:string}[];

test('development context cases, including original misses, preserve uncertainty and no clearance',()=>{
 for(const row of cases){const d=evaluateStatement(row.text);assert.equal(d.status,row.expected_action,row.id);assert.equal(d.schema_version,'medassist.safety-decision.v2');assert.equal(d.negative_safety_conclusion,false);assert.equal(d.clinical_validation,false);assert.equal(d.model_b_status,'unable_to_assess');}
});
test('TS and Python return identical decisions for all development cases',()=>{
 const python=process.env.MEDASSIST_TEST_PYTHON||'python';
 const code='import sys,json; from models.medassist_ai.safety.provisional import ProvisionalSafety; g=ProvisionalSafety(); print(json.dumps([g.check(t) for t in json.load(sys.stdin)]))';
 const out=execFileSync(python,['-B','-c',code],{input:JSON.stringify(cases.map(c=>c.text)),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1',PYTHONDONTWRITEBYTECODE:'1'}});
 const actual=JSON.parse(out);for(let i=0;i<cases.length;i++)assert.deepEqual(evaluateStatement(cases[i].text),actual[i],cases[i].id);
});
test('safety clarification is explicit, blocks routine work, and never generates negative evidence',()=>{
 const p=evaluateStatement('heart attack');assert.equal(p.status,'clarify');assert.equal(p.suppress_ordinary_flow,true);
 for(const answer of ['current','unsure'] as const)assert.equal(resolveSafetyClarification(p,answer).status,'escalate');
 const historical=resolveSafetyClarification(p,'non_current');assert.equal(historical.status,'not_assessed');assert.equal(historical.negative_safety_conclusion,false);
 assert.equal(resolveSafetyClarification(evaluateStatement('I am having a stroke'),'non_current').status,'escalate');
});
test('third-party reports, suspected assertions, remote history and typed evidence remain separate',()=>{
 const other=evaluateStatement('I think my father is having a stroke now');assert.equal(other.status,'escalate');assert.ok(other.mentions.every(m=>m.subject==='other'));assert.ok(other.mentions.some(m=>m.assertion==='suspected'));
 const old=evaluateStatement('I had a stroke years ago');assert.equal(old.status,'not_assessed');assert.ok(old.mentions.every(m=>m.context==='remote_history'));
 assert.equal(normalizeSafetyText('I can’t breathe'),'i cannot breathe');assert.doesNotMatch(JSON.stringify(other),/diagnosis|observed_positive|urgency_level/);
});
async function endpoint(mode:'development'|'production',enabled:boolean,run:(send:(path:string,body:unknown)=>Promise<{status:number;body:any}>)=>Promise<void>){
 const app=express();let modelCalls=0;registerModelADemo(app,{mode,host:'127.0.0.1',port:3000,legacyAgentsEnabled:false},{enabled,token:'fictional-only-test-token-123456789012345678901234567890',fetchImpl:(async()=>{modelCalls++;throw Error('offline')}) as typeof fetch});
 const s=await new Promise<ReturnType<typeof app.listen>>(resolve=>{const v=app.listen(0,'127.0.0.1',()=>resolve(v))});
 try{const port=(s.address() as {port:number}).port;await run((path,body)=>new Promise((resolve,reject)=>{const q=httpRequest({hostname:'127.0.0.1',port,path,method:'POST',headers:{Host:'127.0.0.1:3000',Origin:'http://127.0.0.1:3000','Content-Type':'application/json'}},r=>{let raw='';r.on('data',d=>raw+=d);r.on('end',()=>{let b:unknown=raw;try{b=JSON.parse(raw)}catch{}resolve({status:r.statusCode!,body:b})})});q.on('error',reject);q.end(JSON.stringify(body))}));assert.equal(modelCalls,0)}finally{await new Promise<void>(resolve=>s.close(()=>resolve()))}
}
test('independent safety endpoint handles new categories even when all model paths are disabled',async()=>{
 await endpoint('development',false,async send=>{for(const text of ['I am having a heart attack','I am having a stroke','My child is unconscious','I have uncontrolled bleeding']){const r=await send('/api/research/medassist/safety',{schema_version:'medassist.safety-request.v1',text});assert.equal(r.status,200);assert.equal(r.body.status,'escalate')}});
});
test('API escalation and clarification precede vocabulary, cloud and Model A availability',async()=>{
 await endpoint('development',true,async send=>{for(const [text,status] of [['I am having a stroke','escalate'],['heart attack','clarify']]){const r=await send('/api/research/model-a/natural/extract',{schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text,question_id:null,prior_context:[]});assert.equal(r.status,409);assert.equal(r.body.safety.status,status)}});
});
test('current emergency context cannot be hidden in prior descriptions',async()=>{
 await endpoint('development',true,async send=>{const r=await send('/api/research/model-a/natural/extract',{schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text:'A separate cough detail',question_id:null,prior_context:['I am having a heart attack now']});assert.equal(r.status,409);assert.equal(r.body.safety.status,'escalate')});
});
test('safety endpoints remain local development-only rather than a public clinical route',async()=>{
 await endpoint('production',false,async send=>{const r=await send('/api/research/medassist/safety',{schema_version:'medassist.safety-request.v1',text:'I am having a stroke'});assert.equal(r.status,404)});
});
