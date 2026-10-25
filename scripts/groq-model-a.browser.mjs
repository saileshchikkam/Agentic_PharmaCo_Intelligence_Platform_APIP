/** One actual fictional cloud request, then real Model A. No mocked transport. */
import { existsSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const output='models/medassist_intelligence/groq-v1/integration-smoke.json';
if(existsSync(output))throw Error('Preserve existing smoke receipt');
const browser=await chromium.launch({channel:'chrome',headless:true});
let stage='load';const calls=[];const pending=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});const hosts=[];let pageErrors=0;
 page.on('request',r=>hosts.push(new URL(r.url()).hostname));page.on('pageerror',()=>pageErrors++);
 page.on('response',r=>{if(r.url().endsWith('/extract')||r.url().endsWith('/interview'))pending.push(r.json().then(body=>calls.push({path:new URL(r.url()).pathname,status:r.status(),body})).catch(()=>{}));});
 await page.goto('http://127.0.0.1:3000/#/preview/medassist-conversation');
 await page.getByRole('button',{name:'Cough',exact:true}).waitFor();
 await page.locator('md-outlined-select').evaluate(async el=>{await el.updateComplete;el.value='0';el.dispatchEvent(new Event('change',{bubbles:true}));});
 stage='cloud_extract';const at=Date.now();await page.getByRole('textbox').fill('I am coughing.');await page.getByRole('textbox').press('Enter');
 await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).waitFor({timeout:20000});const initialMs=Date.now()-at;
 if(calls.some(c=>c.path.endsWith('/interview')))throw Error('Model A ran before confirmation');
 stage='model_a_confirm';await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).click();
 await page.getByRole('button',{name:'Not sure',exact:true}).waitFor({timeout:20000});await page.getByRole('button',{name:'Not sure',exact:true}).click();
 await page.waitForTimeout(500);await page.getByRole('button',{name:'End interview',exact:true}).click();
 await page.getByText('No diagnosis, urgency result or care advice was produced.',{exact:true}).waitFor();
 await Promise.allSettled(pending);const extraction=calls.filter(c=>c.path.endsWith('/extract'));const interviews=calls.filter(c=>c.path.endsWith('/interview'));const last=interviews.at(-1)?.body.handoff;
 if(extraction.length!==1||extraction[0].status!==200||extraction[0].body.provenance?.provider!=='groq-cloud'||!extraction[0].body.suggestion||!last||last.items.length!==223||!last.items.some(i=>i.status==='unknown'))throw Error('Actual Groq/Model A pipeline assertion failed');
 stage='layout_privacy';const widths=[];
 for(const width of [390,820,1440]){
  await page.setViewportSize({width,height:900});await page.waitForTimeout(100);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const text=await page.locator('.medassist-conversation').innerText();
  if(overflow||/E_\d+|model-a-to-b|gsk_/.test(text)||await page.locator('.medassist-conversation table, .medassist-conversation code').count())throw Error('Conversation layout/privacy regression');
  if(await page.locator('.conversation-input').count()!==1)throw Error('Duplicate composer');
  widths.push({width,horizontal_overflow:false,technical_checklist:false});
 }
 const config=await page.evaluate(async()=>{const r=await fetch('/.env.server');const text=await r.text();return {http_status:r.status,key_pattern_present:/gsk_[A-Za-z0-9]/.test(text)};});
 if(config.key_pattern_present||hosts.includes('api.groq.com')||pageErrors)throw Error('Credential/client isolation failure');
 const receipt={status:'passed',additional_cloud_requests:1,benchmark_retry:false,model:extraction[0].body.provenance.model,
  actual_groq:true,explicit_confirmation_before_model_a:true,actual_model_a:true,unknown_preserved:true,handoff_items:223,
  handoff_version:last.schema_version,model_b:last.model_b_status,questions:interviews.flatMap(c=>c.body.selection.question?[c.body.selection.question.evidence_id]:[]),
  initial_ui_elapsed_ms:initialMs,browser_direct_groq_requests:0,private_config_http_status:config.http_status,credential_exposed:false,page_errors:pageErrors,widths,
  layout_changes:'none; provider logic and cloud privacy wording only'};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}catch(e){await Promise.allSettled(pending);const failure={status:'failed',stage,error_kind:e.name,calls:calls.map(c=>({path:c.path,status:c.status,body:c.body}))};
 const target='models/medassist_intelligence/groq-v1/integration-smoke-failure.json';if(!existsSync(target))writeFileSync(target,JSON.stringify(failure,null,2)+'\n');console.log(JSON.stringify({status:'failed',stage,error_kind:e.name,http:calls.map(c=>c.status)}));process.exitCode=1;
}finally{await browser.close();}
