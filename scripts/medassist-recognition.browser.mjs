/** Fictional transport failures test clarification state, not model accuracy. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {anchors} from '../src/features/medassist-conversation/natural.ts';
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE||'playwright');
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0}});let browser;
const vocabulary={schema_version:'medassist.natural-vocabulary.v1',fictional_only:true,items:Object.keys(anchors).map(evidence_id=>({evidence_id,kind:'symptom',data_type:'B',question_en:anchors[evidence_id].label,possible_values:[],initial_allowed:true})),coverage:{symptom_fields:110,universal_coverage:false}};
try{
 await server.listen();await server.watcher.close();browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:900}});page.setDefaultTimeout(10000);
 await page.route('**/api/research/model-a/natural/vocabulary',r=>r.fulfill({json:vocabulary}));
 await page.route('**/api/research/model-a/language',r=>r.fulfill({json:{schema_version:'medassist.language-status.v2',configured:true,provider:'groq-cloud',model:'qwen/qwen3.8-27b',timeout_ms:1000}}));
 let calls=0,mode='unsupported';
 await page.route('**/api/research/model-a/natural/extract',r=>{calls++;const text=r.request().postDataJSON().text;
  if(mode==='pain')return r.fulfill({json:{schema_version:'medassist.natural-extraction.v1',observations:[{evidence_id:'E_53',state:'confirmed',value:true,quote:text}],unmapped:[],instruction_attempt:false}});
  return mode==='unsupported'?r.fulfill({json:{schema_version:'medassist.natural-extraction.v1',observations:[],unmapped:[{quote:text,kind:'unsupported'}],instruction_attempt:false}})
    :r.fulfill({status:mode==='timeout'?504:mode==='invalid'?502:422,json:{error:mode==='timeout'?'LANGUAGE_TIMEOUT':mode==='invalid'?'LANGUAGE_INVALID_OUTPUT':'LANGUAGE_MAPPING_FAILED'}});});
 await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded'});await page.getByText('Ready to listen',{exact:false}).waitFor();
 const submit=async text=>{const input=page.getByRole('textbox',{name:'Fictional symptom description',exact:true});await input.fill(text);await input.press('Enter');await page.waitForFunction(()=>!document.querySelector('.conversation-typing'));};
 await submit('glittering elbow');await page.getByText('I have kept your description, but cannot map it',{exact:false}).waitFor();
 await submit('glittering elbow');await page.getByText('I have already kept those details.',{exact:false}).waitFor();
 const assistantCount=await page.locator('.conversation-assistant').count();await submit('glittering elbow');
 assert.equal(calls,1);assert.equal(await page.locator('.conversation-assistant').count(),assistantCount);assert.equal(await page.getByRole('button',{name:'Retry description',exact:true}).count(),0);
 await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();mode='mapping';
 await submit('I have stomach pain that started three days ago');await page.getByText('I recognize a supported symptom',{exact:false}).waitFor();
 await submit('stomach pain');await page.getByText('I have already kept those details.',{exact:false}).waitFor();assert.equal(calls,2);
 for(const kind of ['timeout','invalid']){
  await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();mode=kind;
  await submit('headache');await page.getByRole('button',{name:'Retry description',exact:true}).waitFor();
  if(kind==='timeout')await page.waitForTimeout(2100);
  await page.getByRole('button',{name:'Retry description',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.conversation-typing'));
  assert.equal(await page.locator('.conversation-user').filter({hasText:'headache'}).count(),1);
  if(kind==='invalid'){assert.equal(await page.getByRole('button',{name:'Retry description',exact:true}).count(),0);const before=calls;await submit('headache');assert.equal(calls,before);}
  else assert.equal(await page.getByRole('button',{name:'Retry description',exact:true}).count(),1);
 }
 // A recorded real numeric-question response tests controls above the sticky composer.
 await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();mode='pain';
 const actual=JSON.parse(readFileSync('models/medassist_ai/docs/recognition-after.json','utf8')).cases[0].model_a.response;
 await page.route('**/api/research/model-a/natural/interview',r=>r.fulfill({json:actual}));
 await submit('stomach pain');await page.getByRole('button',{name:'Confirm these details',exact:true}).click();
 await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).fill('35');await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).press('Enter');
 await page.getByRole('button',{name:'F',exact:true}).click();await page.getByRole('button',{name:'0',exact:true}).waitFor();
 await page.waitForFunction(()=>{const form=document.querySelector('.conversation-input'),last=document.querySelector('.conversation-turn md-filled-tonal-button');return !!form&&!!last&&last.getBoundingClientRect().bottom<=form.getBoundingClientRect().top;});
 const composer=await page.locator('.conversation-input').boundingBox();
 for(let n=0;n<=10;n++){const bounds=await page.getByRole('button',{name:String(n),exact:true}).boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<=composer.y);}
 if(process.env.MEDASSIST_RECOGNITION_SCREENSHOTS)await page.screenshot({path:process.env.MEDASSIST_RECOGNITION_SCREENSHOTS+'/controls-fixed-390.png'});
 await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();
 // A blocked concept still cannot prevent the independent emergency interruption.
 await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).fill('I cannot breathe');await page.getByRole('alert',{name:'Emergency help',exact:true}).waitFor();
 assert.equal(await page.getByRole('link',{name:'Call 112 in India',exact:true}).count(),1);
 console.log(JSON.stringify({unsupported_requests:1,equivalent_mapping_requests:1,bounded_operational_retries:true,duplicate_assistant_fallback_suppressed:true,emergency_override:true,numeric_controls_uncovered:true,cloud_calls:0}));
}finally{await browser?.close();await server.close();}
