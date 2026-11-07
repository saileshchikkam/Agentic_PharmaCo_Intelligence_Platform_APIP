import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {once} from 'node:events';
import express from 'express';
import {registerVerifiedAdr} from '../server/cloud-account';
import {sqliteGuidedRepository} from '../server/adr/repository';
import {fixtureSpecialistRepository} from '../server/specialist/fixtureRepository';
import {categories} from '../server/specialist/domain';
test('identity APIs reuse verified principal; metadata, workspace and request roles confer no authority',async()=>{
 const a=randomUUID(),b=randomUUID(),admin=randomUUID(),db=new DatabaseSync(':memory:');
 db.exec('create table local_users(id text primary key)');for(const id of [a,b,admin])db.prepare('insert into local_users values(?)').run(id);
 const identity=fixtureSpecialistRepository([admin],{version:'private-fictional-3b-v1',approved:true,categories});
 const app=express();let revoked=false;
 registerVerifiedAdr(app,sqliteGuidedRepository(db),async token=>revoked?null:token==='a'?{id:a,user_metadata:{role:'admin'}}:token==='b'?{id:b}:token==='admin'?{id:admin}:null,null,false,identity);
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+(server.address() as {port:number}).port;
 const call=(path:string,body?:unknown,token='a',account=token==='a'?a:token==='b'?b:admin)=>fetch(origin+'/api'+path,{method:body===undefined?'GET':'POST',
  headers:{Authorization:'Bearer '+token,'X-APIP-Account':account,'Content-Type':'application/json','Idempotency-Key':randomUUID()},body:body===undefined?undefined:JSON.stringify(body)});
 const profile={fullName:'Fictional Applicant',category:categories[0],qualification:'Synthetic qualification',registration:'',jurisdiction:'',organization:'Example Institute',department:'',experience:'',specialization:''};
 try{
  assert.equal((await call('/account/capabilities',undefined,'invalid')).status,401);
  assert.equal((await call('/account/capabilities',undefined,'a',b)).status,409);
  assert.equal((await call('/admin/specialist-applications')).status,403);
  assert.equal((await call('/specialist/applications',{profile,role:'admin'})).status,400);
  assert.equal((await call('/specialist/applications',{profile:{...profile,approved:true}})).status,400);
  const created=await call('/specialist/applications',{profile});assert.equal(created.status,201);const c=(await created.json()).application;
  assert.equal((await call('/specialist/applications/'+c.id+'/commands',{expectedVersion:1,command:{type:'submit'}},'b')).status,404);
  assert.equal((await call('/specialist/applications/'+c.id+'/commands',{expectedVersion:1,command:{type:'submit',role:'APPROVED'}})).status,400);
  assert.equal((await call('/admin/specialist-applications/'+c.id+'/decisions',{expectedVersion:1,command:{action:'approve',reason:'forged',evidenceReference:'fixture',policyVersion:'private-fictional-3b-v1'}})).status,403);
  const caps=await(await call('/account/capabilities')).json();assert.equal(caps.identityAdministration,false);assert.equal(caps.patientCaseAccess,false);
  revoked=true;assert.equal((await call('/specialist/applications/current')).status,401);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));db.close();}
});
