import assert from 'node:assert/strict';
export async function runSwitch({actors,origin,results,session,api,signIn,logout,save}){
 const [patient,specialist]=actors;
 results.phase='isolated-initial-identities';
 for(const a of actors){
  await a.page.waitForFunction(()=>{const s=JSON.parse(localStorage.getItem('apip.cloud.auth')||'null');return !!s?.access_token;},null,{timeout:600000});
  assert(a.credentials,'PRIVATE_LOGIN_REQUIRED');const s=await session(a);a.id=s.id;
  const r=await api(a,'/api/account/capabilities');assert.equal(r.status,200);assert.equal(r.data.accountRole,a.kind.toUpperCase());
  const list=await api(a,'/api/account/adr-cases');assert.equal(list.status,200);assert(list.data.cases.length>0,'PREVIOUS_SAVED_ADR_REQUIRED');a.caseId=list.data.cases[0].id;
 }
 assert.notEqual(patient.id,specialist.id);results.checks.isolatedIdentities=true;await save();
 const p=patient;
 async function verify(actor){
  const s=await session(p);assert(s);assert.equal(s.id,actor.id,'AUTHENTICATED_SUBJECT');
  const cap=await api(p,'/api/account/capabilities');assert.equal(cap.status,200);assert.equal(cap.data.accountRole,actor.kind.toUpperCase());
  await p.page.getByRole('heading',{name:actor.kind==='patient'?'Your APIP dashboard':'Your Pharmacovigilance Workspace',exact:true}).waitFor();
  const own=await api(p,'/api/account/adr-guided/'+actor.caseId);assert.equal(own.status,200);
  const foreign=await api(p,'/api/account/adr-guided/'+(actor===patient?specialist:patient).caseId);assert.equal(foreign.status,404);
 }
 results.phase='patient-initial';await p.page.goto(origin+'/#/patient/home');await verify(patient);results.checks.patientInitial=true;await save();
 results.phase='patient-complete-logout';await logout(p);assert.equal(await session(p),null);assert.equal((await p.page.request.get(origin+'/api/account/capabilities')).status(),401);results.checks.patientLogout=true;await save();
 results.phase='same-context-specialist';await signIn(p,specialist);await verify(specialist);
 await p.page.goto(origin+'/#/patient/home');await p.page.waitForURL(/\/specialist(?:\/home)?$/);assert.equal((await api(p,'/api/sharing/inbox')).status,403);results.checks.sameContextSpecialist=true;await save();
 results.phase='specialist-complete-logout';await logout(p);assert.equal(await session(p),null);results.checks.specialistLogout=true;await save();
 results.phase='same-context-patient-return';await signIn(p,patient);await verify(patient);
 for(const path of ['/specialist','/specialist/profile','/specialist/reviews','/admin/specialist-applications']){await p.page.goto(origin+'/#'+path);await p.page.waitForURL(/\/patient\/home$/);}
 assert.equal((await api(p,'/api/specialist/applications/current')).status,403);assert.equal((await api(p,'/api/admin/specialist-applications')).status,403);
 const response=p.page.waitForResponse(r=>r.url()===origin+'/api/account/capabilities'&&r.request().method()==='GET');void response.catch(()=>{});await p.page.reload();assert.equal((await response).status(),200);await verify(patient);
 results.checks.sameContextPatientReturn=true;results.checks.refreshPersistence=true;results.phase='complete';results.passed=true;await save();
}
