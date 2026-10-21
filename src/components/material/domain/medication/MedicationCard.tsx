import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';
import { MedicationStatus } from './MedicationStatus';
import { PatientMedication } from '../types';

export interface MedicationCardProps {
  id?: string;
  medication: PatientMedication;
  onViewDetails?: (med: PatientMedication) => void;
  onReportReaction?: (med: PatientMedication) => void;
  className?: string;
}

/**
 * MedicationCard - Material 3 Scannable Medication Card
 * Clear typography, respectful grouping, and semantic status.
 * Never looks like a metric/KPI box or generic dashboard card.
 */
export const MedicationCard: React.FC<MedicationCardProps> = ({
  id,
  medication,
  onViewDetails,
  onReportReaction,
  className = '',
}) => {
  return (
    <M3Card
      id={id || `med-card-${medication.id}`}
      variant="outlined"
      className={`space-y-4 hover:border-[var(--md-sys-color-primary)]/50 transition-colors ${className}`}
    >
      {/* Header with Drug Name & Status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Prescription medication
          </span>
          <h3 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            {medication.name}
          </h3>
          <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            {medication.dosage} • {medication.route}
          </p>
        </div>
        <MedicationStatus status={medication.status} />
      </div>

      {/* Regimen & Timing Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-xs">
        <div>
          <span className="text-[var(--md-sys-color-on-surface-variant)] block">Schedule</span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)] mt-0.5 block">
            {medication.frequency}
          </span>
        </div>
        <div>
          <span className="text-[var(--md-sys-color-on-surface-variant)] block">Course Started</span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)] mt-0.5 block">
            {medication.startedDate}
          </span>
        </div>
        {medication.indication && (
          <div className="sm:col-span-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <span className="text-[var(--md-sys-color-on-surface-variant)] block">Reason / Indication</span>
            <span className="font-medium text-[var(--md-sys-color-on-surface)] mt-0.5 block">
              {medication.indication}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
        <M3Button
          id={`btn-view-${medication.id}`}
          variant="text"
          label="View details"
          onClick={() => onViewDetails && onViewDetails(medication)}
        />
        {onReportReaction && (
          <M3Button
            id={`btn-report-rxn-${medication.id}`}
            variant="tonal"
            label="Report a reaction"
            leadingIcon="medication"
            onClick={() => onReportReaction(medication)}
          />
        )}
      </div>
    </M3Card>
  );
};
