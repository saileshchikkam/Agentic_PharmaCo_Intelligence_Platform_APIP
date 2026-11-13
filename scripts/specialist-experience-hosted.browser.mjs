// Optional real hosted UI check. User enters credentials in Chrome, never this worker.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=await import(process.env.ADR_PLAYWRIGHT_MODULE||'playwright');
const dir=resolve('../phase3c-a-evidence/hosted');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:false}),context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage();
let capabilities200=false;p.on('response',r=>{if(new URL(r.url()).pathname==='/api/account/capabilities'&&r.status()===200)capabilities200=true;});
await p.goto('http://127.0.0.1:3301/#/sign-in/specialist');console.log('Hosted 3C-A Chrome ready. Sign in privately with the existing submitted/revoked synthetic applicant. No profile, authorization or case data will be changed.');
try{
 await p.locator('.specialist-service').first().waitFor({timeout:1800000});assert(capabilities200);assert.equal(await p.locator('.specialist-service').count(),3);
 for(const width of [320,360,820,1440]){
  await p.setViewportSize({width,height:1000});await p.evaluate(()=>scrollTo(0,0));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:resolve(dir,`dashboard-${width}.png`)});
  await p.getByRole('button',{name:'Professional profile',exact:true}).click();await p.getByRole('heading',{name:'Professional details',exact:true}).waitFor();
  await p.screenshot({path:resolve(dir,`profile-${width}.png`),mask:[p.getByRole('textbox',{name:'Full name',exact:true})],maskColor:'#e8eaed'});
  await p.getByRole('button',{name:'Back to workspace',exact:true}).click();await p.locator('.specialist-service').first().waitFor();
 }
 await p.reload();await p.locator('.specialist-service').first().waitFor();
 const status=await p.locator('.specialist-verification strong').innerText();await writeFile(resolve(dir,'results.json'),JSON.stringify({result:'PASS',mode:'real hosted Supabase Auth and PostgreSQL',capabilities:200,primaryCards:3,widths:[320,360,820,1440],status,sessionRestoration:'PASS',mutations:'none'},null,2));console.log('PASS actual hosted profile/dashboard, three cards, four widths, capabilities 200 and session restoration.');
}catch(e){console.log('Hosted UI verification incomplete: '+e.name);}
await new Promise(()=>{});
