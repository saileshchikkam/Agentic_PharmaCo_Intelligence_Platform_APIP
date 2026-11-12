/** Maps provider and local account authentication failures to safe, user-actionable error notices. */
export function formatAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  const roleErrors: Record<string,string>={PATIENT_PORTAL_REQUIRED:'This account belongs to the Patient Portal. Use Patient Sign In.',SPECIALIST_PORTAL_REQUIRED:'This account belongs to the Specialist Portal. Use Specialist Sign In.',ACCOUNT_ROLE_MISSING:'This account has no verified portal role. Contact the development administrator.',ACCOUNT_ROLE_SETUP_REQUIRED:'Account role setup is pending. Please contact the development administrator.',ACCOUNT_ROLE_UNAVAILABLE:'Account roles could not be checked. Please retry when the service is available.',SESSION_CLEANUP_FAILED:'Sign-out could not be confirmed. Close this page and retry before switching accounts.'};
  if(roleErrors[msg])return roleErrors[msg];
  const name =
    err instanceof Error
      ? err.name
      : typeof (err as { name?: unknown })?.name === 'string'
        ? (err as { name: string }).name
        : '';
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
  if (
    /already.*registered/i.test(msg) ||
    /user_already_exists/i.test(msg) ||
    ['user_already_exists', 'email_exists'].includes(code) ||
    msg === 'ACCOUNT_EXISTS'
  ) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (code === 'email_address_invalid' || /email address.*is invalid/i.test(msg)) {
    return 'This email address domain or format cannot be used. Please enter a valid email address.';
  }
  if (code === 'weak_password' || /password should be/i.test(msg)) {
    return 'Please choose a stronger password (at least 12 characters with letters, numbers, or symbols).';
  }
  if (code === 'same_password' || /different from the old password/i.test(msg)) {
    return 'Please choose a new password that is different from your current password.';
  }
  if (
    name === 'AuthPKCECodeVerifierMissingError' ||
    ['pkce_code_verifier_not_found', 'otp_expired', 'flow_state_expired', 'flow_state_not_found', 'bad_code_verifier'].includes(code) ||
    /code verifier/i.test(msg)
  ) {
    return 'This verification link is invalid or expired. Please request a new link.';
  }
  if (
    name === 'AuthSessionMissingError' ||
    ['session_not_found', 'session_expired', 'refresh_token_not_found', 'SIGN_IN_REQUIRED'].includes(code) ||
    msg === 'SIGN_IN_REQUIRED' ||
    /session.*missing|session.*expired/i.test(msg)
  ) {
    return 'Your authentication or reset session is missing or expired. Please sign in or request a new link.';
  }
  if (['signup_disabled', 'email_provider_disabled'].includes(code)) {
    return 'Email registration is currently unavailable on this authentication configuration.';
  }
  if (code === 'user_banned' || /user is banned/i.test(msg)) {
    return 'This account is currently restricted and cannot sign in.';
  }
  if (msg === 'LOCAL_RECOVERY_UNAVAILABLE') {
    return 'Password reset links require the hosted authentication service.';
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
  if (/failed to fetch/i.test(msg) || /network/i.test(msg) || /fetch failed/i.test(msg) || /timed out|timeout|AbortError/i.test(msg)) {
    return 'Unable to reach the authentication service. Please check your network connection and try again.';
  }
  return 'Unable to complete this authentication request. Please check your details or try again.';
}
