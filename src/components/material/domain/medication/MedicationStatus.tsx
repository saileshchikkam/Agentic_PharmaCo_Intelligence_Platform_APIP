import React from 'react';
import { MedicationState } from '../types';

export interface MedicationStatusProps {
  id?: string;
  status: MedicationState;
  showDescription?: boolean;
  className?: string;
}

/**
 * MedicationStatus - Semantic Informational Status Indicator
 * Compliant with Material 3 color tokens & accessibility guidelines.
 * Never relies on color alone; includes clear text label and role.
 */
export const MedicationStatus: React.FC<MedicationStatusProps> = ({
  id,
  status,
  showDescription = false,
  className = '',
}) => {
  let label = 'Active';
  let description = 'Currently scheduled as prescribed';
  let badgeClasses = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/30';
  let dotColor = 'bg-[var(--md-sys-color-secondary)]';

  switch (status) {
    case 'completed':
      label = 'Completed';
      description = 'Prescribed regimen fully concluded';
      badgeClasses = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]/60';
      dotColor = 'bg-[var(--md-sys-color-outline)]';
      break;

    case 'paused':
      label = 'Paused';
      description = 'Temporarily held under medical advice';
      badgeClasses = 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/30';
      dotColor = 'bg-[var(--md-sys-color-tertiary)]';
      break;

    case 'discontinued':
      label = 'Discontinued';
      description = 'Ceased prior to scheduled course completion';
      badgeClasses = 'bg-[var(--md-sys-color-error-container)]/70 text-[var(--md-sys-color-on-error-container)] border-[var(--md-sys-color-error)]/30';
      dotColor = 'bg-[var(--md-sys-color-error)]';
      break;

    case 'unknown':
      label = 'Status Unknown';
      description = 'Awaiting patient or provider verification';
      badgeClasses = 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]/40';
      dotColor = 'bg-[var(--md-sys-color-on-surface-variant)]';
      break;

    case 'active':
    default:
      label = 'Active';
      description = 'Currently scheduled as prescribed';
      badgeClasses = 'bg-[var(--md-sys-color-secondary-container)]/80 text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/40';
      dotColor = 'bg-[var(--md-sys-color-secondary)]';
      break;
  }

  return (
    <div id={id} className={`inline-flex flex-col ${className}`}>
      <span
        role="status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeClasses}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
        {label}
      </span>
      {showDescription && (
        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          {description}
        </span>
      )}
    </div>
  );
};
