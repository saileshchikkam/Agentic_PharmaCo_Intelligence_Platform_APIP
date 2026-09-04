import React, { useRef } from 'react';
import { ColorSystemSection } from './ColorSystemSection';
import { TypographySection } from './TypographySection';
import { SurfaceHierarchySection } from './SurfaceHierarchySection';
import { ComponentsShowcaseSection } from './ComponentsShowcaseSection';
import { ExperienceModesSection } from './ExperienceModesSection';
import { ClinicalDataPatternsSection } from './ClinicalDataPatternsSection';
import { GovernanceAndAuditSection } from './GovernanceAndAuditSection';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Sparkles, Shield, Compass, BookOpen, Layers } from 'lucide-react';

export interface DesignSystemPlaygroundProps {
  viewportWidth: 'mobile' | 'tablet' | 'full';
}

export const DesignSystemPlayground: React.FC<DesignSystemPlaygroundProps> = ({
  viewportWidth,
}) => {
  const containerClass = {
    mobile: 'max-w-[375px] mx-auto border-x border-slate-300 dark:border-slate-800 shadow-2xl my-6 rounded-3xl overflow-hidden bg-white dark:bg-slate-950 p-4',
    tablet: 'max-w-[768px] mx-auto border-x border-slate-300 dark:border-slate-800 shadow-2xl my-6 rounded-3xl overflow-hidden bg-white dark:bg-slate-950 p-6',
    full: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  }[viewportWidth];

  return (
    <div className={containerClass}>
      {/* Platform Vision & Design Formula Banner */}
      <div className="mb-10 space-y-4">
        <div className="p-6 rounded-3xl apip-glass border border-teal-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="provenance" size="sm">Phase 1 / Step 1 Showcase</Badge>
              <Badge variant="agent" size="sm">
                <Sparkles className="w-3 h-3 mr-1" /> Apple HIG + Liquid Glass + Material Compatibility
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              APIP Visual Operating System & Design Foundation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Establishes the design tokens, spatial hierarchy, typography, and controlled Liquid Glass material grammar for the <strong>Agentic Pharma Intelligence Platform</strong>. Designed for clinical safety, high-density pharmacovigilance precision, and empathetic patient triage exploration.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Content-First Hierarchy
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Functional Liquid Glass
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Non-Diagnostic Safety
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Core Showcase Sections */}
      <div className="space-y-16">
        <section id="colors" className="scroll-mt-24">
          <ColorSystemSection />
        </section>

        <section id="typography" className="scroll-mt-24">
          <TypographySection />
        </section>

        <section id="surfaces" className="scroll-mt-24">
          <SurfaceHierarchySection />
        </section>

        <section id="components" className="scroll-mt-24">
          <ComponentsShowcaseSection />
        </section>

        <section id="modes" className="scroll-mt-24">
          <ExperienceModesSection />
        </section>

        <section id="patterns" className="scroll-mt-24">
          <ClinicalDataPatternsSection />
        </section>

        <section id="governance" className="scroll-mt-24">
          <GovernanceAndAuditSection />
        </section>
      </div>

      {/* Footer System Boundary Note */}
      <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-600 dark:text-slate-400">
          APIP Design System Foundation — Strictly scoped to Phase 1 / Step 1.
        </p>
        <p>
          Full route implementations, ML pipelines, and backend APIs are intentionally deferred to subsequent development phases.
        </p>
      </div>
    </div>
  );
};
