/** One recorded-response replay plus at most two live fictional extractions. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { normalizeProposalQuotes, readProposal } from '../src/features/medassist-conversation/natural.ts';
const output = 'models/medassist_ai/docs/p0-reliability-followup.json'; assert.equal(existsSync(output), false);
const { chromium } = await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const recorded = JSON.parse(readFileSync('models/medassist_ai/docs/p0-validation-diagnostic.json', 'utf8'));
const cases = [
  { text: "I've had stomach pain since yesterday evening. I feel like vomiting, but I haven't actually vomited.", source: 'recorded_groq_response_with_final_normalization' },
  { text: "My head has been hurting since this morning, and bright lights make it worse. I don't have a fever.", source: 'live_groq' },
  { text: 'I am coughing.', source: 'live_groq' }
];
const browser = await chromium.launch({ channel: 'chrome', headless: true }), rows = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' }); page.setDefaultTimeout(10000);
  await page.goto('http://127.0.0.1:3000/#/preview/medassist-conversation', { waitUntil: 'domcontentloaded' });
  const vocabulary = await (await page.request.get('http://127.0.0.1:3000/api/research/model-a/natural/vocabulary')).json();
  const normalized = readProposal(normalizeProposalQuotes(recorded.structured_output), cases[0].text, vocabulary, null); assert.ok(normalized);
  const route = '**/api/research/model-a/natural/extract';
  await page.route(route, r => r.fulfill({ json: normalized }));
  for (let index = 0; index < cases.length; index++) {
    if (index) { await page.unroute(route); await page.getByRole('button', { name: 'Restart fictional interview', exact: true }).click(); }
    await page.getByText('Ready to listen', { exact: false }).waitFor();
    const pending = page.waitForResponse(r => r.url().endsWith('/natural/extract'), { timeout: 20000 }), at = Date.now();
    const input = page.getByRole('textbox', { name: 'Fictional symptom description', exact: true }); await input.fill(cases[index].text); await input.press('Enter');
    const r = await pending, extraction = await r.json(); await page.waitForFunction(() => !document.querySelector('.conversation-typing'));
    const row = { source: cases[index].source, at: new Date(at).toISOString(), fictional_text: cases[index].text, status: r.status(), elapsed_ms: Date.now() - at, extraction,
      user_bubbles: await page.locator('.conversation-user').count(), actual_model_a: null };
    assert.equal(row.user_bubbles, 1);
    if (r.ok() && await page.getByRole('button', { name: 'Confirm these details', exact: true }).count()) {
      await page.getByRole('button', { name: 'Confirm these details', exact: true }).click();
      const age = page.getByRole('textbox', { name: 'Fictional age in years', exact: true }); await age.fill('35'); await age.press('Enter');
      const selected = page.waitForResponse(r => r.url().endsWith('/natural/interview')); await page.getByRole('button', { name: 'F', exact: true }).click();
      const first = await selected, body = await first.json(); assert.equal(first.status(), 200);
      const headers = first.request().headers();
      const replay = await page.request.post('http://127.0.0.1:3000/api/research/model-a/natural/interview', {
        headers: { Origin: 'http://127.0.0.1:3000', 'X-Conversation-ID': headers['x-conversation-id'], 'X-Request-ID': headers['x-request-id'] }, data: first.request().postDataJSON()
      });
      assert.equal(replay.headers()['x-idempotent-replay'], '1'); assert.deepEqual(await replay.json(), body);
      const firstQuestion = body.result.selection.question.evidence_id;
      const next = page.waitForResponse(r => r.url().endsWith('/natural/interview'));
      await page.getByRole('button', { name: 'Not sure', exact: true }).click(); const nextResult = await next, answered = await nextResult.json(); assert.equal(nextResult.status(), 200);
      assert.equal(answered.progress.answered, 1); assert.notEqual(answered.result.selection.question?.evidence_id, firstQuestion);
      const item = answered.result.handoff.items.find(i => i.evidence_id === firstQuestion); assert.equal(item.status, 'unknown'); assert.equal(item.value, null);
      row.actual_model_a = { first_question_id: firstQuestion, next_question_id: answered.result.selection.question?.evidence_id ?? null,
        unknown_preserved: true, repeat_prevented: true, http_replay_cached: true, export_items: answered.result.handoff.items.length,
        model_b_status: answered.result.handoff.model_b_status, observed: answered.result.handoff.items.filter(i => ['observed_positive', 'observed_negative'].includes(i.status)).map(i => ({ id: i.evidence_id, status: i.status, value: i.value })) };
    }
    rows.push(row); console.log(JSON.stringify({ source: row.source, status: row.status, question: row.actual_model_a?.first_question_id ?? null }));
    if (!r.ok()) break;
  }
  const diagnostics = await (await page.request.get('http://127.0.0.1:3000/api/research/model-a/language/diagnostics')).json();
  writeFileSync(output, JSON.stringify({ at: new Date().toISOString(), fictional_only: true, rows, diagnostics }, null, 2) + '\n', { flag: 'wx' });
} finally { await Promise.race([browser.close(), new Promise(done => setTimeout(done, 2000))]); }
