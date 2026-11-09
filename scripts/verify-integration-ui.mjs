import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const { chromium } = await import(process.env.ADR_PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.APIP_PREVIEW_URL || 'http://127.0.0.1:3602';
const evidence = process.env.APIP_EVIDENCE_DIR || 'C:/Users/ASUS/.gemini/antigravity/brain/ea9e900d-3b79-47d7-b664-829795422ff1/preview-captures/integration';

await mkdir(evidence, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const results = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  // 1. Landing Page V2
  console.log('[1/6] Testing Landing Page V2...');
  await page.goto(origin + '/#/');
  await page.locator('#access-title').waitFor();
  await page.getByRole('heading', { name: 'Your health experience, made clearer.' }).waitFor();
  const header = page.locator('.access-header');
  assert(await header.isVisible());
  await page.screenshot({ path: join(evidence, '01-landing-v2.png') });
  results.push({ page: 'Landing V2', status: 'PASS' });

  // 2. Patient Sign-In Navigation
  console.log('[2/6] Testing Patient Sign-In...');
  await page.getByRole('link', { name: 'Explore as patient' }).click();
  await page.waitForURL('**/#/sign-in/patient');
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
  assert(await page.locator('md-outlined-text-field[label="Email"]').isVisible());
  assert(await page.locator('md-outlined-text-field[label="Password"]').isVisible());
  await page.screenshot({ path: join(evidence, '02-patient-signin.png') });
  results.push({ page: 'Patient Sign-In', status: 'PASS' });

  // 3. Specialist Sign-In Navigation
  console.log('[3/6] Testing Specialist Sign-In...');
  await page.goto(origin + '/#/sign-in/specialist');
  await page.waitForURL('**/#/sign-in/specialist');
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
  assert(await page.locator('md-outlined-text-field[label="Email"]').isVisible());
  assert(await page.locator('md-outlined-text-field[label="Password"]').isVisible());
  await page.screenshot({ path: join(evidence, '03-specialist-signin.png') });
  results.push({ page: 'Specialist Sign-In', status: 'PASS' });

  // 4. ADR Guided Reporting Intake Preview
  console.log('[4/6] Testing ADR Guided Reporting Intake...');
  await page.goto(origin + '/#/preview/adr-report');
  await page.waitForURL('**/#/preview/adr-report');
  await page.locator('.access-header').waitFor();
  await page.screenshot({ path: join(evidence, '04-adr-intake.png') });
  results.push({ page: 'ADR Intake', status: 'PASS' });

  // 5. MedAssist Entry
  console.log('[5/6] Testing MedAssist Entry...');
  await page.goto(origin + '/#/');
  await page.getByRole('link', { name: 'Explore MedAssist research' }).click();
  await page.waitForURL('**/#/sign-in/patient?continue=medassist');
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
  await page.screenshot({ path: join(evidence, '05-medassist-entry.png') });
  results.push({ page: 'MedAssist Entry', status: 'PASS' });

  // 6. Responsive Mobile Viewport (360px)
  console.log('[6/6] Testing Responsive Mobile (360px)...');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(origin + '/#/');
  await page.locator('#access-title').waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: join(evidence, '06-mobile-360.png'), fullPage: true });
  results.push({ page: 'Mobile 360px', status: 'PASS' });

  assert.deepEqual(errors, []);
  console.log('\nAll integration UI checks passed successfully!');
  await writeFile(join(evidence, 'ui-results.json'), JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
