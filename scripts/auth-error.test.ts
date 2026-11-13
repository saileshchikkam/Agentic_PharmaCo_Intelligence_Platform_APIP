import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAuthError } from '../src/features/account/authError';
import {
  accountDestination,
  clearPendingAuthReturn,
  readAuthCallback,
  readPendingAuthReturn,
  safeAccountReturn,
  savePendingAuthReturn,
} from '../src/features/account/authCallback';

test('formatAuthError maps Supabase codes and local account errors to non-enumerating actionable notices', () => {
  const errWithCode = (code: string, message = 'provider failure') => Object.assign(new Error(message), { code });
  const errWithName = (name: string, message = 'provider failure', code?: string) =>
    Object.assign(new Error(message), { name, ...(code ? { code } : {}) });

  assert.match(formatAuthError(errWithCode('invalid_credentials', 'Invalid login credentials')), /Incorrect email or password/);
  assert.match(formatAuthError(new Error('INVALID_CREDENTIALS')), /Incorrect email or password/);
  assert.match(formatAuthError(errWithCode('email_not_confirmed', 'Email not confirmed')), /confirm your email address/i);
  assert.match(formatAuthError(errWithCode('user_already_exists')), /already exists/);
  assert.match(formatAuthError(errWithCode('email_exists')), /already exists/);
  assert.match(formatAuthError(new Error('ACCOUNT_EXISTS')), /already exists/);
  assert.match(formatAuthError(errWithCode('email_address_invalid', 'Email address "x@example.test" is invalid')), /valid email address/);
  assert.match(formatAuthError(errWithCode('weak_password')), /stronger password/);
  assert.match(formatAuthError(errWithCode('same_password')), /different from your current password/i);
  assert.match(formatAuthError(errWithName('AuthSessionMissingError', 'Auth session missing!')), /missing or expired/i);
  assert.match(formatAuthError(errWithCode('session_not_found')), /missing or expired/i);
  assert.match(formatAuthError(errWithCode('refresh_token_not_found')), /missing or expired/i);
  assert.match(formatAuthError(errWithName('AuthPKCECodeVerifierMissingError', 'missing verifier', 'pkce_code_verifier_not_found')), /invalid or expired/i);
  assert.match(formatAuthError(errWithCode('otp_expired')), /invalid or expired/i);
  assert.match(formatAuthError(errWithCode('signup_disabled')), /unavailable/i);
  assert.match(formatAuthError(errWithCode('user_banned')), /restricted/i);
  assert.match(formatAuthError(new Error('LOCAL_RECOVERY_UNAVAILABLE')), /hosted authentication service/i);
  assert.match(formatAuthError(errWithCode('over_email_send_rate_limit')), /Too many attempts/);
  assert.match(formatAuthError(new Error('TRY_LATER')), /Too many attempts/);
  assert.match(formatAuthError(new TypeError('Failed to fetch')), /network connection/i);
  assert.match(formatAuthError(errWithName('AbortError', 'The operation was aborted due to timeout')), /network connection/i);
  assert.equal(
    formatAuthError(new Error('some unexpected internal exception')),
    'Unable to complete this authentication request. Please check your details or try again.'
  );
});

test('authCallback restricts return URLs, handles trailing slashes, and isolates cross-tab pending returns', () => {
  assert.equal(accountDestination('adr-report'), '/preview/adr-report');
  assert.equal(accountDestination('medassist'), '/preview/medassist');
  assert.equal(accountDestination('other'), '/patient/home');

  assert.equal(safeAccountReturn('/specialist/reviews'), '/specialist/reviews');
  assert.equal(safeAccountReturn('/specialist/reviews/'), '/specialist/reviews');
  assert.equal(safeAccountReturn('/patient/home/'), '/patient/home');
  assert.equal(safeAccountReturn('/account/profile'), '/account/profile');
  assert.equal(safeAccountReturn('/preview/adr-report/?case=00000000-0000-4000-8000-000000000001'), '/preview/adr-report?case=00000000-0000-4000-8000-000000000001');
  assert.equal(safeAccountReturn('https://evil.example/phish'), '/patient/home');
  assert.equal(safeAccountReturn('//evil.example/phish'), '/patient/home');
  assert.equal(safeAccountReturn('/#/specialist/home'), '/specialist/home');

  assert.deepEqual(
    readAuthCallback(new URL('http://127.0.0.1:3602/?apip_auth=1&code=abc')),
    { code: 'abc' }
  );
  assert.deepEqual(
    readAuthCallback(new URL('http://127.0.0.1:3602/?apip_auth=1&error=access_denied&code=abc')),
    { code: null }
  );

  const mem = new Map<string, string>();
  const store = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); },
  };
  savePendingAuthReturn('https://evil.example/phish', 'patient', store, 1000);
  assert.equal(readPendingAuthReturn(false, store, 1500), null);
  savePendingAuthReturn('/specialist/profile', 'specialist', store, 1000);
  assert.deepEqual(readPendingAuthReturn(false, store, 2000), { path: '/specialist/profile', role: 'specialist' });
  assert.deepEqual(readPendingAuthReturn(true, store, 2000), { path: '/specialist/profile', role: 'specialist' });
  assert.equal(readPendingAuthReturn(false, store, 2000), null);
  savePendingAuthReturn('/patient/home', 'patient', store, 1000);
  assert.equal(readPendingAuthReturn(false, store, 1000 + 60 * 60 * 1000 + 1), null);
  savePendingAuthReturn('/patient/home', 'patient', store, 1000);
  clearPendingAuthReturn(store);
  assert.equal(mem.size, 0);
});

test('portal failures explain wrong portal, unbound legacy identity and setup outages',()=>{
 assert.match(formatAuthError(Error('PATIENT_PORTAL_REQUIRED')),/Patient Portal/);
 assert.match(formatAuthError(Error('SPECIALIST_PORTAL_REQUIRED')),/Specialist Portal/);
 assert.match(formatAuthError(Error('ACCOUNT_ROLE_MISSING')),/no verified portal role/);
 assert.match(formatAuthError(Error('ACCOUNT_ROLE_SETUP_REQUIRED')),/setup is pending/);
 assert.match(formatAuthError(Error('ACCOUNT_ROLE_UNAVAILABLE')),/could not be checked/);
});
