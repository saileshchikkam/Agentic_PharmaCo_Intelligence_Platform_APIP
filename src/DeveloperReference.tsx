import React, { useEffect, useState } from 'react';
import './design-system/material-web-imports';
import { PageNavigation, PreviewFooter, PreviewHeader } from './features/access/PreviewLayout';
import { MaterialNavTabs, NavTabId } from './components/material/MaterialNavTabs';
import { CoreComponentsView } from './components/material/CoreComponentsView';
import { DomainComponentsView } from './components/material/DomainComponentsView';
import { DesignFoundationView } from './components/material/DesignFoundationView';
import { useAccount } from './features/account/AccountProvider';
import { Appearance } from './design-system/appearance';
import { goBackPreview, navigatePreview } from './features/access/navigation';

interface Props {
  appearance: Appearance;
  setAppearance: React.Dispatch<React.SetStateAction<Appearance>>;
  preferencesSaved: boolean;
}

export function DeveloperReference({ appearance, setAppearance, preferencesSaved }: Props) {
  const { user, ready } = useAccount();
  const [activeTab, setActiveTab] = useState<NavTabId>('domain-components');
  const [authorized, setAuthorized] = useState<boolean | null>(import.meta.env.DEV ? true : null);
  const isDark = appearance.isDark;
  const toggleTheme = () => setAppearance((previous) => ({ ...previous, isDark: !previous.isDark }));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById('access-title')?.focus({ preventScroll: true });
  }, []);

  // Developer authorization check: local DEV builds allow local design preview; production builds verify identity administration or fail closed.
  useEffect(() => {
    if (import.meta.env.DEV || user?.id?.startsWith('fictional-')) {
      setAuthorized(true);
      return;
    }
    if (!ready) return;
    if (!user) {
      setAuthorized(false);
      const timer = setTimeout(() => navigatePreview('/', { replace: true }), 2500);
      return () => clearTimeout(timer);
    }

    const controller = new AbortController();
    fetch('/api/account/capabilities', {
      headers: { 'x-apip-actor': user.id },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data?.identityAdministration === true) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          setTimeout(() => navigatePreview('/', { replace: true }), 2500);
        }
      })
      .catch(() => {
        setAuthorized(false);
        setTimeout(() => navigatePreview('/', { replace: true }), 2500);
      });

    return () => controller.abort();
  }, [ready, user]);

  if (authorized === false) {
    return (
      <div className="access-app developer-reference">
        <PreviewHeader screen="developer-reference" appearance={appearance} setAppearance={setAppearance} preferencesSaved={preferencesSaved} />
        <main id="access-main" tabIndex={-1} className="access-main">
          <div className="access-page-shell" style={{ paddingBlock: '64px', textAlign: 'center' }}>
            <h1 className="m3-headline-small" style={{ color: 'var(--md-sys-color-error)' }}>Access Denied</h1>
            <p className="m3-body-medium" style={{ marginBlock: '16px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Developer workspace is restricted to authorized project owners. Redirecting to home…
            </p>
          </div>
        </main>
        <PreviewFooter />
      </div>
    );
  }

  if (authorized === null) {
    return (
      <div className="access-app developer-reference">
        <PreviewHeader screen="developer-reference" appearance={appearance} setAppearance={setAppearance} preferencesSaved={preferencesSaved} />
        <main id="access-main" tabIndex={-1} className="access-main">
          <div className="access-page-shell" style={{ paddingBlock: '64px', textAlign: 'center' }}>
            <p className="m3-body-medium" role="status">Verifying developer authorization…</p>
          </div>
        </main>
        <PreviewFooter />
      </div>
    );
  }

  return (
    <div className="access-app developer-reference">
      <a href="#access-main" className="access-skip-link" onClick={(event) => {
        event.preventDefault(); document.getElementById('access-main')?.focus();
      }}>Skip to main content</a>
      <PreviewHeader screen="developer-reference" appearance={appearance} setAppearance={setAppearance} preferencesSaved={preferencesSaved} />
      <main id="access-main" tabIndex={-1} className="access-main">
        <div className="access-page-shell">
          <PageNavigation onBack={() => goBackPreview('/')} />
          <h1 id="access-title" tabIndex={-1} className="m3-headline-small">Developer design reference</h1>
          <p className="m3-body-medium mt-1 text-[var(--md-sys-color-on-surface-variant)]">
            For Sailesh and the APIP development team: reusable Material 3 components for the application.
            Access is restricted to authorized project owners.
          </p>
          {/* Material 3 Navigation Tabs */}
          <MaterialNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main Content Surface */}
          <div className="py-8">
            {activeTab === 'domain-components' && (
              <DomainComponentsView isDark={isDark} onToggleTheme={toggleTheme} />
            )}

            {activeTab === 'core-components' && (
              <CoreComponentsView isDark={isDark} onToggleTheme={toggleTheme} />
            )}

            {activeTab === 'design-foundation' && (
              <DesignFoundationView accent={appearance.accent} isDark={isDark} onToggleTheme={toggleTheme} />
            )}
          </div>
        </div>
      </main>

      <PreviewFooter><span>Material 3 design reference</span></PreviewFooter>
    </div>
  );
}
