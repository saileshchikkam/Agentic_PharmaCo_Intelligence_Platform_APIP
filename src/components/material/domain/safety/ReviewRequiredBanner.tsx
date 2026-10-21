import React from 'react';
import { M3Button } from '../../core/M3Button';

export interface ReviewRequiredBannerProps {
  id?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * ReviewRequiredBanner - Restrained Safety Review Notice
 * Emphasizes clinical human review without alarming red alerts or speculative danger rhetoric.
 */
export const ReviewRequiredBanner: React.FC<ReviewRequiredBannerProps> = ({
  id = 'review-required-banner',
  title = 'Review required',
  message = 'This report contains information that should be reviewed by an appropriately qualified pharmacovigilance professional before regulatory finalization.',
  actionLabel = 'View report',
  onAction,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`rounded-2xl p-4 bg-[var(--md-sys-color-tertiary-container)]/70 text-[var(--md-sys-color-on-tertiary-container)] border border-[var(--md-sys-color-tertiary)]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-2xl text-[var(--md-sys-color-tertiary)] shrink-0 mt-0.5" aria-hidden="true">
          verified_user
        </span>
        <div>
          <h4 className="text-sm font-semibold leading-tight">{title}</h4>
          <p className="text-xs leading-relaxed opacity-90 mt-1 max-w-2xl">
            {message}
          </p>
        </div>
      </div>

      {onAction && (
        <M3Button
          id={`${id}-action-btn`}
          variant="tonal"
          label={actionLabel}
          leadingIcon="visibility"
          onClick={onAction}
          className="shrink-0 text-xs"
        />
      )}
    </div>
  );
};
