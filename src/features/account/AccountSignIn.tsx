import { accountDestination } from './authCallback';
import React, { useEffect, useState } from 'react';
import { M3Button, M3TextField } from '../../components/material/core';
import { accountClient } from './client';
import { useAccount } from './AccountProvider';
import { navigatePreview } from '../access/navigation';
import './account.css';

export function AccountSignIn({ creatingInitially = false, requestedTask, workspace }: { creatingInitially?: boolean; requestedTask?: string; workspace?:'specialist' }) {
  const { user, ready, error } = useAccount();
  const creating = creatingInitially;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [googleEnabled,setGoogleEnabled]=useState<boolean|null>(null);
  useEffect(()=>{if(accountClient?.kind!=='supabase')return;const controller=new AbortController();void fetch(String(import.meta.env.VITE_SUPABASE_URL)+'/auth/v1/settings',{headers:{apikey:String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)},signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then(settings=>setGoogleEnabled(settings.external?.google===true)).catch(()=>{});return()=>controller.abort();},[]);
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setNotice('Enter a valid email address and password.'); return;
    }
    setBusy(true); setNotice('');
    try {
      const verifyEmail = creating ? await accountClient.signUp(email.trim(), password)
        : (await accountClient.signIn(email.trim(), password), false);
      setPassword('');
      setNotice(verifyEmail ? 'Check your email to confirm your account, then sign in to complete your profile.' : 'Signed in. Opening your dashboard…');
    } catch { setPassword(''); setNotice('Unable to complete this request. Check your details or try again later.'); }
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
    {accountClient?.kind === 'local' ? <p className="account-notice">Local development account · saved on this computer. Use a fictional email and a separate test password. No email verification or recovery service is connected.</p> : <><M3Button variant="outlined" disabled={!accountClient || busy || googleEnabled===false} onClick={() => void google()}>Continue with Google</M3Button>{googleEnabled===false&&<p role="status">Google sign-in is not enabled for this environment yet. Please use your email address.</p>}<p className="account-divider">or use email</p></>}
    {error && <p role="alert">{error}</p>}
    <M3TextField label="Email address" type="email" autoComplete={creating ? 'email' : 'username'} value={email} required disabled={busy || !accountClient} onChange={e => setEmail(e.target.value)} />
    <M3TextField label="Password" type={showPassword ? 'text' : 'password'} autoComplete={creating ? 'new-password' : 'current-password'} value={password} required disabled={busy || !accountClient} onChange={e => setPassword(e.target.value)} />
    <M3Button variant="text" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide password' : 'Show password'}</M3Button>
    <div className="account-actions"><M3Button type="submit" loading={busy} disabled={!accountClient}>{creating ? 'Create account' : 'Sign in'}</M3Button>
      <M3Button variant="text" disabled={busy} onClick={() => navigatePreview((creating?'/sign-in/':'/sign-up/')+(workspace==='specialist'?'specialist':'patient')+(requestedTask?'?continue='+encodeURIComponent(requestedTask):''))}>{creating ? 'Use an existing account' : 'Create account'}</M3Button></div>
    {accountClient?.kind === 'supabase' && <p>Confirm your email after creating an account. For password recovery, contact your APIP account administrator.</p>}
    {notice && <p role="status">{notice}</p>}
    <a className="access-text-link" href="#/account/profile" onClick={e => { e.preventDefault(); navigatePreview('/account/profile'); }}>Explore the profile layout</a>
    <a className="access-text-link" href="#/patient/home" onClick={e => { e.preventDefault(); navigatePreview('/patient/home'); }}>Continue to fictional previews</a>
  </form>;
}
