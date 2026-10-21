import React, { useEffect, useState } from 'react';
import './design-system/material-web-imports';
import { PageNavigation, PreviewHeader } from './features/access/PreviewLayout';
import { MaterialNavTabs, NavTabId } from './components/material/MaterialNavTabs';
import { CoreComponentsView } from './components/material/CoreComponentsView';
import { DomainComponentsView } from './components/material/DomainComponentsView';
import { DesignFoundationView } from './components/material/DesignFoundationView';

import { Appearance } from './design-system/appearance';
import { goBackPreview } from './features/access/navigation';

interface Props {
  appearance: Appearance;
  setAppearance: React.Dispatch<React.SetStateAction<Appearance>>;
  preferencesSaved: boolean;
}

export function DeveloperReference({ appearance, setAppearance, preferencesSaved }: Props) {
  const [activeTab, setActiveTab] = useState<NavTabId>('domain-components');
  const isDark = appearance.isDark;
  const toggleTheme = () => setAppearance((previous) => ({ ...previous, isDark: !previous.isDark }));
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById('access-title')?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="access-app developer-reference">
      <a href="#access-main" className="access-skip-link" onClick={(event) => {
        event.preventDefault(); document.getElementById('access-main')?.focus();
      }}>Skip to main content</a>
      <PreviewHeader screen="developer-reference" appearance={appearance} setAppearance={setAppearance} preferencesSaved={preferencesSaved} />
      <main id="access-main" tabIndex={-1} className="access-main">
        <div className="access-page-shell">
          <PageNavigation onBack={() => goBackPreview('/sign-in/developer')} />
          <h1 id="access-title" tabIndex={-1} className="m3-headline-small">Developer design reference</h1>
          <p className="m3-body-medium mt-1 text-[var(--md-sys-color-on-surface-variant)]">
            For Sailesh and the APIP development team: reusable Material 3 components for the future application.
            Examples here demonstrate design and interaction only. Developer sign-in and access restrictions are still pending.
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

      {/* Minimal Footer */}
      <footer className="access-footer">
        <span>APIP — Agentic Pharma Co-intelligence Platform • Material 3 Design Demo</span>
        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/80">
          Design demonstration only; no regulatory conformance verified.
        </span>
      </footer>
    </div>
  );
}
