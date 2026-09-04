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

  const handleReportSubmitted = (caseRef: string) => {
    // Construct valid ICSRCase adhering to domain schema
    const newCase: ICSRCase = {
      id: `case-${Date.now()}`,
      caseNumber: caseRef,
      dateReported: new Date().toISOString().split('T')[0],
      reporter: {
        type: 'Patient',
        name: 'Anonymous Reporter',
        country: 'United States',
      },
      patient: {
        initials: 'PT',
        age: '48',
        gender: 'Female',
        medicalHistory: ['Hypertension'],
      },
      suspectedDrug: {
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin',
        dosage: '500mg BID',
        route: 'Oral',
        startDate: '2026-08-25',
        indication: 'Respiratory tract infection',
      },
      concomitantDrugs: [],
      adverseEvent: {
        primaryTerm: 'Cutaneous eruption',
        narrative: 'Patient reported generalized cutaneous erythematous eruption with pruritus 3 days following antibiotic initiation.',
        meddraPreferredTerm: 'Rash maculo-papular',
        systemOrganClass: 'Skin and subcutaneous tissue disorders',
        onsetDate: '2026-08-28',
        outcome: 'Recovering/Resolving',
        seriousness: {
          isFatal: false,
          isLifeThreatening: false,
          causedHospitalization: false,
          causedDisability: false,
          congenitalAnomaly: false,
          otherMedicallyImportant: false,
        },
      },
      dechallenge: 'Positive (improved after stopping)',
      rechallenge: 'Not Rechallenged',
      validation: {
        isValidICSR: true,
        completenessScore: 94,
        qualityIndex: 90,
        issues: [],
        regulatoryCompliance: 'ICH E2B(R3) Conforming',
      },
      causality: {
        naranjoScore: 6,
        naranjoCategory: 'Probable',
        whoUmcCategory: 'Probable / Likely',
        questionsBreakdown: [
          { question: 'Are there previous conclusive reports on this reaction?', score: 1, rationale: 'Known documented reaction pattern' }
        ],
      },
    };

    setCases((prev) => [newCase, ...prev]);
  };

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
          <ReportReactionView onReportSubmitted={handleReportSubmitted} />
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
          <span>APIP — Agentic Pharma Intelligence Platform • Phase 1 Material 3 Foundation</span>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/80">
            Adhering to ICH E2B(R3) pharmacovigilance data standards & GVP guidelines
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
