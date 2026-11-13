// Real hosted diagnosis/verification. No passwords or tokens leave Chrome.
import assert from 'node:assert/strict';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {watch} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=await import(process.env.ADR_PLAYWRIGHT_MODULE||'playwright');
const evidence=resolve('../phase3b-evidence/hosted-repair');await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:false});
const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
const failures=[],success=[];
page.on('response',async response=>{
 if(new URL(response.url()).pathname!=='/api/account/capabilities')return;
 if(response.status()===503){const body=await response.json().catch(()=>({}));failures.push({status:503,error:body.error==='SPECIALIST_UNAVAILABLE'?body.error:'OTHER_BOUNDED_ERROR'});
  await writeFile(resolve(evidence,'failed-request.json'),JSON.stringify(failures,null,2));console.log('CAPABILITIES HTTP 503 SPECIALIST_UNAVAILABLE');}
 if(response.status()===200)success.push(200);
});
await page.goto('http://127.0.0.1:3301/#/sign-in/specialist');
console.log('Private hosted repair Chrome window ready. Sign in with an existing synthetic applicant. This worker remains open across the approved repair.');
try{
 await page.getByRole('heading',{name:'Your specialist workspace',exact:true}).waitFor({timeout:1800000});
 await page.getByRole('button',{name:'Retry connection',exact:true}).waitFor({timeout:20000});
 await page.screenshot({path:resolve(evidence,'before.png')});
 const flag=resolve(evidence,'approved-repair-applied.flag');
 await new Promise(async(resolveResult,reject)=>{
  const timer=setTimeout(()=>{watcher.close();reject(Error('HOSTED_APPROVAL_PENDING'));},1800000);
  const check=async()=>{try{await access(flag);clearTimeout(timer);watcher.close();resolveResult();}catch{/* wait for file notification only */}};
  const watcher=watch(evidence,()=>void check());await check();
 });
 // The normal capability refresh may already remove Retry after the repair commits.
 const retry=page.getByRole('button',{name:'Retry connection',exact:true});
 if(await retry.isVisible())await retry.click({timeout:2000}).catch(()=>{});
 await page.getByRole('heading',{name:'Professional profile',exact:true}).waitFor({timeout:20000});
 assert(success.length>0);
 const fullName=page.getByRole('textbox',{name:'Full name',exact:true});
 if(await page.getByRole('button',{name:'Create application draft',exact:true}).count()){
  await fullName.fill('Fictional Hosted Specialist');
  await page.getByRole('textbox',{name:'Qualification (fictional)',exact:true}).fill('Synthetic pharmacovigilance qualification');
  await page.getByRole('textbox',{name:'Organization or institution (fictional)',exact:true}).fill('Fictional Academic Institute');
  await page.getByRole('button',{name:'Create application draft',exact:true}).click();await page.getByRole('heading',{name:'DRAFT',exact:true}).waitFor();
  await page.reload();await page.getByRole('heading',{name:'DRAFT',exact:true}).waitFor();assert.equal(await fullName.inputValue(),'Fictional Hosted Specialist');
  await page.getByRole('textbox',{name:'Department or professional role',exact:true}).fill('Fictional safety department');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();
  await page.getByRole('button',{name:'Submit application',exact:true}).waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('.specialist-actions md-outlined-button')?.disabled);
  await page.getByRole('button',{name:'Submit application',exact:true}).click();await page.getByRole('heading',{name:'SUBMITTED',exact:true}).waitFor();
 }
 const state=await page.locator('.specialist-status h2').innerText();
 await page.reload();await page.getByRole('heading',{name:state,exact:true}).waitFor();
 assert(!await page.getByText('Specialist services are unavailable. Your entered information is preserved. Please retry.',{exact:true}).count());
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(evidence,'after-1440.png'),mask:[page.getByText(/^Signed-in account:/)]});
 await page.setViewportSize({width:360,height:900});await page.screenshot({path:resolve(evidence,'after-360.png'),mask:[page.getByText(/^Signed-in account:/)]});
 await page.goto('http://127.0.0.1:3301/#/admin/specialist-applications');await page.locator('.specialist-notice').getByText('Your account is not authorized for identity administration.',{exact:true}).waitFor();
 await page.goto('http://127.0.0.1:3301/#/specialist');
 await writeFile(resolve(evidence,'result.json'),JSON.stringify({result:'PASS',before:failures[0],after:{status:200,state},mode:'real hosted Supabase Auth and PostgreSQL',profileSave:'PASS',reloadAndSessionRestoration:'PASS',administratorDenial:'PASS'},null,2));
 console.log('PASS hosted capabilities 200, saved profile, submitted status, reload/session restoration and administrator denial.');
}catch(error){console.log('Hosted repair worker stopped: '+error.name);await writeFile(resolve(evidence,'worker-error.json'),JSON.stringify({result:'BLOCKED',type:error.name},null,2));}
await new Promise(()=>{});
