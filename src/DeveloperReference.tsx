import React, { useState } from 'react';
import './design-system/material-web-imports';
import { TopAppBar } from './components/material/TopAppBar';
import { MaterialNavTabs, NavTabId } from './components/material/MaterialNavTabs';
import { CoreComponentsView } from './components/material/CoreComponentsView';
import { DomainComponentsView } from './components/material/DomainComponentsView';
import { DesignFoundationView } from './components/material/DesignFoundationView';

import { AppearanceSettings } from './components/material/AppearanceSettings';
import { Appearance } from './design-system/appearance';

interface Props {
  appearance: Appearance;
  setAppearance: React.Dispatch<React.SetStateAction<Appearance>>;
  preferencesSaved: boolean;
}

export function DeveloperReference({ appearance, setAppearance, preferencesSaved }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTabId>('domain-components');
  const isDark = appearance.isDark;
  const toggleTheme = () => setAppearance((previous) => ({ ...previous, isDark: !previous.isDark }));
  const closeSettings = () => {
    setSettingsOpen(false);
    document.getElementById('apip-settings-toggle')?.focus();
  };


  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] flex flex-col font-sans transition-colors">
      {/* Material 3 Top App Bar */}
      <TopAppBar isDark={isDark} onToggleTheme={toggleTheme}
        settingsOpen={settingsOpen} onToggleSettings={() => setSettingsOpen((open) => !open)} />
      {settingsOpen && <AppearanceSettings value={appearance} onChange={setAppearance}
        onClose={closeSettings} saved={preferencesSaved} />}

      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8">
        <a href="#/" className="mb-4 inline-flex min-h-12 items-center gap-2 text-[var(--md-sys-color-primary)]">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span> Back to APIP
        </a>
        <p className="m3-title-medium">Developer design reference</p>
        <p className="m3-body-medium mt-1 text-[var(--md-sys-color-on-surface-variant)]">
          For Sailesh and the APIP development team: reusable Material 3 components for the future application.
          Examples here demonstrate design and interaction only. Developer sign-in and access restrictions are still pending.
        </p>
      </div>
      {/* Material 3 Navigation Tabs */}
      <MaterialNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Surface */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'domain-components' && (
          <DomainComponentsView isDark={isDark} onToggleTheme={toggleTheme} />
        )}

        {activeTab === 'core-components' && (
          <CoreComponentsView isDark={isDark} onToggleTheme={toggleTheme} />
        )}

        {activeTab === 'design-foundation' && (
          <DesignFoundationView accent={appearance.accent} isDark={isDark} onToggleTheme={toggleTheme} />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-[var(--md-sys-color-outline-variant)]/40 py-6 text-xs text-[var(--md-sys-color-on-surface-variant)] transition-colors">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>APIP — Agentic Pharma Co-intelligence Platform • Material 3 Design Demo</span>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/80">
            Design demonstration only; no regulatory conformance verified.
          </span>
        </div>
      </footer>
    </div>
  );
}
