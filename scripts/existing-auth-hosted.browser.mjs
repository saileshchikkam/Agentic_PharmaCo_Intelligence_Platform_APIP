import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {randomUUID} from 'node:crypto';
import {runSwitch} from './existing-auth-hosted-checks.mjs';
const origin='http://127.0.0.1:3602',provider='https://kstxwoitiistmvivwixd.supabase.co/auth/v1/';
const dir=resolve(process.env.APIP_AUTH_EVIDENCE);await mkdir(dir,{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.APIP_PLAYWRIGHT_MODULE).href);
const results={mode:'real hosted existing accounts, bounded single-context switch',checks:{},passed:false};
let browser;const actors=[];let deadline;
const save=()=>writeFile(join(dir,'result.json'),JSON.stringify(results,null,2));
const session=a=>a.page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('apip.cloud.auth')||'null');return s?.user&&s.access_token?{id:s.user.id,token:s.access_token}:null;});
async function api(a,path){const s=await session(a);if(!s)throw Error('SESSION_MISSING');const r=await fetch(origin+path,{headers:{Authorization:'Bearer '+s.token,'X-APIP-Account':s.id,Origin:origin,'Idempotency-Key':randomUUID()},signal:AbortSignal.timeout(12000)});return {status:r.status,data:await r.json()};}
async function loginPage(a,kind){
 await a.page.goto(origin+'/?switchcheck='+Date.now()+'#/sign-in/'+kind);
 await a.page.getByRole('heading',{name:kind==='patient'?'Patient Sign In':'Specialist Sign In',exact:true}).waitFor();
 await a.page.locator('md-dialog[open]').waitFor();
 await a.page.evaluate(async()=>{await Promise.all(document.getAnimations().map(x=>x.finished.catch(()=>{})));});
}
async function signIn(a,identity){
 await loginPage(a,identity.kind);
 await a.page.getByRole('textbox',{name:'Email',exact:true}).fill(identity.credentials.email);
 await a.page.locator('input[type=password]').fill(identity.credentials.password);
 const response=a.page.waitForResponse(r=>r.url().startsWith(provider+'token?grant_type=password')&&r.request().method()==='POST');void response.catch(()=>{});
 await a.page.getByRole('button',{name:'Sign in',exact:true}).click();
 if(!(await response).ok())throw Error('PASSWORD_GRANT_FAILED');
 await a.page.waitForURL(identity.kind==='patient'?/\/patient\/home$/:/\/specialist(?:\/home)?$/);
}
async function logout(a){
 const response=a.page.waitForResponse(r=>r.url().startsWith(provider+'logout')&&r.request().method()==='POST');void response.catch(()=>{});
 try{await a.page.getByRole('button',{name:'Sign out',exact:true}).click();if(!(await response).ok())throw Error('LOGOUT_FAILED');await a.page.waitForFunction(()=>!localStorage.getItem('apip.cloud.auth'));}
 catch(error){await response.catch(()=>{});throw error;}
}
try{
 browser=await chromium.launch({channel:'chrome',headless:false});
 // One fixed overall deadline: no indefinite waits, retries or polling files.
 deadline=setTimeout(()=>{void browser.close().catch(()=>{});},15*60*1000);
 for(const kind of ['patient','specialist']){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(20000);const a={kind,context,page};actors.push(a);
  page.on('request',r=>{if(!a.credentials&&r.url().startsWith(provider+'token?grant_type=password')&&r.method()==='POST'){const body=r.postDataJSON();a.credentials={email:body.email,password:body.password};}});
  await loginPage(a,kind);await page.evaluate(k=>{document.title='APIP SWITCH CHECK — EXISTING '+k.toUpperCase()+' — SIGN IN HERE';},kind);
 }
 results.phase='private-existing-logins';await save();console.log('READY: sign in privately in the two labeled existing-account windows. Maximum 10 minutes; no registration.');
 await runSwitch({actors,origin,results,session,api,signIn,logout,save});console.log('PASS: Patient → logout → Specialist → logout → Patient, verified subjects/roles, owner persistence and route denial.');
}catch(error){results.passed=false;results.error={phase:results.phase,type:/^[A-Za-z]+$/.test(error.name)?error.name:'Error',code:/^[A-Z_]+$/.test(error.message)?error.message:'BOUNDED_BROWSER_FAILURE'};await save();console.error(JSON.stringify(results.error));process.exitCode=1;}
finally{clearTimeout(deadline);for(const a of actors){a.credentials=null;await a.context.close().catch(()=>{});}await browser?.close().catch(()=>{});}
