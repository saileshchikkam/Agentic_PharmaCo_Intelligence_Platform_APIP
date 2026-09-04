import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Check, Clock, AlertCircle, Sparkles, Pill, Activity, Stethoscope } from 'lucide-react';

const SOC_DATA = [
  { name: 'Hepatic / Hepatobiliary', count: 142, color: '#0d9488' },
  { name: 'Skin & Subcutaneous', count: 98, color: '#0284c7' },
  { name: 'Musculoskeletal', count: 64, color: '#6366f1' },
  { name: 'Respiratory / Thoracic', count: 47, color: '#f59e0b' },
  { name: 'Immune System / SJS', count: 26, color: '#e11d48' },
];

export const ClinicalDataPatternsSection: React.FC = () => {
  const [confirmedEntities, setConfirmedEntities] = useState<Record<string, boolean>>({
    drug: true,
    reaction: false,
    onset: true,
    dechallenge: false,
  });

  const toggleConfirm = (key: string) => {
    setConfirmedEntities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            06. Clinical Patterns: Extraction, Timelines & Signal Visuals
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Specialized clinical interaction patterns transforming unstructured patient narratives into verified regulatory data, alongside scientifically framed disproportionality visualizations.
        </p>
      </div>

      {/* ADR Natural Language Extraction Pattern */}
      <Card surface="solid" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Natural Language ADR Extraction & Verification Pattern
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Click unverified tags to simulate patient confirmation before statutory submission.
            </p>
          </div>
          <Badge variant="agent" size="sm">
            <Sparkles className="w-3 h-3 mr-1" /> Reporting Agent
          </Badge>
        </div>

        {/* Narrative Box with Inline Highlight Chips */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          "I was prescribed{' '}
          <span className="bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-semibold px-1.5 py-0.5 rounded border border-teal-300 dark:border-teal-700">
            Augmentin 875mg/125mg
          </span>{' '}
          for acute sinus infection. On day 8, I developed severe nausea, dark urine and{' '}
          <span className="bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-semibold px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-700">
            jaundice with yellowing of the eyes
          </span>
          . I immediately{' '}
          <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-semibold px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700">
            stopped taking the pills
          </span>
          , and my physician ordered liver function tests."
        </div>

        {/* Extracted Interactive Entity Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Suspect Medication</span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                Amoxicillin / Clavulanate
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant={confirmedEntities.drug ? 'success' : 'neutral'} size="sm">
                {confirmedEntities.drug ? 'Patient Confirmed' : 'AI Extracted'}
              </Badge>
              <button
                onClick={() => toggleConfirm('drug')}
                className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                {confirmedEntities.drug ? 'Edit' : 'Confirm'}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Adverse Reaction (MedDRA)</span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                Cholestatic Jaundice (DILI)
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant={confirmedEntities.reaction ? 'success' : 'warning'} size="sm">
                {confirmedEntities.reaction ? 'Patient Confirmed' : 'Needs Verification'}
              </Badge>
              <button
                onClick={() => toggleConfirm('reaction')}
                className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                {confirmedEntities.reaction ? 'Edit' : 'Confirm'}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Onset Latency</span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                8 Days Post-Initiation
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant={confirmedEntities.onset ? 'success' : 'neutral'} size="sm">
                {confirmedEntities.onset ? 'Patient Confirmed' : 'AI Extracted'}
              </Badge>
              <button
                onClick={() => toggleConfirm('onset')}
                className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                {confirmedEntities.onset ? 'Edit' : 'Confirm'}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Dechallenge Action</span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                Immediate Drug Withdrawal
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant={confirmedEntities.dechallenge ? 'success' : 'warning'} size="sm">
                {confirmedEntities.dechallenge ? 'Patient Confirmed' : 'Needs Verification'}
              </Badge>
              <button
                onClick={() => toggleConfirm('dechallenge')}
                className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                {confirmedEntities.dechallenge ? 'Edit' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Clinical Timeline Pattern */}
      <Card surface="solid" padding="md" className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Clinical Event & Medication Timeline
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          <div className="relative">
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-teal-600 border-2 border-white dark:border-slate-900" />
            <div className="text-xs font-mono text-slate-400">Day 1 — 2026-08-01</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              Prescription Initiated: Amoxicillin/Clavulanate 875mg
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Oral administration twice daily with meals.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-rose-600 border-2 border-white dark:border-slate-900 animate-pulse" />
            <div className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">
              Day 8 — 2026-08-08 (Adverse Event Onset)
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              Acute Jaundice & Pruritus Manifestation
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ALT elevated to 420 U/L (8x ULN), Total Bilirubin 4.8 mg/dL.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
            <div className="text-xs font-mono text-slate-400">Day 9 — 2026-08-09</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              Dechallenge: Antibiotic Discontinued
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Patient instructed to halt medication immediately.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900" />
            <div className="text-xs font-mono text-slate-400">Day 21 — 2026-08-21</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              Clinical Recovery / Dechallenge Positive
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bilirubin normalised; jaundice resolved completely.
            </p>
          </div>
        </div>
      </Card>

      {/* PV Data Visualization (MedDRA SOC Distribution) */}
      <Card surface="solid" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pharmacovigilance Data Visualization Style (Recharts)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              MedDRA System Organ Class (SOC) Adverse Reaction Frequency Distribution
            </p>
          </div>
          <Badge variant="info" size="sm">Stable Solid Canvas</Badge>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SOC_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {SOC_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Alert variant="signal">
          <strong>Scientific Framing Rule:</strong> Analytical charts are strictly rendered on stable, solid surfaces (Level 1) without translucent backgrounds to ensure coordinate accuracy. Metric elevations are labeled as <em>"Potential Disproportionality Signals"</em> requiring human safety officer adjudication.
        </Alert>
      </Card>
    </div>
  );
};
