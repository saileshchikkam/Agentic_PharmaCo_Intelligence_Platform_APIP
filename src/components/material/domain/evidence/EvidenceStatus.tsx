import React from 'react';

export type EvidenceStatusType = 'reference_available' | 'corroborated' | 'under_assessment';

export interface EvidenceStatusProps {
  id?: string;
  status: EvidenceStatusType;
  className?: string;
}

/**
 * EvidenceStatus - Scientific Reference Evidence Badge
 * Carefully characterizes scientific literature or label references without claiming absolute proof.
 */
export const EvidenceStatus: React.FC<EvidenceStatusProps> = ({
  id,
  status,
  className = '',
}) => {
  let label = 'Reference available';
  let badgeStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]';

  switch (status) {
    case 'corroborated':
      label = 'Literature corroborated';
      badgeStyle = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/30';
      break;

    case 'under_assessment':
      label = 'Under assessment';
      badgeStyle = 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/30';
      break;

    case 'reference_available':
    default:
      label = 'Reference available';
      badgeStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]';
      break;
  }

  return (
    <span
      id={id}
      role="status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeStyle} ${className}`}
    >
      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
        menu_book
      </span>
      {label}
    </span>
  );
};
