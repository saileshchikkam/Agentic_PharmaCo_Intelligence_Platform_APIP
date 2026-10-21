import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';
import { ValidationCheckItem } from '../types';

export interface PvValidationSummaryProps {
  id?: string;
  items: ValidationCheckItem[];
  onViewMissing?: () => void;
  className?: string;
}

/**
 * PvValidationSummary - Pharmacovigilance Regulatory Validation Checklist
 * Validates minimum ICSR criteria according to international regulatory specifications.
 * Not a synthetic AI probability score.
 */
export const PvValidationSummary: React.FC<PvValidationSummaryProps> = ({
  id = 'pv-validation-summary',
  items,
  onViewMissing,
  className = '',
}) => {
  const needsReviewCount = items.filter((i) => i.status !== 'complete').length;

  return (
    <M3Card id={id} variant="outlined" className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            ICH E2B(R3) Validation
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            Report Validation Summary
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Verification of required safety data elements for valid ICSR transmission.
          </p>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
            needsReviewCount === 0
              ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/30'
              : 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/30'
          }`}
        >
          {needsReviewCount === 0 ? 'Minimum ICSR Reporting Elements Met' : `${needsReviewCount} Element(s) Need Review`}
        </span>
      </div>

      <div className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
        {items.map((item) => {
          let badge = (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--md-sys-color-secondary)]">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Complete
            </span>
          );

          if (item.status === 'needs_review') {
            badge = (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--md-sys-color-tertiary)]">
                <span className="material-symbols-outlined text-sm">help_outline</span>
                Needs review
              </span>
            );
          } else if (item.status === 'missing') {
            badge = (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--md-sys-color-error)]">
                <span className="material-symbols-outlined text-sm">error_outline</span>
                Missing field
              </span>
            );
          }

          return (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-[var(--md-sys-color-on-surface)]">
                  {item.label}
                </span>
                {item.detail && (
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">
                    {item.detail}
                  </span>
                )}
              </div>
              <div>{badge}</div>
            </div>
          );
        })}
      </div>

      {onViewMissing && needsReviewCount > 0 && (
        <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30 flex justify-end">
          <M3Button
            id={`${id}-btn-missing`}
            variant="tonal"
            label="View missing information"
            leadingIcon="checklist"
            onClick={onViewMissing}
          />
        </div>
      )}
    </M3Card>
  );
};
