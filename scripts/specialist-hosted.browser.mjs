// Optional real hosted check. Credentials are entered by the user in Chrome only.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=await import(process.env.ADR_PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.APIP_SPECIALIST_HOSTED_ORIGIN||'http://127.0.0.1:3301';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw Error('PRIVATE_LOOPBACK_ONLY');
const evidence=resolve(process.env.APIP_SPECIALIST_EVIDENCE_DIR||'../phase3b-evidence');await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:false});
const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
const codes=[];page.on('response',response=>{const pathname=new URL(response.url()).pathname;if(pathname==='/api/account/capabilities')codes.push(response.status());});
await page.goto(origin+'/#/sign-in/specialist');
await page.getByRole('heading',{name:'Sign in',exact:true}).waitFor();
await page.screenshot({path:resolve(evidence,'hosted-sign-in-1440.png')});
console.log('Hosted specialist sign-in window ready. Enter an existing synthetic applicant account privately. No administrator bootstrap is performed.');
try{
 await page.getByRole('heading',{name:'Your specialist workspace',exact:true}).waitFor({timeout:600000});
 await page.getByRole('heading',{name:'Professional profile',exact:true}).waitFor();
 assert(codes.includes(200));
 if(await page.getByRole('button',{name:'Create application draft',exact:true}).count()){
  await page.getByRole('textbox',{name:'Full name',exact:true}).fill('Fictional Hosted Applicant');
  await page.getByRole('textbox',{name:'Qualification (fictional)',exact:true}).fill('Synthetic academic qualification');
  await page.getByRole('textbox',{name:'Organization or institution (fictional)',exact:true}).fill('Fictional Institute');
  await page.getByRole('button',{name:'Create application draft',exact:true}).click();await page.getByRole('heading',{name:'DRAFT',exact:true}).waitFor();
  await page.reload();await page.getByRole('heading',{name:'DRAFT',exact:true}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Full name',exact:true}).inputValue(),'Fictional Hosted Applicant');
  await page.getByRole('button',{name:'Submit application',exact:true}).click();await page.getByRole('heading',{name:'SUBMITTED',exact:true}).waitFor();
 }
 for(const width of [320,360,820,1440]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // Hide account email in evidence; it is never copied into output files.
  await page.screenshot({path:resolve(evidence,`hosted-application-${width}.png`),mask:[page.getByText(/^Signed-in account:/)]});
 }
 await page.goto(origin+'/#/admin/specialist-applications');
 await page.getByText('Your account is not authorized for identity administration.',{exact:true}).waitFor();
 await writeFile(resolve(evidence,'hosted-browser-results.json'),JSON.stringify({authentication:'PASS real Supabase sign-in',capabilities:'PASS HTTP 200',ownApplication:'PASS saved and reloaded',administratorImpersonation:'PASS denied',hostedPrivilegedWorkflow:'BLOCKED administrator bootstrap unauthorized',widths:[320,360,820,1440]},null,2));
 console.log('PASS real hosted Auth, capabilities, saved application, reload and administrator denial. Privileged hosted decisions remain blocked.');
}catch(error){console.error('Hosted browser check incomplete: '+(error.name||'Error'));process.exitCode=1;}
// Leave the user-visible preview open after verification; Ctrl+C ends the worker.
await new Promise(()=>{});
