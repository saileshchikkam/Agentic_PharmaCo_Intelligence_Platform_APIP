import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import {
  ShieldCheck,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Zap,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Accessibility,
} from 'lucide-react';

export const GovernanceAndAuditSection: React.FC = () => {
  const [governanceCheck, setGovernanceCheck] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
  });

  const governanceQuestions = [
    { id: 1, q: '1. What functional purpose does the translucency serve?' },
    { id: 2, q: '2. Would a solid surface communicate the same thing more clearly?' },
    { id: 3, q: '3. Does the effect preserve readability (4.5:1 contrast)?' },
    { id: 4, q: '4. Does it work identically in both light and dark modes?' },
    { id: 5, q: '5. Does it degrade cleanly on low-power mobile devices?' },
    { id: 6, q: '6. Does it remain fully keyboard-accessible with visible focus?' },
    { id: 7, q: '7. Does it align with APIP clinical clarity rather than decorative AI theater?' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            07. Accessibility, Responsive Architecture & Design Governance
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Guarantees that future development phases and AI coding agents do not drift into decorative clichés, illegible transparency, or accessibility regressions.
        </p>
      </div>

      {/* 7-Question Design Governance Gate */}
      <Card surface="solid" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            The 7-Question Liquid Glass Governance Gate
          </h4>
          <Badge variant="provenance" size="sm">Strict System Standard</Badge>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Before introducing any new translucent or glass surface in Phase 2–6, every engineer and AI agent must pass all 7 criteria. If any answer is doubtful, <strong>default to a solid surface</strong>.
        </p>

        <div className="space-y-2 pt-2">
          {governanceQuestions.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
            >
              <span className="text-slate-700 dark:text-slate-200 font-medium">{item.q}</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Passed
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Responsive Recomposition Rules */}
      <Card surface="solid" padding="md" className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Responsive Recomposition Rules (Not Just Scaling)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Smartphone className="w-4 h-4 text-teal-600" />
              <span>Mobile (&lt;640px)</span>
            </div>
            <ul className="space-y-1 text-slate-500 dark:text-slate-400 list-disc list-inside">
              <li>Patient-first conversational layout</li>
              <li>Floating navigation collapses to sticky bottom bar</li>
              <li>Touch targets &ge; 44px strictly enforced</li>
              <li>Tables re-composed into stacked case cards</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Tablet className="w-4 h-4 text-sky-600" />
              <span>Tablet (640px–1024px)</span>
            </div>
            <ul className="space-y-1 text-slate-500 dark:text-slate-400 list-disc list-inside">
              <li>2-column clinical inspection layout</li>
              <li>Side-by-side symptom exploration and visit prep</li>
              <li>Collapsible filter drawers for PV safety inbox</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>Desktop (&gt;1024px)</span>
            </div>
            <ul className="space-y-1 text-slate-500 dark:text-slate-400 list-disc list-inside">
              <li>High-density PV tabular workbench</li>
              <li>3-column ICSR case inspector with live E2B XML diff</li>
              <li>Floating contextual toolbars with Liquid Glass</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Accessibility & Focus States Checklist */}
      <Card surface="solid" padding="md" className="space-y-4">
        <div className="flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Accessibility & Sensory Standards (WCAG 2.1 AA)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">High Contrast Focus Rings:</span>
            <p className="text-slate-500 dark:text-slate-400">
              Interactive controls display a 3px ring with <code>rgba(13, 148, 136, 0.35)</code> on keyboard Tab navigation.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">Screen Reader Accessibility:</span>
            <p className="text-slate-500 dark:text-slate-400">
              Modal dialogs implement ARIA modal roles, ESC key traps, and explicit screen-reader labels for icon buttons.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">Reduced Motion Support:</span>
            <p className="text-slate-500 dark:text-slate-400">
              CSS media query <code>prefers-reduced-motion: reduce</code> automatically sets transition durations to 0.01ms.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">Liquid Glass Fallback:</span>
            <p className="text-slate-500 dark:text-slate-400">
              If <code>backdrop-filter</code> is unavailable, elements automatically fall back to opaque Level 2 elevated surfaces.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
