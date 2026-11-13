import assert from 'node:assert/strict';import {join} from 'node:path';
export async function run({actors,results,origin,dir,api,session,signIn,logout,save}){
 signIn=async(a,portal=a.kind)=>{
  await a.page.goto(origin+'/?authcheck='+Date.now()+'#/sign-in/'+portal);
  await a.page.getByRole('heading',{name:portal==='patient'?'Patient Sign In':'Specialist Sign In',exact:true}).waitFor();
  await a.page.locator('md-dialog[open]').waitFor();
  await a.page.evaluate(async()=>{await Promise.all(document.getAnimations().map(x=>x.finished.catch(()=>{})));});
  await a.page.getByRole('textbox',{name:'Email',exact:true}).fill(a.credentials.email);
  await a.page.locator('input[type=password]').fill(a.credentials.password);
  const response=a.page.waitForResponse(r=>r.url().includes('/auth/v1/token?grant_type=password')&&r.request().method()==='POST',{timeout:15000});
  void response.catch(()=>{});await a.page.getByRole('button',{name:'Sign in',exact:true}).click();
  const r=await response;results.lastPasswordGrant={kind:a.kind,status:r.status()};await save();assert.equal(r.status(),200,'PASSWORD_GRANT_STATUS');
 };
 const screen=async(a,label)=>a.page.screenshot({path:join(dir,label+'.png'),fullPage:true});
 for(const a of actors){if(results.checks[a.kind+'ReloadPersistence'])continue;results.phase=a.kind+'-login-reload';
 await a.page.waitForFunction(()=>{try{const s=JSON.parse(localStorage.getItem('apip.cloud.auth'));return !!s?.access_token;}catch{return false;}},{},{timeout:1200000});
 if(!a.credentials)throw Error('PRIVATE_EXISTING_LOGIN_REQUIRED');
 const initial=await api(a,'/api/account/capabilities');assert.equal(initial.status,200,'INITIAL_CAPABILITIES_STATUS');assert.equal(initial.data.accountRole,a.kind.toUpperCase(),'INITIAL_CAPABILITIES_ROLE');a.id=(await session(a)).id;results.checks[a.kind+'Login']=true;
 const capabilityResponse=a.page.waitForResponse(r=>r.url()===origin+'/api/account/capabilities'&&r.request().method()==='GET',{timeout:20000});
 await a.page.reload();const response=await capabilityResponse;const data=await response.json();results.reloadDiagnostics??={};results.reloadDiagnostics[a.kind]={status:response.status(),role:data.accountRole,error:data.error,sessionPresent:!!await session(a)};await save();
 if(response.status()!==200)throw Error('RELOAD_API_'+response.status()+'_'+(data.error||'UNKNOWN'));assert.equal(data.accountRole,a.kind.toUpperCase(),'RELOAD_ROLE');
 await a.page.getByRole('heading',{name:a.kind==='patient'?'Your APIP dashboard':/^(Your professional profile|Your Pharmacovigilance Workspace)$/,exact:true}).waitFor();
 const after=await api(a,'/api/account/capabilities');assert.equal(after.status,200,'AFTER_RELOAD_STATUS');assert.equal(after.data.accountRole,a.kind.toUpperCase(),'AFTER_RELOAD_ROLE');results.checks[a.kind+'ReloadPersistence']=true;await save();
 }
 const [p,s]=actors;
 if(!results.checks.patientSpecialistIsolation){
 results.phase='patient-portal';await p.page.goto(origin+'/#/patient/home');await p.page.getByRole('heading',{name:'Your APIP dashboard',exact:true}).waitFor();assert.equal(await p.page.getByRole('link',{name:'For specialists',exact:true}).count(),0);
 await p.page.goto(origin+'/#/specialist/reviews');await p.page.waitForURL(/\/patient\/home$/);assert.equal((await api(p,'/api/specialist/applications/current')).status,403);assert.equal((await api(p,'/api/admin/specialist-applications')).status,403);results.checks.patientSpecialistIsolation=true;
 await p.page.goto(origin+'/#/preview/medassist');assert(p.page.url().includes('/preview/medassist'));await p.page.goto(origin+'/#/patient/adr/cases');await p.page.getByRole('heading',{name:'My ADR Reports',exact:true}).waitFor();results.checks.patientNavigation=true;
 results.checks.patientSpecialistIsolation=true;await save();}
 if(!results.checks.specialistOnboardingAndPendingRestriction){
 results.phase='specialist-onboarding';
 const current=await api(s,'/api/specialist/applications/current');assert.equal(current.status,200,'SPECIALIST_APPLICATION_STATUS');
 if(!current.data.application||current.data.application.state==='DRAFT'){
  await s.page.goto(origin+'/#/specialist/profile');await s.page.getByRole('heading',{name:'Your professional profile',exact:true}).waitFor();assert.equal(await s.page.locator('.specialist-service').count(),0,'ONBOARDING_MUST_HIDE_CARDS');
  await s.page.getByRole('textbox',{name:'Full name',exact:true}).fill('Fictional Demo Specialist');await s.page.getByRole('textbox',{name:'Qualification',exact:true}).fill('Fictional pharmacy qualification');await s.page.getByRole('textbox',{name:'Organization or institution',exact:true}).fill('Fictional APIP Research Institute');await s.page.getByRole('button',{name:'Save profile',exact:true}).click();await s.page.getByText('Profile saved',{exact:true}).waitFor();await s.page.getByRole('button',{name:'Submit profile',exact:true}).click();
 }else{assert.equal(current.data.application.state,'SUBMITTED','NO_AUTOMATIC_APPROVAL');assert.equal(current.data.application.profile.fullName,'Fictional Demo Specialist');await s.page.goto(origin+'/#/specialist/home');}
 await s.page.getByRole('heading',{name:'Your Pharmacovigilance Workspace',exact:true}).waitFor();await s.page.locator('.specialist-service').nth(2).waitFor({state:'visible'});assert.equal(await s.page.locator('.specialist-service').count(),3,'THREE_CARDS');assert.equal(await s.page.getByRole('link',{name:'For patients',exact:true}).count(),0,'SPECIALIST_HEADER_ISOLATION');assert(await s.page.getByRole('button',{name:'Review access restricted',exact:true}).isDisabled());assert.equal((await api(s,'/api/sharing/inbox')).status,403);results.checks.specialistOnboardingAndPendingRestriction=true;
 await s.page.goto(origin+'/#/patient/home');await s.page.waitForURL(/\/specialist\/home$/);results.checks.specialistPatientDashboardIsolation=true;
 results.checks.specialistOnboardingAndPendingRestriction=true;await save();}
 if(!results.checks.adrPersistenceAndTwoWayOwnership){
 results.phase='owned-adr-persistence';for(const a of actors){let c;if(a.caseId){const existing=await api(a,'/api/account/adr-guided/'+a.caseId);assert.equal(existing.status,200);c=existing.data.case;}else{const created=await api(a,'/api/account/adr-guided',{fictionalOnly:true});assert.equal(created.status,201);c=created.data.case;a.caseId=c.id;}const updated=await api(a,'/api/account/adr-guided/'+c.id+'/command',{expectedRevision:c.revision,command:{type:'confirm',key:'reaction',value:'Fictional mild itching for software verification only'}});assert.equal(updated.status,200);a.caseId=c.id;a.revision=updated.data.case.revision;await a.page.goto(origin+'/#/patient/adr/cases');await a.page.reload();await a.page.getByRole('heading',{name:'My ADR Reports',exact:true}).waitFor();await a.page.locator('.adr-case-card').first().waitFor();await a.page.reload();await a.page.locator('.adr-case-card').first().waitFor();const saved=await api(a,'/api/account/adr-guided/'+c.id);assert.equal(saved.status,200);assert.equal(saved.data.case.revision,a.revision);}
 assert.equal((await api(p,'/api/account/adr-guided/'+s.caseId)).status,404);assert.equal((await api(s,'/api/account/adr-guided/'+p.caseId)).status,404);results.checks.adrPersistenceAndTwoWayOwnership=true;
 results.checks.adrPersistenceAndTwoWayOwnership=true;await save();}
 if(!results.checks.responsiveComplete){
 results.phase='responsive-layout';for(const width of [1440,375]){for(const a of actors){await a.page.setViewportSize({width,height:1000});await a.page.goto(origin+(a.kind==='patient'?'/#/patient/home':'/#/specialist/home'));await a.page.getByRole('heading',{name:a.kind==='patient'?'Your APIP dashboard':'Your Pharmacovigilance Workspace',exact:true}).waitFor();assert(await a.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if(a.kind==='specialist'){await a.page.locator('.specialist-service').nth(2).waitFor({state:'visible'});const boxes=await a.page.locator('.specialist-service').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y,width:n.getBoundingClientRect().width})));assert.equal(boxes.length,3);if(width===1440)assert(boxes.every(b=>Math.abs(b.y-boxes[0].y)<2));else assert(boxes.every(b=>Math.abs(b.x-boxes[0].x)<2));}await screen(a,a.kind+'-'+width);results.layouts.push({kind:a.kind,width,overflow:false});} }await save();
 results.checks.responsiveComplete=true;await save();}
 if(!results.checks.sessionLifecycleComplete){
 results.phase='wrong-portal-and-session-switching';for(const a of actors){if(results.checks[a.kind+'SignInAfterLogout'])continue;if(!results.checks[a.kind+'WrongPortalDenied']){if(await session(a))await logout(a);await signIn(a,a.kind==='patient'?'specialist':'patient');await a.page.getByText(a.kind==='patient'?'This account belongs to the Patient Portal. Use Patient Sign In.':'This account belongs to the Specialist Portal. Use Specialist Sign In.',{exact:true}).waitFor();assert.equal(await session(a),null);results.checks[a.kind+'WrongPortalDenied']=true;}await signIn(a);await a.page.waitForURL(a.kind==='patient'?/\/patient\/home$/:/\/specialist(?:\/home)?$/,{timeout:20000});await a.page.reload();await a.page.getByRole('heading',{name:a.kind==='patient'?'Your APIP dashboard':'Your Pharmacovigilance Workspace',exact:true}).waitFor();const cap=await api(a,'/api/account/capabilities');assert.equal(cap.status,200);assert.equal(cap.data.accountRole,a.kind.toUpperCase());const record=await api(a,'/api/account/adr-guided/'+a.caseId);assert.equal(record.status,200);assert.equal(record.data.case.revision,a.revision);results.checks[a.kind+'AdrPersistenceAfterLogout']=true;results.checks[a.kind+'SignInAfterLogout']=true;}
 results.checks.sessionLifecycleComplete=true;await save();}
 if(!results.checks.sameContextAccountSwitch){
 results.phase='same-context-account-switch';if(await session(p))await logout(p);await signIn({...p,kind:'specialist',credentials:s.credentials},'specialist');await p.page.waitForURL(/\/specialist(?:\/home)?$/,{timeout:20000});assert.equal((await api(p,'/api/account/capabilities')).data.accountRole,'SPECIALIST');results.checks.sameContextAccountSwitch=true;

 results.checks.sameContextAccountSwitch=true;await save();}

 delete results.error;delete results.pageDiagnostics;results.passed=true;results.phase='complete';await save();
}
