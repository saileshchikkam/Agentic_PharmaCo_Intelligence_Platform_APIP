import {UserRound, Stethoscope, Eye, EyeOff, MailCheck, Info, CircleAlert, CircleCheck, ShieldCheck} from 'lucide-react';
import { accountDestination } from './authCallback';
import React, { useEffect, useRef, useState } from 'react';
import { M3Button, M3TextField } from '../../components/material/core';
import { accountClient } from './client';
import { useAccount } from './AccountProvider';
import { navigatePreview } from '../access/navigation';
import './account.css';

interface AccountSignInProps {
  creatingInitially?: boolean;
  requestedTask?: string;
  workspace?: 'specialist';
  forgotPassword?: boolean;
  resetPasswordMode?: boolean;
}

export function AccountSignIn({
  creatingInitially = false,
  requestedTask,
  workspace,
  forgotPassword = false,
  resetPasswordMode = false,
}: AccountSignInProps) {
  const { user, ready, error: authError } = useAccount();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(
    resetPasswordMode ? 'reset' : forgotPassword ? 'forgot' : creatingInitially ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);

  const isSpecialist = workspace === 'specialist';
  const submitting = useRef(false);
  useEffect(() => {
    setMode(resetPasswordMode ? 'reset' : forgotPassword ? 'forgot' : creatingInitially ? 'signup' : 'signin');
    setEmail(''); setPassword(''); setConfirmPassword(''); setShowPassword(false);
    setNotice(null); setVerifyEmailSent(false);
  }, [creatingInitially, forgotPassword, resetPasswordMode, workspace]);

  useEffect(() => {
    if (!accountClient) {
      setNotice({
        type: 'info',
        message: 'Authentication service is not configured. Please supply Supabase environment keys.',
      });
      return;
    }
    if (accountClient.kind !== 'supabase') return;
    const controller = new AbortController();
    const url = String(import.meta.env.VITE_SUPABASE_URL || '');
    const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
    if (!url || !key) return;

    fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      signal: controller.signal,
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(settings => setGoogleEnabled(settings.external?.google === true))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (user && ready && mode !== 'reset') {
      const task = requestedTask ?? sessionStorage.getItem('apip.account.continue');
      sessionStorage.removeItem('apip.account.continue');
      const destination = sessionStorage.getItem('apip.account.return');
      sessionStorage.removeItem('apip.account.return');

      const rawDest = destination ? destination.replace(/^(\/#|#)/, '') : '';
      const validCustomDest =
        rawDest &&
        /^(?:\/specialist(?:\/(?:profile|home|reviews))?|\/admin\/specialist-applications(?:\/[0-9a-f-]{36})?|\/patient\/adr\/cases(?:\/[0-9a-f-]{36}(?:\/history|\/revisions\/[1-9][0-9]{0,2})?)?|\/preview\/adr-report\?case=[0-9a-f-]{36})$/i.test(
          rawDest
        );

      const target = validCustomDest
        ? rawDest
        : isSpecialist
        ? '/specialist'
        : accountDestination(task);

      navigatePreview(target, { replace: true });
    }
  }, [user?.id, ready, requestedTask, isSpecialist, mode]);

  const validate = () => {
    // BUG A FIX: Reset password mode validates new password and confirm password only (no email required)
    if (mode === 'reset') {
      if (!password) {
        setNotice({ type: 'error', message: 'Please enter your new password.' });
        return false;
      }
      if (password.length < 8) {
        setNotice({ type: 'error', message: 'Password must be at least 8 characters long.' });
        return false;
      }
      if (password !== confirmPassword) {
        setNotice({ type: 'error', message: 'Passwords do not match.' });
        return false;
      }
      return true;
    }

    // Email-based modes (signin, signup, forgot)
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setNotice({ type: 'error', message: 'Please enter a valid email address.' });
      return false;
    }
    if (mode === 'forgot') return true;

    // Password check for signin and signup
    if (!password) {
      setNotice({ type: 'error', message: 'Please enter your password.' });
      return false;
    }
    if (mode === 'signup' && password.length < 8) {
      setNotice({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return false;
    }
    return true;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountClient) {
      setNotice({ type: 'error', message: 'Account service is currently unavailable.' });
      return;
    }
    if (submitting.current) return;
    setNotice(null);
    if (!validate()) return;
    submitting.current = true;
    setBusy(true);
    try {
      if (mode === 'signup') {
        sessionStorage.setItem('apip.account.return', isSpecialist ? '/specialist/profile' : accountDestination(requestedTask));
        const verifyNeeded = await accountClient.signUp(email.trim(), password);
        setPassword('');
        if (verifyNeeded) {
          setVerifyEmailSent(true);
        } else {
          setNotice({ type: 'success', message: 'Account created! Redirecting to your dashboard…' });
          const target = isSpecialist ? '/specialist/profile' : accountDestination(requestedTask);
          navigatePreview(target, { replace: true });
        }
      } else if (mode === 'signin') {
        await accountClient.signIn(email.trim(), password);
        setPassword('');
        setNotice({ type: 'success', message: 'Signed in. Opening your dashboard…' });
      } else if (mode === 'forgot') {
        // BUG C FIX: Accurate status when in local development mode
        if (accountClient.kind === 'local') {
          setNotice({
            type: 'info',
            message:
              'Password reset via email requires cloud mode with Supabase Auth. In local development, accounts are stored in the local database.',
          });
          setBusy(false);
          return;
        }
        if (accountClient.resetPassword) {
          await accountClient.resetPassword(email.trim());
        }
        setNotice({
          type: 'success',
          message: 'If an account exists for this email, password reset instructions have been sent.',
        });
      } else if (mode === 'reset') {
        if (accountClient.updatePassword) {
          await accountClient.updatePassword(password);
          setNotice({ type: 'success', message: 'Password updated successfully! Redirecting…' });
          setTimeout(() => {
            navigatePreview(isSpecialist ? '/sign-in/specialist' : '/sign-in/patient', { replace: true });
          }, 1500);
        }
      }
    } catch (err: unknown) {
      setPassword('');
      const msg = err instanceof Error ? err.message : '';
      if (/invalid.*credential/i.test(msg) || /invalid_grant/i.test(msg)) {
        setNotice({ type: 'error', message: 'Incorrect email or password. Please try again.' });
      } else if (/already.*registered/i.test(msg) || /user_already_exists/i.test(msg)) {
        setNotice({ type: 'error', message: 'An account with this email already exists. Try signing in.' });
      } else if (/rate.*limit/i.test(msg)) {
        setNotice({ type: 'error', message: 'Too many attempts. Please wait a few moments and try again.' });
      } else {
        setNotice({ type: 'error', message: 'Unable to complete this request. Check your details or try again.' });
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (!accountClient || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setNotice(null);
    try {
      if (googleEnabled === false) {
        setNotice({
          type: 'info',
          message:
            'Google Sign-in is not yet enabled on the hosted project. Please use email and password to sign in.',
        });
        submitting.current = false; setBusy(false);
        return;
      }
      if (requestedTask) {
        sessionStorage.setItem('apip.account.continue', requestedTask);
      } else {
        sessionStorage.removeItem('apip.account.continue');
      }
      await accountClient.google(isSpecialist ? 'specialist' : undefined);
      submitting.current = false; setBusy(false);
    } catch {
      setNotice({ type: 'error', message: 'Google sign-in could not be opened. Please retry or use email.' });
      submitting.current = false; setBusy(false);
    }
  };

  // If email confirmation is waiting
  if (verifyEmailSent) {
    return (
      <div className="auth-card-shell" role="region" aria-label="Email verification">
        <div className="auth-card-header">
          <div className="auth-card-brand-symbol" aria-hidden="true">
            <MailCheck size={32} aria-hidden="true" />
          </div>
          <h1 className="auth-card-title">Check your email</h1>
          <p className="auth-card-subtitle">
            We sent a confirmation link to <strong>{email}</strong>.
          </p>
        </div>
        <p className="auth-card-caption" style={{ textAlign: 'center', margin: '16px 0 24px' }}>
          Open the link in your email to confirm your account and access {isSpecialist ? 'the specialist workspace' : 'your patient dashboard'}.
        </p>
        <div className="auth-card-actions">
          <M3Button
            variant="filled"
            onClick={() => {
              setVerifyEmailSent(false);
              setMode('signin');
              navigatePreview(isSpecialist ? '/sign-in/specialist' : '/sign-in/patient');
            }}
          >
            Back to sign in
          </M3Button>
        </div>
      </div>
    );
  }

  const title =
    mode === 'reset'
      ? 'Choose a new password'
      : mode === 'forgot'
      ? 'Reset your password'
      : mode === 'signup'
      ? 'Create your account'
      : 'Welcome back';

  const subtitle =
    mode === 'reset'
      ? 'Enter your new account password below'
      : mode === 'forgot'
      ? 'Enter your email to receive recovery instructions'
      : isSpecialist
      ? mode === 'signup'
        ? 'Create an account to apply for specialist verification'
        : 'Sign in to the specialist workspace'
      : mode === 'signup'
      ? 'Start your personal patient space'
      : 'Sign in to your patient account';

  return (
    <div className="auth-card-shell" role="region" aria-label={title}>
      {/* Brand Header */}
      <div className="auth-card-header">
        <div className="auth-card-brand-symbol" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--md-sys-color-primary, #0284c7)' }}>
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
            <path d="m8.5 8.5 7 7" />
          </svg>
        </div>
        <h1 className="auth-card-title">{title}</h1>
        <p className="auth-card-subtitle">{subtitle}</p>
      </div>

      {/* Role Navigation Toggle (between Patient and Specialist) */}
      <div className="auth-role-switch">
        <button
          type="button"
          aria-label="Patient"
          aria-pressed={!isSpecialist}
          disabled={busy}
          className={`auth-role-tab ${!isSpecialist ? 'active' : ''}`}
          onClick={() => {
            if (isSpecialist) {
              navigatePreview(mode === 'signup' ? '/sign-up/patient' : '/sign-in/patient');
            }
          }}
        >
          <UserRound size={18} aria-hidden="true" />
          Patient
        </button>
        <button
          type="button"
          aria-label="Specialist"
          aria-pressed={isSpecialist}
          disabled={busy}
          className={`auth-role-tab ${isSpecialist ? 'active' : ''}`}
          onClick={() => {
            if (!isSpecialist) {
              navigatePreview(mode === 'signup' ? '/sign-up/specialist' : '/sign-in/specialist');
            }
          }}
        >
          <Stethoscope size={18} aria-hidden="true" />
          Specialist
        </button>
      </div>

      {/* Notice / Error banner */}
      {(notice || authError) && (
        <div
          role={notice?.type === 'error' || authError ? 'alert' : 'status'}
          className={`auth-notice-banner ${notice?.type ?? (authError ? 'error' : 'info')}`}
        >
          {notice?.type === "success" ? <CircleCheck size={20} aria-hidden="true" /> : notice?.type === "info" ? <Info size={20} aria-hidden="true" /> : <CircleAlert size={20} aria-hidden="true" />}
          <span>{notice?.message ?? authError}</span>
        </div>
      )}

      {/* Google OAuth (only for signin and signup) */}
      {(mode === 'signin' || mode === 'signup') && (
        <>
          <M3Button
            variant="outlined"
            leadingIcon={<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" >
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>}
            className="auth-google-btn"
            disabled={busy || !accountClient}
            onClick={() => void handleGoogle()}
            ariaLabel="Continue with Google"
          >
            Continue with Google
          </M3Button>

          <div className="auth-divider">
            <span>or with email</span>
          </div>
        </>
      )}

      {/* Main Email/Password Form */}
      <form onSubmit={submit} noValidate className="auth-form-body">
        {mode !== 'reset' && (
          <div className="auth-field-wrapper">
            <M3TextField
              label="Email"
              type="email"
              autoComplete={mode === 'signup' ? 'email' : 'username'}
              value={email}
              required
              disabled={busy || !accountClient}
              onChange={e => {
                setEmail(e.target.value);
                setNotice(null);
              }}
            />
          </div>
        )}

        {mode !== 'forgot' && (
          <div className="auth-field-wrapper" style={{ position: 'relative' }}>
            <M3TextField
              label={mode === 'reset' ? 'New password' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' || mode === 'reset' ? 'new-password' : 'current-password'}
              value={password}
              required
              disabled={busy || !accountClient}
              onChange={e => {
                setPassword(e.target.value);
                setNotice(null);
              }}
            />
            <button
              type="button"
              className="auth-password-toggle"
              disabled={busy}
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(p => !p)}
            >
              {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
            {mode === 'signup' && (
              <span className="auth-field-helper">Minimum 8 characters</span>
            )}
          </div>
        )}

        {mode === 'reset' && (
          <div className="auth-field-wrapper" style={{ position: 'relative' }}>
            <M3TextField
              label="Confirm new password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              required
              disabled={busy || !accountClient}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setNotice(null);
              }}
            />
          </div>
        )}

        {/* Forgot password link on sign-in */}
        {mode === 'signin' && (
          <div className="auth-forgot-row">
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setMode('forgot');
                setNotice(null);
                navigatePreview(isSpecialist ? '/forgot-password/specialist' : '/forgot-password/patient');
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Specialist signup informational note */}
        {mode === 'signup' && isSpecialist && (
          <div className="auth-specialist-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Professional verification details are submitted after account creation in your specialist profile.</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="auth-submit-row">
          <M3Button type="submit" variant="filled" disabled={busy || !accountClient}>
            {busy
              ? 'Please wait…'
              : mode === 'signup'
              ? 'Create account'
              : mode === 'signin'
              ? 'Sign in'
              : mode === 'forgot'
              ? 'Send reset link'
              : 'Update password'}
          </M3Button>
        </div>
      </form>

      {/* Footer Navigation Switcher */}
      <div className="auth-card-footer">
        {mode === 'signin' && (
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-link-btn primary"
              onClick={() => {
                setMode('signup');
                setNotice(null);
                navigatePreview(isSpecialist ? '/sign-up/specialist' : '/sign-up/patient');
              }}
            >
              Create an account
            </button>
          </p>
        )}
        {mode === 'signup' && (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="auth-link-btn primary"
              onClick={() => {
                setMode('signin');
                setNotice(null);
                navigatePreview(isSpecialist ? '/sign-in/specialist' : '/sign-in/patient');
              }}
            >
              Sign in
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <p>
            Remember your password?{' '}
            <button
              type="button"
              className="auth-link-btn primary"
              onClick={() => {
                setMode('signin');
                setNotice(null);
                navigatePreview(isSpecialist ? '/sign-in/specialist' : '/sign-in/patient');
              }}
            >
              Back to sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
