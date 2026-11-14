import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const assert = (value, message) => { if (!value) throw Error(message); };
const output = process.env.MEDASSIST_UI_SCREENSHOTS;
if (output) await mkdir(output, { recursive: true });
// Isolated UI fixture mounts the real component; no authentication or hosted data is mocked.
const server = await createServer({server:{host:'127.0.0.1',port:3957}, plugins:[{
 name:'medassist-layout-fixture',
 resolveId(id) { if(id === '/@id/__x00__layout-fixture') return '\0layout-fixture'; },
 load(id) { if(id === '\0layout-fixture') return `import React from 'react';import {createRoot} from 'react-dom/client';import MedAssist from '/src/features/medassist-conversation/MedAssistConversation.tsx';import '/src/index.css';import '/src/design-system/material-web-imports.ts';import '/src/features/access/access.css';import {applyAppearance} from '/src/design-system/appearance.ts';applyAppearance({accent:'blue',isDark:false});createRoot(document.getElementById('root')).render(React.createElement('div',{className:'access-app access-app-conversation'},React.createElement(MedAssist)));`; },
 configureServer(s) { s.middlewares.use('/layout-fixture', async (_req,res) => {res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/layout-fixture','<html><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Material+Symbols+Outlined&display=swap" rel="stylesheet"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/@id/__x00__layout-fixture"></script></html>'));}); }
}]});
let browser;
try {
 await server.listen();
 browser = await chromium.launch({channel:'chrome',headless:true});
 if(process.env.MEDASSIST_VERIFY_UNIFIED_PREVIEW) {
 const integrated=await browser.newPage();
 const home=await integrated.goto('http://127.0.0.1:3602/',{timeout:15000});
 const ready=await integrated.request.get('http://127.0.0.1:3602/api/ready',{timeout:15000});
 console.log(JSON.stringify({preview:home.status(),apiReady:ready.status()}));
 await integrated.goto('http://127.0.0.1:3602/#/preview/medassist-conversation');
 await integrated.getByRole('heading',{name:'Patient Sign In',exact:true}).waitFor();
 console.log('Hosted authenticated MedAssist: BLOCKED - fresh browser requires private patient sign-in.');
 await integrated.close();
 }
 for (const width of [1440,1024,768,375,320]) {
  const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
  await page.goto(server.resolvedUrls.local[0]+'layout-fixture');
  await page.getByRole('heading',{name:'MedAssist AI',exact:true}).waitFor();
  const panel=page.locator('.conversation-workspace'), log=page.locator('.conversation-messages');
  const before=await panel.boundingBox();
  assert(!await page.locator('.conversation-research-details').evaluate(e=>e.open),'details must start closed');
  if(output) await page.screenshot({path:`${output}/medassist-before-${width}.png`,fullPage:true});
  for(let i=0;i<15;i++) {
   const input=page.getByRole('textbox').first();
   await input.fill('I have a cough. Fictional detail '+i);await input.press('Enter');
   await page.getByRole('button',{name:'No / Not sure — correct this',exact:true}).click();
  }
  assert(await page.locator('.conversation-open-mentions').count()===0,'additional descriptions panel must not render');
  const after=await panel.boundingBox();
  assert(before.height>=720,'chat should use more available height');
  assert(Math.abs(before.height-after.height)<2,'chat grew at '+width);
  assert(await log.evaluate(e=>e.scrollHeight>e.clientHeight),'history must scroll');
  await log.evaluate(e=>{e.scrollTop=0;e.dispatchEvent(new Event('scroll'));});
  await page.getByRole('textbox').first().fill('I have a cough. Another fictional detail');
  await page.getByRole('textbox').first().press('Enter');
  assert(await log.evaluate(e=>e.scrollTop===0),'new messages moved reader');
  await page.getByText('Research details',{exact:true}).click();
  assert(await log.evaluate(e=>e.scrollTop===0),'disclosure moved history');
  await page.getByText('Research details',{exact:true}).click();
  await log.evaluate(e=>{e.scrollTop=e.scrollHeight;e.dispatchEvent(new Event('scroll'));});
  assert(await page.getByRole('button',{name:'Confirm these details',exact:true}).isVisible(),'confirmation inaccessible');
  assert(await page.locator('.severity-pill').count()===4,'four severity categories lost');
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'horizontal overflow '+width);
  assert(await page.locator('.conversation-input').evaluate(e=>e.getBoundingClientRect().bottom<=e.parentElement.getBoundingClientRect().bottom),'composer outside card');
  if(output) await page.screenshot({path:`${output}/medassist-after-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Confirm these details',exact:true}).click();
  await page.getByRole('textbox').first().fill('35');
  await page.getByRole('textbox').first().press('Enter');
  await page.getByRole('button',{name:'F',exact:true}).click();
  for(let turn=0;turn<3;turn++) await page.getByRole('button',{name:'Not sure',exact:true}).click();
  assert(await page.locator('.conversation-summary').count()===1,'session summary missing');
  assert(await page.locator('.conversation-open-mentions').count()===0,'panel reappeared during follow-up');
  assert(Math.abs((await panel.boundingBox()).height-before.height)<2,'follow-ups changed card height');
  await page.getByRole('button',{name:'Restart',exact:true}).click();
  assert(await page.locator('.conversation-user').count()===0,'restart failed');
  await page.getByRole('button',{name:'Emergency help',exact:true}).click();
  await page.getByRole('heading',{name:'Emergency help',exact:true}).waitFor();
  assert(await page.getByRole('link',{name:'Call 112 in India'}).isVisible(),'emergency content inaccessible');
  assert(errors.length===0,errors.join('\n'));
  console.log(JSON.stringify({width,status:'PASS',before:before.height,after:after.height,exchanges:15,mode:'isolated real-component scripted UI fixture'}));
  await page.close();
 }
} finally {await browser?.close();await server.close();}

