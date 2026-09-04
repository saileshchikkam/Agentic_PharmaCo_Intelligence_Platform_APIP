import React from 'react';
import { AdrReviewState } from '../types';

export interface AdrReviewStatusProps {
  id?: string;
  state: AdrReviewState;
  showExplanation?: boolean;
  className?: string;
}

/**
 * AdrReviewStatus - Material 3 Workflow Status Badge
 * Communicates intake / review progression without implying regulatory approval or medical confirmation.
 */
export const AdrReviewStatus: React.FC<AdrReviewStatusProps> = ({
  id,
  state,
  showExplanation = false,
  className = '',
}) => {
  let label = 'Draft';
  let explanation = 'Initial intake in progress';
  let badgeStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]';

  switch (state) {
    case 'incomplete':
      label = 'Incomplete';
      explanation = 'Essential information still needed';
      badgeStyle = 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]';
      break;

    case 'ready_for_review':
      label = 'Ready for review';
      explanation = 'Core criteria provided, awaiting user or specialist check';
      badgeStyle = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/30';
      break;

    case 'under_review':
      label = 'Under review';
      explanation = 'Currently being reviewed within the application workflow';
      badgeStyle = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/30';
      break;

    case 'needs_clarification':
      label = 'Needs clarification';
      explanation = 'Reviewer or system requested additional details';
      badgeStyle = 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/30';
      break;

    case 'reviewed':
      label = 'Workflow reviewed';
      explanation = 'Reviewed within internal safety workflow';
      badgeStyle = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/30';
      break;

    case 'submitted':
      label = 'Submitted';
      explanation = 'Transmitted to safety record archive';
      badgeStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)]/40 font-semibold';
      break;

    case 'draft':
    default:
      label = 'Draft';
      explanation = 'Saved locally on this device';
      badgeStyle = 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]';
      break;
  }

  return (
    <div id={id} className={`inline-flex flex-col ${className}`}>
      <span
        role="status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeStyle}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
        {label}
      </span>
      {showExplanation && (
        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          {explanation}
        </span>
      )}
    </div>
  );
};
