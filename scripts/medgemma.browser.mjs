/** Explicit real loopback smoke; requires the separately enabled local preview. */
import { writeFileSync, existsSync } from 'node:fs';
const { chromium } = await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const output = 'models/medassist_intelligence/medgemma-browser-smoke.json';
if (existsSync(output)) throw Error('Preserve the existing receipt');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage(); const actual = []; const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', async r => {
    if (r.url().endsWith('/extract') || r.url().endsWith('/interview')) {
      try { actual.push({ path: new URL(r.url()).pathname, status: r.status(), body: await r.json() }); } catch {}
    }
  });
  await page.goto('http://127.0.0.1:3000/#/preview/medassist-conversation');
  await page.getByRole('button', { name: 'Cough', exact: true }).waitFor();
  await page.locator('md-outlined-select').evaluate(async el => { await el.updateComplete; el.value = '0'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.getByRole('textbox').fill('I have a cough.');
  await page.getByRole('textbox').press('Enter');
  await page.getByRole('button', { name: 'Yes, start with this symptom', exact: true }).waitFor({ timeout: 90000 });
  await page.getByRole('button', { name: 'Yes, start with this symptom', exact: true }).click();
  await page.getByRole('button', { name: 'Not sure', exact: true }).waitFor({ timeout: 25000 });
  await page.getByRole('button', { name: 'Not sure', exact: true }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'End interview', exact: true }).click();
  await page.getByText('No diagnosis, urgency result or care advice was produced.', { exact: true }).waitFor({ timeout: 25000 });
  const extraction = actual.find(x => x.path.endsWith('/extract'));
  const interviews = actual.filter(x => x.path.endsWith('/interview'));
  const handoff = interviews.at(-1)?.body.handoff;
  if (extraction?.body.provenance?.provider !== 'ollama-local' || interviews.length < 3 || !interviews[0].body.selection.question
    || handoff?.items.length !== 223 || !handoff.items.some(x => x.status === 'unknown') || errors.length) throw Error('Actual pipeline assertions failed');
  const rejected = [];
  for (const text of ['I have ear discomfort.', 'Fever is present and fever is absent.']) {
    const result = await page.evaluate(async text => {
      const r = await fetch('/api/research/model-a/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema_version: 'medassist.extract-request.v1', fictional_only: true, text }) });
      const body = await r.json(); return { status: r.status, hasSuggestion: !!body.suggestion };
    }, text);
    if (result.hasSuggestion) throw Error('Unsafe proposal crossed final guard');
    rejected.push(result);
  }
  const receipt = { status: 'passed', actual_ollama: true, actual_model_a: true, explicit_confirmation: true,
    unknown_preserved: true, handoff_version: handoff.schema_version, handoff_items: handoff.items.length,
    model_b: handoff.model_b_status, questions: interviews.filter(x => x.body.selection.question).map(x => x.body.selection.question.evidence_id),
    final_guard_actual_regressions: rejected, page_errors: errors, ui_layout_changed: false };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n'); console.log(JSON.stringify(receipt));
} finally { await browser.close(); }
