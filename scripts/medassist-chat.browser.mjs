/** Fictional transport fixtures exercise UI behavior; actual inference is a separate bounded smoke. */
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync} from 'node:fs';
import {createServer} from 'vite';
import {cloudEnvelope} from '../src/features/medassist-intelligence/cloud-extraction.ts';
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0}});
const initials=[{evidence_id:'E_201',label:'Cough',question_en:'Do you have a cough?'},{evidence_id:'E_91',label:'Fever',question_en:'Do you have a fever (either felt or measured with a thermometer)?'},{evidence_id:'E_97',label:'Sore throat',question_en:'Do you have a sore throat?'}];
function result(req){
 const n=req.answers.length,done=!!req.stop || n===20;
 const evidence={schema_version:'model-a.evidence.v1',origin:'developer_fictional_fixture',context:req.context,initial:req.initial,answers:req.answers,unobserved_semantics:'unknown_not_negative',human_clinical_review:false};
 const observed=new Map([req.initial,...req.answers].map(a=>[a.evidence_id,a]));
 return {schema_version:'model-a.demo.v1',selection:{schema_version:'model-a.response.v1',research_only:true,status:done?'abstained':'question',reason:done?(req.stop||'budget_exhausted'):null,question:done?null:{evidence_id:'E_'+(n+1),question_en:'Fictional follow-up '+(n+1)+'?',data_type:'B',possible_values:[true,false],allows_unknown:true,unknown_value:null},state:{answered_question_ids:req.answers.map(a=>a.evidence_id),pending_question_id:done?null:'E_'+(n+1),questions_answered:n,remaining_budget:20-n,stopping_reason:done?(req.stop||'budget_exhausted'):null},evidence,limitations:[]},handoff:{schema_version:'model-a-to-b.evidence.v1',research_only:true,intended_use:'fictional_demo_evidence_only',producer:'model-a.adapter.v1',protocol_id:'medassist-v2-adaptive-questioning-v1',context:req.context,context_origin:'developer_fictional_fixture',initial_evidence_id:req.initial.evidence_id,items:Array.from({length:223},(_,i)=>{const a=observed.get('E_'+i);return {evidence_id:'E_'+i,data_type:'B',status:!a?'not_asked':a.state==='unknown'?'unknown':a.state==='contradiction'?'contradiction':a.value?'observed_positive':'observed_negative',value:a?.value??null,unsupported_reason:null,provenance:{source:a?'developer_fictional_fixture':'not_disclosed',disclosure:!a?'none':i===201?'initial':'followup',turn:!a?null:i===201?0:i}};}),missing_item_semantics:'unspecified_never_negative',model_b_status:'not_enabled',human_clinical_review:false}};
}
let browser;const results=[];
try{
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of (process.env.MEDASSIST_TYPED_ONLY ? [] : [320,390,768,820,1440])){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});let requests=[],failOnce=true,extractFail=true;const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/research/model-a/vocabulary',r=>r.fulfill({json:{schema_version:'model-a.vocabulary.v1',mode:'limited_structured_input',initials}}));
  await page.route('**/api/research/model-a/language',r=>r.fulfill({json:{schema_version:'medassist.language-status.v2',configured:true,provider:'groq-cloud',model:'qwen/qwen3.8-27b',timeout_ms:1000}}));
  await page.route('**/api/research/model-a/extract',r=>{if(extractFail){extractFail=false;return r.fulfill({status:503,json:{error:'fictional failure'}});}const text=r.request().postDataJSON().text;return r.fulfill({json:cloudEnvelope({schema_version:'medassist.sparse-extraction.v1',observations:[{evidence_id:'E_201',state:text.includes('no cough')?'absent':'present',quote:text}],unmapped:[],instruction_attempt:false},text,'qwen/qwen3.8-27b','a'.repeat(64))});});
  await page.route('**/api/research/model-a/interview',r=>{const req=r.request().postDataJSON();requests.push(req);if(failOnce){failOnce=false;return r.fulfill({status:503,json:{error:'fictional failure'}});}return r.fulfill({json:result(req)});});
  await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByText('Fictional research · Model A ready',{exact:true}).waitFor();
  assert.equal(await page.locator('.conversation-welcome').count(),1);
  assert.equal(await page.locator('md-outlined-select').count(),0);assert.equal(await page.getByRole('button',{name:'Cough',exact:true}).count(),0);
  assert.equal(await page.locator('.conversation-navigation').count(),0);
  assert.equal(await page.locator('.assessment-details').evaluate(el=>el.open),width>=1000);
  assert.equal(await page.locator('.conversation-welcome').evaluate(el=>getComputedStyle(el).animationName),'none');
  const input=page.getByRole('textbox',{name:'Fictional symptom description',exact:true});
  await input.fill('draft');await input.press('Shift+Enter');assert.match(await input.inputValue(),/\n/);
  await input.fill('I have a cough');await input.press('Enter');
  await page.getByRole('button',{name:'Retry description',exact:true}).click();
  await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).waitFor();
  assert.equal(requests.length,0,'model called before confirmation/context');
  await page.getByRole('button',{name:'No / Not sure — correct this',exact:true}).click();
  await input.fill('no cough');await input.press('Enter');
  await page.getByText('I need clarification before starting.',{exact:false}).waitFor();assert.equal(requests.length,0);
  await input.fill('I have a cough');await input.press('Enter');await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).click();
  const age=page.getByRole('textbox',{name:'Fictional age in years',exact:true});await age.fill('35');await age.press('Enter');
  await page.getByRole('button',{name:'F',exact:true}).click();await page.getByRole('button',{name:'Retry last action',exact:true}).click();
  await page.getByText('Fictional follow-up 1?',{exact:true}).waitFor();
  assert.deepEqual(requests[0],requests[1],'retry altered evidence');
  const welcomeBefore=await page.locator('.conversation-welcome').elementHandle();
  for(const [turn,answer] of [[1,'Not sure'],[2,'No'],[3,'Yes']]){
   await page.getByRole('textbox',{name:'Your answer',exact:true}).fill(answer);await page.getByRole('textbox',{name:'Your answer',exact:true}).press('Enter');
   await page.getByText('Fictional follow-up '+(turn+1)+'?',{exact:true}).waitFor();
  }
  assert.equal(await page.locator('.conversation-welcome').evaluate((el,old)=>el===old,welcomeBefore),true,'greeting remounted on ordinary rerender');
  assert.equal(await page.locator('.severity-neutral').count(),4);
  assert.equal(await page.locator('[aria-label="Assessment status"] [aria-selected="true"]').count(),0);
  await page.getByRole('button',{name:'End interview',exact:true}).click();await page.getByText('No diagnosis, urgency result or care advice was produced.',{exact:true}).waitFor();
  await page.getByText('Session summary',{exact:true}).click();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export fictional evidence',exact:true}).click();const file=await download;const exported=JSON.parse(readFileSync(await file.path(),'utf8'));
  assert.equal(exported.schema_version,'model-a-to-b.evidence.v1');assert.equal(exported.items.length,223);
  assert.equal(exported.items[1].status,'unknown');assert.equal(exported.items[2].status,'observed_negative');assert.equal(exported.items[4].status,'not_asked');
  assert.equal(exported.model_b_status,'not_enabled');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'conversation expanded page height '+width);
  const composer=await page.locator('.conversation-input').boundingBox();assert.ok(composer.y+composer.height<=900,'composer inaccessible '+width);
  const outer=await page.locator('.medassist-conversation').evaluate(el=>getComputedStyle(el).maxHeight);assert.equal(outer,'none','legacy height collision');
  if(process.env.MEDASSIST_UI_SCREENSHOTS){mkdirSync(process.env.MEDASSIST_UI_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.MEDASSIST_UI_SCREENSHOTS+'/chat-'+width+'.png',fullPage:true});}
  await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();assert.equal(await page.locator('.conversation-user').count(),0);assert.equal(await page.locator('.conversation-welcome').count(),1);
  await input.fill('I have a cough');await input.press('Enter');await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).click();
  await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).fill('Not sure');await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).press('Enter');
  await page.getByText('The frozen research model requires explicit age',{exact:false}).waitFor();
  const calls=requests.length;await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).fill('find care');await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).press('Enter');await page.getByText('Find hospitals (external Maps)',{exact:true}).click();assert.equal(requests.length,calls);
  assert.equal(errors.length,0);results.push({width,passed:true,greeting:true,confirmation:true,unknownAndNegative:true,exportItems:223,retry:true,contextAbstention:true,neutralSeverity:true,contextualNavigation:true,reducedMotion:true,cloudCalls:0});await page.close();
 }
 const page=await browser.newPage({reducedMotion:'no-preference'});let typedRequest;let release,entered;const waiting=new Promise(resolve=>entered=resolve);
 await page.route('**/api/research/model-a/vocabulary',r=>r.fulfill({json:{schema_version:'model-a.vocabulary.v1',mode:'limited_structured_input',initials}}));
 await page.route('**/api/research/model-a/language',r=>r.fulfill({json:{schema_version:'medassist.language-status.v2',configured:false,provider:'groq-cloud',model:null,timeout_ms:null}}));
 await page.route('**/api/research/model-a/interview',async r=>{
  typedRequest=r.request().postDataJSON();const body=result(typedRequest),n=typedRequest.answers.length;
  for(const [i,type] of [[1,'C'],[2,'M']]){body.handoff.items[i].data_type=type;if(typedRequest.answers.some(a=>a.evidence_id==='E_'+i))body.handoff.items[i].status='observed_value';}
  if(n===0)body.selection.question={...body.selection.question,data_type:'C',possible_values:[0,'some']};
  if(n===1)body.selection.question={...body.selection.question,data_type:'M',possible_values:['one','two']};
  if(n===2){entered();await new Promise(resolve=>release=resolve);}
  try{await r.fulfill({json:body});}catch{}
 });
 await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByText('Fictional research · Model A ready',{exact:true}).waitFor();
 assert.equal(await page.locator('.conversation-welcome').evaluate(el=>getComputedStyle(el).animationName),'conversation-welcome-enter');
 await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).fill('I have a cough');await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).press('Enter');
 await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).click();await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).fill('35');await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).press('Enter');await page.getByRole('button',{name:'F',exact:true}).click();
 await page.getByRole('button',{name:'0',exact:true}).click();await page.getByRole('button',{name:'Confirm choices (0)',exact:true}).waitFor();
 assert.equal(typedRequest.answers[0].value,0);assert.equal(typeof typedRequest.answers[0].value,'number');
 await page.getByRole('button',{name:'Confirm choices (0)',exact:true}).click();await waiting;assert.deepEqual(typedRequest.answers[1].value,[]);
 await page.getByRole('button',{name:'Emergency help',exact:true}).click();await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();release();
 await page.getByText('Ordinary questions and self-care are paused.',{exact:false}).waitFor();
 assert.equal(await page.getByText('Fictional follow-up 3?',{exact:true}).count(),0,'late question replaced emergency');
 await page.close();
 console.log(JSON.stringify({results,normalMotionGreeting:true,typedCategoricalZero:true,explicitEmptyMultichoice:true,pendingQuestionSafetyPrecedence:true,inference:'fictional transport fixtures only'}));
}finally{await browser?.close();await server.close();}
