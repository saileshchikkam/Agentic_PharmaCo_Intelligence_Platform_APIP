import React from 'react';
import { Sun, Moon, Sparkles, Zap, Smartphone, Tablet, Monitor, Eye, Archive } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface DesignSystemHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  isGlassEnabled: boolean;
  onToggleGlass: () => void;
  isReducedMotion: boolean;
  onToggleReducedMotion: () => void;
  viewportWidth: 'mobile' | 'tablet' | 'full';
  onChangeViewport: (w: 'mobile' | 'tablet' | 'full') => void;
  activeSection: string;
  onSelectSection: (id: string) => void;
  onToggleArchiveView?: () => void;
  isArchiveView?: boolean;
}

export const DesignSystemHeader: React.FC<DesignSystemHeaderProps> = ({
  isDark,
  onToggleTheme,
  isGlassEnabled,
  onToggleGlass,
  isReducedMotion,
  onToggleReducedMotion,
  viewportWidth,
  onChangeViewport,
  activeSection,
  onSelectSection,
  onToggleArchiveView,
  isArchiveView = false,
}) => {
  const navSections = [
    { id: 'colors', label: '01 Colors' },
    { id: 'typography', label: '02 Typography' },
    { id: 'surfaces', label: '03 Material Hierarchy' },
    { id: 'components', label: '04 Components' },
    { id: 'modes', label: '05 Modes (Patient/PV/Agent)' },
    { id: 'patterns', label: '06 Clinical Patterns' },
    { id: 'governance', label: '07 Governance' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full apip-glass border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-600 dark:bg-teal-500 flex items-center justify-center text-white shadow-sm font-black text-sm tracking-wider">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                APIP Visual Operating System
              </h1>
              <Badge variant="provenance" size="sm">Phase 1 / Step 1</Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Apple-Inspired Liquid Glass + Material-Compatible Clinical Intelligence
            </p>
          </div>
        </div>

        {/* Global Playground Interactive Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Viewport Width Simulators */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onChangeViewport('mobile')}
              title="Mobile (375px)"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewportWidth === 'mobile'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeViewport('tablet')}
              title="Tablet (768px)"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewportWidth === 'tablet'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeViewport('full')}
              title="Full Desktop"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewportWidth === 'full'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Glass Fallback Toggle */}
          <button
            onClick={onToggleGlass}
            title={isGlassEnabled ? 'Glass Enabled (Click to test Fallback)' : 'Fallback Mode Active (Solid Only)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isGlassEnabled
                ? 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950/40 dark:border-teal-800/60 dark:text-teal-300'
                : 'bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isGlassEnabled ? 'Glass Active' : 'Fallback (No Glass)'}</span>
          </button>

          {/* Reduced Motion Toggle */}
          <button
            onClick={onToggleReducedMotion}
            title={isReducedMotion ? 'Reduced Motion Active (0ms)' : 'Fluid Motion Active'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isReducedMotion
                ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300'
                : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isReducedMotion ? 'Motion Reduced' : 'Motion Fluid'}</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            title="Toggle Light / Dark Mode"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Prototype Archive Toggle */}
          {onToggleArchiveView && (
            <button
              onClick={onToggleArchiveView}
              title="Inspect Preserved Prototype Archive"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArchiveView ? 'Return to Showcase' : 'Archive'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Section Quick Jump Bar */}
      {!isArchiveView && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none py-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1 text-xs">
          {navSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                activeSection === sec.id
                  ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
