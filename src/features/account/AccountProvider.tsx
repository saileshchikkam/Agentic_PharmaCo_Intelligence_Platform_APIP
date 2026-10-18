import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { accountClient } from './client';
import type { PatientProfile } from './profile';

interface AccountState {
  user: User | null; profile: PatientProfile | null; ready: boolean; error: string;
  reload: () => void; signOut: () => Promise<void>;
}
const Context = createContext<AccountState | null>(null);
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [ready, setReady] = useState(!accountClient);
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (!accountClient) return;
    let disposed = false;
    const { data } = accountClient.auth.onAuthStateChange((_event, session) => {
      if (disposed) return;
      setUser(session?.user ?? null);
    });
    return () => { disposed = true; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!accountClient) return;
    let disposed = false;
    setProfile(null); setError(''); setReady(false);
    if (!user) { setReady(true); return; }
    void accountClient.from('patient_profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data, error }) => {
      if (disposed) return;
      if (error) setError('Your profile could not be loaded. Retry before using saved information.');
      else setProfile(data as PatientProfile | null);
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
      const { error } = await accountClient.auth.signOut({ scope: 'local' });
      if (error) { setError('Sign-out failed. Please retry.'); return; }
      sessionStorage.removeItem('apip.account.continue');
      setUser(null); setProfile(null);
    } catch { setError('Sign-out failed. Please retry.'); }
  };
  return <Context.Provider value={{ user, profile: profile?.user_id === user?.id ? profile : null,
    ready, error, reload: () => setGeneration(v => v + 1), signOut }}>{children}</Context.Provider>;
}
export function useAccount() {
  const value = useContext(Context);
  if (!value) throw new Error('AccountProvider is required');
  return value;
}
