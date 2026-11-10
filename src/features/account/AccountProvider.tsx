import React, { createContext, useContext, useEffect, useState } from 'react';
import { accountClient, type AccountUser } from './client';
import type { PatientProfile } from './profile';

export const GUEST_PATIENT: AccountUser = { id: 'fictional-patient-preview', email: 'patient.preview@apip.local' };
export const GUEST_PATIENT_PROFILE: PatientProfile = {
  user_id: 'fictional-patient-preview',
  revision: 1,
  display_name: 'Fictional Patient (Demo)',
  birth_date: '1990-05-12',
  relationship: 'self',
  conditions: 'Seasonal Allergies',
  surgeries: null,
  medicines: 'Cetirizine 10mg PRN',
  allergies: 'Penicillin (suspected rash)',
  history_notes: 'Demonstration account for academic review',
  share_medassist: true,
  share_adr: true,
  updated_at: new Date().toISOString()
};

export const GUEST_SPECIALIST: AccountUser = { id: 'fictional-specialist-preview', email: 'specialist.preview@apip.local' };
export const GUEST_SPECIALIST_PROFILE: PatientProfile = {
  user_id: 'fictional-specialist-preview',
  revision: 1,
  display_name: 'Dr. Mahesh P (Specialist Reviewer)',
  birth_date: '1982-11-20',
  relationship: 'self',
  conditions: null,
  surgeries: null,
  medicines: null,
  allergies: null,
  history_notes: 'Demonstration specialist reviewer',
  share_medassist: true,
  share_adr: true,
  updated_at: new Date().toISOString()
};

export interface AccountState {
  user: AccountUser | null;
  profile: PatientProfile | null;
  ready: boolean;
  error: string;
  isGuest: boolean;
  setGuestRole: (role: 'patient' | 'specialist' | null) => void;
  reload: () => void;
  signOut: () => Promise<void>;
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
  const [guestRole, setGuestRoleState] = useState<'patient' | 'specialist' | null>(() => {
    const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('apip.guest.role') : null;
    if (saved === 'patient' || saved === 'specialist') return saved;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.startsWith('#/specialist')) return 'specialist';
    if (hash.startsWith('#/patient') || hash.startsWith('#/preview/adr-report')) return 'patient';
    return null;
  });

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

  const setGuestRole = (role: 'patient' | 'specialist' | null) => {
    if (role) {
      sessionStorage.setItem('apip.guest.role', role);
    } else {
      sessionStorage.removeItem('apip.guest.role');
    }
    setGuestRoleState(role);
  };

  const signOut = async () => {
    sessionStorage.removeItem('apip.guest.role');
    setGuestRoleState(null);
    if (!accountClient) return;
    try {
      await accountClient.signOut();
      sessionStorage.removeItem('apip.account.continue');
      sessionStorage.removeItem('apip.account.return');
      setUser(null); setProfile(null);
    } catch { setError('Sign-out failed. Please retry.'); }
  };

  const effectiveUser = user ?? (guestRole === 'specialist' ? GUEST_SPECIALIST : guestRole === 'patient' ? GUEST_PATIENT : null);
  const effectiveProfile = profile?.user_id === user?.id
    ? profile
    : guestRole === 'specialist' ? GUEST_SPECIALIST_PROFILE : guestRole === 'patient' ? GUEST_PATIENT_PROFILE : null;

  return <Context.Provider value={{
    user: effectiveUser,
    profile: effectiveProfile,
    ready: ready && authReady,
    error: authError || error,
    isGuest: !user && Boolean(guestRole),
    setGuestRole,
    reload: () => setGeneration(v => v + 1),
    signOut,
  }}>{children}</Context.Provider>;
}

export function useAccount() {
  const value = useContext(Context);
  if (!value) throw new Error('AccountProvider is required');
  return value;
}
