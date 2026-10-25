/** Explicit final-policy browser smoke; uses real Model A and no authored API stubs. */
import { writeFileSync, existsSync } from 'node:fs';
const { chromium } = await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const output='models/medassist_intelligence/reliability-v1/final-route-smoke.json';
if(existsSync(output))throw Error('Preserve existing receipt');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const interviews=[];
 page.on('response',async r=>{if(r.url().endsWith('/interview'))interviews.push(await r.json());});
 await page.goto('http://127.0.0.1:3000/#/preview/medassist-conversation');
 await page.getByRole('button',{name:'Cough',exact:true}).waitFor();
 await page.locator('md-outlined-select').evaluate(async el=>{await el.updateComplete;el.value='0';el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.getByRole('textbox').fill('I am not sure about fever.');await page.getByRole('textbox').press('Enter');
 await page.getByRole('alert').filter({hasText:'Nothing was recorded'}).waitFor();
 if(await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).count())throw Error('Unqualified input became evidence');
 const requests=[];
 for(const text of ['I have a cough.','No cough.','I do not know if I have a cough.','Fever is present and fever is absent.','I have ear discomfort.','Cough for 3 days.']){
  requests.push(await page.evaluate(async text=>{const at=performance.now();const r=await fetch('/api/research/model-a/extract',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schema_version:'medassist.extract-request.v1',fictional_only:true,text})});return {status:r.status,body:await r.json(),elapsed_ms:performance.now()-at};},text));
 }
 if(requests.some(r=>r.status!==422||r.body.error!=='LOCAL_LANGUAGE_NOT_QUALIFIED'))throw Error('Qualification gate bypass');
 await page.getByRole('button',{name:'Cough',exact:true}).click();await page.getByRole('button',{name:'Yes, start with this symptom',exact:true}).click();
 await page.getByRole('button',{name:'Not sure',exact:true}).waitFor();await page.getByRole('button',{name:'Not sure',exact:true}).click();
 await page.waitForTimeout(500);await page.getByRole('button',{name:'End interview',exact:true}).click();
 await page.getByText('No diagnosis, urgency result or care advice was produced.',{exact:true}).waitFor();
 const h=interviews.at(-1)?.handoff; if(h?.items.length!==223||!h.items.some(i=>i.status==='unknown')||interviews.length!==3)throw Error('Real Model A lifecycle failed');
 const times=requests.map(r=>r.elapsed_ms).sort((a,b)=>a-b);
 const receipt={status:'passed',qualification_blocked_cases:requests.length,blocked_request_median_ms:times[Math.ceil(times.length*.5)-1],blocked_request_p95_ms:times[Math.ceil(times.length*.95)-1],
  measured_latency_scope:'six blocked loopback requests; no language inference, not extraction latency or accuracy',free_text_did_not_create_candidate:true,ui_layout_changed:false,
  actual_model_a:true,initial_source:'explicit structured button and confirmation',unknown_preserved:true,distinct_questions:new Set(interviews.flatMap(r=>r.selection.question?[r.selection.question.evidence_id]:[])).size,
  handoff_version:h.schema_version,handoff_items:h.items.length,model_b:h.model_b_status,selected_provider_pipeline:false};
 writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}finally{await browser.close();}
