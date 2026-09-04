import React from 'react';
import { PatientMedication } from '../types';
import { MedicationStatus } from './MedicationStatus';

export interface MedicationSummaryProps {
  id?: string;
  medication: PatientMedication;
  className?: string;
}

/**
 * MedicationSummary - Compact Read-Only Medication Summary Row
 * Used in review panels, intake summaries, and quick lists.
 */
export const MedicationSummary: React.FC<MedicationSummaryProps> = ({
  id,
  medication,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex items-center justify-between p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)]">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            medication
          </span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
            {medication.name} <span className="font-normal text-[var(--md-sys-color-on-surface-variant)]">{medication.dosage}</span>
          </h4>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {medication.frequency} • {medication.route}
          </p>
        </div>
      </div>
      <MedicationStatus status={medication.status} />
    </div>
  );
};
