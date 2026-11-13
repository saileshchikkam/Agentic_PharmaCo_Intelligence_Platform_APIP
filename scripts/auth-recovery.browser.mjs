import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer as httpServer } from 'node:http';
import { createServer } from 'vite';

const { chromium } = await import(process.env.ADR_PLAYWRIGHT_MODULE || 'playwright');
const provider = 'https://auth.example.test';
const server = httpServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const vite = await createServer({
  server: { middlewareMode: true, hmr: { server }, watch: null },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(provider),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_fixture'),
  },
});
server.on('request', vite.middlewares);
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

const patientId = '00000000-0000-0000-0000-000000000011';
const specialistId = '00000000-0000-0000-0000-000000000012';
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const makeSession = (id, email, expires = 3600) => {
  const exp = Math.floor(Date.now() / 1000) + expires;
  return {
    access_token: encode({ alg: 'HS256' }) + '.' + encode({ sub: id, exp }) + '.fixture',
    refresh_token: 'fixture-refresh-' + id,
    expires_in: expires,
    expires_at: exp,
    token_type: 'bearer',
    user: {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: {},
      user_metadata: {},
    },
  };
};

let signupChallenge = '';
let recoverChallenge = '';
let activeUserId = specialistId;
let failAdrApiWith401 = false;
let failRefresh = false;

const headers = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
};

await context.route(provider + '/**', async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const json = (data, status = 200) => route.fulfill({ status, headers, json: data });
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });

  if (url.pathname === '/auth/v1/settings') {
    return json({ external: { email: true, google: false } });
  }
  if (url.pathname === '/auth/v1/signup') {
    const body = req.postDataJSON();
    assert.equal(url.searchParams.get('redirect_to'), origin + '/?apip_auth=1');
    assert.ok(body.code_challenge, 'signup sends PKCE code_challenge');
    signupChallenge = body.code_challenge;
    return json(makeSession(specialistId, body.email).user);
  }
  if (url.pathname === '/auth/v1/recover') {
    const body = req.postDataJSON();
    assert.equal(url.searchParams.get('redirect_to'), origin + '/?apip_auth=1&type=recovery');
    assert.ok(body.code_challenge, 'recover sends PKCE code_challenge');
    recoverChallenge = body.code_challenge;
    return json({});
  }
  if (url.pathname === '/auth/v1/token') {
    const body = req.postDataJSON();
    const grant = url.searchParams.get('grant_type');
    if (grant === 'pkce') {
      const digest = createHash('sha256').update(body.code_verifier).digest('base64url');
      if (body.auth_code === 'confirm-spec') {
        assert.equal(digest, signupChallenge);
        activeUserId = specialistId;
        return json(makeSession(specialistId, 'fictional.spec@example.test'));
      }
      if (body.auth_code === 'recover-spec') {
        assert.equal(digest, recoverChallenge);
        activeUserId = specialistId;
        return json(makeSession(specialistId, 'fictional.spec@example.test'));
      }
      return json({ code: 'otp_expired', msg: 'Expired fixture link' }, 400);
    }
    if (grant === 'password') {
      activeUserId = patientId;
      return json(makeSession(patientId, body.email));
    }
    if (grant === 'refresh_token') {
      if (failRefresh) {
        return json({ code: 'refresh_token_not_found', msg: 'Fixture refresh revoked' }, 400);
      }
      return json(makeSession(activeUserId, 'fictional@example.test'));
    }
  }
  if (url.pathname === '/auth/v1/user') {
    if (req.method() === 'PUT') {
      assert.ok(req.headers().authorization?.startsWith('Bearer '));
      return json(makeSession(activeUserId, 'fictional.spec@example.test').user);
    }
    return json(makeSession(activeUserId, 'fictional@example.test').user);
  }
  if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers });
  if (url.pathname === '/rest/v1/patient_profiles') return json(null);
  return json({ msg: 'Unexpected fixture route' }, 404);
});

await context.route(origin + '/api/**', async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname === '/api/account/capabilities') {
    return route.fulfill({
      json: { specialistWorkspace: false, identityAdministration: false, authorizationVersion: 'none' },
    });
  }
  if (url.pathname === '/api/specialist/applications/current') {
    return route.fulfill({ json: { application: null } });
  }
  if (url.pathname.startsWith('/api/account/adr-guided') || url.pathname.startsWith('/api/account/adr-cases')) {
    if (failAdrApiWith401) {
      return route.fulfill({ status: 401, json: { error: 'SIGN_IN_REQUIRED' } });
    }
    return route.fulfill({ json: { cases: [] } });
  }
  return route.fulfill({ status: 404, json: { error: 'NOT_FOUND' } });
});

