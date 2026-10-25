/** Seven fixed fictional cases through the real browser/API, no direct model/cloud client. */
import {existsSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import assert from 'node:assert/strict';
const phase=process.argv[2];assert.ok(['before','after'].includes(phase));
const output=`models/medassist_ai/docs/recognition-${phase}.json`;assert.equal(existsSync(output),false);
const {chromium}=await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE||'playwright');
const cases=['I have stomach pain that started three days ago','stomach pain','headache','I am coughing.','I have diarrhea and nausea.','I have a fever.','I have a sore throat.'];
const browser=await chromium.launch({channel:'chrome',headless:true});const rows=[];const started=Date.now();
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(10000);
 await page.goto('http://127.0.0.1:3000/#/preview/medassist-conversation',{waitUntil:'domcontentloaded'});
 for(let i=0;i<cases.length;i++){
  if(i>0){await new Promise(resolve=>setTimeout(resolve,22000));await page.getByRole('button',{name:'Restart fictional interview',exact:true}).click();}
  console.log(JSON.stringify({phase,starting_case:i+1}));
  await page.getByText('Ready to listen',{exact:false}).waitFor();
  const pending=page.waitForResponse(r=>r.url().endsWith('/natural/extract'),{timeout:20000});
  const input=page.getByRole('textbox',{name:'Fictional symptom description',exact:true});await input.fill(cases[i]);await input.press('Enter');
  const response=await pending,extraction=await response.json();
  await page.waitForFunction(()=>!document.querySelector('.conversation-typing'));
  const row={text:cases[i],http_status:response.status(),request:response.request().postDataJSON(),extraction,confirmation_visible:await page.getByRole('button',{name:'Confirm these details',exact:true}).count()>0,model_a:null};
  if(row.confirmation_visible){
   await page.getByRole('button',{name:'Confirm these details',exact:true}).click();
   await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).fill('35');await page.getByRole('textbox',{name:'Fictional age in years',exact:true}).press('Enter');
   const selected=page.waitForResponse(r=>r.url().endsWith('/natural/interview'));await page.getByRole('button',{name:'F',exact:true}).click();
   const r=await selected;row.model_a={status:r.status(),request:r.request().postDataJSON(),response:await r.json()};
  }
  row.visible_conversation=await page.locator('.conversation-messages').innerText();rows.push(row);
  console.log(JSON.stringify({phase,case:i+1,status:row.http_status,ids:extraction.observations?.map(x=>x.evidence_id),confirmation:row.confirmation_visible,question:row.model_a?.response?.result?.selection?.question?.evidence_id??null}));
  if(process.env.MEDASSIST_RECOGNITION_SCREENSHOTS){mkdirSync(process.env.MEDASSIST_RECOGNITION_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.MEDASSIST_RECOGNITION_SCREENSHOTS}/${phase}-${i+1}.png`,fullPage:true});}
  writeFileSync(output+'.partial',JSON.stringify({phase,fictional_only:true,cases:rows},null,2)+'\n');
 }
 writeFileSync(output,JSON.stringify({phase,fictional_only:true,case_count:rows.length,cases:rows},null,2)+'\n',{flag:'wx'});
 if(existsSync(output+'.partial'))unlinkSync(output+'.partial');
}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,2000))]);}
