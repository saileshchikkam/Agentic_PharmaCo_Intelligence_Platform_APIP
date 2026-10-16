import React, { useState, useEffect } from 'react';
import './design-system/material-web-imports';
import { TopAppBar } from './components/material/TopAppBar';
import { MaterialNavTabs, NavTabId } from './components/material/MaterialNavTabs';
import { PatientHealthView } from './components/material/PatientHealthView';
import { ReportReactionView } from './components/material/ReportReactionView';
import { SafetyRecordsView } from './components/material/SafetyRecordsView';
import { CoreComponentsView } from './components/material/CoreComponentsView';
import { DomainComponentsView } from './components/material/DomainComponentsView';
import { DesignFoundationView } from './components/material/DesignFoundationView';
import { INITIAL_ICSR_CASES } from './mockData';
import { ICSRCase } from './types';

export function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [activeTab, setActiveTab] = useState<NavTabId>('domain-components');
  const [cases, setCases] = useState<ICSRCase[]>(() => {
    const saved = localStorage.getItem('apip_cases_m3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse local stored cases, using initial defaults');
      }
    }
    return INITIAL_ICSR_CASES;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] flex flex-col font-sans transition-colors">
      {/* Material 3 Top App Bar */}
      <TopAppBar isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />

      {/* Material 3 Navigation Tabs */}
      <MaterialNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Surface */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'domain-components' && (
          <DomainComponentsView isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
        )}

        {activeTab === 'core-components' && (
          <CoreComponentsView isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
        )}

        {activeTab === 'patient-health' && (
          <PatientHealthView onNavigateToReport={() => setActiveTab('report-reaction')} />
        )}

        {activeTab === 'report-reaction' && (
          <ReportReactionView />
        )}

        {activeTab === 'safety-records' && (
          <SafetyRecordsView cases={cases} />
        )}

        {activeTab === 'design-foundation' && (
          <DesignFoundationView isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
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

export default App;
