/** Authored transport fixtures test UI, not extraction accuracy or model performance. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { anchors } from '../src/features/medassist-conversation/natural.ts';
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE||'playwright');
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0}});
const vocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:Object.keys(anchors).map(id=>({evidence_id:id,kind:'symptom',data_type:'B',question_en:anchors[id].label,possible_values:[],initial_allowed:true})),coverage:{symptom_fields:110,universal_coverage:false}};
const ids=['E_201','E_91','E_97','E_94','E_50','E_74','E_127','E_219'];
function result(req){
 const answers=[...req.initial_disclosures,...req.turns.flatMap(t=>[t.answer,...t.disclosures])],n=req.turns.length,done=!!req.stop||n===8;
 const reason=done?(req.stop||'question_budget'):null,q=done?null:{evidence_id:ids[n],question_en:`Fictional follow-up ${n+1}?`,data_type:'B',possible_values:[],allows_unknown:true,unknown_value:null};
 const observed=new Map([req.initial,...answers].map(a=>[a.evidence_id,a]));
 const evidence={schema_version:'model-a.evidence.v1',origin:'developer_fictional_fixture',context:req.context,initial:req.initial,answers,unobserved_semantics:'unknown_not_negative',human_clinical_review:false};
 const handoff={schema_version:'model-a-to-b.evidence.v1',research_only:true,intended_use:'fictional_demo_evidence_only',producer:'model-a.adapter.v1',protocol_id:'medassist-v2-adaptive-questioning-v1',context:req.context,context_origin:'developer_fictional_fixture',initial_evidence_id:req.initial.evidence_id,items:Array.from({length:223},(_,i)=>{const a=observed.get('E_'+i);return{evidence_id:'E_'+i,data_type:'B',status:!a?'not_asked':a.state==='unknown'?'unknown':a.state==='contradiction'?'contradiction':a.value?'observed_positive':'observed_negative',value:a?.value??null,unsupported_reason:null,provenance:{source:a?'developer_fictional_fixture':'not_disclosed',disclosure:!a?'none':a===req.initial?'initial':'followup',turn:!a?null:a===req.initial?0:1}};}),missing_item_semantics:'unspecified_never_negative',model_b_status:'not_enabled',human_clinical_review:false};
 return {schema_version:'medassist.natural-result.v1',result:{schema_version:'model-a.demo.v1',selection:{schema_version:'model-a.response.v1',research_only:true,status:done?'abstained':'question',reason,question:q,state:{answered_question_ids:answers.map(a=>a.evidence_id),pending_question_id:q?.evidence_id??null,questions_answered:answers.length,remaining_budget:20-answers.length,stopping_reason:reason},evidence,limitations:[]},handoff},progress:{answered:n,target:8,hard_limit:10},audit:{filter_version:'topical-candidates.v1',candidate_ids:q?[q.evidence_id]:[],frozen_feature_encoding:true,clinical_validation:false}};
}
let browser;const observations=[];
try{
 await server.listen();await server.watcher.close();browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];let calls=[],fail=true;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/research/model-a/natural/vocabulary',r=>r.fulfill({json:vocabulary}));
  await page.route('**/api/research/model-a/language',r=>r.fulfill({json:{schema_version:'medassist.language-status.v2',configured:true,provider:'groq-cloud',model:'qwen/qwen3.8-27b',timeout_ms:1000}}));
  await page.route('**/api/research/model-a/natural/extract',r=>{if(fail){fail=false;return r.fulfill({status:503,json:{error:'fixture-timeout'}});}const text=r.request().postDataJSON().text;return r.fulfill({json:{schema_version:'medassist.natural-extraction.v1',observations:[{evidence_id:'E_51',state:'confirmed',value:true,quote:'diarrhea'},{evidence_id:'E_148',state:'confirmed',value:true,quote:'nausea'}],unmapped:[{quote:'two days',kind:'duration'}],instruction_attempt:false}});});
  await page.route('**/api/research/model-a/natural/interview',r=>{const req=r.request().postDataJSON();calls.push(req);return r.fulfill({json:result(req)});});
  await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded'});
  await page.getByText('Ready to listen',{exact:false}).waitFor();
  const input=page.getByRole('textbox',{name:'Fictional symptom description',exact:true});
  await input.fill('draft');await input.press('Shift+Enter');assert.match(await input.inputValue(),/\n/);
  await input.fill('I have diarrhea and nausea for two days');await input.press('Enter');
  await page.getByRole('button',{name:'Retry description',exact:true}).waitFor();await page.waitForTimeout(2100);await page.getByRole('button',{name:'Retry description',exact:true}).click();
  await page.getByRole('button',{name:'Confirm these details',exact:true}).click();assert.equal(calls.length,0);
  await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).fill('35');await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).press('Enter');
  await page.getByRole('button',{name:'F',exact:true}).click();await page.getByText('Fictional follow-up 1?',{exact:true}).waitFor();
  for(let n=1;n<=8;n++){
   assert.match(await page.locator('.conversation-assessment').textContent(),new RegExp(`Question ${n} of up to 8`));
   await page.getByRole('button',{name:n===2?'No':'Not sure',exact:true}).click();
   if(n<8)await page.getByText(`Fictional follow-up ${n+1}?`,{exact:true}).waitFor();
   else await page.getByText('No diagnosis, urgency result or care advice was produced.',{exact:true}).waitFor();
  }
  assert.equal(calls.at(-1).turns.length,8);assert.equal(calls.at(-1).turns[0].answer.state,'unknown');assert.equal(calls.at(-1).turns[1].answer.value,false);
  const log=page.locator('.conversation-messages');
  const layout=await log.evaluate(el=>({overflow:getComputedStyle(el).overflowY,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,pageHeight:document.documentElement.scrollHeight,horizontal:document.documentElement.scrollWidth>innerWidth}));
  assert.equal(layout.overflow,'visible');assert.ok(Math.abs(layout.scrollHeight-layout.clientHeight)<3);assert.ok(layout.pageHeight>1800);assert.equal(layout.horizontal,false);
  const visible=await page.locator('.medassist-conversation').innerText();assert.doesNotMatch(visible,/Model [AB]|E_\d|question_budget|evidence vector|inference|research protocol/i);
  assert.equal(await page.locator('form').count(),1);assert.equal(errors.length,0);
  await page.getByText('Session summary',{exact:true}).click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download session',exact:true}).click();const payload=JSON.parse(readFileSync(await (await downloaded).path(),'utf8'));
  assert.equal(payload.schema_version,'medassist.conversation-export.v2');assert.equal(payload.evidence.schema_version,'model-a-to-b.evidence.v1');assert.equal(payload.evidence.items.length,223);assert.equal(payload.conversation.turns.length,8);assert.equal(payload.user_confirmed_proposals[0].observations.length,2);assert.equal(payload.unresolved_conflict,false);
  await page.getByText('Session summary',{exact:true}).click();
  await page.mouse.wheel(0,-10000);await page.waitForFunction(()=>window.scrollY===0);
  await page.mouse.wheel(0,10000);await page.waitForFunction(()=>window.scrollY>1000);
  const composer=await page.locator('.conversation-input').boundingBox();assert.ok(composer.y>=0 && composer.y+composer.height<=900);
  assert.equal(await page.locator('.conversation-summary').evaluate(el=>getComputedStyle(el).overflowY),'visible');
  const imageDir=process.env.MEDASSIST_NATURAL_SCREENSHOTS;
  if(imageDir){mkdirSync(imageDir,{recursive:true});await page.screenshot({path:`${imageDir}/natural-${width}.png`,fullPage:true});await page.screenshot({path:`${imageDir}/natural-end-${width}.png`});}
  observations.push({width,routine_questions:8,explicit_confirmation:true,unknown_and_negative_preserved:true,page_height:layout.pageHeight,transcript_overflow:layout.overflow,horizontal_overflow:false,browser_errors:0,language_failure_retry:true});
  // Emergency takes precedence while the new language request is pending.
  await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();
  await page.route('**/api/research/model-a/natural/extract',async r=>{await new Promise(resolve=>setTimeout(resolve,200));try{await r.fulfill({status:503,json:{error:'pending'}});}catch{}});
  await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).fill('I have diarrhea');await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).press('Enter');
  await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).fill('I cannot breathe');await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Call 112 in India',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Confirm these details',exact:true}).count(),0);
  await page.close();
 }
 console.log(JSON.stringify({fictional_transport_fixtures:true,widths:observations,pending_emergency_precedence:true}));
}finally{await browser?.close();await server.close();}
