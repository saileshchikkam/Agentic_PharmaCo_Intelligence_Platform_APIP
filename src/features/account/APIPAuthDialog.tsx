import React, { useEffect, useRef, useState } from 'react';
import type { MdDialog } from '@material/web/dialog/dialog';
import { M3Button, M3TextField } from '../../components/material/core';
import { accountClient } from './client';
import { formatAuthError } from './authError';
import { useAccount } from './AccountProvider';
import {
  accountDestination,
  clearPendingAuthReturn,
  readPendingAuthReturn,
  savePendingAuthReturn,
} from './authCallback';
import { navigatePreview } from '../access/navigation';
import { Brand } from '../access/PreviewLayout';
import './auth-dialog.css';

export type AuthRole = 'patient' | 'specialist';
export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

export interface APIPAuthDialogProps {
  open: boolean;
  onClose: () => void;
  initialRole?: AuthRole;
  initialMode?: AuthMode;
  requestedTask?: string;
}

export function APIPAuthDialog({
  open,
  onClose,
  initialRole = 'patient',
  initialMode = 'signin',
  requestedTask,
}: APIPAuthDialogProps) {
  const { user, ready, portal, portalReady, error: authError } = useAccount();
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);

  const dialogRef = useRef<MdDialog>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const submitting = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSpecialist = role === 'specialist';

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  // Sync props when opening
  useEffect(() => {
    if (open) {
      lastActiveElement.current = document.activeElement as HTMLElement | null;
      let nextRole = initialRole;
      if (initialMode === 'reset') {
        const pendingRole = readPendingAuthReturn(false)?.role;
        let storedRole: string | null = null;
        try { storedRole = sessionStorage.getItem('apip.last.role'); } catch {}
        if (pendingRole === 'specialist' || (!pendingRole && storedRole === 'specialist')) {
          nextRole = 'specialist';
        }
      }
      setRole(nextRole);
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setNotice(null);
      setVerifyEmailSent(false);
      setResending(false);
    }
  }, [open, initialRole, initialMode]);

  // Dialog animations and shadow scrim styling
  useEffect(() => {
    const dialog = dialogRef.current as (MdDialog & {
      getOpenAnimation?: () => unknown;
      getCloseAnimation?: () => unknown;
    }) | null;
    if (!dialog) return;

    const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced) {
      dialog.getOpenAnimation = () => ({
        dialog: [[[{ opacity: 0 }, { opacity: 1 }], { duration: 0 }]],
        scrim: [[[{ opacity: 0 }, { opacity: 0.32 }], { duration: 0 }]],
      });
      dialog.getCloseAnimation = () => ({
        dialog: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 0 }]],
        scrim: [[[{ opacity: 0.32 }, { opacity: 0 }], { duration: 0 }]],
      });
    } else {
      dialog.getOpenAnimation = () => ({
        dialog: [
          [
            [
              { opacity: 0, transform: 'scale(0.97) translateY(10px)' },
              { opacity: 1, transform: 'scale(1) translateY(0)' },
            ],
            { duration: 280, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)' },
          ],
        ],
        scrim: [
          [
            [
              { opacity: 0, backdropFilter: 'blur(0px)' },
              { opacity: 0.32, backdropFilter: 'blur(6px)' },
            ],
            { duration: 280, easing: 'linear' },
          ],
        ],
      });

      dialog.getCloseAnimation = () => ({
        dialog: [
          [
            [
              { opacity: 1, transform: 'scale(1) translateY(0)' },
              { opacity: 0, transform: 'scale(0.97) translateY(8px)' },
            ],
            { duration: 200, easing: 'cubic-bezier(0.3, 0, 0.8, 0.15)' },
          ],
        ],
        scrim: [
          [
            [
              { opacity: 0.32, backdropFilter: 'blur(6px)' },
              { opacity: 0, backdropFilter: 'blur(0px)' },
            ],
            { duration: 200, easing: 'linear' },
          ],
        ],
      });
    }

    if (dialog.shadowRoot) {
      const styleId = 'apip-auth-dialog-scrim-blur';
      if (!dialog.shadowRoot.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .scrim {
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            pointer-events: auto;
          }
          dialog {
            margin: auto !important;
            position: fixed !important;
            inset: 0 !important;
          }
        `;
        dialog.shadowRoot.appendChild(style);
      }
    }
  }, []);

  // Dialog imperative show/close syncing
  const intendedOpenRef = useRef(open);
  intendedOpenRef.current = open;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      void dialog.show();
    } else if (!open && dialog.open) {
      void dialog.close();
      if (lastActiveElement.current && typeof lastActiveElement.current.focus === 'function') {
        try {
          lastActiveElement.current.focus({ preventScroll: true });
        } catch {
          // ignore focus error
        }
      }
    }
  }, [open]);

  // Dialog event listeners for native close & escape
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      if (busy) {
        e.preventDefault();
        return;
      }
    };

    const handleClosed = () => {
      if (intendedOpenRef.current) {
        if (open) {
          onClose();
        } else {
          void dialog.show();
        }
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('closed', handleClosed);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('closed', handleClosed);
    };
  }, [busy, open, onClose]);

  // Check Google OAuth availability on hosted project
  useEffect(() => {
    if (!accountClient) {
      setNotice({
        type: 'info',
        message: 'Authentication service is not configured. Please supply Supabase environment keys.',
      });
      return;
    }
    if (accountClient.kind !== 'supabase') {
      setGoogleEnabled(false);
      return;
    }
    const controller = new AbortController();
    const url = String(import.meta.env.VITE_SUPABASE_URL || '');
    const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
    if (!url || !key) return;

    fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((settings) => setGoogleEnabled(settings.external?.google === true))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  // Post-authentication redirect and session handling
  useEffect(() => {
    if (open && user && ready && portalReady && portal !== 'unknown' && !busy && mode !== 'reset') {
      const task = requestedTask ?? sessionStorage.getItem('apip.account.continue');
      sessionStorage.removeItem('apip.account.continue');
      const destination = sessionStorage.getItem('apip.account.return');
      sessionStorage.removeItem('apip.account.return');

      const rawDest = destination ? destination.replace(/^(\/#|#)/, '') : '';
      const validCustomDest =
        rawDest &&
        (isSpecialist
          ? /^(?:\/specialist(?:\/(?:profile|home|reviews))?|\/admin\/specialist-applications(?:\/[0-9a-f-]{36})?|\/account\/profile)$/i
          : /^(?:\/patient\/home|\/account\/profile|\/patient\/adr\/cases(?:\/[0-9a-f-]{36}(?:\/history|\/revisions\/[1-9][0-9]{0,2})?)?|\/preview\/(?:adr-report|medassist)(?:\?case=[0-9a-f-]{36})?)$/i
        ).test(rawDest);

      const target = portal === 'specialist' ? '/specialist' : validCustomDest && !rawDest.startsWith('/specialist') ? rawDest : accountDestination(task);

      // Do NOT call onClose() here: onClose triggers history pop/fallback to landing page.
      // Simply navigate to the target route; the dialog will unmount or close via route change.
      navigatePreview(target, { replace: true });
    }
  }, [open, user?.id, ready, portal, portalReady, busy, requestedTask, isSpecialist, mode]);

  const handleCloseRequest = () => {
    const dialog = dialogRef.current;
    if (dialog && dialog.open) {
      void dialog.close();
    } else {
      onClose();
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.defaultPrevented) {
      e.preventDefault();
      void submit(e);
    }
  };

  const switchRole = (nextRole: AuthRole) => {
    setRole(nextRole);
    setNotice(null);
    const basePath =
      mode === 'signup' ? '/sign-up/' : mode === 'forgot' ? '/forgot-password/' : '/sign-in/';
    navigatePreview(`${basePath}${nextRole}`, { replace: true });
  };

  const switchMode = (nextMode: AuthMode) => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setMode(nextMode);
    setNotice(null);
    let path = '/sign-in/' + role;
    if (nextMode === 'signup') path = '/sign-up/' + role;
    else if (nextMode === 'forgot') path = '/forgot-password/' + role;
    else if (nextMode === 'reset') path = '/reset-password';
    navigatePreview(path, { replace: true });
  };

  const validate = () => {
    if (mode === 'reset') {
      if (!password) {
        setNotice({ type: 'error', message: 'Please enter your new password.' });
        return false;
      }
      if (password.length < 12) {
        setNotice({ type: 'error', message: 'Password must be at least 12 characters long.' });
        return false;
      }
      if (password !== confirmPassword) {
        setNotice({ type: 'error', message: 'Passwords do not match.' });
        return false;
      }
      return true;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setNotice({ type: 'error', message: 'Please enter a valid email address.' });
      return false;
    }
    if (mode === 'forgot') return true;

    if (!password) {
      setNotice({ type: 'error', message: 'Please enter your password.' });
      return false;
    }
    if (mode === 'signup' && password.length < 12) {
      setNotice({ type: 'error', message: 'Password must be at least 12 characters long.' });
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

    const previousReturn = mode === 'signup' ? sessionStorage.getItem('apip.account.return') : null;
    const previousPendingReturn = mode === 'signup' || mode === 'forgot' ? readPendingAuthReturn(false) : null;
    try {
      if (mode === 'signup') {
        const signupDestination = isSpecialist ? '/specialist/profile' : accountDestination(requestedTask);
        sessionStorage.setItem('apip.account.return', signupDestination);
        savePendingAuthReturn(signupDestination, role);
        const verifyNeeded = await accountClient.signUp(email.trim(), password, isSpecialist ? 'SPECIALIST' : 'PATIENT');
        setPassword('');
        if (verifyNeeded) {
          setVerifyEmailSent(true);
        } else {
          clearPendingAuthReturn();
          setNotice({ type: 'success', message: 'Account created! Opening your dashboard…' });
          navigatePreview(signupDestination, { replace: true });
        }
      } else if (mode === 'signin') {
        await accountClient.signIn(email.trim(), password, isSpecialist ? 'SPECIALIST' : 'PATIENT');
        setPassword('');
        setNotice({ type: 'success', message: 'Signed in. Opening your dashboard…' });
      } else if (mode === 'forgot') {
        if (accountClient.kind === 'local') {
          setNotice({
            type: 'info',
            message: 'Password reset via email requires cloud mode with Supabase Auth. In local development, accounts are stored in the local database.',
          });
          setBusy(false);
          return;
        }
        savePendingAuthReturn(isSpecialist ? '/specialist' : '/patient/home', role);
        if (accountClient.resetPassword) {
          await accountClient.resetPassword(email.trim());
        }
        setNotice({
          type: 'success',
          message: 'If an account exists for this email, password reset instructions have been sent.',
        });
      } else if (mode === 'reset') {
        if (!user) {
          setNotice({
            type: 'error',
            message: 'Your password reset link is missing or has expired. Request a new reset link to continue.',
          });
          return;
        }
        if (accountClient.updatePassword) {
          await accountClient.updatePassword(password);
          setPassword('');
          setConfirmPassword('');
          const pending = readPendingAuthReturn(true);
          if (pending) {
            try {
              sessionStorage.setItem('apip.account.return', pending.path);
              sessionStorage.setItem('apip.last.role', pending.role);
            } catch {
              // ignore storage access errors
            }
          }
          const targetRole = pending?.role ?? role;
          setRole(targetRole);
          setNotice({ type: 'success', message: 'Password updated successfully! Opening your workspace…' });
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
          resetTimerRef.current = setTimeout(() => {
            resetTimerRef.current = null;
            setMode('signin');
            navigatePreview('/sign-in/' + targetRole, { replace: true });
          }, 1500);
        }
      }
    } catch (err: unknown) {
      if (mode === 'signup') {
        if (previousReturn === null) sessionStorage.removeItem('apip.account.return');
        else sessionStorage.setItem('apip.account.return', previousReturn);
      }
      if (mode === 'signup' || mode === 'forgot') {
        if (previousPendingReturn) savePendingAuthReturn(previousPendingReturn.path, previousPendingReturn.role);
        else clearPendingAuthReturn();
      }
      setPassword('');
      setNotice({ type: 'error', message: formatAuthError(err) });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !accountClient?.resendConfirmation || resending || busy) return;
    setResending(true);
    setNotice(null);
    try {
      savePendingAuthReturn(
        isSpecialist ? '/specialist/profile' : accountDestination(requestedTask),
        role
      );
      await accountClient.resendConfirmation(cleanEmail);
      setNotice({
        type: 'success',
        message: 'A new confirmation link has been sent if this email is awaiting verification.',
      });
    } catch (err: unknown) {
      setNotice({ type: 'error', message: formatAuthError(err) });
    } finally {
      setResending(false);
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
          message: 'Google Sign-in is not enabled on this project. Please sign in with email and password.',
        });
        submitting.current = false;
        setBusy(false);
        return;
      }
      if (requestedTask) {
        sessionStorage.setItem('apip.account.continue', requestedTask);
      } else {
        sessionStorage.removeItem('apip.account.continue');
      }
      await accountClient.google(isSpecialist ? 'specialist' : undefined);
      submitting.current = false;
      setBusy(false);
    } catch {
      setNotice({ type: 'error', message: 'Google sign-in could not be opened. Please retry or use email.' });
      submitting.current = false;
      setBusy(false);
    }
  };

  const resetChecking = mode === 'reset' && !ready;
  const resetInvalid = mode === 'reset' && ready && !user;
  const visibleAuthError =
    authError && !/profile could not be loaded/i.test(authError) ? authError : '';

  const dialogTitle =
    resetInvalid
      ? 'Password reset link expired'
      : mode === 'reset'
      ? 'Choose a new password'
      : mode === 'forgot'
      ? 'Reset your password'
      : mode === 'signup'
      ? isSpecialist
        ? 'Apply as Specialist'
        : 'Create Patient Account'
      : isSpecialist
      ? 'Specialist Sign In'
      : 'Patient Sign In';

  const subtitle =
    resetInvalid
      ? 'Your recovery link is missing, invalid, or has expired'
      : resetChecking
      ? 'Verifying your password reset link…'
      : mode === 'reset'
      ? 'Enter your new account password below'
      : mode === 'forgot'
      ? 'Enter your email to receive recovery instructions'
      : isSpecialist
      ? mode === 'signup'
        ? 'Create an account to apply for specialist verification'
        : 'Sign in to the specialist review workspace'
      : mode === 'signup'
      ? 'Start your personal, private patient workspace'
      : 'Sign in to continue to your patient workspace';

  const contextHeadline = isSpecialist ? 'Specialist Portal' : 'Welcome to APIP';
  const contextDescription = isSpecialist
    ? 'Pharmacovigilance workspace for reviewing assigned, consented reports and PvPI forms.'
    : 'A personal space to organize medicine experiences, symptoms, and sharing decisions.';

  return (
    <md-dialog
      ref={dialogRef}
      class="apip-auth-dialog"
      className="apip-auth-dialog"
      open={open || undefined}
      aria-label={dialogTitle}
      quick={matchMedia('(prefers-reduced-motion: reduce)').matches || undefined}
    >
      <div slot="content" className="apip-auth-grid">
        {/* Left Column: Product Context */}
        <section className="apip-auth-context" aria-label="APIP Context">
          <div className="apip-auth-context-top">
            <div className="apip-auth-brand-row">
              <Brand large />
            </div>
            <div className="apip-auth-symbol-container" aria-hidden="true">
              <span className="material-symbols-outlined">
                {isSpecialist ? 'clinical_notes' : 'health_and_safety'}
              </span>
            </div>
            <div>
              <h2 className="apip-auth-headline">{contextHeadline}</h2>
              <p className="apip-auth-description">{contextDescription}</p>
            </div>
          </div>

          <div className="apip-auth-context-bottom">
            <span className="apip-auth-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>science</span>
              Research Prototype
            </span>
            <p className="apip-auth-prototype-note">
              Use fictional data. Reports are not automatically submitted to national pharmacovigilance authorities.
            </p>
          </div>
        </section>

        {/* Right Column: Authentication Pane */}
        <section className="apip-auth-form-pane" aria-labelledby="apip-auth-title-id">
          {verifyEmailSent ? (
            <div className="apip-auth-verification-pane" role="region" aria-label="Email verification">
              <div className="apip-auth-symbol-container" aria-hidden="true">
                <span className="material-symbols-outlined">mark_email_read</span>
              </div>
              <h2 className="apip-auth-title">Check your email</h2>
              <p className="apip-auth-subtitle">
                We sent a confirmation link to <strong>{email}</strong>.
              </p>
              <p className="apip-auth-description" style={{ textAlign: 'center' }}>
                Open the link in your email to confirm your account and access{' '}
                {isSpecialist ? 'the specialist workspace' : 'your patient dashboard'}.
              </p>
              {notice && (
                <div
                  role={notice.type === 'error' ? 'alert' : 'status'}
                  className={`apip-auth-notice ${notice.type}`}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {notice.type === 'success' ? 'check_circle' : notice.type === 'info' ? 'info' : 'error'}
                  </span>
                  <span>{notice.message}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                {accountClient?.resendConfirmation && email.trim() && (
                  <M3Button
                    variant="outlined"
                    disabled={resending || busy}
                    onClick={() => void handleResend()}
                  >
                    {resending ? 'Sending…' : 'Resend confirmation email'}
                  </M3Button>
                )}
                <M3Button
                  variant="filled"
                  onClick={() => {
                    setVerifyEmailSent(false);
                    switchMode('signin');
                  }}
                >
                  Back to sign in
                </M3Button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Bar with Role Switcher & Close Button */}
              <div className="apip-auth-top-bar">
                {mode !== 'reset' && (
                  <div className="apip-auth-role-switch" role="tablist" aria-label="Select role">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!isSpecialist}
                      aria-label="Patient workspace"
                      disabled={busy || undefined}
                      className={`apip-auth-role-tab ${!isSpecialist ? 'active' : ''}`}
                      onClick={() => switchRole('patient')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                        person
                      </span>
                      Patient
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isSpecialist}
                      aria-label="Specialist workspace"
                      disabled={busy || undefined}
                      className={`apip-auth-role-tab ${isSpecialist ? 'active' : ''}`}
                      onClick={() => switchRole('specialist')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                        clinical_notes
                      </span>
                      Specialist
                    </button>
                  </div>
                )}

                <md-icon-button
                  class="apip-auth-close-button"
                  className="apip-auth-close-button"
                  aria-label="Close authentication dialog"
                  disabled={busy || undefined}
                  onClick={handleCloseRequest}
                >
                  <md-icon>
                    <span className="material-symbols-outlined">close</span>
                  </md-icon>
                </md-icon-button>
              </div>

              {/* Form Heading */}
              <div className="apip-auth-form-heading">
                <h1 id="apip-auth-title-id" className="apip-auth-title">{dialogTitle}</h1>
                <p className="apip-auth-subtitle">{subtitle}</p>
              </div>

              {/* Notice / Alert Banner */}
              {(notice || visibleAuthError) && (
                <div
                  role={notice?.type === 'error' || (!notice && visibleAuthError) ? 'alert' : 'status'}
                  className={`apip-auth-notice ${notice?.type ?? 'error'}`}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {notice?.type === 'success'
                      ? 'check_circle'
                      : notice?.type === 'info'
                      ? 'info'
                      : 'error'}
                  </span>
                  <span>{notice?.message ?? visibleAuthError}</span>
                </div>
              )}
              {mode === 'signin' &&
                accountClient?.resendConfirmation &&
                notice?.type === 'error' &&
                /confirm your email/i.test(notice.message) &&
                email.trim() && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                    <M3Button
                      variant="outlined"
                      disabled={resending || busy}
                      onClick={() => void handleResend()}
                    >
                      {resending ? 'Sending…' : 'Resend confirmation email'}
                    </M3Button>
                  </div>
                )}

              {/* Google OAuth (only for signin and signup) */}
              {(mode === 'signin' || mode === 'signup') && (
                <>
                  <M3Button
                    variant="outlined"
                    leadingIcon={
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    }
                    className="apip-auth-google-btn"
                    disabled={busy || !accountClient || googleEnabled === false}
                    onClick={() => void handleGoogle()}
                    ariaLabel="Continue with Google"
                  >
                    Continue with Google
                  </M3Button>
                  {googleEnabled === false && (
                    <p className="apip-auth-prototype-note" style={{ textAlign: 'center', marginTop: '4px', marginBottom: '8px' }}>
                      Google sign-in is not enabled on this environment. Please sign in with email and password.
                    </p>
                  )}

                  <div className="apip-auth-divider">
                    <span>or with email</span>
                  </div>
                </>
              )}

              {resetChecking ? (
                <p role="status" className="apip-auth-subtitle">Verifying your password reset link…</p>
              ) : resetInvalid ? (
                <div className="apip-auth-form" role="region" aria-label="Password reset link unavailable">
                  {!notice && !visibleAuthError && (
                    <div role="alert" className="apip-auth-notice error">
                      <span className="material-symbols-outlined" aria-hidden="true">error</span>
                      <span>
                        This password reset link is missing, invalid, or has expired. Request a new reset link to continue.
                      </span>
                    </div>
                  )}
                  <div className="apip-auth-submit-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <M3Button
                      variant="filled"
                      className="apip-auth-submit-btn"
                      onClick={() => switchMode('forgot')}
                    >
                      Request a new reset link
                    </M3Button>
                    <M3Button
                      variant="outlined"
                      className="apip-auth-submit-btn"
                      onClick={() => switchMode('signin')}
                    >
                      Back to sign in
                    </M3Button>
                  </div>
                </div>
              ) : (
              /* Main Credentials Form */
              <form onSubmit={submit} onKeyDown={handleFormKeyDown} noValidate className="apip-auth-form">
                {mode !== 'reset' && (
                  <div className="apip-auth-field-wrapper">
                    <M3TextField
                      label="Email"
                      type="email"
                      autoComplete={mode === 'signup' ? 'email' : 'username'}
                      value={email}
                      required
                      disabled={busy || !accountClient}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setNotice(null);
                      }}
                    />
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div className="apip-auth-field-wrapper">
                    <M3TextField
                      label={mode === 'reset' ? 'New password' : 'Password'}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signup' || mode === 'reset' ? 'new-password' : 'current-password'}
                      value={password}
                      required
                      disabled={busy || !accountClient}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setNotice(null);
                      }}
                    />
                    <button
                      type="button"
                      className="apip-auth-pw-toggle"
                      disabled={busy}
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                    {mode === 'signup' && (
                      <span className="apip-auth-helper">Minimum 12 characters</span>
                    )}
                  </div>
                )}

                {mode === 'reset' && (
                  <div className="apip-auth-field-wrapper">
                    <M3TextField
                      label="Confirm new password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      required
                      disabled={busy || !accountClient}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setNotice(null);
                      }}
                    />
                  </div>
                )}

                {/* Forgot password link */}
                {mode === 'signin' && (
                  <div className="apip-auth-forgot-row">
                    <button
                      type="button"
                      className="apip-auth-text-btn"
                      onClick={() => switchMode('forgot')}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Specialist signup informational note */}
                {mode === 'signup' && isSpecialist && (
                  <div className="apip-auth-specialist-note">
                    <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
                    <span>
                      Professional verification credentials will be reviewed following account creation.
                    </span>
                  </div>
                )}

                {/* Primary Submit Button */}
                <div className="apip-auth-submit-row">
                  <M3Button
                    type="submit"
                    variant="filled"
                    disabled={busy || !accountClient}
                    onClick={(e) => void submit(e)}
                    className="apip-auth-submit-btn"
                  >
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
              )}

              {/* Footer Switcher */}
              <div className="apip-auth-footer">
                {mode === 'signin' && (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="apip-auth-text-btn"
                      onClick={() => switchMode('signup')}
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
                      className="apip-auth-text-btn"
                      onClick={() => switchMode('signin')}
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
                      className="apip-auth-text-btn"
                      onClick={() => switchMode('signin')}
                    >
                      Back to sign in
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </md-dialog>
  );
}
