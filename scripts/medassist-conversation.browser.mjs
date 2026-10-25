import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const assert = (v,m) => { if (!v) throw Error(m); };
const root = process.cwd();
const screenshotDir = process.env.MEDASSIST_UI_SCREENSHOTS;
if (screenshotDir) await mkdir(screenshotDir, {recursive:true});
const server = await createServer({root,server:{host:'127.0.0.1',port:0}});
let browser;
try {
 await server.listen();
 browser = await chromium.launch({channel:'chrome',headless:true});
 const initials=[{evidence_id:'E_201',label:'Cough',question_en:'Do you have a cough?'},{evidence_id:'E_91',label:'Fever',question_en:'Do you have a fever (either felt or measured with a thermometer)?'},{evidence_id:'E_97',label:'Sore throat',question_en:'Do you have a sore throat?'}];
 for(const width of [390,820,1440]) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  let fail=false; let lastRequest; let count=0;
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(e.message));
  await page.route('**/api/research/model-a/vocabulary',r=>r.fulfill({json:{schema_version:'model-a.vocabulary.v1',mode:'limited_structured_input',initials}}));
  await page.route('**/api/research/model-a/interview',r=>{
   if(fail){fail=false; return r.fulfill({status:503,json:{error:'unavailable'}});}
   const req=r.request().postDataJSON(); lastRequest=req; count=req.answers.length; const done=count===20 || !!req.stop;
   return r.fulfill({json:{schema_version:'model-a.demo.v1',selection:{schema_version:'model-a.response.v1',research_only:true,status:done?'abstained':'question',reason:done?'user_stopped':null,question:done?null:{evidence_id:'E_'+(count+1),question_en:'Fictional follow-up '+(count+1)+'?',data_type:'B',possible_values:[true,false],allows_unknown:true,unknown_value:null},state:{answered_question_ids:req.answers.map(a=>a.evidence_id),pending_question_id:done?null:'E_'+(count+1),questions_answered:req.answers.length,remaining_budget:20-req.answers.length,stopping_reason:done?'user_stopped':null},evidence:{schema_version:'model-a.evidence.v1',origin:'developer_fictional_fixture',context:req.context,initial:req.initial,answers:req.answers,unobserved_semantics:'unknown_not_negative',human_clinical_review:false},limitations:[]},handoff:{schema_version:'model-a-to-b.evidence.v1',research_only:true,intended_use:'fictional_demo_evidence_only',producer:'model-a.adapter.v1',protocol_id:'medassist-v2-adaptive-questioning-v1',context:req.context,context_origin:'developer_fictional_fixture',initial_evidence_id:req.initial.evidence_id,items:Array.from({length:223},(_,i)=>({evidence_id:'E_'+i,data_type:'B',status:i===201?'observed_positive':'not_asked',value:i===201?true:null,unsupported_reason:null,provenance:{source:i===201?'developer_fictional_fixture':'not_disclosed',disclosure:i===201?'initial':'none',turn:i===201?0:null}})),missing_item_semantics:'unspecified_never_negative',model_b_status:'not_enabled',human_clinical_review:false}}});
  });
  await page.goto(server.resolvedUrls.local[0]+'#/preview/medassist-conversation',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByText('Fictional research · Model A ready',{exact:true}).waitFor();
  await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).fill('I have a cough');
  await page.getByRole('textbox',{name:'Fictional symptom description',exact:true}).press('Enter');
  await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).click();
  await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).fill('35');
  await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).press('Enter');
  await page.getByRole('button',{name:'F',exact:true}).click();
  await page.getByText('Fictional follow-up 1?',{exact:true}).waitFor();
  const heightBefore=await page.evaluate(()=>document.documentElement.scrollHeight);
  assert(heightBefore<=900,'chat shell exceeds viewport at '+width+': '+heightBefore);
  assert(await page.locator('.conversation-notice details').evaluate(el=>!el.open),'technical information expanded by default');
  for(let turn=1;turn<=20;turn++) {
   assert(await page.getByText('Fictional follow-up '+turn+'?',{exact:true}).count()===1,'duplicate question');
   assert(await page.locator('.conversation-input').count()===1,'one composer');
   assert(await page.locator('.medassist-conversation table, .medassist-conversation code, .medassist-conversation .model-a-evidence').count()===0,'technical checklist leaked');
   assert(!/E_\d+|model-a-to-b|not_asked|Evidence state filter/.test(await page.locator('.medassist-conversation').innerText()),'technical IDs leaked');
   const box=await page.locator('.conversation-input').boundingBox();
   assert(box.y+box.height<=900,'composer outside viewport at '+width+' turn '+turn+': '+JSON.stringify(box));
   if(turn===19) {
    await page.locator('.conversation-messages').focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);
    assert(await page.locator('.conversation-messages').evaluate(el=>el.scrollTop===0),'history cannot scroll');
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
    assert(await page.locator('.conversation-messages').evaluate(el=>el.scrollHeight-el.scrollTop-el.clientHeight<2),'latest message unreachable');
    if (screenshotDir) await page.screenshot({path:screenshotDir+'/medassist-compact-'+width+'.png',fullPage:true});
   }
   await page.getByRole('textbox',{name:'Your answer',exact:true}).fill(turn===1?'not sure':turn===2?'no':'yes');
   await page.getByRole('textbox',{name:'Your answer',exact:true}).press('Enter');
   if(turn<20) await page.getByText('Fictional follow-up '+(turn+1)+'?',{exact:true}).waitFor();
  }
  await page.getByText('No diagnosis, urgency result or care advice was produced.',{exact:true}).waitFor();
  assert(lastRequest.answers.length===20,'20 answers not preserved');
  assert(lastRequest.answers[0].state==='unknown' && lastRequest.answers[0].value===null,'UNKNOWN changed');
  assert(lastRequest.answers[1].state==='confirmed' && lastRequest.answers[1].value===false,'false changed');
  assert(await page.locator('.conversation-user').count()===24,'user bubbles lost/duplicated');
  const metrics=await page.evaluate(()=>({pageHeight:document.documentElement.scrollHeight,logHeight:document.querySelector('.conversation-messages').clientHeight,logScrollHeight:document.querySelector('.conversation-messages').scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert(metrics.pageHeight<=heightBefore+2,'20 turns expanded page height');
  assert(metrics.pageHeight<=900,'completed chat exceeds viewport');
  assert(metrics.logScrollHeight>metrics.logHeight,'transcript not independently scrollable');
  assert(!metrics.overflow,'horizontal overflow');
  await page.getByText('Session summary',{exact:true}).click();
  assert(await page.locator('.conversation-summary').evaluate(el=>el.clientHeight<=96),'summary expanded beyond limit');
  const composer=await page.locator('.conversation-input').boundingBox();
  assert(composer.y>=0 && composer.y+composer.height<=900,'completed composer not accessible');
  assert(await page.locator('.conversation-message').count()>40,'earlier messages lost');
  assert(pageErrors.length===0,'browser errors');
  await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();
  assert(await page.locator('.conversation-user').count()===0,'restart should clear timeline');
  console.log(JSON.stringify({width,status:'passed',answers:20,evidenceItems:223,heightBefore,...metrics,inference:'authored transport stub; not actual Model A'}));
  await page.route('**/api/research/model-a/fixtures',r=>r.fulfill({json:{schema_version:'model-a.fixtures.v1',fictional_only:true,fixtures:[{fixture_id:'compact-ui',label:'Authored UI fixture',request:{schema_version:'model-a.request.v1',fictional_case:true,context:{age:35,source_sex:'F'},initial:{evidence_id:'E_201',state:'confirmed',value:true},answers:[],stop:null}}]}}));
  await page.goto(server.resolvedUrls.local[0]+'#/research/model-a');
  await page.getByRole('button',{name:'Authored UI fixture',exact:true}).click();
  await page.getByText('Developer evidence inspector',{exact:true}).waitFor();
  assert(!await page.locator('.model-a-evidence').evaluate(el=>el.open),'inspector should start collapsed');
  assert(!await page.locator('.model-a-table').isVisible(),'diagnostics visible by default');
  await page.getByText('Developer evidence inspector',{exact:true}).click();
  assert(await page.locator('.model-a-table tbody tr').count()===223,'structured evidence lost');
  assert(await page.locator('.model-a-table').evaluate(el=>el.clientHeight<=320 && el.scrollHeight>el.clientHeight),'inspector not bounded');
  assert(await page.getByRole('button',{name:'Export accepted evidence JSON',exact:true}).isVisible(),'developer export lost');
  console.log(JSON.stringify({width,developerInspector:'collapsed by default; 223 rows retained; bounded 320px; export retained'}));
  await page.close();
 }
} finally { await browser?.close(); await server.close(); }
