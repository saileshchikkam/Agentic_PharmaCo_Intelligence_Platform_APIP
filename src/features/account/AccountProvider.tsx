import React, { createContext, useContext, useEffect, useState } from 'react';
import { accountClient, type AccountUser } from './client';
import type { PatientProfile } from './profile';

interface AccountState {
  user: AccountUser | null; profile: PatientProfile | null; ready: boolean; error: string;
  reload: () => void; signOut: () => Promise<void>;
}
const Context = createContext<AccountState | null>(null);
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [ready, setReady] = useState(!accountClient);
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  const [authReady, setAuthReady] = useState(!accountClient);
  const [authError, setAuthError] = useState('');
  useEffect(() => {
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
      setUser(null); setProfile(null);
    } catch { setError('Sign-out failed. Please retry.'); }
  };
  return <Context.Provider value={{ user, profile: profile?.user_id === user?.id ? profile : null,
    ready: ready && authReady, error: authError || error, reload: () => setGeneration(v => v + 1), signOut }}>{children}</Context.Provider>;
}
export function useAccount() {
  const value = useContext(Context);
  if (!value) throw new Error('AccountProvider is required');
  return value;
}
