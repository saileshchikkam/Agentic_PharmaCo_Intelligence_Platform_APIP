import React from 'react';
import { Card } from '../ui/Card';
import { Check, ShieldCheck } from 'lucide-react';

interface SwatchProps {
  name: string;
  token: string;
  hex: string;
  textColor?: string;
  roleDescription: string;
}

const Swatch: React.FC<SwatchProps> = ({ name, token, hex, textColor = 'text-white', roleDescription }) => (
  <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
    <div
      className={`h-16 w-full rounded-lg flex items-end p-2.5 shadow-inner font-mono text-xs font-semibold ${textColor}`}
      style={{ backgroundColor: hex }}
    >
      <span>{hex}</span>
    </div>
    <div>
      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">{name}</h5>
      <code className="text-[10px] text-teal-600 dark:text-teal-400 font-mono block mt-0.5">{token}</code>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{roleDescription}</p>
    </div>
  </div>
);

export const ColorSystemSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            01. Clinical & Technological Color Architecture
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Departing from generic hospital blue, APIP pairs an authoritative clinical teal with precision sky, deep slate, and intelligence indigo. Semantic status colors are paired with shape, text, and icons to guarantee accessibility.
        </p>
      </div>

      {/* Brand & Identity */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Brand & Intelligence Palette
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Swatch
            name="Clinical Teal (Primary)"
            token="--apip-brand-primary"
            hex="#0d9488"
            roleDescription="Authoritative clinical guidance, confirmed actions, verified safety badges."
          />
          <Swatch
            name="Teal Dark (Hover/Active)"
            token="--apip-brand-primary-hover"
            hex="#0f766e"
            roleDescription="Active click states, heavy outlines, dark-mode high contrast."
          />
          <Swatch
            name="Precision Sky (Secondary)"
            token="--apip-brand-secondary"
            hex="#0284c7"
            roleDescription="Secondary clinical tools, literature citations, navigation links."
          />
          <Swatch
            name="Intelligence Indigo (Agent)"
            token="--apip-brand-accent"
            hex="#6366f1"
            roleDescription="AI Agent observability, automated reasoning state, model execution."
          />
        </div>
      </div>

      {/* Semantic Safety */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Pharmacovigilance & Clinical Semantic Colors
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Swatch
            name="Clinical Emerald (Success)"
            token="--apip-success-solid"
            hex="#10b981"
            roleDescription="Valid statutory criteria (4/4 met), completed reviews, resolved ADRs."
          />
          <Swatch
            name="Surveillance Amber (Signal Warning)"
            token="--apip-warning-solid"
            hex="#f59e0b"
            roleDescription="Potential disproportionality signal (PRR >= 2), unconfirmed interaction."
          />
          <Swatch
            name="Serious Rose (Critical Safety)"
            token="--apip-critical-solid"
            hex="#e11d48"
            roleDescription="Life-threatening / expedited ICSR, boxed warning, acute reaction."
          />
          <Swatch
            name="Clinical Slate (Foundation)"
            token="--apip-fg-primary"
            hex="#0f172a"
            roleDescription="Primary typographic contrast, high-density table grid headers."
          />
        </div>
      </div>

      {/* Accessibility Contrast Rule Banner */}
      <Card surface="solid" padding="sm" className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100">WCAG AA Standard Enforcement: </span>
            Color is NEVER the sole carrier of clinical safety state. Every serious adverse event or disproportionality signal pairs semantic amber/rose with explicit descriptive labels (e.g. <code className="font-mono text-[11px] px-1 bg-slate-200 dark:bg-slate-700 rounded">EXPEDITED 15-DAY</code>), iconography, and high contrast typography.
          </div>
        </div>
      </Card>
    </div>
  );
};
