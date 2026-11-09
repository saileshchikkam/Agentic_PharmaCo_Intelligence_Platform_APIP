import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const { chromium } = await import(process.env.ADR_PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.APIP_SIGNAL_URL || 'http://127.0.0.1:3000';
const evidence = resolve(process.env.APIP_SIGNAL_EVIDENCE || join(tmpdir(), 'apip-signal-evidence'));
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];

try {
  for (const width of [320, 360, 768, 1024, 1440, 1920]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: width < 800 ? 900 : 1000 }, reducedMotion: 'reduce' });
      try {
        await context.addInitScript(dark => localStorage.setItem('apip.appearance.v1', JSON.stringify({ accent: 'blue', isDark: dark })), theme === 'dark');
        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        await page.goto(origin + '/#/', { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { level: 1, name: /Your experience.*A clearer picture/ }).waitFor();
        assert.equal(await page.locator('.signal-site').getAttribute('data-theme'), theme);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Homepage must fit viewport');
        assert.equal(await page.locator('.signal-pulse').evaluate(node => getComputedStyle(node).display), 'none');
        const minimumContrast = await page.locator('.signal-site').evaluate(site => {
          const style = getComputedStyle(site);
          function luminance(role) {
            const hex = style.getPropertyValue('--signal-' + role).trim().slice(1);
            const rgb = hex.length === 3 ? [...hex].map(digit => digit + digit) : hex.match(/../g);
            return rgb.map(channel => parseInt(channel, 16) / 255)
              .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
              .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
          }
          return Math.min(...[['ink', 'bg'], ['muted', 'bg'], ['accent', 'band'], ['muted', 'surface'], ['on-primary', 'primary']].map(([a, b]) => {
            const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
            return (values[0] + .05) / (values[1] + .05);
          }));
        });
        assert(minimumContrast >= 4.5, 'Core text color pairs must meet 4.5:1');
        await page.screenshot({ path: join(evidence, theme + '-' + width + '.png') });
        if (width === 360 || width === 1440) await page.screenshot({ path: join(evidence, theme + '-' + width + '-full.png'), fullPage: true });
        const stages = page.getByRole('group', { name: 'Report journey stages' });
        for (const stage of ['Structure', 'Consent', 'Review', 'Describe']) {
          const button = stages.getByRole('button', { name: new RegExp(stage) });
          await button.press('Enter');
          assert.equal(await button.getAttribute('aria-pressed'), 'true');
          assert.match(await page.locator('.signal-ticket').innerText(), new RegExp(stage, 'i'));
        }
        const roles = page.getByRole('group', { name: 'Explore by role' });
        await roles.getByRole('button', { name: 'Specialist', exact: true }).press('Space');
        await page.getByRole('heading', { name: 'See what was shared.' }).waitFor();
        await roles.getByRole('button', { name: 'Patient', exact: true }).press('Enter');
        await page.getByRole('heading', { name: 'Put it into words.' }).waitFor();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Expanded controls must fit viewport');
        if (width <= 790) {
          const menu = page.getByRole('button', { name: 'Open menu' });
          await menu.press('Enter');
          const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
          await mobile.getByRole('button', { name: 'Privacy' }).press('Escape');
          assert.equal(await menu.getAttribute('aria-expanded'), 'false');
          assert(await menu.evaluate(node => document.activeElement === node));
          await menu.press('Enter');
          await mobile.getByRole('button', { name: 'Privacy' }).press('Enter');
        } else {
          await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Privacy' }).press('Enter');
        }
        assert.equal(await page.evaluate(() => document.activeElement.id), 'privacy');
        assert.equal(new URL(page.url()).hash, '#/');
        await page.getByText('Withdraw future access', { exact: true }).click();
        await page.getByText('A copy or PDF already delivered', { exact: false }).waitFor();
        await page.getByRole('button', { name: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme' }).press('Enter');
        assert.equal(await page.locator('.signal-site').getAttribute('data-theme'), theme === 'dark' ? 'light' : 'dark');
        await page.getByRole('link', { name: 'Explore as patient', exact: true }).click();
        await page.waitForURL('**/#/sign-in/patient');
        await page.goBack();
        await page.locator('.signal-hero').getByRole('link', { name: 'Enter specialist portal' }).click();
        await page.waitForURL('**/#/sign-in/specialist');
        await page.goBack();
        await page.getByRole('link', { name: 'Explore reporting', exact: true }).click();
        await page.waitForURL('**/#/preview/adr-report');
        assert.deepEqual(pageErrors, []);
        results.push({ width, theme, minimumContrast, result: 'pass' });
        console.log(theme, width, 'passed');
      } finally {
        await context.close();
      }
    }
  }
  const normal = await browser.newPage();
  await normal.goto(origin + '/#/', { waitUntil: 'domcontentloaded' });
  const motion = await normal.locator('.signal-pulse').evaluate(node => {
    const style = getComputedStyle(node);
    return { name: style.animationName, iterations: style.animationIterationCount };
  });
  assert.deepEqual(motion, { name: 'signal-travel', iterations: '1' });
  await writeFile(join(evidence, 'results.json'), JSON.stringify({ results, motion }, null, 2));
  console.log('Evidence:', evidence);
} finally {
  await browser.close();
}
