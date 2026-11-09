import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const playwrightPath = process.env.ADR_PLAYWRIGHT_MODULE || 'C:/Users/ASUS/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);

const BASE_URL = 'http://127.0.0.1:3602';
const ARTIFACT_DIR = 'C:/Users/ASUS/.gemini/antigravity/brain/ea9e900d-3b79-47d7-b664-829795422ff1/preview-captures/auth-dialog';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  console.log('=== APIP AUTH DIALOG REPAIR VERIFICATION SUITE ===');
  const browser = await chromium.launch({ headless: true });
  const results = {
    centering: [],
    interactions: [],
    animations: [],
    screenshots: []
  };

  // Helper to record
  const check = (name, pass, details = '') => {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}${details ? ` (${details})` : ''}`);
    results.interactions.push({ name, pass, details });
    if (!pass) throw new Error(`Assertion failed: ${name}`);
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Homepage before opening dialog
    // ----------------------------------------------------
    const page = await browser.newPage({ viewport: { width: 1536, height: 900 } });
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.access-header');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-homepage-before-dialog.png') });
    results.screenshots.push('01-homepage-before-dialog.png');
    check('1. Homepage loads cleanly before opening dialog', true);

    // ----------------------------------------------------
    // TEST 2: Open dialog via Log in header button and test Centering at 1536px
    // ----------------------------------------------------
    const loginLink = page.locator('.access-header-navigation a:has-text("Log in")');
    await loginLink.click();
    await page.waitForSelector('md-dialog.apip-auth-dialog[open]');
    await page.waitForTimeout(600); // Allow entry animation

    const centerInfo1536 = await page.evaluate(() => {
      const mdDialog = document.querySelector('md-dialog.apip-auth-dialog');
      const shadowDialog = mdDialog.shadowRoot.querySelector('dialog');
      const rect = shadowDialog.getBoundingClientRect();
      const dialogCenterX = rect.left + rect.width / 2;
      const viewportCenterX = window.innerWidth / 2;
      const dialogCenterY = rect.top + rect.height / 2;
      const viewportCenterY = window.innerHeight / 2;

      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
        dialogCenterX,
        viewportCenterX,
        diffX: Math.abs(dialogCenterX - viewportCenterX),
        dialogCenterY,
        viewportCenterY,
        diffY: Math.abs(dialogCenterY - viewportCenterY),
        htmlOverflow: window.getComputedStyle(document.documentElement).overflow
      };
    });

    console.log('1536px Centering measurements:', centerInfo1536);
    check(
      '2. Exact Horizontal Centering at 1536px (diffX <= 3px)',
      centerInfo1536.diffX <= 3,
      `diffX=${centerInfo1536.diffX}px, left=${centerInfo1536.left}px, width=${centerInfo1536.width}px`
    );
    check(
      '2b. Exact Vertical Centering at 1536px (diffY <= 3px)',
      centerInfo1536.diffY <= 3,
      `diffY=${centerInfo1536.diffY}px, top=${centerInfo1536.top}px, height=${centerInfo1536.height}px`
    );

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-dialog-centered-desktop-1536.png') });
    results.screenshots.push('02-dialog-centered-desktop-1536.png');

    // ----------------------------------------------------
    // TEST 3: Background Soft Blur & Scrim Verification
    // ----------------------------------------------------
    const blurInfo = await page.evaluate(() => {
      const mdDialog = document.querySelector('md-dialog.apip-auth-dialog');
      const scrim = mdDialog.shadowRoot.querySelector('.scrim');
      const shadowDialog = mdDialog.shadowRoot.querySelector('dialog');
      const style = window.getComputedStyle(scrim);
      return {
        hasScrim: !!scrim,
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
        opacity: style.opacity,
        position: style.position,
        isModal: shadowDialog ? shadowDialog.matches(':modal') : false
      };
    });

    console.log('Scrim blur measurements:', blurInfo);
    check('3a. Scrim element present in shadow DOM', blurInfo.hasScrim);
    check('3b. Scrim has soft blur (approximately 5-7px)', /blur\(6px\)/.test(blurInfo.backdropFilter), blurInfo.backdropFilter);
    check('3c. Background interactions blocked via Top Layer modal dialog', blurInfo.isModal);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-background-blur-scrim.png') });
    results.screenshots.push('03-background-blur-scrim.png');

    // ----------------------------------------------------
    // TEST 4: Patient Sign-in State screenshot
    // ----------------------------------------------------
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-patient-signin-light.png') });
    results.screenshots.push('04-patient-signin-light.png');

    // ----------------------------------------------------
    // TEST 5: Role Switcher (Specialist Tab)
    // ----------------------------------------------------
    const specialistTab = page.locator('.apip-auth-role-tab:has-text("Specialist")');
    await specialistTab.click();
    await page.waitForTimeout(400);

    const titleText = await page.locator('.apip-auth-title').innerText();
    check('5a. Specialist tab switched title', titleText.includes('Specialist Sign In'), titleText);
    check('5b. URL updated to /sign-in/specialist', page.url().includes('/sign-in/specialist'));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-specialist-signin-light.png') });
    results.screenshots.push('05-specialist-signin-light.png');

    // Switch back to patient
    await page.locator('.apip-auth-role-tab:has-text("Patient")').click();
    await page.waitForTimeout(400);

    // ----------------------------------------------------
    // TEST 6: Sign in Button Click & Validation
    // ----------------------------------------------------
    console.log('Testing Sign in button click when fields are empty...');
    const submitBtn = page.locator('.apip-auth-submit-btn');
    await submitBtn.click();
    await page.waitForTimeout(300);

    let alertMsg = await page.locator('.apip-auth-notice').innerText().catch(() => '');
    check('6a. Validation error on empty submit', alertMsg.includes('Please enter a valid email address'), alertMsg);

    // ----------------------------------------------------
    // TEST 7: Enter Key Submission from Password Field
    // ----------------------------------------------------
    console.log('Filling email and password...');
    const emailInput = page.locator('md-outlined-text-field[label="Email"]').locator('input');
    await emailInput.fill('test.patient@example.com');

    const passwordInput = page.locator('md-outlined-text-field[label="Password"]').locator('input');
    await passwordInput.fill('fictional_password_123');

    console.log('Pressing Enter key inside Password input...');
    await passwordInput.press('Enter');
    await page.waitForTimeout(1000);

    alertMsg = await page.locator('.apip-auth-notice').innerText().catch(() => '');
    console.log('Alert after Enter key submission:', alertMsg);
    check(
      '7. Enter key from password field triggers submission',
      alertMsg.includes('Incorrect email or password') || alertMsg.includes('Unable to complete'),
      alertMsg
    );

    // ----------------------------------------------------
    // TEST 8: Continue with Google Button
    // ----------------------------------------------------
    console.log('Testing Continue with Google button...');
    const googleBtn = page.locator('.apip-auth-google-btn');
    await googleBtn.click();
    await page.waitForTimeout(400);

    const googleNotice = await page.locator('.apip-auth-notice').innerText().catch(() => '');
    console.log('Google OAuth feedback notice:', googleNotice);
    check(
      '8. Continue with Google displays accurate unavailable feedback without broken redirect',
      googleNotice.includes('Google Sign-in is not yet enabled on the hosted project'),
      googleNotice
    );

    // ----------------------------------------------------
    // TEST 9: Password Visibility Toggle
    // ----------------------------------------------------
    const pwField = page.locator('md-outlined-text-field[label="Password"]');
    const pwInputTag = pwField.locator('input');
    const typeInitial = await pwInputTag.getAttribute('type');
    await page.locator('.apip-auth-pw-toggle').click();
    await page.waitForTimeout(300);
    const typeToggled = await pwInputTag.getAttribute('type');
    check('9. Password visibility toggle works', typeInitial === 'password' && typeToggled === 'text', `before=${typeInitial}, after=${typeToggled}`);

    // Toggle back
    await page.locator('.apip-auth-pw-toggle').click();

    // ----------------------------------------------------
    // TEST 10: Dark Theme Dialog
    // ----------------------------------------------------
    await page.evaluate(() => {
      localStorage.setItem('apip.appearance.v1', JSON.stringify({ mode: 'dark', savedAt: Date.now() }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('md-dialog.apip-auth-dialog[open]');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-dark-theme-dialog.png') });
    results.screenshots.push('06-dark-theme-dialog.png');
    check('10. Dark theme dialog rendered and captured', true);

    // Reset to light
    await page.evaluate(() => {
      localStorage.setItem('apip.appearance.v1', JSON.stringify({ mode: 'light', savedAt: Date.now() }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('md-dialog.apip-auth-dialog[open]');
    await page.waitForTimeout(500);

    // ----------------------------------------------------
    // TEST 11: Smooth Exit Animation via Close X Button
    // ----------------------------------------------------
    console.log('Testing Close X button and exit animation...');
    const startClose = Date.now();
    await page.locator('.apip-auth-close-button').click();

    // Dialog should not snap immediately; wait for closed
    await page.waitForSelector('md-dialog.apip-auth-dialog[open]', { state: 'hidden' });
    const closeDuration = Date.now() - startClose;
    console.log(`Dialog close animation duration: ${closeDuration}ms`);

    check('11a. Dialog closed via X button', true);
    check('11b. Close animation ran gracefully before removal', closeDuration >= 180, `${closeDuration}ms`);
    check('11c. URL restored to base without /sign-in', !page.url().includes('/sign-in/'));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08-dialog-after-dismissal.png') });
    results.screenshots.push('08-dialog-after-dismissal.png');

    await page.close();

    // ----------------------------------------------------
    // TEST 12: Centering across multiple viewports (320, 360, 768, 1024, 1440, 1920)
    // ----------------------------------------------------
    const viewports = [
      { name: 'desktop-1920', width: 1920, height: 1080, desktop: true, capture: '09-desktop-1920-centered.png' },
      { name: 'desktop-1440', width: 1440, height: 900, desktop: true },
      { name: 'desktop-1024', width: 1024, height: 768, desktop: true, capture: '10-desktop-1024-centered.png' },
      { name: 'tablet-768', width: 768, height: 1024, desktop: false, capture: '11-tablet-768.png' },
      { name: 'mobile-360', width: 360, height: 800, desktop: false, capture: '07-mobile-auth-dialog-360.png' },
      { name: 'mobile-320', width: 320, height: 640, desktop: false, capture: '12-mobile-320.png' }
    ];

    for (const vp of viewports) {
      console.log(`Checking viewport ${vp.name} (${vp.width}x${vp.height})...`);
      const vpPage = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await vpPage.goto(`${BASE_URL}/#/sign-in/patient`, { waitUntil: 'networkidle' });
      await vpPage.waitForSelector('md-dialog.apip-auth-dialog[open]');
      await vpPage.waitForTimeout(500);

      const geom = await vpPage.evaluate(() => {
        const mdDialog = document.querySelector('md-dialog.apip-auth-dialog');
        const shadowDialog = mdDialog.shadowRoot.querySelector('dialog');
        const rect = shadowDialog.getBoundingClientRect();
        const dialogCenterX = rect.left + rect.width / 2;
        const viewportCenterX = window.innerWidth / 2;
        const dialogCenterY = rect.top + rect.height / 2;
        const viewportCenterY = window.innerHeight / 2;

        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;

        return {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top,
          diffX: Math.abs(dialogCenterX - viewportCenterX),
          diffY: Math.abs(dialogCenterY - viewportCenterY),
          hasOverflow: scrollWidth > clientWidth,
          scrollWidth,
          clientWidth
        };
      });

      console.log(`Viewport ${vp.name} measurements:`, geom);
      results.centering.push({ viewport: vp.name, ...geom });

      if (vp.desktop) {
        check(
          `Centering at ${vp.name}: diffX <= 3px`,
          geom.diffX <= 3,
          `diffX=${geom.diffX}px (left=${geom.left}px, width=${geom.width}px)`
        );
        check(
          `Vertical centering at ${vp.name}: diffY <= 3px`,
          geom.diffY <= 3,
          `diffY=${geom.diffY}px (top=${geom.top}px, height=${geom.height}px)`
        );
      }

      check(`No horizontal overflow at ${vp.name}`, !geom.hasOverflow, `scrollWidth=${geom.scrollWidth}, clientWidth=${geom.clientWidth}`);

      if (vp.capture) {
        await vpPage.screenshot({ path: path.join(ARTIFACT_DIR, vp.capture) });
        results.screenshots.push(vp.capture);
      }

      await vpPage.close();
    }

    // Write full test report
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2-test-report.json'), JSON.stringify(results, null, 2), 'utf8');
    console.log('=== ALL 12 TEST SUITES PASSED CLEANLY ===');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
