import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';
import { AdrReviewStatus } from './AdrReviewStatus';
import { AdrExperienceModel } from '../types';

export interface AdrReportSummaryProps {
  id?: string;
  report: AdrExperienceModel;
  onEdit?: () => void;
  onReview?: () => void;
  onSaveDraft?: () => void;
  className?: string;
}

/**
 * AdrReportSummary - Read-Only Structured Overview of an Adverse Reaction Report
 * Presents verified fields before submission with clear edit, review, and draft actions.
 */
export const AdrReportSummary: React.FC<AdrReportSummaryProps> = ({
  id = 'adr-report-summary',
  report,
  onEdit,
  onReview,
  onSaveDraft,
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Adverse Drug Reaction Summary
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            Reported Experience Overview
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Review the captured details prior to confirming submission to safety records.
          </p>
        </div>
        <AdrReviewStatus state={report.reviewState} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
          <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1">
            Suspect Medication
          </span>
          <span className="font-semibold text-sm text-[var(--md-sys-color-on-surface)] block">
            {report.suspectMedication}
          </span>
          {report.dosage && (
            <span className="text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">
              Dosage: {report.dosage}
            </span>
          )}
        </div>

        <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
          <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1">
            Reported Event
          </span>
          <span className="font-semibold text-sm text-[var(--md-sys-color-on-surface)] block">
            {report.reportedReaction}
          </span>
          <span className="text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">
            Severity: {report.reportedSeverity || 'Patient-reported'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
          <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1">
            Onset & Timing
          </span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)] block">
            {report.firstNoticed}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
          <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1">
            Reported Outcome / Status
          </span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)] block">
            {report.outcome || 'Improving / Resolving'}
          </span>
        </div>

        {report.narrative && (
          <div className="sm:col-span-2 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
            <span className="text-[var(--md-sys-color-on-surface-variant)] block mb-1">
              Patient Narrative
            </span>
            <p className="text-[var(--md-sys-color-on-surface)] leading-relaxed">
              {report.narrative}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/40">
        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <M3Button
              id={`${id}-save-draft`}
              variant="text"
              label="Save draft"
              leadingIcon="save"
              onClick={onSaveDraft}
            />
          )}
          {onEdit && (
            <M3Button
              id={`${id}-edit`}
              variant="outlined"
              label="Edit details"
              leadingIcon="edit"
              onClick={onEdit}
            />
          )}
        </div>

        {onReview && (
          <M3Button
            id={`${id}-proceed-review`}
            variant="filled"
            label="Confirm & Proceed"
            leadingIcon="arrow_forward"
            onClick={onReview}
          />
        )}
      </div>
    </M3Card>
  );
};
