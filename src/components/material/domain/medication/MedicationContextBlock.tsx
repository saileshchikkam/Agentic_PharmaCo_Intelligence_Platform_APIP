import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';
import { PatientMedication } from '../types';

export interface MedicationContextBlockProps {
  id?: string;
  medicationName: string;
  dosage?: string;
  frequencyRoute?: string;
  onChangeMedication?: () => void;
  className?: string;
}

/**
 * MedicationContextBlock - Suspect / Involved Medication Banner
 * Reusable context anchor inside adverse drug reaction workflows.
 */
export const MedicationContextBlock: React.FC<MedicationContextBlockProps> = ({
  id = 'medication-context-block',
  medicationName,
  dosage = '500 mg',
  frequencyRoute = 'Twice daily • Oral capsule',
  onChangeMedication,
  className = '',
}) => {
  return (
    <M3Card
      id={id}
      variant="filled"
      className={`bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/40 p-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]/40 shrink-0">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              medication
            </span>
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Medication involved
            </span>
            <h4 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
              {medicationName} {dosage && <span className="font-normal text-sm text-[var(--md-sys-color-on-surface-variant)]">({dosage})</span>}
            </h4>
            {frequencyRoute && (
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                {frequencyRoute}
              </p>
            )}
          </div>
        </div>

        {onChangeMedication && (
          <M3Button
            id={`${id}-change-btn`}
            variant="outlined"
            label="Change medication"
            leadingIcon="swap_horiz"
            onClick={onChangeMedication}
            className="shrink-0 text-xs"
          />
        )}
      </div>
    </M3Card>
  );
};
