// Two-account hosted acceptance: Patient and Approved Specialist.
// Password entry remains in Chrome; bearer headers stay in memory.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,access,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.ADR_PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.APIP_TEST_ORIGIN||'http://127.0.0.1:3602',dir=resolve(process.env.APIP_TEST_EVIDENCE||'../closure-private-evidence');await mkdir(dir,{recursive:true});

function log(msg) {
  process.stdout.write(msg + '\n');
  void appendFile(resolve(dir, 'test-progress.log'), `[${new Date().toISOString()}] ${msg}\n`).catch(() => {});
}

const browser=await chromium.launch({channel:'chrome',headless:false});
const results={mode:'real hosted Supabase through existing API (two-account)',layout:[],gates:{}};
const headers=[];
const contexts=[];
const pages=[];

async function call(i,path,body,key=randomUUID(),account){
  assert(headers[i]);
  const r=await fetch(origin+path,{
    method:body===undefined?'GET':'POST',
    headers:{
      ...headers[i],
      ...(account?{'X-APIP-Account':account}:{}),
      'Content-Type':'application/json',
      'Idempotency-Key':key
    },
    body:body===undefined?undefined:JSON.stringify(body)
  });
  return {
    status:r.status,
    data:r.headers.get('content-type')?.includes('pdf')?Buffer.from(await r.arrayBuffer()):await r.json()
  };
}

async function signedIn(p, i, label, expectedSubject=null){
  log(`[WAITING AUTH] Context ${i}: ${label}...`);
  await p.waitForFunction(()=>{
    try{
      const raw = localStorage.getItem('apip.cloud.auth');
      if (!raw) return false;
      const s = JSON.parse(raw);
      return !!(s?.user?.id && s?.access_token);
    }catch{
      return false;
    }
  },{},{timeout:1200000});
  const auth = await p.evaluate(() => JSON.parse(localStorage.getItem('apip.cloud.auth')));
  const subject = auth.user.id;
  headers[i] = { Authorization: 'Bearer ' + auth.access_token, 'X-APIP-Account': subject };
  log(`[AUTH DETECTED] Context ${i}: ${label} (subject: ${subject.slice(0, 8)}...)`);
  if (expectedSubject && subject !== expectedSubject) {
    log(`[SUBJECT MISMATCH] Context ${i}: Expected ${expectedSubject}, got ${subject}`);
    throw new Error(`SUBJECT_MISMATCH: Expected ${expectedSubject}, got ${subject}`);
  }
}

