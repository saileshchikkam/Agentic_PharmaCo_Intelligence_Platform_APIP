import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Progress } from '../../core/M3Progress';
import { AdrCompletenessItem } from '../types';

export interface AdrCompletenessProps {
  id?: string;
  items: AdrCompletenessItem[];
  className?: string;
}

/**
 * AdrCompleteness - Form Data Completeness Meter
 * Strictly represents administrative questionnaire completeness.
 * Explicitly disclaims medical or causality confidence.
 */
export const AdrCompleteness: React.FC<AdrCompletenessProps> = ({
  id = 'adr-completeness',
  items,
  className = '',
}) => {
  const completedCount = items.filter((i) => i.isComplete).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  return (
    <M3Card id={id} variant="outlined" className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Intake Completeness Checklist
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            Report Information Completeness
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Checklist of essential information fields required for initial safety review.
          </p>
        </div>
        <span className="text-sm font-semibold font-mono text-[var(--md-sys-color-primary)] px-2 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)]">
          {percentage}%
        </span>
      </div>

      <M3Progress
        id={`${id}-progress`}
        type="linear"
        value={percentage / 100}
        valueLabel={`${completedCount} of ${items.length} sections provided`}
      />

      <div className="divide-y divide-[var(--md-sys-color-outline-variant)]/30 border-t border-b border-[var(--md-sys-color-outline-variant)]/30 py-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2 text-xs">
            <span className="font-medium text-[var(--md-sys-color-on-surface)]">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              {item.value && (
                <span className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] truncate max-w-[150px]">
                  {item.value}
                </span>
              )}
              {item.isComplete ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--md-sys-color-secondary)]">
                  <span className="material-symbols-outlined text-sm">check</span>
                  Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[var(--md-sys-color-on-surface-variant)]">
                  <span className="material-symbols-outlined text-sm">remove</span>
                  Optional / Missing
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block leading-normal">
          <strong>Notice:</strong> This bar indicates form field completeness only. It does not measure clinical certainty, causal relationship, or medication safety probability.
        </span>
      </div>
    </M3Card>
  );
};
