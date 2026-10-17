import type React from 'react';

interface ApipHistoryState extends Record<string, unknown> {
  apipPreview?: true;
  apipDepth?: number;
}

function currentDepth(): number {
  const state = window.history.state as ApipHistoryState | null;
  return state?.apipPreview === true && Number.isInteger(state.apipDepth) ? state.apipDepth ?? 0 : 0;
}

function canLeavePreview(): boolean {
  return window.dispatchEvent(new Event('apip:before-navigate', { cancelable: true }));
}

/** Navigate to an in-app preview route while marking it in browser history. */
export function navigatePreview(path: string): void {
  const route = path.startsWith('/') ? path : `/${path}`;
  if (window.location.hash === `#${route}`) return;
  if (!canLeavePreview()) return;
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
  if (!canLeavePreview()) return;
  if (currentDepth() > 0) {
    window.history.back();
    return;
  }
  const route = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;
  window.history.replaceState({ apipPreview: true, apipDepth: 0 }, '', `${window.location.pathname}${window.location.search}#${route}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function followPreviewLink(event: React.MouseEvent<HTMLAnchorElement>, path: string): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigatePreview(path);
}
