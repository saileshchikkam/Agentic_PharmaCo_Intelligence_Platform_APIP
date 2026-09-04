import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';
import { AdrExperienceModel } from '../types';

export interface AdrSubmissionSummaryProps {
  id?: string;
  report: AdrExperienceModel;
  submissionReference: string;
  submissionDate: string;
  onDone?: () => void;
  onPrintOrExport?: () => void;
  className?: string;
}

/**
 * AdrSubmissionSummary - Post-Submission Confirmation Surface
 * Provides transmission reference and calm reassurance of privacy and human-in-the-loop review.
 */
export const AdrSubmissionSummary: React.FC<AdrSubmissionSummaryProps> = ({
  id = 'adr-submission-summary',
  report,
  submissionReference = 'APIP-INTAKE-2026-0891',
  submissionDate = '04 Sep 2026',
  onDone,
  onPrintOrExport,
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-5 ${className}`}>
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">
            task_alt
          </span>
        </div>
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            ADR Record Prepared
          </span>
          <h3 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            Report Ready for Review
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Reference code: <span className="font-mono font-semibold text-[var(--md-sys-color-on-surface)]">{submissionReference}</span> • {submissionDate}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Reported reaction</span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)]">{report.reportedReaction}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Suspected medicine</span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)]">{report.suspectMedication}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Review status</span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)]">Prepared for review</span>
        </div>
      </div>

      <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed p-3 rounded-lg bg-[var(--md-sys-color-surface-container-high)]/60">
        This adverse drug reaction record has been prepared within the application workflow. Qualified pharmacovigilance reviewers review staged reports before potential regulatory reporting under applicable guidelines.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/40">
        {onPrintOrExport && (
          <M3Button
            id={`${id}-export`}
            variant="text"
            label="Download receipt"
            leadingIcon="download"
            onClick={onPrintOrExport}
          />
        )}
        {onDone && (
          <M3Button
            id={`${id}-done`}
            variant="filled"
            label="Return to health space"
            onClick={onDone}
          />
        )}
      </div>
    </M3Card>
  );
};
