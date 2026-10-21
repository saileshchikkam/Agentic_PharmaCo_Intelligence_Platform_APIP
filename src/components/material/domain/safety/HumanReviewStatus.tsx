import React from 'react';

export type HumanReviewStateType =
  | 'awaiting_review'
  | 'under_review'
  | 'reviewer_requested_clarification'
  | 'reviewed'
  | 'returned_for_clarification';

export interface HumanReviewStatusProps {
  id?: string;
  state: HumanReviewStateType;
  reviewerName?: string;
  updatedDate?: string;
  showExplanation?: boolean;
  className?: string;
}

/**
 * HumanReviewStatus - Explicit Human-in-the-Loop Workflow State
 * Clearly indicates human clinical ownership, rejecting autonomous AI decision claims.
 */
export const HumanReviewStatus: React.FC<HumanReviewStatusProps> = ({
  id = 'human-review-status',
  state,
  reviewerName,
  updatedDate,
  showExplanation = false,
  className = '',
}) => {
  let label = 'Awaiting human review';
  let explanation = 'Case queued for qualified pharmacovigilance specialist evaluation';
  let iconName = 'hourglass_top';
  let containerStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]';

  switch (state) {
    case 'under_review':
      label = 'Under human review';
      explanation = reviewerName
        ? `Actively assigned to safety officer: ${reviewerName}`
        : 'Actively being reviewed by a qualified specialist';
      iconName = 'person_search';
      containerStyle = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/30';
      break;

    case 'reviewer_requested_clarification':
      label = 'Clarification requested';
      explanation = 'Specialist requested further patient or reporter follow-up';
      iconName = 'contact_support';
      containerStyle = 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/30';
      break;

    case 'returned_for_clarification':
      label = 'Returned for follow-up';
      explanation = 'Additional data points needed before formal ICH E2B sign-off';
      iconName = 'assignment_return';
      containerStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-tertiary)] border-[var(--md-sys-color-tertiary)]/40';
      break;

    case 'reviewed':
      label = 'Human review completed';
      explanation = reviewerName
        ? `Physician sign-off recorded by ${reviewerName}`
        : 'Reviewed and validated by a pharmacovigilance physician';
      iconName = 'fact_check';
      containerStyle = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/30';
      break;

    case 'awaiting_review':
    default:
      label = 'Awaiting human review';
      explanation = 'Case queued for qualified specialist evaluation';
      iconName = 'hourglass_empty';
      containerStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]';
      break;
  }

  return (
    <div id={id} className={`inline-flex flex-col ${className}`}>
      <span
        role="status"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border ${containerStyle}`}
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          {iconName}
        </span>
        {label}
        {updatedDate && <span className="opacity-75 font-mono text-[11px] ml-1">({updatedDate})</span>}
      </span>
      {showExplanation && (
        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
          {explanation}
        </span>
      )}
    </div>
  );
};