try {
 if (!process.argv.includes('--skip-layout')) {
  const visual=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),v=await visual.newPage();
  await v.goto('http://127.0.0.1:3601/#/sign-in/patient');
  await v.getByRole('heading',{name:'Welcome back',exact:true}).waitFor();
  await v.screenshot({path:resolve(dir,'before-desktop.png'),fullPage:true});
  for(const width of [320,360,820,1024,1440,1920]){
   await v.setViewportSize({width,height:1000});
   await v.goto(origin+'/#/sign-in/patient');
   await v.getByRole('heading',{name:'Welcome back',exact:true}).waitFor();
   const email=v.getByRole('textbox',{name:'Email',exact:true});
   await email.fill('fictional@example.test');
   await v.getByRole('textbox',{name:'Password',exact:true}).fill('Fictional-example');
   await v.getByRole('button',{name:'Show password',exact:true}).focus();
   await v.keyboard.press('Space');
   assert.equal(await v.getByRole('textbox',{name:'Password',exact:true}).getAttribute('type'),'text');
   await v.getByRole('button',{name:'Hide password',exact:true}).click();
   const box=await v.locator('.auth-card-shell').boundingBox();
   assert(box&&box.width<=552.5);
   if(width>=820)assert(box.width>=520);
   assert(await v.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.equal(await v.getByRole('link',{name:'Developer sign-in',exact:true}).count(),0);
   for(const name of ['Patient','Specialist']){
     const tab=await v.getByRole('button',{name,exact:true}).boundingBox();
     assert(tab&&tab.x>=box.x&&tab.x+tab.width<=box.x+box.width,'Segmented control must fit the card');
   }
   await v.screenshot({path:resolve(dir,'signin-'+width+'.png'),fullPage:true});
   await v.getByRole('button',{name:'Create an account',exact:true}).click();
   await v.getByRole('heading',{name:'Create your account',exact:true}).waitFor();
   await v.goBack();
   await v.getByRole('heading',{name:'Welcome back',exact:true}).waitFor();
   await v.getByRole('button',{name:'Specialist',exact:true}).click();
   assert.equal(await v.getByRole('button',{name:'Specialist',exact:true}).getAttribute('aria-pressed'),'true');
   await v.getByRole('button',{name:'Forgot password?',exact:true}).click();
   await v.getByRole('heading',{name:'Reset your password',exact:true}).waitFor();
   await v.reload();
   await v.getByRole('heading',{name:'Reset your password',exact:true}).waitFor();
   await v.getByRole('button',{name:'Back to sign in',exact:true}).click();
   await v.evaluate(()=>localStorage.setItem('apip.appearance.v1',JSON.stringify({accent:'blue',isDark:true})));
   await v.reload();
   assert(await v.locator('html.dark').count());
   assert(await v.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await v.screenshot({path:resolve(dir,'dark-'+width+'.png'),fullPage:true});
   await v.evaluate(()=>localStorage.setItem('apip.appearance.v1',JSON.stringify({accent:'blue',isDark:false})));
   await v.reload();
   results.layout.push({width,card:box.width,result:'PASS',keyboard:'browser Back/Forward, visibility and segmented controls'});
  }
  await visual.close();
  if(process.argv.includes('--layout-only')){
    await writeFile(resolve(dir,'layout-results.json'),JSON.stringify(results,null,2));
    await browser.close();
    process.exit(0);
  }
  log('PASS six-width production authentication layout, typing, visibility, route history and dark theme.');
 } else {
  log('Skipping layout suite (--skip-layout supplied). Proceeding directly to authenticated browser test.');
 }

 const routes=['/sign-in/patient','/sign-in/specialist'];
 const labels=['PATIENT — SEPARATE SYNTHETIC ACCOUNT','APPROVED SPECIALIST — FICTIONAL APIP SHARING REVIEWER'];
 const expectedSubjects=[null, 'da312f4f-cbcf-400b-8a81-b0e13f7efc42'];

 for(let i=0;i<2;i++){
   const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage();
   contexts.push(c);
   pages.push(p);

   // Network capture for authentication feedback
   p.on('response', async res => {
     const url = res.url();
     if (url.includes('/auth/v1/token')) {
       const status = res.status();
       try {
         const data = await res.json();
         if (status >= 400) {
           log(`[AUTH RESPONSE] Context ${i} (${labels[i]}): HTTP ${status} error_code="${data.error_code || data.error || 'unknown'}" msg="${data.msg || data.error_description || 'unknown'}"`);
         } else if (status === 200) {
           log(`[AUTH RESPONSE] Context ${i} (${labels[i]}): HTTP 200 OK (session created)`);
         }
       } catch {}
     }
   });

   await p.goto(origin+'/#'+routes[i]);
   await p.evaluate(label=>document.title=label,labels[i]);
 }

 log('PRIVATE SIGN-IN NEEDED: patient (window 0) and approved specialist (window 1).');
 await Promise.all(pages.map((p, i) => signedIn(p, i, labels[i], expectedSubjects[i])));

 // Verify distinct subjects
 assert.notEqual(headers[0]['X-APIP-Account'], headers[1]['X-APIP-Account']);
 results.gates.sessionRestoration='PASS';
 log(`[ISOLATION VERIFIED] 2 distinct authenticated subjects verified: Patient=${headers[0]['X-APIP-Account'].slice(0,8)}..., Specialist=${headers[1]['X-APIP-Account'].slice(0,8)}...`);

 // Verify Patient Capabilities
 const patientCaps = await call(0, '/api/account/capabilities');
 assert.equal(patientCaps.status, 200);
 assert.equal(patientCaps.data.identityAdministration, false);
 assert.equal(patientCaps.data.specialistWorkspace, false);
 results.gates.realEmailSession0 = 'PASS';
 log(`[CAPABILITIES] Patient: OK (regular patient)`);

 // Verify Specialist Capabilities
 const specialistCaps = await call(1, '/api/account/capabilities');
 assert.equal(specialistCaps.status, 200);
 assert.equal(specialistCaps.data.specialistWorkspace, true);
 results.gates.realEmailSession1 = 'PASS';
 log(`[CAPABILITIES] Specialist: OK (specialistWorkspace=true, validUntil=${specialistCaps.data.validUntil})`);

 // Verify Specialist Application State in Hosted Database
 let a = (await call(1, '/api/specialist/applications/current')).data.application;
 assert(a);
 assert.equal(a.state, 'APPROVED');
 results.gates.approvedSpecialist = 'PASS';
 log(`[SPECIALIST APPLICATION] ${a.id} confirmed state APPROVED (${a.profile.fullName}, ${a.profile.category})`);

 // Opt into directory
 assert.equal((await call(1, '/api/sharing/directory', { optedIn: true })).status, 200);
 log('[DIRECTORY] Specialist opted into directory successfully.');

 // Create Patient ADR guided case
 let r = await call(0, '/api/account/adr-guided', { fictionalOnly: true });
 assert.equal(r.status, 201);
 let c = r.data.case;
 for (const [key, value] of [
   ['caseType', 'Initial'],
   ['initials', 'FC'],
   ['reaction', 'Fictional rash for authorized sharing verification'],
   ['reporterName', 'Fictional APIP reporter'],
   ['email', 'fictional@example.test'],
   ['med.' + c.medications[0].id + '.name', 'Fictional medicine']
 ]) {
   r = await call(0, '/api/account/adr-guided/' + c.id + '/command', { expectedRevision: c.revision, command: { type: 'confirm', key, value } });
   assert.equal(r.status, 200);
   c = r.data.case;
 }
 log(`[PATIENT CASE] Created and confirmed fields at revision ${c.revision} (id: ${c.id})`);

 // Patient UI: explicit consent & sharing request
 const p = pages[0], s = pages[1];
 await p.goto(origin + '/#/patient/adr/cases/' + c.id);
 await p.getByRole('button', { name: 'Share revision ' + c.revision, exact: true }).click();
 await p.getByRole('combobox', { name: 'Specialist recipient', exact: true }).click();
 await p.getByRole('option', { name: new RegExp(a.profile.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
 const consent = p.getByRole('checkbox', { name: /I consent to share case/ });
 assert.equal(await consent.isChecked(), false);
 await consent.focus();
 await p.keyboard.press('Space');
 assert.equal(await consent.isChecked(), true);
 await p.getByRole('button', { name: 'Confirm sharing request', exact: true }).click();
 await p.getByRole('button', { name: 'Withdraw future access', exact: true }).waitFor();
 const assignments = (await call(0, '/api/sharing/requests')).data.requests;
 const q = assignments.find(q => q.caseId === c.id);
 assert(q);
 assert.equal(q.revision, c.revision);
 results.gates.hostedConsent = 'PASS';
 log(`[CONSENT & SHARING] Revision 1 shared with specialist (request: ${q.id})`);

 // Specialist UI: Open inbox and PvPI form preview
 await s.goto(origin + '/#/specialist/reviews');
 await s.getByRole('button', { name: 'Open assigned revision', exact: true }).click();
 await s.getByRole('heading', { name: 'Consented revision ' + c.revision, exact: true }).waitFor();
 await s.getByRole('button', { name: 'Preview authorized PvPI form', exact: true }).click();
 await s.getByRole('img', { name: 'Live preview of the original PvPI form, page 1' }).waitFor();
 log(`[SPECIALIST UI] Opened assigned revision ${c.revision} and loaded live PvPI preview`);

 // Validate original PvPI PDF via pypdf
 const pdf = await call(1, '/api/sharing/inbox/' + q.id + '/preview', {});
 assert.equal(pdf.status, 200);
 assert(Buffer.isBuffer(pdf.data));
 const pdfPath = resolve(dir, 'hosted-original.pdf');
 await writeFile(pdfPath, pdf.data);
 execFileSync(process.env.APIP_PDF_PYTHON, [
   '-c',
   "from pypdf import PdfReader;import sys;r=PdfReader(sys.argv[1]);assert len(r.pages)==2;v=[str(f.get('/V','')) for f in r.get_fields().values()];assert 'Fictional APIP reporter' in v;assert 'Fictional medicine' in v",
   pdfPath
 ]);
 results.gates.originalPdf = 'PASS';
 log(`[PDF VALIDATION] 2 pages, fields verified by pypdf: PASS`);

 // Responsive captures across 6 viewports
 for (const width of [320, 360, 820, 1024, 1440, 1920]) {
   await p.setViewportSize({ width, height: 1000 });
   await s.setViewportSize({ width, height: 1000 });
   assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
   assert(await s.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
   await p.screenshot({ path: resolve(dir, 'hosted-patient-' + width + '.png'), fullPage: true });
   await s.screenshot({ path: resolve(dir, 'hosted-inbox-' + width + '.png'), fullPage: true });
 }
 log(`[RESPONSIVE SCREENSHOTS] Captured 12 responsive views: PASS`);

 // Security denials:
 // 1. Patient cannot access specialist inbox
 assert.equal((await call(0, '/api/sharing/inbox/' + q.id)).status, 404);
 // 2. Spoofed account header rejected
 assert.equal((await call(1, '/api/sharing/inbox/' + q.id, undefined, undefined, headers[0]['X-APIP-Account'])).status, 409);
 // 3. Random unassigned caller denied
 assert.equal((await call(0, '/api/sharing/inbox/' + randomUUID())).status, 404);
 results.gates.securityDenials = 'PASS';
 log(`[SECURITY DENIALS] Patient 404, spoofed header 409, nonexistent/unassigned 404: PASS`);

 // Newer revision privacy
 r = await call(0, '/api/account/adr-guided/' + c.id + '/command', { expectedRevision: c.revision, command: { type: 'confirm', key: 'reaction', value: 'Fictional private newer revision' } });
 assert.equal(r.status, 200);
 const specialistView = (await call(1, '/api/sharing/inbox/' + q.id)).data;
 assert.equal(specialistView.revision, 1);
 results.gates.newRevisionPrivate = 'PASS';
 log(`[REVISION PRIVACY] Patient updated to revision 2; specialist retains access ONLY to revision 1: PASS`);

 // Patient consent withdrawal
 await p.getByRole('button', { name: 'Withdraw future access', exact: true }).click();
 await p.getByText('withdrawn', { exact: true }).waitFor();
 assert.equal((await call(1, '/api/sharing/inbox/' + q.id)).status, 404);
 assert.equal((await call(1, '/api/sharing/inbox/' + q.id + '/preview', {})).status, 404);
 await s.reload();
 await s.getByText('No active assignments.', { exact: true }).waitFor();
 results.gates.withdrawal = 'PASS';
 log(`[WITHDRAWAL] Specialist access immediately returns 404 on inbox and preview: PASS`);

 // Sign out cleanup
 for (let i = 0; i < 2; i++) {
   await pages[i].getByRole('button', { name: 'Sign out', exact: true }).click();
   await pages[i].waitForFunction(() => !localStorage.getItem('apip.cloud.auth'));
 }
 results.gates.signOutCleanup = 'PASS';
 await writeFile(resolve(dir, 'results.json'), JSON.stringify(results, null, 2));
 log(`PASS two-account hosted Phase 3C-B acceptance suite complete.`);

} catch (e) {
  results.stop = {
    type: e.name,
    message: e.message,
    location: (e.stack || '').match(/auth-sharing-hosted\.browser\.mjs:[0-9]+:[0-9]+/)?.[0]
  };
  await writeFile(resolve(dir, 'results.json'), JSON.stringify(results, null, 2));
  log(`HOSTED GATE STOPPED: ${e.name} ${e.message} at ${results.stop.location}`);
  console.error(e);
}

await browser.close();
process.exit(0);
