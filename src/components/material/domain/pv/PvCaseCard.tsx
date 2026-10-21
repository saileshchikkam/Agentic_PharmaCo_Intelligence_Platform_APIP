import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';
import { PvCaseStatus } from './PvCaseStatus';
import { PvCaseModel } from '../types';

export interface PvCaseCardProps {
  id?: string;
  caseItem: PvCaseModel;
  onOpenCase?: (caseItem: PvCaseModel) => void;
  className?: string;
}

/**
 * PvCaseCard - Professional Pharmacovigilance Case Summary Card
 * Composes Material 3 surfaces with calm, legible typography.
 * Completely free of enterprise dashboard metric clutter.
 */
export const PvCaseCard: React.FC<PvCaseCardProps> = ({
  id,
  caseItem,
  onOpenCase,
  className = '',
}) => {
  return (
    <M3Card
      id={id || `pv-case-${caseItem.id}`}
      variant="outlined"
      className={`space-y-4 hover:border-[var(--md-sys-color-primary)]/50 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-mono font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Case #{caseItem.caseNumber}
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            {caseItem.reportedReaction}
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Suspect medicine: <strong className="font-medium text-[var(--md-sys-color-on-surface)]">{caseItem.suspectMedicine}</strong> ({caseItem.dosage})
          </p>
        </div>
        <PvCaseStatus status={caseItem.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30">
        <span>Reporter: <strong>{caseItem.reporterType}</strong></span>
        <span>Demographics: <strong>{caseItem.patientDemographics}</strong></span>
        <span>Updated: {caseItem.lastUpdated}</span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
        <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
          {caseItem.e2bCompliant ? 'ICH E2B(R3) compliant' : 'Awaiting required fields'}
        </span>
        <M3Button
          id={`btn-open-case-${caseItem.id}`}
          variant="tonal"
          label="Open case"
          trailingIcon="chevron_right"
          onClick={() => onOpenCase && onOpenCase(caseItem)}
        />
      </div>
    </M3Card>
  );
};
