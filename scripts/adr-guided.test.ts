import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtemp,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {registerLocalAccount} from '../server/local-account';
import {questions,nextQuestion,missing,chronology,validateValue,type GuidedCase} from '../src/features/adr/guided/domain';
import {checkedProposals} from '../server/adr/provider';
const empty=():GuidedCase=>({schemaVersion:1,id:'case',revision:1,fictionalOnly:true,updatedAt:'',values:{},medications:[{id:'med',kind:'suspect'}],statements:[],proposals:[],providerStatus:'manual'});
test('planner, field validation, complete field coverage and unknown semantics',()=>{
 const c=empty();assert.equal(nextQuestion(c),'caseType');assert(!questions(c).some(f=>f.key==='followUp'));
 c.values.caseType={value:'Follow-up',state:'provided',confirmedAt:'',source:'manual',statementId:'1'};assert.equal(nextQuestion(c),'followUp');
 const age=questions(c).find(f=>f.key==='age')!;assert(validateValue(age,'0'));assert(!validateValue(age,'-1'));assert(validateValue(age,null));
 assert(!validateValue(questions(c).find(f=>f.key==='dob')!,'2026-02-30'));
 c.medications.push({id:'con',kind:'concomitant'});assert(questions(c).some(f=>f.key==='med.con.name'));assert(!questions(c).some(f=>f.key==='med.con.rechallenge'));
 assert(missing(c).includes('reaction'));assert(!questions(c).some(f=>f.key.includes('causality')));
 c.values.reactionStart={...c.values.caseType,value:'2026-11-02'};c.values.reactionStop={...c.values.caseType,value:'2026-11-01'};assert.equal(chronology(c).length,1);
});
test('provider proposals are schema constrained, anchored and never silently overwrite confirmed data',()=>{
 const c=empty(),text='Fictional report: itching';const raw={proposals:[{key:'reaction',value:'itching',quote:'itching'}]};
 assert.equal(checkedProposals(raw,text,c)[0].value,'itching');assert.deepEqual(c.values,{});
 for(const bad of [{proposals:[{key:'causality',value:'itching',quote:'itching'}]},{proposals:[{key:'reaction',value:'rash',quote:'itching'}]},{proposals:[{key:'reaction',value:'itching',quote:'itching',confirmed:true}]},{proposals:[{key:'reaction',value:'invented',quote:'invented'}]}])assert.throws(()=>checkedProposals(bad,text,c));
 c.values.reaction={value:'headache',state:'provided',confirmedAt:'',source:'manual',statementId:'1'};assert(checkedProposals(raw,text,c)[0].conflict);
 assert.equal(checkedProposals({proposals:[{key:'reaction',value:'దురద',quote:'దురద'}]},'దురద',c)[0].quote,'దురద');
});
test('real authenticated HTTP: save/resume, ownership, revision history, fallback, repeatable medicines and restart',async()=>{
 const previous=process.env.ADR_INTAKE_PROVIDER;process.env.ADR_INTAKE_PROVIDER='disabled';
 const dir=await mkdtemp(join(tmpdir(),'adr-guided-'));const file=join(dir,'accounts.sqlite');
 const boot=async()=>{const app=express();const server=await new Promise<ReturnType<typeof app.listen>>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const port=(server.address() as {port:number}).port;const service=registerLocalAccount(app,{file,originPort:port});return {server,service,url:`http://127.0.0.1:${port}/api/account`};};
 let runtime=await boot();const stop=async()=>{await new Promise<void>((resolve,reject)=>runtime.server.close(e=>e?reject(e):resolve()));runtime.service.close();};
 const call=async(path:string,body?:unknown,cookie='',id='',origin?:string)=>{const r=await fetch(runtime.url+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin??new URL(runtime.url).origin,'Content-Type':'application/json',Cookie:cookie,'X-APIP-Account':id},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]??''};};
 try{
  const a=await call('/signup',{email:'adr-a@example.test',password:'fictional-password-123'}),b=await call('/signup',{email:'adr-b@example.test',password:'fictional-password-123'}),aid=a.body.user.id,bid=b.body.user.id;
  assert.equal((await call('/adr-guided')).status,401);assert.equal((await call('/adr-guided',undefined,b.cookie,aid)).status,409);
  const created=await call('/adr-guided',{fictionalOnly:true},a.cookie,aid);assert.equal(created.status,201);let c:GuidedCase=created.body.case;const path='/adr-guided/'+c.id;
  assert.equal((await call(path,undefined,b.cookie,bid)).status,404);assert.equal((await call(path+'/history',undefined,b.cookie,bid)).status,404);
  const cmd=async(command:unknown,rev=c.revision)=>call(path+'/command',{expectedRevision:rev,command},a.cookie,aid);
  const confirmed=await cmd({type:'confirm',key:'reaction',value:'  Fictional itching దురద  '});assert.equal(confirmed.status,200);c=confirmed.body.case;
  assert.equal(c.values.reaction.value,'  Fictional itching దురద  ');assert.equal(c.values.reaction.source,'manual');
  assert.equal((await cmd({type:'confirm',key:'reaction',value:'lost update'},1)).status,409);
  assert.equal((await cmd({type:'confirm',key:'causality',value:'certain'})).status,400);
  const added=await cmd({type:'add_medication',kind:'concomitant'});c=added.body.case;assert.equal(c.medications.length,2);
  const desc=await cmd({type:'describe',text:'Several fictional facts; no model call permitted.'});c=desc.body.case;assert.equal(c.providerStatus,'manual_required');assert.deepEqual(c.proposals,[]);
  c=(await cmd({type:'confirm',key:'age',value:null})).body.case;assert.equal(c.values.age.state,'unknown');
  const before=c.revision;await stop();runtime=await boot();const resumed=await call(path,undefined,a.cookie,aid);assert.equal(resumed.body.case.revision,before);assert.equal(resumed.body.case.values.reaction.value,'  Fictional itching దురద  ');
  assert.equal((await call(path+'/history',undefined,a.cookie,aid)).body.versions.length,before);
  assert.equal((await call(path+'/command',{expectedRevision:before,command:{type:'confirm',key:'reaction',value:'attack'}},b.cookie,bid)).status,404);
  assert.equal((await call(path+'/command',{expectedRevision:before,command:{type:'confirm',key:'reaction',value:'attack'}},a.cookie,aid,'https://invalid.test')).status,403);
  const pdf=(cookie=a.cookie,account=aid,revision=c.revision)=>fetch(runtime.url+path+'/pdf',{method:'POST',headers:{Origin:new URL(runtime.url).origin,'Content-Type':'application/json',Cookie:cookie,'X-APIP-Account':account},body:JSON.stringify({expectedRevision:revision})});
  assert.equal((await pdf('','')).status,401);
  assert.equal((await pdf(b.cookie,bid)).status,404);
  assert.equal((await pdf(b.cookie,aid)).status,409);
  assert.equal((await pdf(a.cookie,aid,1)).status,409);
  if(!existsSync('docs/adr/templates/ADRRF_2.pdf')){
   const unavailable=await pdf();assert.equal(unavailable.status,503);assert.deepEqual(await unavailable.json(),{error:'PDF_TEMPLATE_MISSING'});
   return;
  }
  const unsupported=await pdf();assert.equal(unsupported.status,422);assert.equal((await unsupported.json()).error,'PDF_UNSUPPORTED_SCRIPT');
  c=(await cmd({type:'confirm',key:'reaction',value:'Fictional itching'})).body.case;
  const exported=await pdf();assert.equal(exported.status,200);assert.equal(exported.headers.get('content-type'),'application/pdf');assert.match(exported.headers.get('cache-control')??'',/no-store/);assert.equal(exported.headers.get('x-apip-revision'),String(c.revision));assert.match(exported.headers.get('content-disposition')??'',/attachment/);
  const first=Buffer.from(await exported.arrayBuffer());assert.equal(first.subarray(0,5).toString(),'%PDF-');
  const old=c.revision;c=(await cmd({type:'confirm',key:'reaction',value:'Corrected fictional itching'})).body.case;
  assert.equal((await pdf(a.cookie,aid,old)).status,409);
  const regenerated=await pdf();assert.equal(regenerated.status,200);assert.equal(regenerated.headers.get('x-apip-revision'),String(c.revision));assert.notDeepEqual(Buffer.from(await regenerated.arrayBuffer()),first);
 }finally{await stop();await rm(dir,{recursive:true,force:true});if(previous===undefined)delete process.env.ADR_INTAKE_PROVIDER;else process.env.ADR_INTAKE_PROVIDER=previous;}
});
