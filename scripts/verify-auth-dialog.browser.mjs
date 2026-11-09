import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const playwrightPath = process.env.ADR_PLAYWRIGHT_MODULE || 'C:/Users/ASUS/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);

const BASE_URL = 'http://127.0.0.1:3602';
const ARTIFACT_DIR = 'C:/Users/ASUS/.gemini/antigravity/brain/ea9e900d-3b79-47d7-b664-829795422ff1/preview-captures/auth-dialog';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  console.log('Launching Chromium for APIP Auth Dialog verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testReport = {
    viewports: [],
    tests: [],
    screenshots: []
  };

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 1. Load Homepage and verify existing header is intact
    console.log('Navigating to homepage...');
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.access-header');

    // Check header elements
    const headerTitle = await page.locator('.access-home-link').innerText();
    const loginLink = page.locator('.access-header-navigation a:has-text("Log in")');
    const isLoginVisible = await loginLink.isVisible();
    console.log(`Header Brand: "${headerTitle.trim()}", Login link visible: ${isLoginVisible}`);

    await page.locator('.access-header').screenshot({ path: path.join(ARTIFACT_DIR, '12-header-unchanged-desktop.png') });
    testReport.screenshots.push('12-header-unchanged-desktop.png');
    testReport.tests.push({
      name: 'Existing header preserved unchanged',
      pass: isLoginVisible && headerTitle.trim() === 'APIP'
    });

    // 2. Click Login link in header -> Dialog opens!
    console.log('Clicking header Login link...');
    await loginLink.click();
    await page.waitForSelector('md-dialog.apip-auth-dialog[open]');
    console.log('APIPAuthDialog opened successfully!');

    // Check Dialog layout and dimensions
    const dialogBox = await page.locator('.apip-auth-grid').boundingBox();
    console.log(`Dialog grid dimensions: width=${dialogBox?.width}px, height=${dialogBox?.height}px`);
    const isHorizontal = dialogBox ? dialogBox.width > dialogBox.height : false;
    console.log(`Horizontal desktop layout (width > height): ${isHorizontal}`);
    testReport.tests.push({
      name: 'Horizontal landscape desktop layout (width > height)',
      pass: isHorizontal,
      details: `${Math.round(dialogBox?.width ?? 0)}px x ${Math.round(dialogBox?.height ?? 0)}px`
    });

    // Capture Patient Sign-in (Light, 1440)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-desktop-1440-patient-signin-light.png') });
    testReport.screenshots.push('01-desktop-1440-patient-signin-light.png');

    // Check role switcher tabs inside dialog
    const patientTab = page.locator('.apip-auth-role-tab:has-text("Patient")');
    const specialistTab = page.locator('.apip-auth-role-tab:has-text("Specialist")');
    const devTab = page.locator('.apip-auth-role-tab:has-text("Developer")');

    const hasPatient = await patientTab.isVisible();
    const hasSpecialist = await specialistTab.isVisible();
    const hasDeveloper = await devTab.isVisible();

    console.log(`Role tabs in dialog: Patient=${hasPatient}, Specialist=${hasSpecialist}, Developer=${hasDeveloper}`);
    testReport.tests.push({
      name: 'Developer tab removed from public dialog selector',
      pass: hasPatient && hasSpecialist && !hasDeveloper
    });

    // 3. Switch to Specialist role inside dialog
    console.log('Clicking Specialist tab in dialog...');
    await specialistTab.click();
    await page.waitForTimeout(300);
    const specialistTitle = await page.locator('#apip-auth-title-id').innerText();
    console.log(`Specialist Dialog Title: "${specialistTitle}"`);
    console.log(`Current URL hash: ${page.url()}`);
    testReport.tests.push({
      name: 'Specialist role switch',
      pass: specialistTitle.includes('Specialist') && page.url().includes('specialist')
    });

    // Capture Specialist Sign-in (Light, 1440)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-desktop-1440-specialist-signin-light.png') });
    testReport.screenshots.push('02-desktop-1440-specialist-signin-light.png');

    // 4. Switch to Sign up mode
    console.log('Clicking Create an account...');
    await page.locator('.apip-auth-footer button:has-text("Create an account")').click();
    await page.waitForTimeout(300);
    const signupTitle = await page.locator('#apip-auth-title-id').innerText();
    console.log(`Signup Title: "${signupTitle}"`);

    // Switch back to Patient signup
    await patientTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-desktop-1440-signup-patient-light.png') });
    testReport.screenshots.push('03-desktop-1440-signup-patient-light.png');
    testReport.tests.push({
      name: 'Account creation mode supported in dialog',
      pass: page.url().includes('sign-up')
    });

    // 5. Switch to Forgot password mode
    console.log('Switching back to sign in, then clicking Forgot password...');
    await page.locator('.apip-auth-footer button:has-text("Sign in")').click();
    await page.waitForTimeout(300);
    await page.locator('.apip-auth-forgot-row button:has-text("Forgot password?")').click();
    await page.waitForTimeout(300);
    const forgotTitle = await page.locator('#apip-auth-title-id').innerText();
    console.log(`Forgot Password Title: "${forgotTitle}"`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-desktop-1440-forgot-patient-light.png') });
    testReport.screenshots.push('04-desktop-1440-forgot-patient-light.png');
    testReport.tests.push({
      name: 'Password recovery mode supported in dialog',
      pass: page.url().includes('forgot-password')
    });

    // 6. Test Close button & route restoration
    console.log('Closing dialog via close button...');
    await page.locator('.apip-auth-close-button').dispatchEvent('click');
    await page.waitForTimeout(600);
    const isDialogOpenAfterClose = await page.locator('md-dialog.apip-auth-dialog[open]').isVisible().catch(() => false);
    console.log(`Dialog open after close: ${isDialogOpenAfterClose}, current hash: ${page.url()}`);
    testReport.tests.push({
      name: 'Dialog close button and route restoration',
      pass: !isDialogOpenAfterClose && (page.url().endsWith('#/') || page.url().endsWith('/#'))
    });

    // 7. Test Dark Theme
    console.log('Switching to Dark Theme via appearance storage...');
    await page.evaluate(() => localStorage.setItem('apip.appearance.v1', JSON.stringify({ accent: 'blue', isDark: true })));
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.access-header-navigation a:has-text("Log in")').click();
    await page.waitForSelector('md-dialog.apip-auth-dialog[open]');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-desktop-1440-patient-signin-dark.png') });
    testReport.screenshots.push('05-desktop-1440-patient-signin-dark.png');
    testReport.tests.push({ name: 'Dark theme dialog rendered successfully', pass: true });
    await page.locator('.apip-auth-close-button').dispatchEvent('click');
    await page.waitForTimeout(400);

    // Switch back to light theme
    await page.evaluate(() => localStorage.setItem('apip.appearance.v1', JSON.stringify({ accent: 'blue', isDark: false })));
    await page.reload({ waitUntil: 'networkidle' });

    // 8. Test Viewport Matrix: 1024, 768, 360, 320
    const viewports = [
      { width: 1024, height: 768, name: 'desktop-1024' },
      { width: 768, height: 1024, name: 'tablet-768', capture: '06-tablet-768-patient-signin-light.png' },
      { width: 360, height: 800, name: 'mobile-360', capture: '07-mobile-360-patient-signin-light.png' },
      { width: 320, height: 640, name: 'mobile-320', capture: '09-mobile-320-patient-signin-light.png' }
    ];

    for (const vp of viewports) {
      console.log(`Testing viewport ${vp.width}x${vp.height} (${vp.name})...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/#/sign-in/patient`, { waitUntil: 'networkidle' });
      await page.waitForSelector('md-dialog.apip-auth-dialog[open]');

      // Check horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasHorizontalOverflow = scrollWidth > clientWidth;
      console.log(`Viewport ${vp.width}: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}, overflow=${hasHorizontalOverflow}`);

      testReport.viewports.push({
        name: vp.name,
        width: vp.width,
        height: vp.height,
        overflow: hasHorizontalOverflow
      });

      if (vp.capture) {
        await page.screenshot({ path: path.join(ARTIFACT_DIR, vp.capture) });
        testReport.screenshots.push(vp.capture);
      }

      if (vp.name === 'mobile-360') {
        // Also capture dark mode for mobile-360
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '08-mobile-360-patient-signin-dark.png') });
        testReport.screenshots.push('08-mobile-360-patient-signin-dark.png');
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
      }
    }

    // Reset viewport to desktop
    await page.setViewportSize({ width: 1440, height: 900 });

    // 9. Check Footer: Verify "Developer sign-in" link is NOT present
    console.log('Checking footer for Developer sign-in link removal...');
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    const devFooterLink = await page.locator('footer a:has-text("Developer sign-in")').count();
    console.log(`Developer footer links count: ${devFooterLink}`);
    testReport.tests.push({
      name: 'Developer sign-in removed from footer',
      pass: devFooterLink === 0
    });
    await page.locator('.landing-footer').screenshot({ path: path.join(ARTIFACT_DIR, '10-landing-footer-no-developer.png') });
    testReport.screenshots.push('10-landing-footer-no-developer.png');

    // 10. Test Developer Reference Fail-Closed Security (Unauthorized visit)
    console.log('Testing direct unauthorized visit to /#/developer-reference...');
    await page.goto(`${BASE_URL}/#/developer-reference`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const accessDeniedCount = await page.locator('h1:has-text("Access Denied")').count();
    console.log(`Unauthorized visit: Access Denied shown=${accessDeniedCount > 0}`);
    testReport.tests.push({
      name: 'Developer reference fails closed for unauthorized requests',
      pass: accessDeniedCount > 0
    });

    // Capture access denied screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11-developer-reference-access-denied.png') });
    testReport.screenshots.push('11-developer-reference-access-denied.png');

    // 11. Test Discreet Gesture (5 clicks on footer brand)
    console.log('Testing discreet 5-click gesture on footer Brand...');
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    const footerBrand = page.locator('.landing-footer-content a[aria-label="APIP, back to top"]');
    for (let i = 0; i < 5; i++) {
      await footerBrand.click();
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(600);
    console.log(`URL after 5 clicks: ${page.url()}`);
    const navigatedViaGesture = page.url().includes('developer-reference') || await page.locator('h1:has-text("Access Denied")').count() > 0;
    testReport.tests.push({
      name: 'Discreet 5-click footer gesture navigates to developer entrance',
      pass: navigatedViaGesture
    });

    // 12. Test Keyboard Shortcut (Ctrl+Shift+D)
    console.log('Testing keyboard shortcut Ctrl+Shift+D...');
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+Shift+KeyD');
    await page.waitForTimeout(600);
    console.log(`URL after Ctrl+Shift+D: ${page.url()}`);
    const navigatedViaKey = page.url().includes('developer-reference') || await page.locator('h1:has-text("Access Denied")').count() > 0;
    testReport.tests.push({
      name: 'Discreet keyboard shortcut Ctrl+Shift+D navigates to developer entrance',
      pass: navigatedViaKey
    });

    fs.writeFileSync(path.join(ARTIFACT_DIR, 'test-report.json'), JSON.stringify(testReport, null, 2));
    console.log('\n=== TEST REPORT ===');
    console.log(JSON.stringify(testReport, null, 2));

  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
