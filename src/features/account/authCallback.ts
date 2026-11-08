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
  const path = value?.replace(/^(\/#|#)/, '') ?? '';
  return /^(?:\/patient\/home|\/sign-in\/(?:patient|specialist)|\/specialist(?:\/(?:profile|home|reviews))?|\/admin\/specialist-applications(?:\/[0-9a-f-]{36})?|\/patient\/adr\/cases(?:\/[0-9a-f-]{36}(?:\/history|\/revisions\/[1-9][0-9]{0,2})?)?|\/preview\/(?:adr-report|medassist)(?:\?case=[0-9a-f-]{36})?)$/i.test(path) ? path : fallback;
}
