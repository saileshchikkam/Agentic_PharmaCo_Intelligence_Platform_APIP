import { allowedAuthOrigin, readAuthCallback } from './authCallback';
import { createClient } from '@supabase/supabase-js';
import type { PatientProfile, ProfileInput } from './profile';
import { readAccountDraft, type AccountDraftRepository } from '../adr/accountDraft';

export type AccountUser = { id: string; email?: string };
export interface AccountClient {
  kind: 'local' | 'supabase';
  drafts?: AccountDraftRepository;
  subscribe: (listener: (user: AccountUser | null, error?: string) => void) => () => void;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  google: (workspace?: 'specialist') => Promise<void>;
  resetPassword?: (email: string) => Promise<void>;
  updatePassword?: (password: string) => Promise<void>;
  accessToken?: (owner: string) => Promise<string>;
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
    try {
      const result = await request('user');
      if (current === epoch) emit(result.user);
    } catch { if (current === epoch) emit(null); }
  };
  if (channel) channel.onmessage = () => { epoch++; void refresh(); };
  const changed = (user: AccountUser | null) => { emit(user); channel?.postMessage({ type: 'changed' }); };
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
    async resetPassword(_email) { /* local development only */ },
    async updatePassword(_password) { /* local development only */ },
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
    if (!allowedAuthOrigin(location.origin, env.VITE_APIP_AUTH_ORIGINS)) return null;
    const endpoint = new URL(url);
    if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname))) return null;
    const storage = {
      getItem: (key: string) => (key.endsWith('-code-verifier') ? sessionStorage : localStorage).getItem(key),
      setItem: (key: string, value: string) => (key.endsWith('-code-verifier') ? sessionStorage : localStorage).setItem(key, value),
      removeItem: (key: string) => (key.endsWith('-code-verifier') ? sessionStorage : localStorage).removeItem(key),
    };
    const sdk = createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: false,
      persistSession: true, storage, storageKey: 'apip.cloud.auth', autoRefreshToken: true } });
    const continuationKey = 'apip.account.continue';
    const callback = readAuthCallback(new URL(location.href));
    const callbackReady = (async () => {
      if (!callback) return;
      if (callback.type === 'recovery') {
        history.replaceState(history.state, '', '/#/reset-password');
      } else {
        const dest = sessionStorage.getItem('apip.account.return') || '/#/sign-in/patient';
        history.replaceState(history.state, '', dest);
      }
      if (!callback.code) return 'Sign-in was cancelled or the link expired. Please try again.';
      try {
        const { error } = await sdk.auth.exchangeCodeForSession(callback.code);
        if (!error) return;
      } catch { /* Report a safe message without provider details. */ }
      return 'Sign-in could not be completed. Open the link in the browser tab that requested it, or try again.';
    })();
    function redirectTo() {
      return location.origin + '/?apip_auth=1';
    }
    return {
      kind: 'supabase',
      subscribe(listener) {
        let disposed = false;
        let expiry: ReturnType<typeof setTimeout> | undefined;
        let generation = 0;
        let unsubscribe: (() => void) | undefined;
        void callbackReady.then(message => {
          if (disposed) return;
          const { data } = sdk.auth.onAuthStateChange((event, session) => {
            clearTimeout(expiry);
            const current = ++generation;
            const remaining = session?.expires_at ? session.expires_at * 1000 - Date.now() : 0;
            listener(remaining > 0 ? session!.user : null, event === 'INITIAL_SESSION' ? message : undefined);
            if (session) expiry = setTimeout(() => {
              listener(null, 'Your session expired. Sign in again if it cannot be restored.');
              void sdk.auth.getSession().then(({ data, error }) => {
                if (!disposed && current === generation && !error && data.session?.expires_at
                    && data.session.expires_at * 1000 > Date.now()) listener(data.session.user);
              }).catch(() => {});
            }, Math.min(Math.max(remaining, 0), 2147483647));

          });
          unsubscribe = () => data.subscription.unsubscribe();
        });
        return () => { disposed = true; clearTimeout(expiry); unsubscribe?.(); };
      },
      async accessToken(owner) {
        const { data, error } = await sdk.auth.getSession();
        if (error || !data.session || data.session.user.id !== owner) throw Error('SIGN_IN_REQUIRED');
        return data.session.access_token;
      },
      async signUp(email, password) {
        const { data, error } = await sdk.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
        if (error) throw error;
        return !data.session;
      },
      async signIn(email, password) {
        const { error } = await sdk.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async google(workspace?: 'specialist') {
        if (workspace === 'specialist') {
          sessionStorage.setItem('apip.account.return', '/specialist');
        } else {
          sessionStorage.setItem('apip.account.return', '/patient/home');
        }
        const { error } = await sdk.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } });
        if (error) throw error;
      },
      async resetPassword(email) {
        const { error } = await sdk.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + '/?apip_auth=1&type=recovery',
        });
        if (error) throw error;
      },
      async updatePassword(password) {
        const { error } = await sdk.auth.updateUser({ password });
        if (error) throw error;
      },
      async signOut() {
        const { error } = await sdk.auth.signOut({ scope: 'local' });
        if (error) throw error;
        sessionStorage.removeItem(continuationKey);
      },
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

export async function guidedAccountHeaders(owner: string) {
  const token = await accountClient?.accessToken?.(owner);
  return { 'Content-Type': 'application/json', 'X-APIP-Account': owner,
    ...(token ? { Authorization: 'Bearer ' + token } : {}) };
}
