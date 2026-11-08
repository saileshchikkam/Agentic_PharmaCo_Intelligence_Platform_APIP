import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer as httpServer } from 'node:http';
import { createServer } from 'vite';

const { chromium } = await import(process.env.ADR_PLAYWRIGHT_MODULE || 'playwright');
const provider = 'https://auth.example.test';
const server = httpServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const vite = await createServer({ server: { middlewareMode: true, hmr: { server }, watch: null },
  define: { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(provider),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_fixture') } });
server.on('request', vite.middlewares);
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const a = '00000000-0000-0000-0000-000000000001';
const b = '00000000-0000-0000-0000-000000000002';
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function session(id, expires = 3600) {
  const exp = Math.floor(Date.now()/1000) + expires;
  return { access_token: encode({ alg: 'HS256' }) + '.' + encode({ sub: id, exp }) + '.fixture',
    refresh_token: 'fictional-refresh-' + id, expires_in: expires, expires_at: exp, token_type: 'bearer',
    user: { id, aud: 'authenticated', role: 'authenticated', email: 'fictional@example.test', app_metadata: {}, user_metadata: {} } };
}
let challenge, cancel = true, refreshed = 0, refreshFails = false;
const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
await context.route(provider + '/**', async route => {
  const url = new URL(route.request().url());
  const json = (data, status = 200) => route.fulfill({ status, headers, json: data });
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
  if (url.pathname === '/auth/v1/authorize') {
    assert.equal(url.searchParams.get('provider'), 'google');
    assert.equal(url.searchParams.get('redirect_to'), origin + '/?apip_auth=1');
    challenge = url.searchParams.get('code_challenge');
    assert.ok(challenge);
    assert.equal(url.searchParams.get('code_challenge_method')?.toLowerCase(), 's256');
    return route.fulfill({ status: 302, headers: { location: origin + '/?apip_auth=1&' + (cancel ? 'error=access_denied' : 'code=fixture') } });
  }
  if (url.pathname === '/auth/v1/token') {
    const body = route.request().postDataJSON();
    const grant = url.searchParams.get('grant_type');
    if (grant === 'pkce') {
      assert.equal(body.auth_code, 'fixture');
      assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'), challenge);
      return json(session(a));
    }
    if (grant === 'password') return json(session(b, 20));
    if (grant === 'refresh_token') {
      refreshed++;
      return refreshFails ? json({ code: 'refresh_token_not_found', msg: 'Fixture expired' }, 400) : json(session(b));
    }
  }
  if (url.pathname === '/auth/v1/signup') {
    assert.equal(url.searchParams.get('redirect_to'), origin + '/?apip_auth=1');
    assert.ok(route.request().postDataJSON().code_challenge);
    return json(session(b).user);
  }
  if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers });
  if (url.pathname === '/rest/v1/patient_profiles') return json(null);
  return json({ msg: 'Unexpected fixture route' }, 404);
});
await context.route(origin + '/api/account/adr-guided', route => {
  assert.ok(route.request().headers().authorization?.startsWith('Bearer '));
  return route.fulfill({ json: { cases: [] } });
});
const page = await context.newPage();
const signIn = origin + '/#/sign-in/patient?continue=adr-report';
try {
  await page.goto(signIn);
  const google = page.getByRole('button', { name: 'Continue with Google' });
  await google.waitFor();
  if (process.env.APIP_AUTH_SCREENSHOT_DIR) await page.screenshot({ path: process.env.APIP_AUTH_SCREENSHOT_DIR + '/cloud-auth-fixture.png' });
  if (process.env.APIP_AUTH_SCREENSHOT_DIR) {
    await page.getByRole('button', { name: 'Appearance settings' }).click();
    await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.screenshot({ path: process.env.APIP_AUTH_SCREENSHOT_DIR + '/cloud-auth-fixture-dark.png' });
  }
  await google.click();
  await page.getByText('Sign-in was cancelled or the link expired.', { exact: false }).waitFor();
  assert.equal(new URL(page.url()).search, '');
  await page.getByRole('button', { name: 'Create an account', exact: true }).click();
  await page.getByRole('textbox', { name: /^Email(?: address)?$/ }).fill('fictional@example.test');
  await page.getByRole('textbox', { name: 'Password' }).fill('fictional-password-123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.getByRole('heading', { name: 'Check your email', exact: true }).waitFor();
  cancel = false;
  await page.goto(signIn);
  await google.click();
  await page.getByRole('heading', { name: 'Saved reports', exact: true }).waitFor();
  assert.equal(new URL(page.url()).search, '');
  await page.reload();
  await page.getByRole('heading', { name: 'Saved reports', exact: true }).waitFor();
  const other = await context.newPage();
  await other.goto(origin + '/#/preview/adr-report');
  await other.getByRole('heading', { name: 'Saved reports', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await other.getByRole('link', { name: 'Sign in to start' }).waitFor();
  await page.goto(signIn);
  await page.getByRole('textbox', { name: /^Email(?: address)?$/ }).fill('fictional@example.test');
  await page.getByRole('textbox', { name: 'Password' }).fill('fictional-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await other.getByRole('heading', { name: 'Saved reports', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Saved reports', exact: true }).waitFor();
  assert.ok(refreshed > 0);
  refreshFails = true;
  await page.evaluate(() => {
    const key = 'apip.cloud.auth';
    const saved = JSON.parse(localStorage.getItem(key));
    saved.expires_at = 1;
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await page.getByRole('link', { name: 'Sign in to start' }).waitFor();
  console.log('PASS simulated Google PKCE and cancellation, email login, reload, refresh failure and cross-tab sign-out/sign-in');
} finally {
  await browser.close();
  await vite.close();
  await new Promise(resolve => server.close(resolve));
}
