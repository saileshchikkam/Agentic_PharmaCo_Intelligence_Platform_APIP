import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createServer} from 'vite';
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE||'playwright');
const base=resolve('models/medassist_ai/evaluation/emergency-recognition-phase2');
const sha=x=>createHash('sha256').update(x).digest('hex');
const write=(name,x)=>writeFileSync(resolve(base,name),JSON.stringify(x,null,2)+'\n',{flag:'wx'});
const bytes=readFileSync(resolve(base,'independent-scenarios.json'));
const bf=JSON.parse(readFileSync(resolve(base,'independent-browser-freeze.json'),'utf8'));
if(sha(bytes)!==bf.sha256)throw Error('Frozen scenario hash mismatch');
const im=readFileSync(resolve(base,'implementation-freeze.json'));
if(sha(im)!==process.env.MEDASSIST_IMPLEMENTATION_FREEZE_SHA256)throw Error('Frozen implementation manifest mismatch');
for(const [f,h] of Object.entries(JSON.parse(im).files))if(sha(readFileSync(f))!==h)throw Error('Frozen source mismatch '+f);
write('independent-browser-start.json',{at_utc:new Date().toISOString(),scenario_sha256:sha(bytes),implementation_freeze_sha256:sha(im),policy:'One execution per frozen scenario. No reruns or implementation changes. All providers are local browser transport fixtures; no real inference.'});
const metadata=JSON.parse(readFileSync('models/medassist_ai/docs/symptom-schema-metadata.json','utf8')).items;
const vocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:metadata.filter(d=>!d.quarantined).map(d=>({...d,initial_allowed:d.kind==='symptom'&&!d.parent,value_labels:Object.fromEntries(Object.entries(d.value_labels).filter(([,v])=>typeof v==='string'))})),coverage:{symptom_fields:110,universal_coverage:false}};
const scenarios=JSON.parse(bytes).scenarios;
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0}});let browser;
const rows=[];
try{
 await server.listen();await server.watcher.close();browser=await chromium.launch({channel:'chrome',headless:true});
 for(const scenario of scenarios){
  const row={id:scenario.id,name:scenario.name,viewport:scenario.viewport,expected:scenario.expected,actions:[],network:[],page_errors:[],gaps:[],checks:{},patient_annotation_or_evidence_mutation:'unverified: no session evidence export available in initial emergency-only route'};rows.push(row);
  const context=await browser.newContext({viewport:{width:scenario.viewport[0],height:scenario.viewport[1]},reducedMotion:'reduce',serviceWorkers:'block',geolocation:{latitude:17.385,longitude:78.4867,accuracy:40}});
  const page=await context.newPage();page.setDefaultTimeout(5000);
  page.on('pageerror',e=>row.page_errors.push(e.message));
  let pending=null,pendingResolve=null;const pendingObserved=new Promise(r=>pendingResolve=r);
  page.on('request',r=>{if(r.url().includes('/api/'))row.network.push({event:'request_attempt',method:r.method(),url:new URL(r.url()).pathname,body:r.postData(),at:Date.now()})});
  page.on('response',r=>{if(r.url().includes('/api/'))row.network.push({event:'fixture_response_received',url:new URL(r.url()).pathname,status:r.status(),at:Date.now()})});
  page.on('requestfailed',r=>{if(r.url().includes('/api/'))row.network.push({event:'request_failed',url:new URL(r.url()).pathname,error:r.failure()?.errorText,at:Date.now()})});
  await page.addInitScript(()=>{window.__independentUiEvents=[];document.addEventListener('keydown',e=>{if(e.key==='Enter')window.__independentUiEvents.push({type:'Enter',tag:e.target?.tagName,id:e.target?.id,within_composer:!!e.target?.closest?.('form.conversation-input')})},true);document.addEventListener('click',e=>{const a=e.target?.closest?.('a');if(a&&(/^(tel:|https?:)/.test(a.href))&&!a.href.includes('127.0.0.1'))e.preventDefault()},true)});
  await page.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(!['127.0.0.1','localhost'].includes(u.hostname)){row.network.push({event:'nonlocal_attempt_aborted',url:u.origin+u.pathname});return route.abort('blockedbyclient')}
   const p=u.pathname;
   if(!p.startsWith('/api/'))return route.continue();
   if(p.endsWith('/model-a/language'))return route.fulfill({json:{schema_version:'medassist.language-status.v2',configured:true,provider:'groq-cloud',model:'qwen/qwen3.8-27b',timeout_ms:15000}});
   if(p.endsWith('/natural/vocabulary'))return route.fulfill({json:vocabulary});
   if(p.endsWith('/natural/extract')){
    if(scenario.id==='P2B-03'){pending=route;pendingResolve(true);return new Promise(done=>{route.__done=done})}
    if(scenario.id==='P2B-02'){await new Promise(r=>setTimeout(r,18000));return route.fulfill({status:504,json:{error:'PROVIDER_TIMEOUT'}}).catch(e=>row.gaps.push('Timeout fixture could not deliver: '+String(e)))}
    if(scenario.id==='P2B-11')return route.fulfill({status:503,json:{error:'PROVIDER_UNAVAILABLE'}});
    return route.abort('failed');
   }
   row.network.push({event:'unexpected_local_api_aborted',url:p});return route.abort('blockedbyclient');
  });
  try{
   await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded',timeout:60000});await page.getByText('Ready to listen',{exact:false}).waitFor();
   async function submit(text){
    const box=page.locator('#fictional-description');const action={kind:'normal_composer_fill_then_Enter',text};row.actions.push(action);
    if(await box.isDisabled()){action.blocked='Emergency latch disabled the normal composer before input';return false}
    await box.fill(text);action.disabled_after_input=await box.isDisabled();
    const before=await page.evaluate(()=>window.__independentUiEvents.length);
    try{await box.press('Enter',{timeout:1500});action.enter_press_api_completed=true}catch(e){action.enter_press_error=String(e)}
    await page.waitForTimeout(150);
    action.enter_events=await page.evaluate(n=>window.__independentUiEvents.slice(n),before);
    action.enter_reached_composer=action.enter_events.some(e=>e.within_composer);
    action.transcript_contains_text=await page.locator('.conversation-user').filter({hasText:text}).count()>0;
    action.emergency_visible=await page.getByRole('alert',{name:'Emergency help',exact:true}).count()>0;
    action.safety_clarification_visible=await page.getByRole('alert',{name:'Safety clarification',exact:true}).count()>0;
    if(action.disabled_after_input&&!action.enter_reached_composer)row.gaps.push('Emergency was processed on input and disabled/focused away from composer before Enter; this is not an Enter-submitted emergency.');
    return true;
   }
   const texts=scenario.steps.map(s=>s.match(/submit using Enter: (.*)$/i)?.[1]).filter(Boolean);
   if(scenario.id==='P2B-03'){
    await submit(texts[0]);const dispatched=await Promise.race([pendingObserved,new Promise(r=>setTimeout(()=>r(false),3000))]);row.checks.actual_pending_extraction_dispatched=dispatched;
    if(!dispatched)row.gaps.push('Actual pending extraction did not dispatch; delayed-conflicting-provider test unverified.');
    await submit(texts[1]);row.checks.emergency_before_late_reply=await page.getByRole('alert',{name:'Emergency help',exact:true}).count()===1;
    if(pending){try{await pending.fulfill({json:{schema_version:'medassist.natural-extraction.v1',observations:[{evidence_id:'E_53',state:'confirmed',value:true,quote:'head has been aching'}],unmapped:[],instruction_attempt:false}});row.checks.late_fixture_fulfill_attempted=true}catch(e){row.gaps.push('Late response could not be delivered: '+String(e))}finally{pending.__done?.();pending=null}}
    await page.waitForTimeout(300);row.checks.emergency_after_late_reply=await page.getByRole('alert',{name:'Emergency help',exact:true}).count()===1;row.checks.routine_confirmation_visible=await page.getByRole('button',{name:'Confirm these details',exact:true}).count()>0;
    row.gaps.push('Original AbortSignal preserved; a fixture fulfill attempt is not proof that an aborted response reached application processing. Fixture observation uses a valid evidence-code shape, not real inference.');
   }else{
    for(const text of texts)await submit(text);
   }
   if(scenario.id==='P2B-07'||scenario.id==='P2B-08'){
    if(scenario.id==='P2B-07')await context.grantPermissions([],{origin:server.resolvedUrls.local[0]});
    if(scenario.id==='P2B-08')await context.grantPermissions(['geolocation'],{origin:server.resolvedUrls.local[0]});
    row.checks.browser_geolocation_permission=await page.evaluate(async()=> (await navigator.permissions.query({name:'geolocation'})).state);
    const locate=page.getByRole('button',{name:'Use my location',exact:true});
    if(await locate.count()){
     await locate.click();await page.waitForTimeout(400);
     row.checks.location_denial_visible=await page.getByText('Location permission was denied.',{exact:false}).count()>0;
     row.checks.location_granted_receipt_visible=await page.getByText('Approximate device coordinates ready.',{exact:false}).count()>0;
     row.checks.coordinates_displayed=await page.locator('#conversation-navigation-location').inputValue();
     row.checks.location_not_sent_to_backend_without_prepare=!row.network.some(n=>n.url?.includes('/navigation/'));
    }else row.gaps.push('Location controls unavailable in observed safety state; permission scenario unverified.');
   }
   if(scenario.id==='P2B-02'&&row.network.some(n=>n.event==='request_attempt'&&n.url?.endsWith('/natural/extract')))await page.waitForTimeout(18000);
   row.checks.emergency_visible=await page.getByRole('alert',{name:'Emergency help',exact:true}).count()===1;
   row.checks.clarification_visible=await page.getByRole('alert',{name:'Safety clarification',exact:true}).count()===1;
   row.checks.emergency_link_visible=await page.getByRole('link',{name:'Call 112 in India',exact:true}).count()===1;
   row.checks.routine_confirmation_visible=await page.getByRole('button',{name:'Confirm these details',exact:true}).count()>0;
   row.checks.session_export_available=await page.getByRole('button',{name:'Download session',exact:true}).count()>0;
   row.checks.composer_disabled=await page.locator('#fictional-description').isDisabled();
   row.checks.horizontal_overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   row.checks.livepage_errors=row.page_errors.length;
   row.ui_body=await page.locator('body').innerText();row.transcript=await page.locator('.conversation-messages').innerText();row.ui_events=await page.evaluate(()=>window.__independentUiEvents);
   row.checks.extraction_attempts=row.network.filter(n=>n.event==='request_attempt'&&n.url?.endsWith('/natural/extract')).length;
   row.checks.successful_fixture_extraction_responses=row.network.filter(n=>n.event==='fixture_response_received'&&n.url?.endsWith('/natural/extract')&&n.status===200).length;
   row.checks.actual_local_or_cloud_model_inference=0;
   if(['P2B-02','P2B-11'].includes(scenario.id)&&!row.checks.extraction_attempts)row.gaps.push('No provider request occurred for direct safety input; provider timeout/failure delivery was not exercised by this scenario.');
   if(['P2B-04','P2B-05'].includes(scenario.id)&&row.actions.some(a=>a.blocked))row.gaps.push('Repetition/correction submissions were blocked by the emergency-disabled composer; no submitted correction/repetition behavior was observed.');
   row.outcome=scenario.id==='P2B-10'?(!row.checks.emergency_visible?'negative_control_no_emergency':'false_emergency'):
    scenario.id==='P2B-09'?(row.checks.emergency_visible||row.checks.clarification_visible?'no_routine_continuation':'ambiguous_routine_continuation'):
    row.checks.emergency_visible?'emergency_visible':'emergency_missing';
   const shot=await page.screenshot({fullPage:true});writeFileSync(resolve(base,`independent-browser-${scenario.id}.png`),shot,{flag:'wx'});
  }catch(e){row.error=String(e);row.gaps.push('Scenario failed during one execution; not retried.');}
  finally{if(pending){try{await pending.abort()}catch{}pending.__done?.();pending=null}await context.close();write(`independent-browser-${scenario.id}.json`,row)}
 }
 write('independent-browser-results.json',{schema_version:1,completed_at_utc:new Date().toISOString(),scenario_sha256:sha(bytes),implementation_freeze_sha256:sha(im),clinical_status:'AI-assisted fictional engineering integration; not clinical validation',execution_policy:'Each frozen scenario executed once; no route code removed AbortSignal; no case retry. Emergency-on-input is distinguished from Enter submission.',actual_inference_count:0,cloud_network_success:0,external_calls_dispatch_maps_opened:0,rows});
 console.log(JSON.stringify(rows.map(r=>({id:r.id,outcome:r.outcome,checks:r.checks,gaps:r.gaps,error:r.error}))));
}catch(e){write('independent-browser-process-failure.json',{error:String(e),rows});throw e}
finally{await browser?.close();await server.close()}
