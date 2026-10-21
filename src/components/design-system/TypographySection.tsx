import React from 'react';
import { Card } from '../ui/Card';

export const TypographySection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            02. Typography & Numerical Precision Scale
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Paired typography system featuring <strong>Plus Jakarta Sans</strong> for clean, human-centered clinical reading and <strong>JetBrains Mono</strong> for tabular safety metrics, MedDRA LLT codes, PRR calculations, and ICSR case IDs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hierarchical Scale Card */}
        <Card surface="solid" padding="md" className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Typographic Scale (Plus Jakarta Sans)
          </h4>

          <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Display Headline
              </span>
              <span className="text-[10px] font-mono text-slate-400">30px / 800</span>
            </div>
            <p className="text-xs text-slate-500">Patient onboarding hero, executive safety posture</p>
          </div>

          <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Page Title & Primary Sections
              </h2>
              <span className="text-[10px] font-mono text-slate-400">20px / 700</span>
            </div>
            <p className="text-xs text-slate-500">Workspace view headers, triage summary sheets</p>
          </div>

          <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Card & Subsection Titles
              </h3>
              <span className="text-[10px] font-mono text-slate-400">16px / 600</span>
            </div>
            <p className="text-xs text-slate-500">Adverse reaction modules, monograph cards</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                Body text optimized for sustained reading. Patient reports and adverse event narratives maintain a line height of 1.6 to prevent clinical fatigue.
              </p>
              <span className="text-[10px] font-mono text-slate-400 ml-2">14px / 400</span>
            </div>
          </div>
        </Card>

        {/* Tabular Numerical Readability Card */}
        <Card surface="solid" padding="md" className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Numerical Readability (JetBrains Mono)
          </h4>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-500">ICSR Case ID:</span>
              <span className="font-bold text-teal-700 dark:text-teal-300 bg-teal-100/60 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                PV-2026-AUG-88192
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-500">MedDRA LLT Code:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">10002424 (Angioedema)</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-500">Naranjo Score:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+6 (Probable Causality)</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-500">PRR Disproportionality:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">PRR = 3.42 [95% CI: 2.18–5.37]</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-500">Chi-Square Statistic:</span>
              <span className="text-slate-800 dark:text-slate-200">χ² = 28.64 (p &lt; 0.0001)</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Optical Alignment: </span>
            Monospaced numerals ensure tabular decimal alignment across pharmacovigilance reports, statistical tables, and lab panels without character jitter.
          </div>
        </Card>
      </div>
    </div>
  );
};
