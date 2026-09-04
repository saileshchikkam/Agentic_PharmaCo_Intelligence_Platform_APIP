import React, { useState } from 'react';
import { lightScheme, darkScheme, typography, shape } from '../../design-system/tokens';

interface DesignFoundationViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const DesignFoundationView: React.FC<DesignFoundationViewProps> = ({ isDark, onToggleTheme }) => {
  const [demoInput, setDemoInput] = useState('Amoxicillin Clavulanate');
  const [errorInput, setErrorInput] = useState('Invalid batch number');
  const [hasError, setHasError] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [activeChip, setActiveChip] = useState<'mild' | 'moderate' | 'severe'>('moderate');

  const activeScheme = isDark ? darkScheme : lightScheme;

  return (
    <div id="design-foundation-view" className="space-y-12 animate-fade-in pb-12">
      {/* Intro Header */}
      <div>
        <h1 className="m3-headline-small font-normal text-[var(--md-sys-color-on-surface)]">
          Material Design 3 Foundation
        </h1>
        <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-2xl">
          Specification and interactive verification of the APIP visual operating system under Google Material Design 3.
        </p>
      </div>

      {/* 1. Typography Hierarchy */}
      <section aria-labelledby="typography-heading" className="space-y-4">
        <h2 id="typography-heading" className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)]">
          1. Typography Scale (Roboto)
        </h2>
        <div className="m3-surface-container-lowest p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs divide-y divide-[var(--md-sys-color-outline-variant)]/40">
          <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] w-40">Display Large</span>
            <span className="m3-display-large text-[var(--md-sys-color-on-surface)]">57px Clean Scale</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] w-40">Headline Medium</span>
            <span className="m3-headline-medium text-[var(--md-sys-color-on-surface)]">28px Clinical Header</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] w-40">Title Large</span>
            <span className="m3-title-large text-[var(--md-sys-color-on-surface)]">22px Section Title</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] w-40">Body Large</span>
            <span className="m3-body-large text-[var(--md-sys-color-on-surface)]">16px Baseline body readability for patient narrative exploration.</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] w-40">Body Medium</span>
            <span className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">14px Secondary metadata, supporting descriptions, and clinical remarks.</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] w-40">Label Large</span>
            <span className="m3-label-large text-[var(--md-sys-color-primary)]">14px Interactive Control Label</span>
          </div>
        </div>
      </section>

      {/* 2. Action Hierarchy & Component States */}
      <section aria-labelledby="actions-heading" className="space-y-4">
        <h2 id="actions-heading" className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)]">
          2. Action System & State Layers (Active, Hover, Focus, Disabled, Loading)
        </h2>
        <div className="m3-surface-container-lowest p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Action */}
            <div className="space-y-2">
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block">
                Primary Action (Filled Button)
              </span>
              <button
                type="button"
                className="px-6 py-2.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-sm font-medium hover:opacity-90 active:opacity-95 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] shadow-xs transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">check</span>
                <span>Confirm Report</span>
              </button>
            </div>

            {/* Secondary Action */}
            <div className="space-y-2">
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block">
                Secondary Action (Outlined Button)
              </span>
              <button
                type="button"
                className="px-6 py-2.5 rounded-full border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] text-sm font-medium hover:bg-[var(--md-sys-color-surface-container-low)] active:bg-[var(--md-sys-color-surface-container)] focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-primary)] transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">history</span>
                <span>View Timeline</span>
              </button>
            </div>

            {/* Tonal / Tertiary Action */}
            <div className="space-y-2">
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block">
                Tertiary / Tonal Action
              </span>
              <button
                type="button"
                className="px-6 py-2.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] text-sm font-medium hover:opacity-90 active:opacity-95 focus-visible:outline-2 focus-visible:outline-[var(--md-sys-color-secondary)] transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">clinical_notes</span>
                <span>Draft Note</span>
              </button>
            </div>

            {/* Disabled State */}
            <div className="space-y-2">
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block">
                Disabled State
              </span>
              <button
                type="button"
                disabled
                className="px-6 py-2.5 rounded-full bg-[var(--md-sys-color-on-surface)]/12 text-[var(--md-sys-color-on-surface)]/38 text-sm font-medium cursor-not-allowed inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">block</span>
                <span>Action Disabled</span>
              </button>
            </div>

            {/* Loading State */}
            <div className="space-y-2">
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block">
                Loading State Indicator
              </span>
              <button
                type="button"
                onClick={() => setIsLoading(!isLoading)}
                className="px-6 py-2.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-sm font-medium hover:opacity-90 transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                <span>{isLoading ? 'Processing Signal...' : 'Toggle Loading Demo'}</span>
              </button>
            </div>

            {/* Status Indication Chips */}
            <div className="space-y-2">
              <span className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] block">
                Clinical Status Chips
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
                  Under Review
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
                  Signal Alert
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                  Recorded
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Text Fields & Error Handling */}
      <section aria-labelledby="fields-heading" className="space-y-4">
        <h2 id="fields-heading" className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)]">
          3. Input Controls (Standard, Focus, Error States)
        </h2>
        <div className="m3-surface-container-lowest p-6 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Standard Outlined Text Field */}
            <div className="space-y-1.5">
              <label htmlFor="m3-demo-input" className="m3-label-medium text-[var(--md-sys-color-on-surface)] block">
                Medication name
              </label>
              <input
                id="m3-demo-input"
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
              />
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] block">
                Standard focus state supported
              </span>
            </div>

            {/* Error State Text Field */}
            <div className="space-y-1.5">
              <label htmlFor="m3-error-input" className="m3-label-medium text-[var(--md-sys-color-error)] block">
                Lot / Batch Number
              </label>
              <input
                id="m3-error-input"
                type="text"
                value={errorInput}
                onChange={(e) => {
                  setErrorInput(e.target.value);
                  setHasError(e.target.value.length > 0 && !e.target.value.startsWith('LOT-'));
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:outline-none ${
                  hasError
                    ? 'border-[var(--md-sys-color-error)] ring-1 ring-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]/10 text-[var(--md-sys-color-on-surface)]'
                    : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)]'
                }`}
              />
              {hasError ? (
                <span className="text-xs text-[var(--md-sys-color-error)] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">error</span>
                  Format must begin with LOT-XXXX
                </span>
              ) : (
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Valid lot code identifier
                </span>
              )}
            </div>

            {/* Disabled Input */}
            <div className="space-y-1.5">
              <label htmlFor="m3-disabled-input" className="m3-label-medium text-[var(--md-sys-color-on-surface)]/38 block">
                ICH E2B Safety Report ID (Readonly)
              </label>
              <input
                id="m3-disabled-input"
                type="text"
                disabled
                value="E2B-R3-2026-09418"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)]/60 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]/38 text-sm cursor-not-allowed"
              />
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]/60 block">
                Immutable regulatory identifier
              </span>
            </div>
          </div>

          {/* Switch & Checkbox Selection */}
          <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]/40 flex flex-wrap gap-8 items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                role="switch"
                checked={switchChecked}
                onChange={(e) => setSwitchChecked(e.target.checked)}
                className="w-10 h-5 accent-[var(--md-sys-color-primary)] cursor-pointer"
              />
              <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                Automated Signal Detection Scan ({switchChecked ? 'Active' : 'Paused'})
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--md-sys-color-primary)] cursor-pointer"
              />
              <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                Notify Pharmacovigilance Officer on Serious Event
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Surface Hierarchy & Tonal Elevation */}
      <section aria-labelledby="surfaces-heading" className="space-y-4">
        <h2 id="surfaces-heading" className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)]">
          4. Surface Hierarchy & Tonal Elevation (Light/Dark Container Roles)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl m3-surface-container-lowest border border-[var(--md-sys-color-outline-variant)]/60 shadow-xs space-y-1">
            <span className="m3-label-small font-semibold text-[var(--md-sys-color-primary)] uppercase block">
              Container Lowest
            </span>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Purest base surface for high-contrast card backgrounds.
            </p>
          </div>

          <div className="p-4 rounded-xl m3-surface-container-low border border-[var(--md-sys-color-outline-variant)]/40 space-y-1">
            <span className="m3-label-small font-semibold text-[var(--md-sys-color-primary)] uppercase block">
              Container Low
            </span>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Subtle nested surface for grouped metadata items.
            </p>
          </div>

          <div className="p-4 rounded-xl m3-surface-container border border-[var(--md-sys-color-outline-variant)]/40 space-y-1">
            <span className="m3-label-small font-semibold text-[var(--md-sys-color-primary)] uppercase block">
              Container
            </span>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Standard intermediate surface level for cards and dialogues.
            </p>
          </div>

          <div className="p-4 rounded-xl m3-surface-container-high border border-[var(--md-sys-color-outline-variant)]/40 space-y-1">
            <span className="m3-label-small font-semibold text-[var(--md-sys-color-primary)] uppercase block">
              Container High
            </span>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Elevated interactive element or toolbar backdrop.
            </p>
          </div>

          <div className="p-4 rounded-xl m3-surface-container-highest border border-[var(--md-sys-color-outline-variant)]/40 space-y-1">
            <span className="m3-label-small font-semibold text-[var(--md-sys-color-primary)] uppercase block">
              Container Highest
            </span>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Highest surface tier for floating controls & badges.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Semantic Color Tokens */}
      <section aria-labelledby="colors-heading" className="space-y-4">
        <h2 id="colors-heading" className="m3-title-medium font-semibold text-[var(--md-sys-color-on-surface)]">
          5. Semantic Color Architecture ({isDark ? 'Dark Scheme' : 'Light Scheme'})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)]/40 space-y-1 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]">
            <span className="font-semibold block">Primary</span>
            <span className="font-mono text-[11px] opacity-80">{activeScheme.primary}</span>
          </div>

          <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)]/40 space-y-1 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
            <span className="font-semibold block">Primary Container</span>
            <span className="font-mono text-[11px] opacity-80">{activeScheme.primaryContainer}</span>
          </div>

          <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)]/40 space-y-1 bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)]">
            <span className="font-semibold block">Secondary</span>
            <span className="font-mono text-[11px] opacity-80">{activeScheme.secondary}</span>
          </div>

          <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)]/40 space-y-1 bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
            <span className="font-semibold block">Secondary Container</span>
            <span className="font-mono text-[11px] opacity-80">{activeScheme.secondaryContainer}</span>
          </div>

          <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)]/40 space-y-1 bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]">
            <span className="font-semibold block">Tertiary</span>
            <span className="font-mono text-[11px] opacity-80">{activeScheme.tertiary}</span>
          </div>

          <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)]/40 space-y-1 bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
            <span className="font-semibold block">Tertiary Container</span>
            <span className="font-mono text-[11px] opacity-80">{activeScheme.tertiaryContainer}</span>
          </div>

          <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)]/40 space-y-1 bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]">
            <span className="font-semibold block">Error</span>
            <span className="font-mono text-[11px] opacity-80">{activeScheme.error}</span>
          </div>

          <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)]/40 space-y-1 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
            <span className="font-semibold block">Error Container</span>
            <span className="font-mono text-[11px] opacity-80">{activeScheme.errorContainer}</span>
          </div>
        </div>
      </section>
    </div>
  );
};
