/** Four fixed fictional submissions; no benchmark, provider change or test-corpus access. */
import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
const output = 'models/medassist_ai/docs/p0-reliability-live.json';
assert.equal(existsSync(output), false, 'Preserve prior receipts; never rerun over recorded evidence.');
const { chromium } = await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const cases = [
  "Hi, I've been coughing for three days. I also have a mild fever and feel tired, especially at night.",
  "I've had stomach pain since yesterday evening. I feel like vomiting, but I haven't actually vomited.",
  "My head has been hurting since this morning, and bright lights make it worse. I don't have a fever.",
  'I am coughing.'
];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const rows = [], started = new Date().toISOString();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' }); page.setDefaultTimeout(10000);
  await page.goto('http://127.0.0.1:3000/#/preview/medassist-conversation', { waitUntil: 'domcontentloaded' });
  for (let index = 0; index < cases.length; index++) {
    if (index) await page.getByRole('button', { name: 'Restart fictional interview', exact: true }).click();
    await page.getByText('Ready to listen', { exact: false }).waitFor();
    const pending = page.waitForResponse(r => r.url().endsWith('/natural/extract'), { timeout: 20000 });
    const at = Date.now(), input = page.getByRole('textbox', { name: 'Fictional symptom description', exact: true });
    await input.fill(cases[index]); await input.press('Enter');
    const response = await pending, extraction = await response.json();
    await page.waitForFunction(() => !document.querySelector('.conversation-typing'));
    const row = { case: index + 1, at: new Date(at).toISOString(), fictional_text: cases[index], http_status: response.status(),
      elapsed_ms: Date.now() - at, request_id: response.request().headers()['x-request-id'], extraction,
      user_bubbles: await page.locator('.conversation-user').count(), confirmation: await page.getByRole('button', { name: 'Confirm these details', exact: true }).count() === 1, model_a: null };
    assert.equal(row.user_bubbles, 1);
    if (row.confirmation) {
      await page.getByRole('button', { name: 'Confirm these details', exact: true }).click();
      const age = page.getByRole('textbox', { name: 'Fictional age in years', exact: true }); await age.fill('35'); await age.press('Enter');
      const next = page.waitForResponse(r => r.url().endsWith('/natural/interview'));
      await page.getByRole('button', { name: 'F', exact: true }).click(); const r = await next, body = await r.json();
      row.model_a = { http_status: r.status(), question_id: body.result?.selection?.question?.evidence_id ?? null,
        question: body.result?.selection?.question?.question_en ?? null, exported_items: body.result?.handoff?.items?.length ?? null,
        model_b_status: body.result?.handoff?.model_b_status ?? null, handoff_observations: body.result?.handoff?.items?.filter(i => ['observed_positive', 'observed_negative', 'unknown', 'contradiction'].includes(i.status)).map(i => ({ id: i.evidence_id, status: i.status, value: i.value })) ?? [] };
    }
    rows.push(row); console.log(JSON.stringify({ case: row.case, status: row.http_status, confirmed: row.confirmation, user_bubbles: row.user_bubbles, question: row.model_a?.question_id ?? null }));
    // Stop rather than probing repeatedly after a service/configuration/allowance failure.
    if (!response.ok() && !['INVALID_STRUCTURED_OUTPUT', 'EVIDENCE_MAPPING_FAILURE'].includes(extraction.error)) break;
  }
  const diagnostics = await (await page.request.get('http://127.0.0.1:3000/api/research/model-a/language/diagnostics')).json();
  writeFileSync(output, JSON.stringify({ started, completed: new Date().toISOString(), actual_groq: true, actual_model_a: true, rows, diagnostics }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ receipt: output, cases: rows.length, upstream_statuses: diagnostics.attempts?.map(a => a.status) }));
} finally { await Promise.race([browser.close(), new Promise(done => setTimeout(done, 2000))]); }
