/** Authored UI transport fixture; actual Model A evidence is recorded separately. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createServer} from 'vite';
import {understand} from '../src/features/medassist-conversation/understanding.ts';
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE||'playwright');
const metadata=JSON.parse(readFileSync('models/medassist_ai/docs/symptom-schema-metadata.json','utf8')).items;
const vocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:metadata.filter(d=>!d.quarantined).map(d=>({...d,initial_allowed:d.kind==='symptom'&&!d.parent,value_labels:Object.fromEntries(Object.entries(d.value_labels).filter(([,v])=>typeof v==='string'))})),coverage:{symptom_fields:110,universal_coverage:false}};
const ids=['E_55','E_57','E_56','E_54','E_58','E_59','E_216','E_219'];
const question=id=>{const d=vocabulary.items.find(d=>d.evidence_id===id);return{evidence_id:id,question_en:d.question_en,data_type:d.data_type,possible_values:d.possible_values,allows_unknown:true,unknown_value:null};};
function fixture(req){
 const answers=[...req.initial_disclosures,...req.turns.flatMap(t=>[t.answer,...t.disclosures])],n=req.turns.length,done=n===8||!!req.stop;
 const reason=done?(req.stop||'question_budget'):null,q=done?null:question(ids[n]);
 const disclosed=new Map([req.initial,...answers].map(a=>[a.evidence_id,a]));
 const evidence={schema_version:'model-a.evidence.v1',origin:'developer_fictional_fixture',context:req.context,initial:req.initial,answers,unobserved_semantics:'unknown_not_negative',human_clinical_review:false};
 const handoff={schema_version:'model-a-to-b.evidence.v1',research_only:true,intended_use:'fictional_demo_evidence_only',producer:'model-a.adapter.v1',protocol_id:'medassist-v2-adaptive-questioning-v1',context:req.context,context_origin:'developer_fictional_fixture',initial_evidence_id:req.initial.evidence_id,
  items:metadata.map(d=>{const a=disclosed.get(d.evidence_id);return{evidence_id:d.evidence_id,data_type:d.data_type,status:!a?'not_asked':a.state==='unknown'?'unknown':a.state==='contradiction'?'contradiction':d.data_type!=='B'?'observed_value':a.value?'observed_positive':'observed_negative',value:a?.value??null,unsupported_reason:null,provenance:{source:a?'developer_fictional_fixture':'not_disclosed',disclosure:!a?'none':a===req.initial?'initial':'followup',turn:!a?null:a===req.initial?0:1}};}),missing_item_semantics:'unspecified_never_negative',model_b_status:'not_enabled',human_clinical_review:false};
 return{schema_version:'medassist.natural-result.v1',result:{schema_version:'model-a.demo.v1',selection:{schema_version:'model-a.response.v1',research_only:true,status:done?'abstained':'question',reason,question:q,state:{answered_question_ids:answers.map(a=>a.evidence_id),pending_question_id:q?.evidence_id??null,questions_answered:answers.length,remaining_budget:20-answers.length,stopping_reason:reason},evidence,limitations:[]},handoff},progress:{answered:n,target:8,hard_limit:10},audit:{filter_version:'topical-candidates.v2',candidate_ids:q?[q.evidence_id]:[],frozen_feature_encoding:true,clinical_validation:false}};
}
const cases=[['I have a cough.',true],["I've been coughing for three days.",true],["It's mostly a dry cough. I can breathe normally.",true],['I am not coughing.',true],['I used to cough, but it stopped.',false],['My brother is coughing.',false],['I have stomach pain.',true],['My head hurts.',true],["I've had lower back pain for three days.",true],['I think I have a tumor in my breast.',false],['I have a lump in my breast.',false],["I have diarrhea and nausea, but I haven't vomited.",true]];
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0}});let browser;const rows=[];
try{
 await server.listen();await server.watcher.close();browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));let extractionCalls=0,transitions=0;
  await page.route('**/api/research/model-a/language',r=>r.fulfill({json:{schema_version:'medassist.language-status.v2',configured:false,provider:'groq-cloud',model:null,timeout_ms:null}}));
  await page.route('**/api/research/model-a/natural/vocabulary',r=>r.fulfill({json:vocabulary}));
  await page.route('**/api/research/model-a/natural/extract',r=>{extractionCalls++;const b=r.request().postDataJSON();assert.equal(b.schema_version,'medassist.natural-extract-request.v2');const a=understand(b.text,vocabulary,b.question_id?question(b.question_id):null,b.prior_context);return r.fulfill({json:a.proposal});});
  await page.route('**/api/research/model-a/natural/interview',r=>{transitions++;return r.fulfill({json:fixture(r.request().postDataJSON())});});
  await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded'});await page.getByText('Ready to listen',{exact:false}).waitFor();
  const restart=()=>page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();
  const send=async(text,name='Fictional symptom description')=>{const box=page.getByRole('textbox',{name,exact:true});await box.fill(text);await box.press('Enter');await page.waitForFunction(()=>!document.querySelector('.conversation-typing'));};
  for(const [text,confirm] of cases){await restart();await send(text);assert.equal(await page.locator('.conversation-user').count(),1);assert.equal(await page.getByRole('button',{name:'Confirm these details',exact:true}).count(),confirm?1:0,text);}
  await restart();await send('My lower back has been aching for three days.');await page.getByRole('button',{name:'Confirm these details',exact:true}).click();await send('35','Fictional age in years');await page.getByRole('button',{name:'F',exact:true}).click();await page.getByRole('button',{name:'Confirm choices (0)',exact:true}).waitFor();
  assert.equal(transitions,1);const before=extractionCalls;
  await page.getByRole('textbox',{name:'Your answer',exact:true}).fill('anus');await page.locator('.conversation-input').evaluate(form=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});await page.getByText('Is this an additional pain site or a correction?',{exact:false}).waitFor();assert.equal(transitions,1);assert.equal(extractionCalls,before);
  await send('posterior aspect of the ankle','Your answer');await page.getByText('including side where needed',{exact:false}).waitFor();await send('somewhere unfamiliar','Your answer');await page.getByText('I cannot validate another free-text reply',{exact:false}).waitFor();assert.equal(extractionCalls,before);assert.equal(transitions,1);
  await page.getByRole('button',{name:'Not sure',exact:true}).click();await page.getByText('Does the pain radiate to another location?',{exact:true}).waitFor();
  await send('posterior aspect of the ankle','Your answer');assert.equal(transitions,2);
  await send('It radiates to my left ankle.','Your answer');await page.getByRole('button',{name:'Confirm these details',exact:true}).click();await page.getByRole('button',{name:'7',exact:true}).waitFor();assert.equal(transitions,3);
  await send('severe','Your answer');assert.equal(transitions,3);await page.getByText('I will not invent a score',{exact:false}).waitFor();
  for(let turn=2;turn<8;turn++){const reply=page.waitForResponse(r=>r.url().endsWith('/natural/interview'));await page.getByRole('button',{name:'Not sure',exact:true}).click();await reply;await page.waitForFunction(()=>!document.querySelector('.conversation-typing'));}
  await page.getByText('No diagnosis, urgency result or care advice was produced.',{exact:true}).waitFor();assert.equal(transitions,9);
  await page.getByText('Session summary',{exact:true}).click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download session',exact:true}).click();const payload=JSON.parse(readFileSync(await(await download).path(),'utf8'));
  assert.equal(payload.schema_version,'medassist.conversation-export.v2');assert.equal(payload.evidence.schema_version,'model-a-to-b.evidence.v1');assert.equal(payload.evidence.items.length,223);assert.equal(payload.routine_questions_answered,8);
  assert.equal(payload.evidence.items.find(i=>i.evidence_id==='E_55').status,'unknown');assert.deepEqual(payload.evidence.items.find(i=>i.evidence_id==='E_57').value,['V_35']);
  assert.ok(payload.narratives.includes('anus'));assert.ok(payload.understanding_records.some(r=>r.text==='anus'&&!r.confirmed));assert.ok(payload.question_clarifications.some(r=>r.question_id==='E_55'&&r.attempts===2));
  const finalText=await page.locator('.conversation-assistant').last().textContent();assert.doesNotMatch(finalText,/confirmed.*anus|diagnos(?:ed|is is)/i);
  await restart();const safetyBefore=extractionCalls;const box=page.getByRole('textbox',{name:'Fictional symptom description',exact:true});await box.fill('I cannot breathe');await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();assert.equal(extractionCalls,safetyBefore);
  assert.equal(errors.length,0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  rows.push({width,reported_cases:12,models_offline_deterministic_intake:true,anatomy_mismatch_clarified:true,clarifications_bounded_at_two:true,no_clarification_model_turns:true,exact_side_preserved:true,no_invented_score:true,routine_turns:8,export_items:223,context_trace_preserved:true,emergency_independent:true,page_errors:0});await page.close();
 }
 const report={mocked_model_a:true,actual_nlp_code:true,cloud_calls:0,rows};const path='models/medassist_ai/docs/symptom-understanding-browser.json';if(!existsSync(path))writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
}finally{await browser?.close();await server.close();}
