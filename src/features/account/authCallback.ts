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
  return { code: error ? null : code };
}

export function allowedAuthOrigin(origin: string, configured: unknown) {
  const url = new URL(origin);
  if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) return true;
  return url.protocol === 'https:' && typeof configured === 'string'
    && configured.split(',').some(entry => entry.trim() === origin);
}