const tab1 = await context.newPage();
try {
  // 1. Cross-tab email confirmation after specialist sign-up
  await tab1.goto(origin + '/#/sign-up/specialist');
  await tab1.getByRole('textbox', { name: /^Email(?: address)?$/ }).fill('fictional.spec@example.test');
  await tab1.getByRole('textbox', { name: 'Password' }).fill('fictional-password-123');
  await tab1.getByRole('button', { name: 'Create account', exact: true }).click();
  await tab1.getByRole('heading', { name: 'Check your email', exact: true }).waitFor();

  const tab2 = await context.newPage();
  await tab2.goto(origin + '/?apip_auth=1&code=confirm-spec');
  await tab2.waitForFunction(() => window.location.hash.startsWith('#/specialist'));
  assert.equal(new URL(tab2.url()).search, '');
  await tab2.getByRole('button', { name: 'Sign out', exact: true }).click();
  await tab1.waitForFunction(() => !localStorage.getItem('apip.cloud.auth'));
  await tab2.close();

  // 2. Cross-tab password reset from specialist forgot-password -> recovery link in new tab
  await tab1.goto(origin + '/#/forgot-password/specialist');
  await tab1.getByRole('textbox', { name: /^Email(?: address)?$/ }).fill('fictional.spec@example.test');
  await tab1.getByRole('button', { name: 'Send reset link', exact: true }).click();
  await tab1.getByText('If an account exists for this email, password reset instructions have been sent.').waitFor();

  const recoveryTab = await context.newPage();
  await recoveryTab.goto(origin + '/?apip_auth=1&type=recovery&code=recover-spec');
  await recoveryTab.getByRole('heading', { name: 'Choose a new password', exact: true }).waitFor();
  await recoveryTab.getByRole('heading', { name: 'Specialist Portal', exact: true }).waitFor();
  await recoveryTab.getByRole('textbox', { name: 'New password', exact: true }).fill('new-fictional-pass-123');
  await recoveryTab.getByRole('textbox', { name: 'Confirm new password', exact: true }).fill('different-pass-123');
  await recoveryTab.getByRole('button', { name: 'Update password', exact: true }).click();
  await recoveryTab.getByText('Passwords do not match.').waitFor();
  await recoveryTab.getByRole('textbox', { name: 'Confirm new password', exact: true }).fill('new-fictional-pass-123');
  await recoveryTab.getByRole('button', { name: 'Update password', exact: true }).click();
  await recoveryTab.waitForFunction(() => window.location.hash.startsWith('#/specialist'), { timeout: 10000 });
  await recoveryTab.getByRole('button', { name: 'Sign out', exact: true }).click();
  await recoveryTab.close();

  // 3. Expired / missing recovery link shows actionable fallback instead of broken form
  const expiredTab = await context.newPage();
  await expiredTab.goto(origin + '/?apip_auth=1&type=recovery&error=access_denied&error_code=otp_expired');
  await expiredTab.getByRole('heading', { name: 'Password reset link expired', exact: true }).waitFor();
  await expiredTab.getByText('This password reset link is invalid or expired. Please request a new reset link.').waitFor();
  await expiredTab.getByRole('button', { name: 'Request a new reset link', exact: true }).click();
  await expiredTab.waitForFunction(() => window.location.hash.startsWith('#/forgot-password/'));
  await expiredTab.close();

  // 4. Server 401 SIGN_IN_REQUIRED reconciles dead session and redirects back to sign-in with notice
  await tab1.goto(origin + '/#/sign-in/patient');
  await tab1.getByRole('textbox', { name: /^Email(?: address)?$/ }).fill('fictional.patient@example.test');
  await tab1.getByRole('textbox', { name: 'Password' }).fill('fictional-password-123');
  await tab1.getByRole('button', { name: 'Sign in', exact: true }).click();
  await tab1.waitForFunction(() => window.location.hash === '#/patient/home', { timeout: 10000 });
  failAdrApiWith401 = true;
  failRefresh = true;
  await tab1.goto(origin + '/#/patient/adr/cases');
  await tab1.waitForFunction(() => window.location.hash.startsWith('#/sign-in/patient'), { timeout: 10000 });
  await tab1.getByText('Your session expired. Sign in again to continue.').waitFor();
  assert.equal(await tab1.evaluate(() => localStorage.getItem('apip.cloud.auth')), null);

  console.log('PASS cross-tab email confirmation, cross-tab password reset, expired recovery UI, and 401 session reconciliation');
} finally {
  await browser.close();
  await vite.close();
  server.closeAllConnections?.();
  await new Promise(resolve => server.close(resolve));
}
