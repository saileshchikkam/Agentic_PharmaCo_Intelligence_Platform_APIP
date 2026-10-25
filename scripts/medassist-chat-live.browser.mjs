/** Exactly one fictional cloud extraction, real Model A, no mocked transport or benchmark. */
import assert from 'node:assert/strict';
import {existsSync,writeFileSync,mkdirSync} from 'node:fs';
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const output='models/medassist_ai/docs/chat-live-integration.json';
if(existsSync(output))throw Error('Preserve existing live integration receipt');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});let extracts=0;const calls=[],pending=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().endsWith('/extract')){extracts++;assert.ok(extracts<=1,'one-call cap');}});
 page.on('response',r=>{if(r.url().endsWith('/extract')||r.url().endsWith('/interview'))pending.push(r.json().then(body=>calls.push({path:new URL(r.url()).pathname,status:r.status(),body})).catch(()=>{}));});
 await page.goto('http://127.0.0.1:3000/#/preview/medassist-conversation',{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByText('Fictional research · Model A ready',{exact:true}).waitFor();
 await page.getByText('Fictional initial text is sent to Groq.',{exact:false}).waitFor();
 const start=Date.now();await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).fill('I am coughing.');await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).press('Enter');
 await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).waitFor({timeout:25000});const extractionMs=Date.now()-start;
 assert.equal(calls.filter(c=>c.path.endsWith('/interview')).length,0);
 await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).click();
 await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).fill('35');await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).press('Enter');await page.getByRole('button',{name:'F',exact:true}).click();
 await page.getByRole('textbox',{name:'Your answer',exact:true}).waitFor();
 await page.getByRole('button',{name:'Not sure',exact:true}).click();
 await page.getByText('1 follow-ups.',{exact:false}).count();
 await page.getByRole('button',{name:'End interview',exact:true}).click();await page.getByText('No diagnosis, urgency result or care advice was produced.',{exact:true}).waitFor();
 await Promise.allSettled(pending);
 const extraction=calls.find(c=>c.path.endsWith('/extract'));const interviews=calls.filter(c=>c.path.endsWith('/interview'));const last=interviews.at(-1)?.body.handoff;
 assert.equal(extracts,1);assert.equal(extraction?.status,200);assert.equal(extraction?.body.provenance.provider,'groq-cloud');assert.ok(extraction?.body.suggestion);
 assert.ok(interviews.length>=3);assert.equal(last?.items.length,223);assert.equal(last.model_b_status,'not_enabled');assert.ok(last.items.some(i=>i.status==='unknown'));
 const questions=interviews.filter(c=>c.body.selection.question).map(c=>({id:c.body.selection.question.evidence_id,visible_question:c.body.selection.question.question_en}));
 assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
 await page.getByRole('button',{name:'Emergency help',exact:true}).click();await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();
 assert.equal(await page.locator('[aria-selected="true"]').count(),0);assert.equal(errors.length,0);
 const report={status:'passed',actual_groq:true,model:extraction.body.provenance.model,cloud_requests:extracts,fictional_input:'I am coughing.',single_extraction_ms:extractionMs,actual_model_a:true,explicit_confirmation_and_context:true,questions,unknown_preserved:true,termination:interviews.at(-1).body.selection.reason,handoff_schema:last.schema_version,handoff_items:223,model_b:'unable_to_assess',emergency_precedence:true,page_errors:errors.length,accuracy_claim:false,locked_test_and_ledger:'not accessed'};
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();
 if(process.env.MEDASSIST_UI_SCREENSHOTS){mkdirSync(process.env.MEDASSIST_UI_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.MEDASSIST_UI_SCREENSHOTS+'/chat-live-welcome-1440.png',fullPage:true});}
 console.log(JSON.stringify(report));
}finally{await browser.close();}
