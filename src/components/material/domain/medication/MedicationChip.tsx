import React from 'react';
import { M3Chip } from '../../core/M3Chip';
import { PatientMedication } from '../types';

export interface MedicationChipProps {
  id?: string;
  medication: Pick<PatientMedication, 'id' | 'name' | 'dosage' | 'status'>;
  onClick?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  type?: 'assist' | 'filter' | 'input';
  className?: string;
}

/**
 * MedicationChip - Compact Medication Representation
 * Uses Material 3 chip semantics for quick filtering or selection in ADR workflows.
 */
export const MedicationChip: React.FC<MedicationChipProps> = ({
  id,
  medication,
  onClick,
  onRemove,
  selected = false,
  type = 'assist',
  className = '',
}) => {
  const label = `${medication.name} ${medication.dosage}`.trim();

  return (
    <M3Chip
      id={id || `med-chip-${medication.id}`}
      type={type}
      label={label}
      icon="medication"
      selected={selected}
      onClick={onClick}
      onRemove={onRemove}
      className={className}
    />
  );
};
