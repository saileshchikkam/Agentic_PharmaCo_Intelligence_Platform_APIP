import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { chromium } = await import(process.env.ADR_PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.APIP_LANDING_URL || 'http://[::1]:3000';
const evidence = process.env.APIP_LANDING_EVIDENCE || join(tmpdir(), 'apip-landing-v2');
const baseline = process.argv.includes('--baseline');
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const width of [320, 360, 768, 1024, 1440, 1920]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      try {
        await page.addInitScript(isDark => localStorage.setItem('apip.appearance.v1', JSON.stringify({ accent: 'blue', isDark })), theme === 'dark');
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin + '/#/');
        await page.locator('#access-title').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), theme === 'dark');
        await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
        const header = page.locator('.access-header');
        const pixels = await header.screenshot({ animations: 'disabled' });
        const headerHash = createHash('sha256').update(pixels).digest('hex');
        const headerFile = join(evidence, 'header-baseline-' + theme + '-' + width + '.png');
        if (baseline) {
          await writeFile(headerFile, pixels);
        } else {
          await writeFile(join(evidence, 'header-v2-' + theme + '-' + width + '.png'), pixels);
          assert.deepEqual(pixels, await readFile(headerFile), 'Header pixels must match at ' + theme + ' ' + width);
          await page.getByRole('heading', { name: 'Your health experience, made clearer.' }).waitFor();
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          await page.screenshot({ path: join(evidence, theme + '-' + width + '.png'), fullPage: width === 360 || width === 1440 });
          assert.match(await page.locator('#access-title').evaluate(el => getComputedStyle(el).fontFamily), /^Roboto/);
          assert.equal(await page.locator('.landing-transition').first().evaluate(el => getComputedStyle(el).animationName), 'none');
          await page.getByRole('link', { name: 'Explore the platform' }).press('Enter');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'landing-platform');
          await page.getByRole('button', { name: 'Next step' }).click();
          await page.getByRole('tabpanel', { name: 'Organize' }).waitFor();
          const steps = page.getByRole('tablist', { name: 'Report walkthrough' });
          assert.equal(await steps.getByRole('tab', { name: 'Organize' }).getAttribute('aria-selected'), 'true');
          await steps.getByRole('tab', { name: 'Organize' }).press('ArrowRight');
          await steps.getByRole('tab', { name: 'Control' }).press('Enter');
          await page.getByRole('tabpanel', { name: 'Control' }).waitFor();
          for (const title of ['Review', 'Describe']) {
            await steps.getByRole('tab', { name: title }).press('Enter');
            await page.getByRole('tabpanel', { name: title }).waitFor();
          }
          const audiences = page.getByRole('tablist', { name: 'Choose a journey' });
          await audiences.getByRole('tab', { name: 'Specialist' }).press('Enter');
          await page.getByRole('tabpanel', { name: 'Specialist' }).getByRole('link', { name: 'Enter specialist portal' }).click();
          await page.waitForURL('**/#/sign-in/specialist');
          await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
          await page.locator('.access-footer').getByText(/not a substitute for professional medical advice/).waitFor();
          await page.goBack();
          await page.getByText('What happens if I withdraw access?', { exact: true }).click();
          await page.getByText(/PDF copies already delivered cannot be recalled/).waitFor();
          await page.getByRole('link', { name: 'Explore MedAssist research', exact: true }).click();
          await page.waitForURL('**/#/sign-in/patient?continue=medassist');
          await page.goBack();
          await page.getByRole('link', { name: 'Try fictional reporting', exact: true }).click();
          await page.waitForURL('**/#/preview/adr-report');
          await page.goBack();
          await page.getByRole('link', { name: 'Explore as patient', exact: true }).click();
          await page.waitForURL('**/#/sign-in/patient');
          assert.deepEqual(errors, []);
        }
        results.push({ width, theme, headerHash });
        console.log(theme, width, baseline ? 'baseline captured' : 'passed, header identical');
      } finally {
        await page.close();
      }
    }
  }
  await writeFile(join(evidence, baseline ? 'baseline.json' : 'results.json'), JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
