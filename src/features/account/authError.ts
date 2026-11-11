/** Maps provider and local account authentication failures to safe, user-actionable error notices. */
export function formatAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  const code = typeof (err as { code?: unknown })?.code === 'string' ? (err as { code: string }).code : '';

  if (
    /invalid.*credential/i.test(msg) ||
    /invalid_grant/i.test(msg) ||
    /user.*not.*found/i.test(msg) ||
    ['invalid_credentials', 'user_not_found', 'INVALID_CREDENTIALS'].includes(code) ||
    msg === 'INVALID_CREDENTIALS'
  ) {
    return 'Incorrect email or password. Please try again.';
  }
  if (/email.*not.*confirmed/i.test(msg) || /unconfirmed/i.test(msg) || code === 'email_not_confirmed') {
    return 'Please confirm your email address before signing in. Check your inbox for the confirmation link.';
  }
  if (/already.*registered/i.test(msg) || /user_already_exists/i.test(msg) || code === 'user_already_exists' || msg === 'ACCOUNT_EXISTS') {
    return 'An account with this email already exists. Try signing in.';
  }
  if (code === 'email_address_invalid' || /email address.*is invalid/i.test(msg)) {
    return 'This email address domain or format cannot be used. Please enter a valid email address.';
  }
  if (code === 'weak_password' || /password should be/i.test(msg)) {
    return 'Please choose a stronger password (at least 12 characters with letters, numbers, or symbols).';
  }
  if (
    /rate.*limit/i.test(msg) ||
    /only request this after/i.test(msg) ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    msg === 'TRY_LATER'
  ) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (/failed to fetch/i.test(msg) || /network/i.test(msg) || /fetch failed/i.test(msg)) {
    return 'Unable to reach the authentication service. Please check your network connection and try again.';
  }
  return 'Unable to complete this authentication request. Please check your details or try again.';
}
