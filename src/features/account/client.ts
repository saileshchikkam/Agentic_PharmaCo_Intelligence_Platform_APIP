import { createClient } from '@supabase/supabase-js';
import type { PatientProfile, ProfileInput } from './profile';
import { readAccountDraft, type AccountDraftRepository } from '../adr/accountDraft';

export type AccountUser = { id: string; email?: string };
interface AccountClient {
  kind: 'local' | 'supabase';
  drafts?: AccountDraftRepository;
  subscribe: (listener: (user: AccountUser | null, error?: string) => void) => () => void;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  google: () => Promise<void>;
  signOut: () => Promise<void>;
  readProfile: (userId: string) => Promise<PatientProfile | null>;
  saveProfile: (userId: string, profile: ProfileInput, revision: number | null) => Promise<PatientProfile>;
  deleteProfile: (userId: string, revision: number) => Promise<void>;
}

function localClient(): AccountClient {
  const listeners = new Set<(user: AccountUser | null, error?: string) => void>();
  let epoch = 0;
  const emit = (user: AccountUser | null, error?: string) => listeners.forEach(listener => listener(user, error));
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('apip.local.auth') : null;
  const request = async (path: string, body?: unknown, userId?: string) => {
    const res = await fetch(`/api/account/${path}`, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(userId ? { 'X-APIP-Account': userId } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
    });
    const result = await res.json();
    if (!res.ok) {
      if (res.status === 401 || result.error === 'ACCOUNT_CHANGED') { epoch++; emit(null); }
      throw new Error(typeof result.error === 'string' ? result.error : 'Account service unavailable');
    }
    return result;
  };
  const refresh = async () => {
    const current = epoch;
    try { const result = await request('session'); if (current === epoch) emit(result.user); }
    catch { if (current === epoch) emit(null, 'Local account service unavailable. Check the development server.'); }
  };
  const changed = (user: AccountUser | null) => { epoch++; emit(user); channel?.postMessage('changed'); };
  if (channel) channel.onmessage = () => { epoch++; emit(null); void refresh(); };
  return {
    kind: 'local',
    drafts: {
      async load(userId) {
        const result = await request('drafts', undefined, userId);
        if (!Array.isArray(result.drafts) || result.drafts.length > 200) throw new Error('INVALID_DRAFTS');
        const drafts: ReturnType<typeof readAccountDraft>[] = result.drafts.map(readAccountDraft);
        if (drafts.some(draft => !draft) || new Set(drafts.map(draft => draft!.id)).size !== drafts.length) throw new Error('INVALID_DRAFTS');
        return drafts as NonNullable<ReturnType<typeof readAccountDraft>>[];
      },
      async save(userId, draft, expectedRevision) {
        const result = await request('drafts/save', { fictionalOnly: true, id: draft.id, expectedRevision,
          status: draft.status, statements: draft.statements }, userId);
        const saved = readAccountDraft(result.draft);
        if (!saved || saved.id !== draft.id) throw new Error('INVALID_DRAFT');
        return saved;
      },
      async remove(userId, draft) { await request('drafts/delete', { fictionalOnly: true, id: draft.id, expectedRevision: draft.revision }, userId); },
    },
    subscribe(listener) {
      listeners.add(listener); void refresh();
      const interval = window.setInterval(() => void refresh(), 30000);
      const focus = () => void refresh(); window.addEventListener('focus', focus);
      return () => { listeners.delete(listener); clearInterval(interval); window.removeEventListener('focus', focus); };
    },
    async signUp(email, password) { epoch++; const result = await request('signup', { email, password }); changed(result.user); return false; },
    async signIn(email, password) { epoch++; const result = await request('signin', { email, password }); changed(result.user); },
    async google() { throw new Error('Google sign-in needs a configured provider.'); },
    async signOut() { await request('signout', {}); changed(null); },
    async readProfile(userId) { return (await request('profile', undefined, userId)).profile; },
    async saveProfile(userId, profile, revision) { return (await request('profile', { profile, expectedRevision: revision }, userId)).profile; },
    async deleteProfile(userId, revision) { await request('profile/delete', { expectedRevision: revision }, userId); },
  };
}

const env = (import.meta as ImportMeta & { env: Record<string, string | boolean | undefined> }).env;
function configuredClient(): AccountClient | null {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return env.DEV === true ? localClient() : null;
  if (typeof url !== 'string' || typeof key !== 'string' || !key.startsWith('sb_publishable_')) return null;
  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname))) return null;
    const sdk = createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true,
      storage: window.sessionStorage, storageKey: 'apip.auth', autoRefreshToken: true } });
    return {
      kind: 'supabase',
      subscribe(listener) { const { data } = sdk.auth.onAuthStateChange((_event, session) => listener(session?.user ?? null)); return () => data.subscription.unsubscribe(); },
      async signUp(email, password) { const { data, error } = await sdk.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/#/account/profile` } }); if (error) throw error; return !data.session; },
      async signIn(email, password) { const { error } = await sdk.auth.signInWithPassword({ email, password }); if (error) throw error; },
      async google() { const { error } = await sdk.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/#/account/profile` } }); if (error) throw error; },
      async signOut() { const { error } = await sdk.auth.signOut({ scope: 'local' }); if (error) throw error; },
      async readProfile(userId) { const { data, error } = await sdk.from('patient_profiles').select('*').eq('user_id', userId).maybeSingle(); if (error) throw error; return data; },
      async saveProfile(userId, profile, revision) {
        const query = revision === null ? sdk.from('patient_profiles').insert({ ...profile, user_id: userId })
          : sdk.from('patient_profiles').update(profile).eq('user_id', userId).eq('revision', revision);
        const { data, error } = await query.select().maybeSingle(); if (error || !data) throw error ?? new Error('PROFILE_CONFLICT'); return data;
      },
      async deleteProfile(userId, revision) { const { data, error } = await sdk.from('patient_profiles').delete().eq('user_id', userId).eq('revision', revision).select('user_id'); if (error || !data?.length) throw error ?? new Error('PROFILE_CONFLICT'); },
    };
  } catch { return null; }
}
export const accountClient = configuredClient();
