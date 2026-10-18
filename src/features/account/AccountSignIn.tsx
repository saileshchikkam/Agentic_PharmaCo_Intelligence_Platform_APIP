import React, { useEffect, useState } from 'react';
import { M3Button, M3TextField } from '../../components/material/core';
import { accountClient } from './client';
import { useAccount } from './AccountProvider';
import { navigatePreview } from '../access/navigation';
import './account.css';

export function AccountSignIn({ requestedTask }: { requestedTask?: string }) {
  const { user, ready } = useAccount();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (requestedTask === 'medassist' || requestedTask === 'adr-report') sessionStorage.setItem('apip.account.continue', requestedTask);
    if (user && ready) navigatePreview(`/account/profile${requestedTask ? `?continue=${requestedTask}` : ''}`);
  }, [user?.id, ready, requestedTask]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountClient) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password || (creating && password.length < 12)) {
      setNotice('Enter a valid email and password. New passwords must have at least 12 characters.'); return;
    }
    setBusy(true); setNotice('');
    try {
      const result = creating
        ? await accountClient.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${location.origin}/#/account/profile` } })
        : await accountClient.auth.signInWithPassword({ email: email.trim(), password });
      setPassword('');
      setNotice(result.error ? 'Unable to complete sign-in. Check your details, email verification and service configuration.'
        : creating && !result.data.session ? 'Check your email to confirm your account, then sign in to complete your profile.' : 'Signed in. Opening your profile…');
    } catch { setNotice('The account service is unavailable. Please retry.'); }
    finally { setBusy(false); }
  };
  const google = async () => {
    if (!accountClient) return;
    setBusy(true);
    try {
      const { error } = await accountClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/#/account/profile` } });
      if (error) setNotice('Google sign-in is unavailable. Check the provider configuration or use email.');
    } catch { setNotice('Google sign-in could not be opened. Please retry.'); }
    finally { setBusy(false); }
  };
  return <form className="access-form" onSubmit={submit} noValidate>
    <h2>{creating ? 'Create your account' : 'Welcome back'}</h2>
    <p>One account for MedAssist and ADR reporting. Complete your health profile after verifying your sign-in.</p>
    {!accountClient && <p className="account-notice" role="status">Account service not connected. You can explore the profile layout, but nothing can be saved or uploaded.</p>}
    <M3Button variant="outlined" disabled={!accountClient || busy} onClick={() => void google()}>Continue with Google</M3Button>
    <p className="account-divider">or use email</p>
    <M3TextField label="Email address" type="email" autoComplete="email" value={email} required disabled={busy || !accountClient} onChange={e => setEmail(e.target.value)} />
    <M3TextField label="Password" type="password" autoComplete={creating ? 'new-password' : 'current-password'} value={password} required disabled={busy || !accountClient} onChange={e => setPassword(e.target.value)} supportingText={creating ? 'At least 12 characters.' : undefined} />
    <div className="account-actions"><M3Button type="submit" loading={busy} disabled={!accountClient}>{creating ? 'Create account' : 'Sign in'}</M3Button>
      <M3Button variant="text" disabled={busy} onClick={() => { setCreating(v => !v); setPassword(''); setNotice(''); }}>{creating ? 'Use an existing account' : 'Create account'}</M3Button></div>
    {notice && <p role="status">{notice}</p>}
    <a className="access-text-link" href="#/account/profile" onClick={e => { e.preventDefault(); navigatePreview('/account/profile'); }}>Explore the profile layout</a>
    <a className="access-text-link" href="#/patient/home" onClick={e => { e.preventDefault(); navigatePreview('/patient/home'); }}>Continue to fictional previews</a>
  </form>;
}
