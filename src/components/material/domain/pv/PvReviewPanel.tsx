import React from 'react';
import { M3Card } from '../../core/M3Card';
import { PvCaseStatus } from './PvCaseStatus';
import { PvCaseMetadata } from './PvCaseMetadata';
import { PvCaseModel, ValidationCheckItem } from '../types';

export interface PvReviewPanelProps {
  id?: string;
  caseData: PvCaseModel;
  narrativeText?: string;
  validationItems?: ValidationCheckItem[];
  concomitantMedications?: string[];
  medicalHistory?: string[];
  className?: string;
}

/**
 * PvReviewPanel - Full-Featured Pharmacovigilance Case Inspection Panel
 * Organizes case narrative, drug details, validation checkpoints, and clinical context.
 */
export const PvReviewPanel: React.FC<PvReviewPanelProps> = ({
  id = 'pv-review-panel',
  caseData,
  narrativeText = 'Patient experienced acute pruritus and erythematous maculopapular rash on both upper extremities starting 48 hours following commencement of oral Amoxicillin 500 mg BID for acute sinusitis. No prior history of penicillin hypersensitivity. Suspect medication ceased on Day 4 with gradual clearing of skin lesions over the subsequent 72 hours.',
  validationItems = [
    { id: '1', label: 'Identifiable Patient', status: 'complete', detail: 'Age 42, Female' },
    { id: '2', label: 'Identifiable Reporter', status: 'complete', detail: 'Consumer / Patient' },
    { id: '3', label: 'Suspected Medicinal Product', status: 'complete', detail: 'Amoxicillin 500 mg oral' },
    { id: '4', label: 'Adverse Event / Reaction', status: 'complete', detail: 'Erythematous rash (MedDRA PT: Rash erythematous)' },
  ],
  concomitantMedications = ['Multivitamin daily', 'Acetaminophen 500mg PRN (1 dose)'],
  medicalHistory = ['Mild seasonal allergic rhinitis', 'No chronic hepatic or renal impairment'],
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Pharmacovigilance Case Review
          </span>
          <h2 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            ICSR Case #{caseData.caseNumber}
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Suspect: {caseData.suspectMedicine} • Reaction: {caseData.reportedReaction}
          </p>
        </div>
        <PvCaseStatus status={caseData.status} />
      </div>

      {/* Metadata Bar */}
      <PvCaseMetadata caseData={caseData} />

      {/* Primary Case Narrative */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] block">
          Primary Clinical Narrative
        </span>
        <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-xs text-[var(--md-sys-color-on-surface)] leading-relaxed border border-[var(--md-sys-color-outline-variant)]/30">
          {narrativeText}
        </div>
      </div>

      {/* Concomitants and Medical Context Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
          <span className="font-semibold text-[var(--md-sys-color-on-surface)] block mb-1.5">
            Concomitant Medications
          </span>
          <ul className="space-y-1 text-[var(--md-sys-color-on-surface-variant)]">
            {concomitantMedications.map((med, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] shrink-0" />
                {med}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
          <span className="font-semibold text-[var(--md-sys-color-on-surface)] block mb-1.5">
            Relevant Medical History
          </span>
          <ul className="space-y-1 text-[var(--md-sys-color-on-surface-variant)]">
            {medicalHistory.map((hist, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-secondary)] shrink-0" />
                {hist}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Core ICH Criteria Validation Bar */}
      <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs">
        <span className="font-semibold text-[var(--md-sys-color-on-surface)] block mb-2">
          Regulatory Validation Elements (ICH E2B)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {validationItems.map((val) => (
            <div key={val.id} className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30">
              <span className="font-medium text-[var(--md-sys-color-on-surface)] block">
                {val.label}
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-secondary)] font-semibold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">check</span>
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </M3Card>
  );
};
