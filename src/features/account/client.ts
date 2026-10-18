import { createClient } from '@supabase/supabase-js';

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Only the publishable key belongs here. Database ownership is enforced by Postgres RLS.
function configuredClient() {
  if (!url || !key?.startsWith('sb_publishable_')) return null;
  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname))) return null;
    return createClient(url, key, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true,
        storage: window.sessionStorage, storageKey: 'apip.auth', autoRefreshToken: true },
    });
  } catch { return null; }
}
export const accountClient = configuredClient();
