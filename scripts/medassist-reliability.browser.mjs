/** Mocked browser transport: recovery and state behavior, not clinical/model performance. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { anchors } from '../src/features/medassist-conversation/natural.ts';
const { chromium } = await import(process.env.MEDASSIST_PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: process.cwd(), server: { host: '127.0.0.1', port: 0 } });
const vocabulary = { schema_version: 'medassist.natural-vocabulary.v1', fictional_only: true, items: Object.keys(anchors).map(evidence_id => ({ evidence_id, kind: 'symptom', data_type: 'B', question_en: anchors[evidence_id].label, possible_values: [], initial_allowed: true })), coverage: { symptom_fields: 110, universal_coverage: false } };
let browser;
const rows = [];
try {
  await server.listen(); await server.watcher.close(); browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const width of [390, 820, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' }); page.setDefaultTimeout(10000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/research/model-a/natural/vocabulary', r => r.fulfill({ json: vocabulary }));
    await page.route('**/api/research/model-a/language', r => r.fulfill({ json: { schema_version: 'medassist.language-status.v2', configured: true, provider: 'groq-cloud', model: 'qwen/qwen3.8-27b', timeout_ms: 15000 } }));
    let mode = 'PROVIDER_TIMEOUT', calls = [], interviewCalls = [];
    await page.route('**/api/research/model-a/natural/extract', async r => {
      calls.push({ id: r.request().headers()['x-request-id'], session: r.request().headers()['x-conversation-id'] });
      await new Promise(done => setTimeout(done, 80));
      if (mode !== 'success') return r.fulfill({ status: mode === 'RATE_LIMITED' ? 429 : 503, headers: mode === 'RATE_LIMITED' ? { 'retry-after': '3' } : {}, json: { error: mode } });
      return r.fulfill({ json: { schema_version: 'medassist.natural-extraction.v1', observations: [{ evidence_id: 'E_53', state: 'confirmed', value: true, quote: 'stomach pain' }], unmapped: [], instruction_attempt: false } });
    });
    const recorded = JSON.parse(readFileSync('models/medassist_ai/docs/recognition-after.json', 'utf8')).cases[0].model_a.response;
    await page.route('**/api/research/model-a/natural/interview', async r => {
      interviewCalls.push(r.request().headers()['x-request-id']); await new Promise(done => setTimeout(done, 80)); return r.fulfill({ json: recorded });
    });
    await page.goto(server.resolvedUrls.local[0] + '#/preview/medassist-conversation', { waitUntil: 'domcontentloaded' });
    await page.getByText('Ready to listen', { exact: false }).waitFor();
    const input = () => page.getByRole('textbox', { name: 'Fictional symptom description', exact: true });
    const submit = async () => { await input().fill('stomach pain'); await input().press('Enter'); await page.waitForFunction(() => !document.querySelector('.conversation-typing')); };
    // Enter plus a synthetic second click in the same task exercises the synchronous guard.
    await input().fill('stomach pain');
    await page.locator('.conversation-input').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.querySelector('md-filled-button').click();
    });
    await page.getByRole('button', { name: 'Retry description', exact: true }).waitFor(); assert.equal(calls.length, 1);
    assert.equal(await page.locator('.conversation-user').count(), 1);
    // A layout rerender does not resubmit; immediate retry honors the local cooldown.
    await page.setViewportSize({ width: width + 1, height: 900 });
    await page.getByRole('button', { name: 'Retry description', exact: true }).click(); assert.equal(calls.length, 1);
    mode = 'success'; await page.waitForTimeout(2100);
    await page.getByRole('button', { name: 'Retry description', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm these details', exact: true }).waitFor();
    assert.equal(calls.length, 2); assert.equal(calls[0].id, calls[1].id); assert.equal(calls[0].session, calls[1].session);
    assert.equal(await page.locator('.conversation-user').count(), 1);
    await page.locator('.conversation-question md-filled-button').evaluate(button => { button.click(); button.click(); });
    const age = page.getByRole('textbox', { name: 'Fictional age in years', exact: true }); await age.fill('35');
    await page.locator('.conversation-input').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    assert.equal(await page.locator('.conversation-user p').filter({hasText:/^35$/}).count(), 1);
    await page.getByRole('button', { name: 'F', exact: true }).click(); await page.getByRole('button', { name: '0', exact: true }).waitFor();
    assert.equal(interviewCalls.length, 1);
    await page.getByText('Session summary', { exact: true }).click();
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download session', exact: true }).click();
    const evidence = JSON.parse(readFileSync(await (await download).path(), 'utf8'));
    assert.equal(evidence.user_confirmed_proposals.length, 1); assert.equal(evidence.evidence.items.length, 223); assert.equal(evidence.evidence.model_b_status, 'not_enabled');
    await page.getByRole('button', { name: 'Restart fictional interview', exact: true }).click(); mode = 'RATE_LIMITED'; const start = calls.length;
    await submit(); await page.getByRole('button', { name: 'Retry description', exact: true }).click(); assert.equal(calls.length, start + 1);
    mode = 'success'; await page.waitForTimeout(3100); await page.getByRole('button', { name: 'Retry description', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm these details', exact: true }).waitFor(); assert.equal(await page.locator('.conversation-user').count(), 1);
    for (const category of ['AUTH_FAILURE', 'QUOTA_EXHAUSTED']) {
      await page.getByRole('button', { name: 'Restart fictional interview', exact: true }).click(); mode = category; await submit();
      assert.equal(await page.getByRole('button', { name: 'Retry description', exact: true }).count(), 0);
    }
    // Provider outage must not suppress the independent emergency interruption.
    await input().fill('I cannot breathe'); await page.getByRole('alert', { name: 'Emergency help', exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Call 112 in India', exact: true }).count(), 1);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByText('Ready to listen', { exact: false }).waitFor();
    assert.equal(await page.locator('.conversation-user').count(), 0); // No silent persistence/replay on refresh.
    assert.equal(errors.length, 0); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    rows.push({ width, duplicate_send_suppressed: true, stable_retry_id: true, single_confirmation_and_model_a_transition: true,
      rate_cooldown: true, auth_and_quota_no_retry: true, emergency_offline: true, refresh_clears_without_replay: true, browser_errors: 0 });
    await page.close();
  }
  console.log(JSON.stringify({ mocked_transport: true, cloud_calls: 0, rows }));
} finally { await browser?.close(); await server.close(); }
