import React, { createContext, useContext, useEffect, useState } from 'react';
import { accountClient, guidedAccountHeaders, type AccountUser } from './client';
import { clearPendingAuthReturn } from './authCallback';
import type { PatientProfile } from './profile';

interface AccountState {
  user: AccountUser | null; profile: PatientProfile | null; ready: boolean; error: string;
  portal: 'patient' | 'specialist' | 'unknown'; portalReady: boolean;
  reload: () => void; signOut: () => Promise<void>;
  invalidateSession: (owner?: string, message?: string) => Promise<void>;
}
const Context = createContext<AccountState | null>(null);
function clearLegacyBrowserDrafts() {
  try {
    window.localStorage.removeItem('apip.fictionalAdrDraft.v1');
    window.localStorage.removeItem('apip.fictionalAdrDraft.v2');
    window.localStorage.removeItem('apip.fictionalAdrDrafts.v1');
  } catch {
    // ignore storage access errors
  }
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [ready, setReady] = useState(!accountClient);
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  const [authReady, setAuthReady] = useState(!accountClient);
  const [authError, setAuthError] = useState('');
  const [portal,setPortal]=useState<'patient'|'specialist'|'unknown'>('unknown');
  const [portalReady,setPortalReady]=useState(false);
  useEffect(()=>{
    if(!user){setPortal('unknown');setPortalReady(true);return;}
    let cancelled=false;setPortal('unknown');setPortalReady(false);
    void (async()=>{try{
      const headers=await guidedAccountHeaders(user.id);
      const response=await fetch('/api/account/capabilities',{headers,cache:'no-store'});
      if(!response.ok)throw Error('PORTAL_UNAVAILABLE');
      const c=await response.json();
      if(!cancelled){setPortal(c.accountRole==='SPECIALIST'?'specialist':c.accountRole==='PATIENT'?'patient':'unknown');setPortalReady(true);}
    }catch{if(!cancelled){setPortal('unknown');setPortalReady(true);}}})();
    return()=>{cancelled=true;};
  },[user?.id]);
  useEffect(() => {
    try {
      sessionStorage.removeItem('apip.guest.role');
    } catch {
      // ignore storage access errors
    }
    if (accountClient?.kind === 'supabase') clearLegacyBrowserDrafts();
    if (!accountClient) return;
    let disposed = false;
    const unsubscribe = accountClient.subscribe((user, message) => {
      if (disposed) return;
      setUser(user); setAuthError(message ?? ''); setAuthReady(true);
    });
    return () => { disposed = true; unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!accountClient) return;
    let disposed = false;
    setProfile(null); setError(''); setReady(false);
    if (!user) { setReady(true); return; }
    void accountClient.readProfile(user.id).then(data => {
      if (disposed) return;
      setProfile(data);
      setReady(true);
    }, () => {
      if (disposed) return;
      setError('Your profile could not be loaded. Retry before using saved information.');
      setReady(true);
    });
    return () => { disposed = true; };
  }, [user?.id, generation]);
  const signOut = async () => {
    if (!accountClient) return;
    try {
      await accountClient.signOut();
      sessionStorage.removeItem('apip.account.continue');
      sessionStorage.removeItem('apip.account.return');
      sessionStorage.removeItem('apip.last.role');
      clearPendingAuthReturn();
      clearLegacyBrowserDrafts();
      setUser(null); setProfile(null);
    } catch { setError('Sign-out failed. Please retry.'); }
  };
  const invalidateSession = async (owner?: string, message?: string) => {
    if (!accountClient?.invalidateSession) return;
    await accountClient.invalidateSession(owner, message);
  };
  return <Context.Provider value={{ user, portal, portalReady, profile: profile?.user_id === user?.id ? profile : null,
    ready: ready && authReady, error: authError || error, reload: () => setGeneration(v => v + 1), signOut, invalidateSession }}>{children}</Context.Provider>;
}
export function useAccount() {
  const value = useContext(Context);
  if (!value) throw new Error('AccountProvider is required');
  return value;
}
