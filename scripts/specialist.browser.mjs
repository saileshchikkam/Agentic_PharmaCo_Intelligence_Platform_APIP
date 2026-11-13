import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {startSpecialistFixture} from './specialist-fixture-runtime.ts';
const {chromium}=await import(process.env.ADR_PLAYWRIGHT_MODULE||'playwright');
const runtime=await startSpecialistFixture(process.argv.includes('--serve')?3300:0);
const evidence=resolve(process.env.APIP_SPECIALIST_EVIDENCE_DIR||'../phase3b-evidence');await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:!process.argv.includes('--serve')});
const results=[];
async function signup(page,email){
 await page.goto(runtime.origin+'/#/sign-in/specialist');
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.getByRole('textbox',{name:/^Email(?: address)?$/,exact:true}).fill(email);
 await page.getByRole('textbox',{name:'Password',exact:true}).fill('Fictional-fixture-only-123');
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.getByRole('heading',{name:'Your specialist workspace',exact:true}).waitFor();
 return page.evaluate(async()=> (await(await fetch('/api/account/session')).json()).user.id);
}
try{
 for(const width of (process.env.APIP_SPECIALIST_WIDTHS?process.env.APIP_SPECIALIST_WIDTHS.split(',').map(Number):process.argv.includes('--serve')?[1440]:[320,360,820,1440])){
  const patient=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),admin=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const p=await patient.newPage(),a=await admin.newPage();const errors=[],clinicalRequests=[];p.on('pageerror',e=>errors.push(e.message));a.on('pageerror',e=>errors.push(e.message));
  for(const page of [p,a])page.on('request',request=>{if(/\/api\/account\/adr-(guided|cases)/.test(request.url()))clinicalRequests.push(request.url());});
  await signup(p,`applicant-${width}@example.test`);
  await p.getByRole('textbox',{name:'Full name',exact:true}).waitFor({timeout:15000}).catch(async error=>{console.error('Fixture workspace diagnostic:',(await p.locator('body').innerText()).slice(0,1600));throw error;});
  await p.getByRole('textbox',{name:'Full name',exact:true}).fill('Fictional Specialist '+width);
  await p.getByRole('textbox',{name:'Qualification (fictional)',exact:true}).fill('Synthetic pharmacy qualification');
  await p.getByRole('textbox',{name:'Organization or institution (fictional)',exact:true}).fill('Fictional Institute');
  await p.getByRole('button',{name:'Create application draft',exact:true}).click();
  await p.getByRole('heading',{name:'DRAFT',exact:true}).waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'application fits viewport');await p.evaluate(()=>scrollTo(0,0));
  await p.screenshot({path:resolve(evidence,`application-${width}.png`)});
  await p.getByRole('button',{name:'Submit application',exact:true}).click();
  await p.getByRole('heading',{name:'SUBMITTED',exact:true}).waitFor();
  await p.evaluate(()=>scrollTo(0,0));
  await p.screenshot({path:resolve(evidence,`pending-${width}.png`)});
  const adminId=await signup(a,`administrator-${width}@example.test`);
  if(!results.length)await runtime.bootstrap(adminId);
  else{
   // Separate, explicit disposable fixture permission. This is never an email-based runtime grant.
   await runtime.db.query("insert into apip_identity.administrator_capabilities(subject,capability,provisioning_reference) values($1,'specialist.identity.admin','separate-width-fixture')",[adminId]);
  }
  await a.goto(runtime.origin+'/#/admin/specialist-applications');
  await a.getByRole('heading',{name:'Specialist applications',exact:true}).waitFor();
  await a.screenshot({path:resolve(evidence,`admin-list-${width}.png`)});
  await a.getByRole('button',{name:'Review application',exact:true}).last().click();
  await a.getByRole('heading',{name:'Independent identity review',exact:true}).waitFor();
  async function decision(action){
   await a.getByRole('button',{name:action,exact:true}).click();
   const d=a.locator('md-dialog');await a.getByRole('dialog').waitFor();
   await d.getByRole('textbox',{name:'Decision reason',exact:true}).fill('Fictional independent prototype check');
   await d.getByRole('textbox',{name:'Synthetic verification evidence reference',exact:true}).fill('synthetic-reference-'+width);
   await d.getByLabel('I independently reviewed this fictional application and confirm this decision').click();
   const bounds=await a.getByRole('dialog').boundingBox();assert(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1,'dialog is fully inside viewport');
   await a.screenshot({path:resolve(evidence,`decision-${action.replaceAll(' ','-')}-${width}.png`)});
   await d.getByRole('button',{name:'Confirm decision',exact:true}).focus();await a.keyboard.press('Enter');await a.getByRole('dialog').waitFor({state:'hidden'});
  }
  await decision('begin verification');await a.getByRole('heading',{name:'PENDING VERIFICATION',exact:true}).waitFor();
  await a.screenshot({path:resolve(evidence,`admin-detail-${width}.png`)});
  await decision('approve');await a.getByRole('heading',{name:'APPROVED',exact:true}).waitFor();
  await p.reload();await p.getByRole('heading',{name:'APPROVED',exact:true}).waitFor();
  await p.getByText('Your specialist identity is currently authorized.',{exact:true}).waitFor();
  await p.screenshot({path:resolve(evidence,`approved-${width}.png`)});
  await p.getByRole('button',{name:'Appearance settings',exact:true}).click();await p.getByRole('button',{name:'Dark mode',exact:true}).click();await p.keyboard.press('Escape');
  await p.screenshot({path:resolve(evidence,`dark-${width}.png`)});
  const applicationId=await p.evaluate(async()=>{
   const {user}=await(await fetch('/api/account/session')).json();
   return (await(await fetch('/api/account/identity-fixture/specialist/applications/current',{headers:{'X-APIP-Account':user.id}})).json()).application.id;
  });
  await runtime.db.query("update apip_identity.applications set valid_until=now()-interval '1 second' where id=$1",[applicationId]);
  await p.reload();await p.getByRole('heading',{name:'EXPIRED',exact:true}).waitFor();await p.screenshot({path:resolve(evidence,`expired-${width}.png`)});
  await a.reload();await a.getByRole('heading',{name:'EXPIRED',exact:true}).waitFor();await decision('renew');
  await a.getByRole('heading',{name:'APPROVED',exact:true}).waitFor();
  await decision('suspend');await p.reload();await p.getByRole('heading',{name:'SUSPENDED',exact:true}).waitFor();
  await p.screenshot({path:resolve(evidence,`suspended-${width}.png`)});
  await decision('revoke');await p.reload();await p.getByRole('heading',{name:'REVOKED',exact:true}).waitFor();
  await p.screenshot({path:resolve(evidence,`revoked-${width}.png`)});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.goto(runtime.origin+'/#/admin/specialist-applications');await p.locator('.specialist-notice').getByText('Your account is not authorized for identity administration.',{exact:true}).waitFor();
  const rejectedContext=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),rejected=await rejectedContext.newPage();
  const rejectedEmail=`rejected-${width}@example.test`;await signup(rejected,rejectedEmail);
  await rejected.getByRole('textbox',{name:'Full name',exact:true}).fill('Fictional Rejected Applicant');
  await rejected.getByRole('textbox',{name:'Qualification (fictional)',exact:true}).fill('Fictional qualification');
  await rejected.getByRole('button',{name:'Create application draft',exact:true}).click();await rejected.getByRole('heading',{name:'DRAFT',exact:true}).waitFor();
  await rejected.getByRole('button',{name:'Submit application',exact:true}).click();await rejected.getByRole('heading',{name:'SUBMITTED',exact:true}).waitFor();
  await a.goto(runtime.origin+'/#/admin/specialist-applications');await a.getByRole('button',{name:'Review application',exact:true}).click();
  await decision('reject');await rejected.reload();await rejected.getByRole('heading',{name:'REJECTED',exact:true}).waitFor();
  await rejected.screenshot({path:resolve(evidence,`rejected-${width}.png`)});
  await p.getByRole('button',{name:'Sign out',exact:true}).click();await p.getByRole('heading',{name:'Sign in',exact:true}).waitFor();
  await p.getByRole('textbox',{name:/^Email(?: address)?$/,exact:true}).fill(rejectedEmail);await p.getByRole('textbox',{name:'Password',exact:true}).fill('Fictional-fixture-only-123');
  await p.getByRole('button',{name:'Sign in',exact:true}).click();
  await p.locator('.specialist-notice').getByText('Your account is not authorized for identity administration.',{exact:true}).waitFor();
  await p.getByRole('button',{name:'Overview & profile',exact:true}).click();
  await p.getByRole('heading',{name:'REJECTED',exact:true}).waitFor();
  assert.equal(await p.getByRole('textbox',{name:'Full name',exact:true}).inputValue(),'Fictional Rejected Applicant');
  assert.deepEqual(clinicalRequests,[],'identity dashboards never request patient ADR records');
  assert.deepEqual(errors,[]);results.push({width,result:'PASS',backend:'disposable PostgreSQL, existing local test authentication'});
  console.log('PASS '+width+'px specialist application, admin confirmation, approval, revoked session, themes and denial');
  if(!process.argv.includes('--serve')){await patient.close();await admin.close();await rejectedContext.close();}
 }
 await writeFile(resolve(evidence,'results.json'),JSON.stringify(results,null,2));
 if(process.argv.includes('--serve')){console.log('DISPOSABLE FIXTURE PREVIEW '+runtime.origin+'/#/sign-in/specialist');await new Promise(()=>{});}
}finally{await browser.close();await runtime.close();}
