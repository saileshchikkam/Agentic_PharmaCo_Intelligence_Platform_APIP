import assert from 'node:assert/strict';
import express from 'express';
import { mkdtemp,mkdir,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { registerLocalAccount } from '../server/local-account.ts';

process.env.NODE_ENV='development';process.env.ADR_INTAKE_PROVIDER='disabled';
const serve=process.argv.includes('--serve');
const dir=process.env.APIP_CASE_EVIDENCE_DIR?resolve(process.env.APIP_CASE_EVIDENCE_DIR):await mkdtemp(join(tmpdir(),'apip-3a-browser-'));
await mkdir(dir,{recursive:true});
const app=express();
const server=await new Promise(resolve=>{const s=app.listen(serve?3200:0,'127.0.0.1',()=>resolve(s));});
const port=server.address().port,origin=`http://127.0.0.1:${port}`;
const account=registerLocalAccount(app,{file:join(dir,'phase3a-fictional.sqlite'),originPort:port});
const vite=await createServer({server:{middlewareMode:true,hmr:{server},watch:null},define:{
  'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(''),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('')}});
app.use(vite.middlewares);
if(serve){
  console.log(`Phase 3A SQLite-only fictional preview: ${origin}/#/patient/adr/cases`);
  console.log('Independent development database; existing port 3000 and hosted port 3100 are untouched.');
  await new Promise(()=>{});
}
const {chromium}=await import(process.env.ADR_PLAYWRIGHT_MODULE||'playwright');
let browser;
const results=[];
try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const width of (process.env.APIP_CASE_WIDTHS??'320,360,820,1440').split(',').map(Number)){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/#/');
    await page.getByRole('link',{name:'Sign up',exact:true}).click();
    await page.getByRole('textbox',{name:'Email address'}).fill(`phase3a-${width}-${Date.now()}@example.test`);
    await page.getByLabel('Password',{exact:true}).fill('fictional-browser-only-123');
    await page.getByRole('button',{name:'Create account',exact:true}).click();
    await page.getByRole('heading',{name:'Your APIP dashboard'}).waitFor();
    const seeded=await page.evaluate(async()=>{
      const {user}=await(await fetch('/api/account/session')).json();
      const call=async(path,body)=>{
        const r=await fetch('/api/account/adr-guided'+path,{method:body===undefined?'GET':'POST',
          headers:{'Content-Type':'application/json','X-APIP-Account':user.id},body:body===undefined?undefined:JSON.stringify(body)});
        if(!r.ok)throw Error('fixture '+r.status);return r.json();
      };
      let c=(await call('',{fictionalOnly:true})).case;
      for(const [key,value] of Object.entries({caseType:'Initial',initials:'XZ',age:'32',gender:'Female',reaction:'Fictional initial rash',
        reactionStart:'2026-11-01',seriousness:'None reported',outcome:'Recovered',reporterName:'Fictional Reporter',reportDate:'2026-11-02',
        [`med.${c.medications[0].id}.name`]:'Fictional Alpha', [`med.${c.medications[0].id}.dose`]:'10 mg'}))
        c=(await call(`/${c.id}/command`,{expectedRevision:c.revision,command:{type:'confirm',key,value}})).case;
      const historical=c.revision;
      c=(await call(`/${c.id}/command`,{expectedRevision:c.revision,command:{type:'confirm',key:'reaction',value:'Fictional later itching'}})).case;
      for(let i=0;i<2;i++)await call('',{fictionalOnly:true});
      return {id:c.id,historical,latest:c.revision};
    });
    await page.getByRole('button',{name:'My ADR Reports',exact:true}).click();
    await page.getByRole('heading',{name:'My ADR Reports',exact:true}).waitFor();
    await page.locator('.adr-case-card').first().waitFor();
    assert.equal(await page.locator('.adr-case-card').count(),3);
    await page.screenshot({path:join(dir,`list-${width}.png`),fullPage:true});
    await page.getByRole('searchbox',{name:'Search case reference or medicine'}).fill('Alpha');
    await page.getByRole('button',{name:'Apply filters',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.adr-case-card').length===1);
    await page.screenshot({path:join(dir,`search-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'View report',exact:true}).click();
    await page.getByRole('heading',{name:`Report ${seeded.id.slice(0,8)}`,exact:true}).waitFor();
    await page.screenshot({path:join(dir,`detail-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'Edit latest report',exact:true}).click();
    await page.locator('.adr-stages').waitFor();
    assert(await page.getByText(`Saved revision ${seeded.latest}`,{exact:true}).isVisible());
    await page.screenshot({path:join(dir,`guided-${width}.png`),fullPage:true});
    await page.locator('.adr-stages button').last().click();
    await page.locator('.adr-question summary').filter({hasText:'Reporter information ·'}).click();
    await page.getByRole('button',{name:'Edit Reporter name',exact:true}).click();
    const answer=page.getByRole('textbox',{name:'Reporter name',exact:true});
    await answer.fill('Fictional keyboard reporter');
    // Native browser Back must preserve an unfinished answer when leaving is declined.
    page.once('dialog',dialog=>dialog.dismiss());
    await page.evaluate(()=>window.history.back());
    await page.waitForTimeout(250);
    assert.equal(await answer.inputValue(),'Fictional keyboard reporter');
    const saved=page.waitForResponse(r=>r.url().endsWith('/command')&&r.request().method()==='POST');
    await answer.press('Enter');assert.equal((await saved).status(),200);
    await page.locator('.adr-question summary').filter({hasText:'Reaction ·'}).click();
    await page.getByRole('button',{name:'Edit What reaction or event was noticed?',exact:true}).click();
    const narrative=page.getByRole('textbox',{name:'What reaction or event was noticed?',exact:true});
    await narrative.fill('Fictional keyboard narrative');await narrative.press('Enter');
    assert.match(await narrative.inputValue(),/\n$/);
    const multiline=page.waitForResponse(r=>r.url().endsWith('/command')&&r.request().method()==='POST');
    await narrative.press('Control+Enter');assert.equal((await multiline).status(),200);
    await page.getByRole('button',{name:'Back to report',exact:true}).click();
    await page.getByRole('button',{name:'Revision history',exact:true}).click();
    await page.getByRole('heading',{name:'Revision history',exact:true}).waitFor();
    await page.getByRole('button',{name:'View revision '+seeded.historical,exact:true}).waitFor();
    await page.screenshot({path:join(dir,`history-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'View revision '+seeded.historical,exact:true}).click();
    await page.getByText('This is an immutable saved version.',{exact:false}).waitFor();
    assert.equal(await page.locator('.adr-question').getByRole('button',{name:/^Edit /}).count(),0);
    await page.locator('.adr-question summary').filter({hasText:'Reaction ·'}).click();
    await page.getByText('Fictional initial rash',{exact:true}).waitFor();
    if(width<1000)await page.getByRole('button',{name:'Show form preview',exact:true}).click();
    await page.getByRole('img',{name:'Live preview of the original PvPI form, page 1'}).waitFor({timeout:30000});
    const download=page.waitForEvent('download');
    await page.getByRole('link',{name:'Download PDF · revision '+seeded.historical,exact:true}).click();
    const pdf=join(dir,`historical-${width}.pdf`);await(await download).saveAs(pdf);
    execFileSync(process.env.APIP_PDF_PYTHON||'python',['-c',
      "from pypdf import PdfReader;import sys;p=PdfReader(sys.argv[1]);assert len(p.pages)==2;assert len(p.get_fields())==147;assert p.get_fields()['Text Field8']['/V']=='Fictional initial rash'",pdf]);
    await page.waitForTimeout(750);
    await page.getByRole('img',{name:'Live preview of the original PvPI form, page 1'}).waitFor({timeout:30000});
    await page.getByText('Preparing the saved form preview…',{exact:true}).waitFor({state:'hidden'});
    await page.evaluate(()=>scrollTo(0,0));
    await page.waitForTimeout(300);
    await page.getByText('Preparing the saved form preview…',{exact:true}).waitFor({state:'hidden'});
    await page.screenshot({path:join(dir,`historical-${width}.png`)});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const settings=page.getByRole('button',{name:'Appearance settings',exact:true});await settings.click();
    await page.getByRole('group',{name:'Appearance settings',exact:true}).getByRole('button',{name:'Dark mode',exact:true}).click();
    await page.keyboard.press('Escape');
    await page.screenshot({path:join(dir,`dark-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'My ADR Reports',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.adr-case-card').length===1);
    assert.equal(await page.getByRole('searchbox',{name:'Search case reference or medicine'}).inputValue(),'Alpha');
    await page.getByRole('button',{name:'Sign out',exact:true}).click();
    await page.getByRole('heading',{name:'Sign in',exact:true}).waitFor();
    assert.equal(await page.locator('.adr-case-card').count(),0);
    assert.equal(await page.getByRole('img',{name:/Live preview/}).count(),0);
    // A protected deep link survives sign-in; a different account sees no previous-owner snapshot.
    await page.goto(`${origin}/#/patient/adr/cases/${seeded.id}/revisions/${seeded.historical}`);
    await page.getByRole('heading',{name:'Sign in',exact:true}).waitFor();
    await page.getByRole('button',{name:'Create account',exact:true}).click();
    await page.getByRole('textbox',{name:'Email address'}).fill(`phase3a-other-${width}-${Date.now()}@example.test`);
    await page.getByLabel('Password',{exact:true}).fill('fictional-other-only-123');
    await page.getByRole('button',{name:'Create account',exact:true}).click();
    await page.getByText('This report is unavailable in your account.',{exact:true}).waitFor();
    assert.equal(await page.locator('.adr-question').count(),0);
    assert.equal(await page.getByRole('img',{name:/Live preview/}).count(),0);
    assert.deepEqual(errors,[]);
    results.push({width,result:'PASS',mode:'isolated SQLite; real local auth; original PDF runtime'});
    console.log('PASS '+width+'px case management, guided edit, history, original PDF, dark mode, logout');
    await context.close();
  }
  await writeFile(join(dir,'browser-results.json'),JSON.stringify(results,null,2));console.log('Evidence: '+dir);
}finally{
  await browser?.close();await vite.close();await new Promise(resolve=>server.close(resolve));account.close();
}
