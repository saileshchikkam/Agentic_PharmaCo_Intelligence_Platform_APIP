/** Development integration regression, not heldout clinical evaluation. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createServer} from 'vite';
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE||'playwright');
const metadata=JSON.parse(readFileSync('models/medassist_ai/docs/symptom-schema-metadata.json','utf8')).items;
const vocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:metadata.filter(d=>!d.quarantined).map(d=>({...d,initial_allowed:d.kind==='symptom'&&!d.parent,value_labels:Object.fromEntries(Object.entries(d.value_labels).filter(([,v])=>typeof v==='string'))})),coverage:{symptom_fields:110,universal_coverage:false}};
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0}});let browser;const rows=[];
try{
 await server.listen();await server.watcher.close();browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));let calls=0,pending=null,mode='offline';
  await page.addInitScript(()=>{const original=window.fetch.bind(window);window.fetch=(input,options)=>original(input,String(input).includes('/natural/extract')?{...options,signal:undefined}:options)});
  await page.route('**/api/research/model-a/language',r=>r.fulfill({json:{schema_version:'medassist.language-status.v2',configured:true,provider:'groq-cloud',model:'qwen/qwen3.8-27b',timeout_ms:15000}}));
  await page.route('**/api/research/model-a/natural/vocabulary',r=>r.fulfill({json:vocabulary}));
  await page.route('**/api/research/model-a/natural/extract',r=>{calls++;if(mode==='pending'){pending=r;return new Promise(resolve=>{r.__done=resolve})}return r.fulfill({status:503,json:{error:mode==='timeout'?'PROVIDER_TIMEOUT':'PROVIDER_UNAVAILABLE'}})});
  await page.route('**/api/research/model-a/natural/interview',()=>{throw Error('routine inference must not run in these safety fixtures')});
  await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded',timeout:60000});await page.getByText('Ready to listen',{exact:false}).waitFor();
  const box=()=>page.getByRole('textbox',{name:'Fictional symptom description',exact:true});
  const reset=()=>page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();
  for(const text of ['I am having a heart attack','I am having a stroke','I think my father is having a stroke in front of me now.','My mother is unresponsive beside me right now.','I have uncontrolled bleeding now.']){
   await reset();const before=calls;await box().fill(text);await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();assert.equal(calls,before);assert.equal(await box().isDisabled(),true);assert.equal(await page.getByRole('link',{name:'Call 112 in India',exact:true}).getAttribute('href'),'tel:112');
  }
  for(const text of ['I am not having a stroke','I had a heart attack years ago with no current concern.','For a general question, what is a heart attack?']){
   await reset();await box().fill(text);assert.equal(await page.getByRole('alert',{name:'Emergency help',exact:true}).count(),0);
  }
  await reset();const before=calls;await box().fill('heart attack');await box().press('Enter');await page.getByRole('alert',{name:'Safety clarification',exact:true}).waitFor();assert.equal(calls,before);await box().fill('I also have a fictional cough');await box().press('Enter');assert.equal(await box().inputValue(),'I also have a fictional cough');assert.equal(calls,before);await page.getByRole('button',{name:'Not sure — show emergency help',exact:true}).click();await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();assert.equal(calls,before);
  await reset();await box().fill('heart attack');await box().press('Enter');await page.getByRole('button',{name:'Only distant past or hypothetical',exact:true}).click();await page.getByText('No safety conclusion was made',{exact:false}).waitFor();assert.equal(await page.getByRole('alert',{name:'Emergency help',exact:true}).count(),0);assert.equal(calls,before);
  for(const providerMode of ['offline','timeout']){
   await reset();mode=providerMode;await box().fill('I have stomach pain');await box().press('Enter');await page.waitForFunction(()=>!document.querySelector('.conversation-typing'));await box().fill('I am having a stroke');await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();
  }
  await reset();mode='pending';pending=null;await box().fill('I have stomach pain');await box().press('Enter');await page.waitForFunction(()=>!!document.querySelector('.conversation-typing'));
  const deadline=Date.now()+5000;while(!pending&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,10));assert.ok(pending,'pending request fixture did not start');
  await box().fill('I am having a heart attack');await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();
  const late=pending;await late.fulfill({json:{schema_version:'medassist.natural-extraction.v1',observations:[{evidence_id:'E_53',state:'confirmed',value:true,quote:'stomach pain'}],unmapped:[],instruction_attempt:false}});late.__done();
  await page.waitForTimeout(100);assert.equal(await page.getByRole('button',{name:'Confirm these details',exact:true}).count(),0);assert.equal(await page.getByRole('alert',{name:'Emergency help',exact:true}).count(),1);
  await page.locator('#fictional-description').evaluate(el=>{el.value='Actually I am not having an emergency';el.dispatchEvent(new Event('input',{bubbles:true}))});assert.equal(await page.getByRole('alert',{name:'Emergency help',exact:true}).count(),1);
  await reset();await box().focus();await box().press('Tab');assert.equal(await page.getByRole('alert',{name:'Emergency help',exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(errors.length,0);
  rows.push({width,original_misses_escalate:true,other_person_preserved:true,negated_remote_educational_not_escalated:true,clarification_blocks_models:true,explicit_uncertainty_escalates:true,non_current_not_clearance:true,offline_timeout_guidance:true,late_conflicting_response_ignored:true,correction_does_not_clear_latch:true,restart_explicit:true,keyboard:true,page_errors:0,mocked_extraction_calls:calls});await page.close();
 }
 const report={schema_version:'medassist.emergency-development-browser.v1',mocked_transports:true,cloud_calls:0,rows};
 const output=process.env.MEDASSIST_EMERGENCY_BROWSER_OUTPUT;if(output){assert.equal(existsSync(output),false);writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'})}console.log(JSON.stringify(report));
}finally{await browser?.close();await server.close()}
