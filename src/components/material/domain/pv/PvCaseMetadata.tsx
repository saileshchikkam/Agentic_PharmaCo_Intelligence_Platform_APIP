import React from 'react';
import { PvCaseModel } from '../types';

export interface PvCaseMetadataProps {
  id?: string;
  caseData: PvCaseModel;
  className?: string;
}

/**
 * PvCaseMetadata - Key Regulatory Identifiers & Metadata Grid
 * Clean tabular metadata for safety officers and data managers.
 */
export const PvCaseMetadata: React.FC<PvCaseMetadataProps> = ({
  id = 'pv-case-metadata',
  caseData,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-xs border border-[var(--md-sys-color-outline-variant)]/30 ${className}`}
    >
      <div>
        <span className="text-[var(--md-sys-color-on-surface-variant)] block">Case Number</span>
        <span className="font-mono font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5 block">
          {caseData.caseNumber}
        </span>
      </div>

      <div>
        <span className="text-[var(--md-sys-color-on-surface-variant)] block">Reporter Type</span>
        <span className="font-medium text-[var(--md-sys-color-on-surface)] mt-0.5 block">
          {caseData.reporterType}
        </span>
      </div>

      <div>
        <span className="text-[var(--md-sys-color-on-surface-variant)] block">Initial Receipt</span>
        <span className="font-medium text-[var(--md-sys-color-on-surface)] mt-0.5 block">
          {caseData.dateReported}
        </span>
      </div>

      <div>
        <span className="text-[var(--md-sys-color-on-surface-variant)] block">Seriousness Criteria</span>
        <span className="font-medium text-[var(--md-sys-color-on-surface)] mt-0.5 block">
          {caseData.seriousness}
        </span>
      </div>
    </div>
  );
};
