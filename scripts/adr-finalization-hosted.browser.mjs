// Explicit, bounded existing-account acceptance. Tokens stay in browser memory.
// Creates one new fictional report per actor; never edits pre-existing reports.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const origin='http://127.0.0.1:3602';
const out=resolve(process.env.APIP_AUTH_EVIDENCE);
await mkdir(out,{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.APIP_PLAYWRIGHT_MODULE).href);
const result={mode:'real hosted PostgreSQL and Supabase Auth; existing accounts',checks:{},actors:{},passed:false};
const save=()=>writeFile(join(out,'result.json'),JSON.stringify(result,null,2));
let browser,timer;const actors=[];
async function api(a,path,body,key){
 return a.page.evaluate(async({path,body,key})=>{
  const s=JSON.parse(localStorage.getItem('apip.cloud.auth')||'null');
  if(!s?.access_token)throw Error('SESSION_MISSING');
  const r=await fetch(path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+s.access_token,'X-APIP-Account':s.user.id,'Content-Type':'application/json','Idempotency-Key':key||crypto.randomUUID()},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
  return {status:r.status,data:await r.json()};
 },{path,body,key});
}
const guided=id=>'/api/account/adr-guided/'+id;
try{
 browser=await chromium.launch({channel:'chrome',headless:false});
 timer=setTimeout(()=>{void browser.close().catch(()=>{});},20*60*1000);
 for(const role of ['PATIENT','SPECIALIST']){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(25000);
  const a={role,context,page};actors.push(a);
  await page.goto(origin+'/#/sign-in/'+role.toLowerCase());
  await page.getByRole('heading',{name:role==='PATIENT'?'Patient Sign In':'Specialist Sign In',exact:true}).waitFor();
  await page.evaluate(role=>{document.title='APIP FINALIZATION — EXISTING '+role+' — SIGN IN HERE';},role);
 }
 result.phase='private-sign-in';await save();console.log('READY private existing-account Patient and Specialist sign-in; no registration or approvals.');
 for(const a of actors){
  await a.page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('apip.cloud.auth')||'null')?.access_token,null,{timeout:600000});
  const cap=await api(a,'/api/account/capabilities');assert.equal(cap.status,200);assert.equal(cap.data.accountRole,a.role);a.subject=await a.page.evaluate(()=>JSON.parse(localStorage.getItem('apip.cloud.auth')).user.id);
 }
 assert.notEqual(actors[0].subject,actors[1].subject);
 for(const a of actors){
  result.phase=a.role+'-finalization';await save();
  let r=await api(a,'/api/account/adr-guided',{fictionalOnly:true});assert.equal(r.status,201);let c=r.data.case;a.caseId=c.id;
  r=await api(a,guided(c.id)+'/completeness');assert.equal(r.status,200);assert.equal(r.data.available,true);assert.equal(r.data.ready,false);
  r=await api(a,guided(c.id)+'/finalize',{expectedRevision:c.revision,confirmed:true});assert.equal(r.status,422);assert.equal(r.data.error,'INCOMPLETE_REPORT');
  const fields={caseType:'Initial',initials:'FX',age:'32',gender:'Female',weight:null,reaction:'Fictional itching for software testing only',reactionStart:'2026-11-01',reactionStop:null,reporterName:'Fictional reporter',email:'fictional@example.test',[`med.${c.medications[0].id}.name`]:'Fictional medicine'};
  for(const [key,value]of Object.entries(fields)){r=await api(a,guided(c.id)+'/command',{expectedRevision:c.revision,command:{type:'confirm',key,value}});assert.equal(r.status,200);c=r.data.case;}
  a.revision=c.revision;r=await api(a,guided(c.id)+'/completeness');assert.equal(r.status,200);assert.equal(r.data.ready,true);
  r=await api(a,guided(c.id)+'/finalize',{expectedRevision:c.revision-1,confirmed:true});assert.equal(r.status,409);assert.equal(r.data.error,'REVISION_CONFLICT');
  const other=actors.find(x=>x!==a);assert.equal((await api(other,guided(c.id))).status,404);assert.equal((await api(other,guided(c.id)+'/finalize',{expectedRevision:c.revision,confirmed:true})).status,404);
  await a.page.goto(origin+'/#/preview/adr-report?case='+c.id);
  const button=a.page.getByRole('button',{name:'Finalize report',exact:true});await button.waitFor();await button.click();
  await a.page.getByText('Finalize this saved report?',{exact:true}).waitFor();
  const response=a.page.waitForResponse(r=>r.url().endsWith('/'+c.id+'/finalize')&&r.request().method()==='POST');void response.catch(()=>{});
  await a.page.getByRole('button',{name:'Confirm finalization',exact:true}).click();const finalized=await response;assert.equal(finalized.status(),200);const posted=finalized.request().postDataJSON();const command=finalized.request().headers()['idempotency-key'];assert(command);
  const receipt=(await finalized.json()).finalization;assert.equal(receipt.revision,c.revision);assert.equal(receipt.content_sha256.length,64);
  await a.page.getByRole('heading',{name:'Finalized report',exact:true}).waitFor();assert.equal(await a.page.getByRole('button',{name:'Save progress',exact:true}).count(),0);
  r=await api(a,guided(c.id)+'/finalize',posted,command);assert.equal(r.status,200);assert.deepEqual(r.data.finalization,receipt);
  r=await api(a,guided(c.id)+'/finalize',posted);assert.equal(r.status,409);assert.equal(r.data.error,'ALREADY_FINALIZED');
  r=await api(a,guided(c.id)+'/command',{expectedRevision:c.revision,command:{type:'confirm',key:'age',value:'33'}});assert.equal(r.status,409);assert.equal(r.data.error,'REPORT_FINALIZED');
  const unchanged=await api(a,guided(c.id));assert.equal(unchanged.data.case.revision,c.revision);assert.equal(unchanged.data.case.values.weight.state,'unknown');assert.equal(unchanged.data.case.values.reactionStop.state,'unknown');
  for(const width of [1440,375]){
   await a.page.setViewportSize({width,height:1000});
   if(width<1000)await a.page.getByRole('button',{name:'Show form preview',exact:true}).click();
   await a.page.getByRole('img',{name:'Live preview of the original PvPI form, page 1',exact:true}).waitFor({state:'visible'});
   assert(await a.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await a.page.evaluate(()=>window.scrollTo(0,0));
   await a.page.screenshot({path:join(out,a.role+'-'+width+'.png'),fullPage:true,animations:'disabled'});
  }
  const download=a.page.waitForEvent('download');void download.catch(()=>{});
  await a.page.locator('a.adr-download').click();const file=await download;assert.equal(await file.failure(),null);const filePath=join(out,a.role+'.pdf');await file.saveAs(filePath);
  const pdfData=await a.page.evaluate(async()=>Array.from(new Uint8Array(await(await fetch(document.querySelector('a.adr-download').href)).arrayBuffer())));
  const {readFile}=await import('node:fs/promises');assert.deepEqual(Buffer.from(pdfData),await readFile(filePath));
  await a.page.reload();await a.page.getByRole('heading',{name:'Finalized report',exact:true}).waitFor();
  r=await api(a,'/api/account/adr-cases?status=finalized');assert.equal(r.status,200);assert(r.data.cases.some(x=>x.id===c.id&&x.status==='finalized'));
  r=await api(a,'/api/account/adr-guided?limit=25');assert.equal(r.status,200);assert(!r.data.cases.some(x=>x.id===c.id));
  await a.page.goto(origin+'/#/patient/adr/cases');await a.page.getByRole('button',{name:'View finalized report',exact:true}).first().waitFor();
  const foreign=await api(other,'/api/account/adr-cases/'+c.id+'/revisions/'+c.revision);assert.equal(foreign.status,404);
  const foreignPdf=await api(other,'/api/account/adr-cases/'+c.id+'/revisions/'+c.revision+'/pdf',{});assert.equal(foreignPdf.status,404);
  const directory=await api(a,'/api/sharing/directory');result.actors[a.role]={incompleteRejection:422,staleConflict:409,finalize:200,idempotentReplay:200,repeatConflict:409,contentLocked:409,crossOwnerRead:404,crossOwnerFinalize:404,crossOwnerPdf:404,optionalUnknownPreserved:true,previewAndDownloadSameBytes:true,finalizedList:true,notResumable:true,refreshReadOnly:true,widths:[1440,375],sharingDirectoryStatus:directory.status,sharingError:directory.data.error??null,eligibleRecipients:directory.data.specialists?.length??null};
  await save();console.log('PASS hosted '+a.role+' incomplete/complete finalization, immutable lock, replay, ownership, PDF, reload, list and both widths.');
 }
 result.phase='complete';result.passed=true;await save();console.log('PASS real hosted finalization both account portals; sharing eligibility reported separately.');
}catch(e){result.error={phase:result.phase,code:/^[A-Z_]+$/.test(e.message)?e.message:'HOSTED_ASSERTION_FAILED',type:e.name};await save();console.error(JSON.stringify(result.error));process.exitCode=1;}
finally{clearTimeout(timer);for(const a of actors){a.subject=null;await a.context?.close().catch(()=>{});}await browser?.close().catch(()=>{});}
