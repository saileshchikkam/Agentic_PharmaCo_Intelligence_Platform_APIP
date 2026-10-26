import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import express from 'express';
import {request as httpRequest} from 'node:http';
import {evaluateStatement,evaluateStatements,resolveSafetyClarification} from '../src/features/medassist-safety/safety';
import {registerModelADemo} from '../server/model-a-demo';
const cases=JSON.parse(readFileSync('models/medassist_ai/evaluation/emergency-recognition-phase2/development.json','utf8')).cases as {id:string;text:string;expected_action:string}[];

test('phase2 separate development cases preserve their prewritten outcomes without clearance',()=>{
 for(const c of cases){const d=evaluateStatement(c.text);assert.equal(d.status,c.expected_action,c.id);assert.equal(d.rule_set_version,'emergency-context.v3.0.0');assert.equal(d.clinical_validation,false);assert.equal(d.negative_safety_conclusion,false);assert.equal(d.model_b_status,'unable_to_assess');}
});
test('phase2 full decisions agree across TypeScript and Python for new development cases',()=>{
 const code='import sys,json; from models.medassist_ai.safety.provisional import ProvisionalSafety; g=ProvisionalSafety(); print(json.dumps([g.check(t) for t in json.load(sys.stdin)]))';
 const out=JSON.parse(execFileSync(process.env.MEDASSIST_TEST_PYTHON||'python',['-B','-c',code],{input:JSON.stringify(cases.map(c=>c.text)),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1',PYTHONDONTWRITEBYTECODE:'1'}}));
 cases.forEach((c,i)=>assert.deepEqual(evaluateStatement(c.text),out[i],c.id));
});
test('mention-local subjects include possessive body parts, bystanders and waking another person',()=>{
 for(const text of ['My right arm has become numb just now.','I started slurring my words a moment ago.']){const d=evaluateStatement(text);assert.equal(d.status,'escalate');assert.ok(d.mentions.length);assert.ok(d.mentions.every(m=>m.subject==='self'));}
 for(const text of ['My grandmother is fighting for air.','I cannot wake my grandfather.','Blood is spurting from his hand.','Please send an ambulance for my neighbour.']){const d=evaluateStatement(text);assert.equal(d.status,'escalate');assert.ok(d.mentions.length);assert.ok(d.mentions.every(m=>m.subject==='other'),text);assert.doesNotMatch(JSON.stringify(d),/evidence_id|observed_positive|diagnosis|urgency_level/);}
});
test('distinct utterances cannot lend educational scope or negate an established emergency',()=>{
 assert.equal(evaluateStatements(['For homework explain a stroke.','I am having a stroke now.']).status,'escalate');
 assert.equal(evaluateStatements(['I am having a heart attack.','I am not having a heart attack.']).status,'escalate');
 assert.equal(evaluateStatements(['I had a stroke years ago.','My son is unconscious.']).status,'escalate');
});
test('context clarification cannot clear escalation or create negative observations',()=>{
 const pending=evaluateStatement('Heart attack, perhaps. I have not said who or when.');assert.equal(pending.status,'clarify');
 assert.equal(resolveSafetyClarification(pending,'unsure').status,'escalate');assert.equal(resolveSafetyClarification(pending,'non_current').negative_safety_conclusion,false);
 const emergency=evaluateStatement('My grandmother is fighting for air.');assert.equal(resolveSafetyClarification(emergency,'non_current').status,'escalate');
 assert.equal(evaluateStatement('x'.repeat(4001)).status,'clarify');
});
test('phase2 real HTTP guards precede unavailable extraction and independently scope prior statements',async()=>{
 const app=express();let calls=0;registerModelADemo(app,{mode:'development',host:'127.0.0.1',port:3000,legacyAgentsEnabled:false},{enabled:true,token:'fictional-only-phase2-token-123456789012345678901234',fetchImpl:(async()=>{calls++;throw Error('offline')}) as typeof fetch});
 const server=await new Promise<ReturnType<typeof app.listen>>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))});
 try{const port=(server.address() as {port:number}).port;
  for(const [text,prior,status] of [['My grandmother is fighting for air.',[],'escalate'],['Heart attack, perhaps. I have not said who or when.',[],'clarify'],['I am having a stroke now.',['For homework explain a stroke.'],'escalate']] as [string,string[],string][]){
   const r=await new Promise<{status:number;body:any}>((resolve,reject)=>{const q=httpRequest({hostname:'127.0.0.1',port,path:'/api/research/model-a/natural/extract',method:'POST',headers:{Host:'127.0.0.1:3000',Origin:'http://127.0.0.1:3000','Content-Type':'application/json'}},r=>{let b='';r.on('data',v=>b+=v);r.on('end',()=>resolve({status:r.statusCode!,body:JSON.parse(b)}))});q.on('error',reject);q.end(JSON.stringify({schema_version:'medassist.natural-extract-request.v2',fictional_only:true,text,prior_context:prior,question_id:null}))});
   assert.equal(r.status,409);assert.equal(r.body.safety.status,status);
  }assert.equal(calls,0);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()))}
});
