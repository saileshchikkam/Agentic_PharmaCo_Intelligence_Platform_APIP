import test from 'node:test';
import assert from 'node:assert/strict';
import {capabilities,decide,validateProfile,categories,disabledPolicy,type Application} from '../server/specialist/domain';
import {fixtureSpecialistRepository} from '../server/specialist/fixtureRepository';
import {randomUUID} from 'node:crypto';
const profile={fullName:'Fictional Reviewer',category:categories[0],qualification:'Fictional qualification',registration:'',jurisdiction:'Fictional',organization:'Fictional Institute',department:'',experience:'',specialization:''};
const app:Application={id:'fixture',owner:'applicant',version:1,state:'PENDING_VERIFICATION',profile,decisions:[]};
const policy={version:'fixture-only',approved:true,categories};
test('profile rejects extra privilege fields and invalid categories',()=>{
  assert.deepEqual(validateProfile(profile),profile);
  for(const value of [{...profile,approved:true},{...profile,role:'administrator'},{...profile,category:'Administrator'},{...profile,experience:'x'.repeat(301)}])assert.throws(()=>validateProfile(value),/INVALID_PROFILE/);
});
test('disposable workflow: ownership, receipts, audit rollback and immediate revocation',async()=>{
  let failAudit=false;
  const repo=fixtureSpecialistRepository(['admin'],policy,()=>{if(failAudit)throw Error('AUDIT_UNAVAILABLE');});
  let a=await repo.create('applicant',profile,randomUUID());
  await assert.rejects(repo.command('foreign',a.id,a.version,{type:'submit'},randomUUID()),/NOT_FOUND/);
  a=await repo.command('applicant',a.id,a.version,{type:'submit'},randomUUID());
  const change=async(action:string)=>repo.decide('admin',a.id,a.version,{action,reason:'Fictional check',evidenceReference:'synthetic-reference',policyVersion:policy.version},randomUUID());
  a=await change('begin_verification');
  failAudit=true;await assert.rejects(change('approve'),/AUDIT_UNAVAILABLE/);
  assert.equal((await repo.currentApplication('applicant'))?.state,'PENDING_VERIFICATION');
  failAudit=false;
  const key=randomUUID(),command={action:'approve',reason:'Fictional check',evidenceReference:'synthetic-reference',policyVersion:policy.version};
  const expected=a.version;
  a=await repo.decide('admin',a.id,expected,command,key);
  assert.deepEqual(await repo.decide('admin',a.id,expected,command,key),a);
  await assert.rejects(repo.decide('admin',a.id,expected,{...command,reason:'Changed'},key),/IDEMPOTENCY_CONFLICT/);
  await assert.rejects(repo.decide('impostor',a.id,a.version,command,randomUUID()),/FORBIDDEN/);
  assert.equal(a.decisions.filter(d=>d.action==='approve').length,1);
  const identity=await repo.identity('applicant');assert.equal(capabilities(identity.applicationState,false,identity.validUntil).specialistWorkspace,true);
  a=await change('revoke');
  const revoked=await repo.identity('applicant');assert.equal(capabilities(revoked.applicationState,false,revoked.validUntil).specialistWorkspace,false);
  assert.equal(a.decisions.length,3);
});
test('independent authorization, policy and verification gates are mandatory',()=>{
  assert.throws(()=>decide(app,'applicant',true,'approve','Fixture','ref',policy),/SELF_APPROVAL_DENIED/);
  assert.throws(()=>decide(app,'impostor',false,'approve','Fixture','ref',policy),/FORBIDDEN/);
  assert.throws(()=>decide(app,'admin',true,'approve','Fixture','ref',disabledPolicy),/POLICY_NOT_APPROVED/);
  assert.throws(()=>decide(app,'admin',true,'approve','Fixture','',policy),/VERIFICATION_REQUIRED/);
  assert.equal(decide(app,'admin',true,'approve','Fixture','synthetic-ref',policy),'APPROVED');
});
test('revocation removes professional capability and no identity confers clinical access',()=>{
  for(const state of ['DRAFT','SUBMITTED','PENDING_VERIFICATION','APPROVED','REJECTED','SUSPENDED','REVOKED','EXPIRED'] as const){
    const c=capabilities(state,true,new Date(Date.now()+86400000).toISOString());assert.equal(c.patientCaseAccess,false);assert.equal(c.specialistPdfExport,false);
    assert.equal(c.specialistWorkspace,state==='APPROVED');
  }
  assert.equal(decide({...app,state:'APPROVED'},'admin',true,'revoke','Fixture revocation','',policy),'REVOKED');
  assert.throws(()=>decide({...app,state:'REVOKED'},'admin',true,'approve','Fixture','ref',policy),/INVALID_TRANSITION/);
  assert.equal(capabilities('APPROVED',false,'2000-01-01T00:00:00Z').specialistWorkspace,false);
  assert.equal(capabilities('APPROVED').specialistWorkspace,false);
});
