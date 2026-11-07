import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {registerLocalAccount} from '../server/local-account.ts';
const {chromium}=await import(process.env.ADR_PLAYWRIGHT_MODULE||'playwright');
process.env.NODE_ENV='development';process.env.ADR_INTAKE_PROVIDER='disabled';
const dir=await mkdtemp(join(tmpdir(),'adr-ui-'));const app=express();
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
const port=server.address().port,origin=`http://127.0.0.1:${port}`;
const account=registerLocalAccount(app,{file:join(dir,'fictional.sqlite'),originPort:port});
const vite=await createServer({server:{middlewareMode:true,hmr:{server},watch:null},define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(''),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('')}});app.use(vite.middlewares);
const hasTemplate=existsSync('docs/adr/templates/ADRRF_2.pdf');
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const width of [320,360,820,1440]){
  const context=await browser.newContext({viewport:{width,height:720},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route(/^https?:\/\//,route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  await page.goto(origin+'/#/',{waitUntil:'commit'});
  try {
   await page.getByRole('link',{name:'Sign up',exact:true}).click();
  } catch (error) {
   console.error('Home did not load:', page.url(), errors, (await page.locator('body').innerText({timeout:3000}).catch(()=>'' )).slice(0,700));
   throw error;
  }
  await page.getByRole('textbox',{name:'Email address'}).fill(`fictional-${width}@example.test`);
  await page.getByLabel('Password',{exact:true}).fill('fictional-password-123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByRole('heading',{name:'Your APIP dashboard'}).waitFor();
  const settings=page.getByRole('button',{name:'Appearance settings',exact:true});
  await settings.focus();
  await page.keyboard.press('Enter');
  const panel=page.getByRole('group',{name:'Appearance settings',exact:true});
  await panel.waitFor();
  assert(await panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}));
  await panel.getByRole('button',{name:'Dark mode',exact:true}).click();
  await page.waitForFunction(()=>document.documentElement.classList.contains('dark'));
  await page.keyboard.press('Escape');
  await panel.waitFor({state:'hidden'});
  assert(await settings.evaluate(el=>el.matches(':focus-within')));
  await settings.click();
  await panel.getByRole('button',{name:'Dark mode',exact:true}).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Help with patient home'}).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Explore MedAssist',exact:true}).click();
  await page.locator('#medassist-title').waitFor();
  await page.goBack({waitUntil:'commit'});
  await page.getByRole('heading',{name:'Your APIP dashboard'}).waitFor();
  await page.getByRole('button',{name:'Start an ADR report',exact:true}).click();
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Your APIP dashboard'}).waitFor();
  await page.goForward({waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'No saved reports yet'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Pause animation'}).isVisible(),false);
  assert.equal(await page.locator('.adr-process-steps li').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'Pause animation'}).click();
  assert.equal(await page.locator('.adr-process-steps li').first().evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
  await page.getByRole('button',{name:'Resume animation'}).click();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#adr-review-info').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>scrollY>0);
  assert(await page.locator('.access-header').evaluate(el=>Math.abs(el.getBoundingClientRect().top)<1));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:join(dir,`landing-${width}.png`),fullPage:true});
  if(width===1440){
   await page.evaluate(()=>{document.documentElement.style.zoom='2';});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
   assert(await page.locator('.adr-landing-hero').evaluate(el=>el.getBoundingClientRect().right<=innerWidth+1));
   await page.evaluate(()=>{document.documentElement.style.zoom='';});
  }
  await page.getByRole('button',{name:'Start New Report',exact:true}).click();
  await page.getByRole('button',{name:'Initial',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  const initials=page.getByRole('textbox',{name:'Patient initials',exact:true});
  await initials.waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('value'),'1');
  assert(await page.locator('.adr-stages').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await initials.press('Enter');
  await initials.fill('FX');
  assert.equal(await initials.inputValue(),'FX');
  await initials.press('Enter');
  await page.getByRole('heading',{name:'How old was the patient when the reaction began?'}).waitFor();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  assert.equal(await initials.inputValue(),'FX');
  await initials.press('Enter');
  await page.getByRole('button',{name:'3 Reaction',exact:true}).click();
  const reaction=page.getByRole('textbox',{name:'What reaction or event was noticed?',exact:true});
  const longAnswer='Fictional symptoms were recorded for layout testing. '.repeat(16);
  await reaction.fill(longAnswer);
  assert.equal(await reaction.inputValue(),longAnswer);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await reaction.fill('Fictional itching');
  await reaction.press('Enter');
  assert.equal(await reaction.inputValue(),'Fictional itching\n');
  await reaction.press('Backspace');
  await reaction.press('Control+Enter');
  await page.getByRole('heading',{name:'When did the reaction begin?'}).waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('value'),'3');
  if (width === 360 && hasTemplate) {
   await page.route('**/adr-guided/*/pdf', route => route.fulfill({
    status:200, headers:{'Content-Type':'application/pdf','X-APIP-Revision':'1'}, body:'stale',
   }),{times:1});
  }
  if (width < 1000) await page.getByRole('button',{name:'Show form preview',exact:true}).click();
  if (width === 360 && hasTemplate) {
   await page.getByText('This draft changed in another tab.',{exact:false}).waitFor();
   assert.equal(await page.getByRole('img',{name:'Live preview of the original PvPI form, page 1'}).count(),0);
   await page.getByRole('button',{name:'Retry preview',exact:true}).click();
  }
  if (hasTemplate) await page.getByRole('img',{name:'Live preview of the original PvPI form, page 1'}).waitFor();
  else await page.getByText('The original PvPI template is missing from this checkout.').waitFor();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(dir,`live-form-${width}.png`),fullPage:true});
  if (width < 1000) await page.getByRole('button',{name:'Hide form preview',exact:true}).click();
  await page.screenshot({path:join(dir,`question-${width}.png`)});
  await page.getByRole('button',{name:'2 Patient',exact:true}).click();
  const answers={'Gender':'Female','Reported seriousness (select all that apply)':'None reported','Reported outcome':'Recovered','Suspected medicine · Brand / generic name':'Fictional medicine','Reporter name':'Fictional Reporter'};
  for(let n=0;n<55;n++){
   const heading=await page.locator('.adr-question h2').innerText();if(heading==='Review your report details')break;
   const label=await page.locator('.adr-question md-outlined-text-field').getAttribute('label',{timeout:150}).catch(()=>null) ?? await page.locator('.adr-options').getAttribute('aria-label',{timeout:150}).catch(()=>null);
   const value=answers[label];
   if(value){const option=page.getByRole('button',{name:value,exact:true});if(await option.count())await option.click();else await page.getByRole('textbox',{name:label,exact:true}).fill(value);}
   const response=page.waitForResponse(r=>r.url().endsWith('/command')&&r.request().method()==='POST');
   await page.getByRole('button',{name:value?'Continue':'Unknown / not available',exact:true}).click();assert.equal((await response).status(),200);
   await page.waitForFunction(previous=>document.querySelector('.adr-question h2')?.textContent!==previous,heading);
  }
  await page.getByRole('heading',{name:'Review your report details',exact:true}).waitFor();await page.getByText('0 minimum-checklist items still missing.',{exact:false}).waitFor();
  if(width===1440)await page.screenshot({path:join(dir,'grouped-review.png')});
  const generate=async(expected,suffix)=>{
   await page.getByRole('button',{name:/^(Generate official PDF|Regenerate PDF)$/}).click();await page.getByRole('link',{name:'Download PDF',exact:true}).waitFor();
   assert(await page.locator('iframe[title="Generated official PvPI form"]').getAttribute('src'));
   const download=page.waitForEvent('download');await page.getByRole('link',{name:'Download PDF',exact:true}).click();const file=join(dir,`download-${width}-${suffix}.pdf`);await(await download).saveAs(file);
   const fields=JSON.parse(execFileSync(process.env.APIP_PDF_PYTHON||'python',['-c',"import json,sys;from pypdf import PdfReader;r=PdfReader(sys.argv[1]);assert len(r.pages)==2;f=r.get_fields();print(json.dumps({k:str(v.get('/V','')) for k,v in f.items()}))",file],{encoding:'utf8',windowsHide:true}));
   assert.equal(fields['Text Field8'],expected);assert.equal(fields['Text Field10'],'Fictional medicine');assert.equal(fields['Check Box17'],'/Yes');assert.equal(fields['Check Box2'],'/Yes');assert.equal(fields['Check Box10'],'/Yes');assert.equal(fields['Text Field44'],'');assert.equal(fields['Text Field3'],'');
  };
  if(hasTemplate && width===1440){
   await page.route('**/adr-guided/*/pdf', route => route.fulfill({
    status:429, json:{error:'PDF_BUSY'},
   }), {times:1});
  }
  if(hasTemplate){await generate('Fictional itching','initial');assert.equal(await page.getByRole('button',{name:'Skip animation',exact:true}).count(),0);assert.equal(await page.locator('.adr-report-frame').evaluate(e=>getComputedStyle(e).animationName),'none');}
  await page.locator('.adr-question summary').filter({hasText:'Reaction ·'}).click();
  await page.locator('.adr-question').getByRole('button',{name:'Edit What reaction or event was noticed?',exact:true}).click();await page.getByRole('textbox',{name:'What reaction or event was noticed?',exact:true}).fill('Corrected fictional itching');
  const saved=page.waitForResponse(r=>r.url().endsWith('/command'));await page.getByRole('button',{name:'Save progress',exact:true}).click();const revision=(await(await saved).json()).case.revision;
  await page.reload({waitUntil:'domcontentloaded'});const draft=page.locator('.adr-draft-card');await draft.waitFor();assert.match(await draft.innerText(),new RegExp(`Saved revision\\s+${revision}`));assert(await draft.locator('time').getAttribute('datetime'));await page.screenshot({path:join(dir,`saved-${width}.png`),fullPage:true});await draft.getByRole('button',{name:/^Resume draft /}).click();await page.getByRole('heading',{name:'Review your report details',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Download PDF',exact:true}).count(),0);if(hasTemplate)await generate('Corrected fictional itching','regenerated');
  if(hasTemplate&&width===1440){
   await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Regenerate PDF',exact:true}).click();await page.getByRole('button',{name:'Skip animation',exact:true}).waitFor();assert(await page.locator('.adr-report-frame').evaluate(e=>getComputedStyle(e).animationName==='adr-reveal'));await page.getByRole('button',{name:'Skip animation',exact:true}).click();assert.equal(await page.locator('.adr-report-frame.revealing').count(),0);
   await page.getByRole('button',{name:'Regenerate PDF',exact:true}).click();await page.getByRole('button',{name:'Skip animation',exact:true}).waitFor();await page.locator('.adr-report-frame.revealing').waitFor({state:'detached'});
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if(width!==1440)assert.equal(await page.locator('.adr-question').evaluate(e=>getComputedStyle(e).animationName),'none');assert.deepEqual(errors,[]);
  await page.locator('.adr-export').scrollIntoViewIfNeeded();await page.screenshot({path:join(dir,`review-${width}.png`)});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.getByRole('link',{name:'Sign in to start',exact:true}).waitFor();
  await page.getByRole('link',{name:'Sign in to start',exact:true}).click();
  await page.getByRole('textbox',{name:'Email address'}).fill(`fictional-${width}@example.test`);
  await page.getByLabel('Password',{exact:true}).fill('fictional-password-123');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('heading',{name:'Saved reports',exact:true}).waitFor();
  console.log(`PASS ${width}px: signup, dashboard, keyboard and Back, edit/reload, PDF ${hasTemplate?"verified":"skipped (template absent)"}, logout and login`);await context.close();
 }
 console.log('Screenshots: '+dir);
}finally{await browser?.close();await vite.close();await new Promise(resolve=>server.close(resolve));account.close();await rm(join(dir,'fictional.sqlite'),{force:true});}
