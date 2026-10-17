import type React from 'react';

interface ApipHistoryState extends Record<string, unknown> {
  apipPreview?: true;
  apipDepth?: number;
}

function currentDepth(): number {
  const state = window.history.state as ApipHistoryState | null;
  return state?.apipPreview === true && Number.isInteger(state.apipDepth) ? state.apipDepth ?? 0 : 0;
}

/** Navigate to an in-app preview route while marking it in browser history. */
export function navigatePreview(path: string): void {
  const route = path.startsWith('/') ? path : `/${path}`;
  const state: ApipHistoryState = {
    ...(window.history.state && typeof window.history.state === 'object' ? window.history.state : {}),
    apipPreview: true,
    apipDepth: currentDepth() + 1,
  };
  window.history.pushState(state, '', `${window.location.pathname}${window.location.search}#${route}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Return to the prior in-app page, or use a safe route when opened directly. */
export function goBackPreview(fallbackPath: string): void {
  if (currentDepth() > 0) {
    window.history.back();
    return;
  }
  const route = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;
  window.history.replaceState({ apipPreview: true, apipDepth: 0 }, '', `${window.location.pathname}${window.location.search}#${route}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function followPreviewLink(event: React.MouseEvent<HTMLAnchorElement>, path: string): void {
  event.preventDefault();
  navigatePreview(path);
}
