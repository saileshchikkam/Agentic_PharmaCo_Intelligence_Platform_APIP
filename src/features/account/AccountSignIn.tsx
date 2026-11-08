import { accountDestination } from './authCallback';
import React, { useEffect, useState } from 'react';
import { M3Button, M3TextField } from '../../components/material/core';
import { accountClient } from './client';
import { useAccount } from './AccountProvider';
import { navigatePreview } from '../access/navigation';
import './account.css';

export function AccountSignIn({ creatingInitially = false, requestedTask, workspace }: { creatingInitially?: boolean; requestedTask?: string; workspace?:'specialist' }) {
  const { user, ready, error } = useAccount();
  const [creating, setCreating] = useState(creatingInitially);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (user && ready) {
      const task = requestedTask ?? sessionStorage.getItem('apip.account.continue');
      sessionStorage.removeItem('apip.account.continue');
      const destination=sessionStorage.getItem('apip.account.return');
      sessionStorage.removeItem('apip.account.return');
      navigatePreview(destination&&/^(?:\/specialist(?:\/(?:profile|home|reviews))?|\/admin\/specialist-applications(?:\/[0-9a-f-]{36})?|\/patient\/adr\/cases(?:\/[0-9a-f-]{36}(?:\/history|\/revisions\/[1-9][0-9]{0,2})?)?|\/preview\/adr-report\?case=[0-9a-f-]{36})$/i.test(destination)
        ?destination:workspace==='specialist'?'/specialist':accountDestination(task), { replace: true });
    }
  }, [user?.id, ready, requestedTask]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountClient) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password || (creating && password.length < 12)) {
      setNotice('Enter a valid email and password. New passwords must have at least 12 characters.'); return;
    }
    setBusy(true); setNotice('');
    try {
      const verifyEmail = creating ? await accountClient.signUp(email.trim(), password)
        : (await accountClient.signIn(email.trim(), password), false);
      setPassword('');
      setNotice(verifyEmail ? 'Check your email to confirm your account, then sign in to complete your profile.' : 'Signed in. Opening your dashboard…');
    } catch { setPassword(''); setNotice('Unable to complete sign-in. Check your details or try again later. New passwords must have at least 12 characters.'); }
    finally { setBusy(false); }
  };
  const google = async () => {
    if (!accountClient) return;
    setBusy(true);
    try {
      if (requestedTask) sessionStorage.setItem('apip.account.continue', requestedTask);
      else sessionStorage.removeItem('apip.account.continue');
      await accountClient.google();
    } catch { setNotice('Google sign-in could not be opened. Please retry.'); }
    finally { setBusy(false); }
  };
  return <form className="access-form" onSubmit={submit} noValidate>
    <h2>{creating ? 'Create your account' : 'Welcome back'}</h2>
    <p>One account for MedAssist and ADR reporting. Choose a service from your dashboard after signing in.</p>
    {!accountClient && <p className="account-notice" role="status">Account service not connected. You can explore the profile layout, but nothing can be saved or uploaded.</p>}
    {accountClient?.kind === 'local' ? <p className="account-notice">Local development account · saved on this computer. Use a fictional email and a separate test password. No email verification or recovery service is connected.</p> : <><M3Button variant="outlined" disabled={!accountClient || busy} onClick={() => void google()}>Continue with Google</M3Button><p className="account-divider">or use email</p></>}
    {error && <p role="alert">{error}</p>}
    <M3TextField label="Email address" type="email" autoComplete="email" value={email} required disabled={busy || !accountClient} onChange={e => setEmail(e.target.value)} />
    <M3TextField label="Password" type="password" autoComplete={creating ? 'new-password' : 'current-password'} value={password} required disabled={busy || !accountClient} onChange={e => setPassword(e.target.value)} supportingText={creating ? 'At least 12 characters.' : undefined} />
    <div className="account-actions"><M3Button type="submit" loading={busy} disabled={!accountClient}>{creating ? 'Create account' : 'Sign in'}</M3Button>
      <M3Button variant="text" disabled={busy} onClick={() => { setCreating(v => !v); setPassword(''); setNotice(''); }}>{creating ? 'Use an existing account' : 'Create account'}</M3Button></div>
    {accountClient?.kind === 'supabase' && <p>Confirm your email after creating an account. For password recovery, contact your APIP account administrator.</p>}
    {notice && <p role="status">{notice}</p>}
    <a className="access-text-link" href="#/account/profile" onClick={e => { e.preventDefault(); navigatePreview('/account/profile'); }}>Explore the profile layout</a>
    <a className="access-text-link" href="#/patient/home" onClick={e => { e.preventDefault(); navigatePreview('/patient/home'); }}>Continue to fictional previews</a>
  </form>;
}
