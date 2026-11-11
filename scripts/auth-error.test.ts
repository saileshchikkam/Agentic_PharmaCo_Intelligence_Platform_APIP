import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAuthError } from '../src/features/account/authError';
import { accountDestination, readAuthCallback, safeAccountReturn } from '../src/features/account/authCallback';

test('formatAuthError maps Supabase codes and local account errors to non-enumerating actionable notices', () => {
  const errWithCode = (code: string, message = 'provider failure') => Object.assign(new Error(message), { code });

  assert.match(formatAuthError(errWithCode('invalid_credentials', 'Invalid login credentials')), /Incorrect email or password/);
  assert.match(formatAuthError(new Error('INVALID_CREDENTIALS')), /Incorrect email or password/);
  assert.match(formatAuthError(errWithCode('email_not_confirmed', 'Email not confirmed')), /confirm your email address/i);
  assert.match(formatAuthError(errWithCode('user_already_exists')), /already exists/);
  assert.match(formatAuthError(new Error('ACCOUNT_EXISTS')), /already exists/);
  assert.match(formatAuthError(errWithCode('email_address_invalid', 'Email address "x@example.test" is invalid')), /valid email address/);
  assert.match(formatAuthError(errWithCode('weak_password')), /stronger password/);
  assert.match(formatAuthError(errWithCode('over_email_send_rate_limit')), /Too many attempts/);
  assert.match(formatAuthError(new Error('TRY_LATER')), /Too many attempts/);
  assert.match(formatAuthError(new TypeError('Failed to fetch')), /network connection/i);
  assert.equal(
    formatAuthError(new Error('some unexpected internal exception')),
    'Unable to complete this authentication request. Please check your details or try again.'
  );
});

test('authCallback restricts return URLs and rejects open redirects', () => {
  assert.equal(accountDestination('adr-report'), '/preview/adr-report');
  assert.equal(accountDestination('medassist'), '/preview/medassist');
  assert.equal(accountDestination('other'), '/patient/home');

  assert.equal(safeAccountReturn('/specialist/reviews'), '/specialist/reviews');
  assert.equal(safeAccountReturn('/patient/home'), '/patient/home');
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
});
