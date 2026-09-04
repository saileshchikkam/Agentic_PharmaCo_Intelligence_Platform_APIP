import React from 'react';

interface TopAppBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ isDark, onToggleTheme }) => {
  return (
    <header
      id="apip-top-app-bar"
      className="w-full m3-surface border-b border-[var(--md-sys-color-outline-variant)]/60 sticky top-0 z-30 transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Product Brand & Clinical Purpose */}
        <div className="flex items-center gap-3">
          <div
            id="apip-brand-mark"
            className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-medium shadow-xs"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-2xl text-[var(--md-sys-color-primary)]">
              clinical_notes
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)] tracking-tight">
                APIP
              </span>
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-medium">
                Healthcare Decision Support
              </span>
            </div>
            <span className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] text-xs hidden sm:block">
              Agentic Pharma Intelligence Platform
            </span>
          </div>
        </div>

        {/* Right: Clinical Notice & Theme Toggle */}
        <div className="flex items-center gap-3">
          <div
            id="apip-safety-badge"
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] text-xs"
          >
            <span className="material-symbols-outlined text-sm text-[var(--md-sys-color-primary)]">
              shield
            </span>
            <span>Non-diagnostic triage support</span>
          </div>

          <md-icon-button
            id="apip-theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <md-icon>
              <span className="material-symbols-outlined">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </md-icon>
          </md-icon-button>
        </div>
      </div>
    </header>
  );
};
