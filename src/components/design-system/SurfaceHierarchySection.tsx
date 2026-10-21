import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ShieldAlert, CheckCircle2, Eye, Sparkles, Layers, Sliders } from 'lucide-react';

export const SurfaceHierarchySection: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  const layers = [
    {
      level: 0,
      name: 'Level 0 — Foundation Canvas',
      type: 'Solid Canvas',
      cssVar: '--apip-bg',
      glass: false,
      description: 'The background viewport canvas. Restful, low saturation (<5%), warm/cool aligned.',
      permitted: 'App root boundary, viewport backdrop, page container.',
      banned: 'Never apply glass or transparency to the base canvas.',
    },
    {
      level: 1,
      name: 'Level 1 — Primary Solid Surface',
      type: 'Solid Card / Plate',
      cssVar: '--apip-surface-primary',
      glass: false,
      description: 'The core workhorse for clinical data. 100% opaque, high-contrast, zero blur.',
      permitted: 'Patient clinical records, dense PV tables, adverse reaction narratives, lab metrics.',
      banned: 'Never replace Level 1 clinical content cards with translucent glass.',
    },
    {
      level: 2,
      name: 'Level 2 — Elevated Solid Surface',
      type: 'Solid Elevated Plate',
      cssVar: '--apip-surface-elevated',
      glass: false,
      description: 'Solid card with restrained drop shadow and border definition for focused items.',
      permitted: 'Interactive forms, expandable case cards, summary callouts, sign-off blocks.',
      banned: 'Do not stack multiple elevated cards within elevated cards.',
    },
    {
      level: 3,
      name: 'Level 3 — Translucent / Liquid Glass Surface',
      type: 'Liquid Glass (16px blur)',
      cssVar: '--apip-glass-bg',
      glass: true,
      description: 'Controlled translucency with specular border highlight, separating floating context from content.',
      permitted: 'Floating navigation bars, contextual toolbars, assistant input trays, operational status chips.',
      banned: 'Never use for long-form reading, statistical charts, or safety warnings.',
    },
    {
      level: 4,
      name: 'Level 4 — Floating Contextual Surface',
      type: 'Liquid Glass Elevated',
      cssVar: '--apip-glass-floating-bg',
      glass: true,
      description: 'Higher opacity glass with deep directional shadow for quick-dismiss surfaces.',
      permitted: 'Dropdown menus, popovers, contextual filters, quick triage actions.',
      banned: 'Permanent dashboards or long-lived data tables.',
    },
    {
      level: 5,
      name: 'Level 5 — Overlay, Dialog & Sheet',
      type: 'Modal Backdrop + Plate',
      cssVar: '--apip-overlay-backdrop',
      glass: true,
      description: 'High-contrast dialog sitting above a blurred backdrop overlay to isolate critical attention.',
      permitted: 'Case inspection modals, physician sign-off confirmation dialogs, E2B export sheets.',
      banned: 'Casual informational callouts.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            03. Material Hierarchy: Solid vs. Elevated vs. Liquid Glass
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          APIP enforces a strict 6-tier material hierarchy. Liquid Glass is treated as a <strong>functional optical material</strong> for spatial continuity and contextual navigation, NOT as a ubiquitous decorative effect.
        </p>
      </div>

      {/* Side-by-Side Surface Matrix Demonstration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Solid Card (Level 1) */}
        <div className="flex flex-col h-full">
          <Card surface="solid" padding="md" className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="neutral" size="sm">Level 1: Solid</Badge>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Opaque
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Clinical Content Surface
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Standard background for patient narratives, drug monographs, and lab reports. Eliminates visual background noise to prevent clinical errors.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <strong>Mandatory for:</strong> Medical records, adverse reaction descriptions, regulatory forms.
            </div>
          </Card>
        </div>

        {/* Elevated Solid Card (Level 2) */}
        <div className="flex flex-col h-full">
          <Card surface="elevated" padding="md" className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="info" size="sm">Level 2: Elevated</Badge>
                <span className="text-[10px] font-mono text-slate-500">Shadow: 4px</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Elevated Focus Surface
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Opaque surface with subtle depth separation and crisp hairline border. Used when a clinical card needs visual emphasis without transparency.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              <strong>Mandatory for:</strong> Active form cards, Naranjo scoring panels, review queues.
            </div>
          </Card>
        </div>

        {/* Liquid Glass Card (Level 3) */}
        <div className="flex flex-col h-full">
          <Card surface="glass" padding="md" className="flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-teal-500/15 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="agent" size="sm">Level 3: Liquid Glass</Badge>
                <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Blur 16px
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Contextual Liquid Glass
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                Translucent optical material combining 76% opacity, 16px blur, and specular highlight. Preserves spatial context while floating above data.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-400">
              <strong>Permitted for:</strong> Navigation bars, floating controls, status banners, toasts.
            </div>
          </Card>
        </div>
      </div>

      {/* Strict Governance Rule: What is Permitted vs Banned */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
          <h5 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Approved Placements for Liquid Glass
          </h5>
          <ul className="space-y-1 text-emerald-800 dark:text-emerald-300/90 list-disc list-inside">
            <li>Floating top navigation bar & role selector</li>
            <li>Bottom conversational input tray in Patient Assistant</li>
            <li>Agent operational milestone badges & execution toasts</li>
            <li>Contextual filters & quick-search triggers</li>
            <li>Full dialog backdrop overlays (Level 5 blur)</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 space-y-2">
          <h5 className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Strictly Banned Glass Placements
          </h5>
          <ul className="space-y-1 text-rose-800 dark:text-rose-300/90 list-disc list-inside">
            <li>Dense pharmacovigilance ICSR tables (MUST be solid Level 1)</li>
            <li>Patient clinical symptom narratives & medical history</li>
            <li>Critical safety warnings & black-box notices</li>
            <li>Coordinate-dependent statistical PRR charts</li>
            <li>Primary text inputs during active patient typing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
