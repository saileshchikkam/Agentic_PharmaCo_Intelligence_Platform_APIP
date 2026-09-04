import React from 'react';
import { PvCaseState } from '../types';

export interface PvCaseStatusProps {
  id?: string;
  status: PvCaseState;
  showDot?: boolean;
  className?: string;
}

/**
 * PvCaseStatus - Material 3 PV Case Lifecycle Indicator
 * Reflects authentic pharmacovigilance workflow stages (New, Incomplete, Validation Required, Under Review, etc.)
 */
export const PvCaseStatus: React.FC<PvCaseStatusProps> = ({
  id,
  status,
  showDot = true,
  className = '',
}) => {
  let label = 'New';
  let badgeStyle = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/30';
  let dotBg = 'bg-[var(--md-sys-color-primary)]';

  switch (status) {
    case 'incomplete':
      label = 'Incomplete';
      badgeStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]';
      dotBg = 'bg-[var(--md-sys-color-outline)]';
      break;

    case 'validation_required':
      label = 'Validation required';
      badgeStyle = 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/30';
      dotBg = 'bg-[var(--md-sys-color-tertiary)]';
      break;

    case 'under_review':
      label = 'Under review';
      badgeStyle = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/30';
      dotBg = 'bg-[var(--md-sys-color-secondary)]';
      break;

    case 'needs_clarification':
      label = 'Needs clarification';
      badgeStyle = 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/30';
      dotBg = 'bg-[var(--md-sys-color-tertiary)]';
      break;

    case 'reviewed':
      label = 'Reviewed';
      badgeStyle = 'bg-[var(--md-sys-color-secondary-container)]/90 text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/40 font-medium';
      dotBg = 'bg-[var(--md-sys-color-secondary)]';
      break;

    case 'closed':
      label = 'Closed';
      badgeStyle = 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]/60';
      dotBg = 'bg-[var(--md-sys-color-outline)]';
      break;

    case 'new':
    default:
      label = 'New';
      badgeStyle = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/30';
      dotBg = 'bg-[var(--md-sys-color-primary)]';
      break;
  }

  return (
    <span
      id={id}
      role="status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeStyle} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} aria-hidden="true" />}
      {label}
    </span>
  );
};
