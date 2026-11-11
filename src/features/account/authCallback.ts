const destinations = {
  'adr-report': '/preview/adr-report',
  medassist: '/preview/medassist',
} as const;

export function accountDestination(task: string | null | undefined) {
  return task === 'adr-report' || task === 'medassist' ? destinations[task] : '/patient/home';
}

export function readAuthCallback(url: URL) {
  if (url.pathname !== '/' || url.searchParams.get('apip_auth') !== '1') return null;
  const fragment = new URLSearchParams(url.hash.slice(1));
  const error = url.searchParams.get('error') ?? fragment.get('error');
  const code = url.searchParams.get('code');
  const type = url.searchParams.get('type') ?? fragment.get('type');
  return { code: error ? null : code, ...(type ? { type } : {}) };
}

export function allowedAuthOrigin(origin: string, configured: unknown) {
  const url = new URL(origin);
  if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) return true;
  return url.protocol === 'https:' && typeof configured === 'string'
    && configured.split(',').some(entry => entry.trim() === origin);
}

/** Only known APIP destinations; never trust a storage value as an external redirect. */
export function safeAccountReturn(value: string | null, fallback = '/patient/home') {
  const path = (value?.replace(/^(\/#|#)/, '') ?? '').replace(/\/+(?=\?|$)/, '');
  return /^(?:\/patient\/home|\/account\/profile|\/sign-in\/(?:patient|specialist)|\/specialist(?:\/(?:profile|home|reviews))?|\/admin\/specialist-applications(?:\/[0-9a-f-]{36})?|\/patient\/adr\/cases(?:\/[0-9a-f-]{36}(?:\/history|\/revisions\/[1-9][0-9]{0,2})?)?|\/preview\/(?:adr-report|medassist)(?:\?case=[0-9a-f-]{36})?)$/i.test(path) ? path : fallback;
}

const pendingReturnKey = 'apip.account.pending_return';
const pendingReturnTtlMs = 60 * 60 * 1000;

export interface PendingAuthReturn {
  path: string;
  role: 'patient' | 'specialist';
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStore(): KeyValueStore | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Saves non-PII cross-tab auth return metadata (role + safe route) with bounded TTL. */
export function savePendingAuthReturn(
  path: string,
  role: 'patient' | 'specialist',
  store: KeyValueStore | null = defaultStore(),
  now = Date.now()
) {
  if (!store) return;
  const safePath = safeAccountReturn(path, '');
  if (!safePath) return;
  try {
    store.setItem(
      pendingReturnKey,
      JSON.stringify({ path: safePath, role, expiresAt: now + pendingReturnTtlMs })
    );
  } catch {
    // ignore storage quota/access errors
  }
}

/** Reads (and optionally consumes) validated cross-tab auth return metadata if unexpired. */
export function readPendingAuthReturn(
  consume = false,
  store: KeyValueStore | null = defaultStore(),
  now = Date.now()
): PendingAuthReturn | null {
  if (!store) return null;
  try {
    const raw = store.getItem(pendingReturnKey);
    if (!raw) return null;
    if (consume) store.removeItem(pendingReturnKey);
    const parsed = JSON.parse(raw) as { path?: unknown; role?: unknown; expiresAt?: unknown } | null;
    if (!parsed || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= now) {
      store.removeItem(pendingReturnKey);
      return null;
    }
    const safePath = typeof parsed.path === 'string' ? safeAccountReturn(parsed.path, '') : '';
    const role = parsed.role === 'specialist' ? 'specialist' : parsed.role === 'patient' ? 'patient' : null;
    if (!safePath || !role) {
      store.removeItem(pendingReturnKey);
      return null;
    }
    return { path: safePath, role };
  } catch {
    try {
      store.removeItem(pendingReturnKey);
    } catch {
      // ignore cleanup errors
    }
    return null;
  }
}

/** Clears cross-tab pending auth return metadata on sign-out or rollback. */
export function clearPendingAuthReturn(store: KeyValueStore | null = defaultStore()) {
  if (!store) return;
  try {
    store.removeItem(pendingReturnKey);
  } catch {
    // ignore storage access errors
  }
}
