import React from 'react';
import { M3Card } from '../../core/M3Card';
import { HumanReviewStatus, HumanReviewStateType } from './HumanReviewStatus';

export interface ReviewSummaryProps {
  id?: string;
  caseNumber: string;
  reviewState: HumanReviewStateType;
  reviewedBy?: string;
  reviewDate?: string;
  clinicalNotes?: string;
  regulatoryRecommendation?: string;
  className?: string;
}

/**
 * ReviewSummary - Human Review Outcome & Sign-Off Record
 * Visualizes physician notes, audit trail, and regulatory recommendation.
 */
export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  id = 'review-summary',
  caseNumber,
  reviewState,
  reviewedBy = 'Elena Vance (Lead Pharmacovigilance Reviewer)',
  reviewDate = '04 Sep 2026',
  clinicalNotes = 'Patient report demonstrates clear temporal relationship following initiation of suspect antibiotic. Documented dechallenge is positive with cutaneous symptoms resolving post cessation.',
  regulatoryRecommendation = 'Flag for expedited regulatory assessment per applicable jurisdiction-specific requirements.',
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Case Review Record
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            Human Review Summary • {caseNumber}
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Sign-off by {reviewedBy} • {reviewDate}
          </p>
        </div>
        <HumanReviewStatus state={reviewState} reviewerName={reviewedBy} />
      </div>

      <div className="space-y-2 text-xs">
        <span className="text-[var(--md-sys-color-on-surface-variant)] block font-medium">
          Clinical Reviewer Assessment
        </span>
        <p className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] leading-relaxed">
          {clinicalNotes}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-xs flex items-start gap-2.5">
        <span className="material-symbols-outlined text-[var(--md-sys-color-primary)] text-lg shrink-0 mt-0.5">
          recommend
        </span>
        <div>
          <span className="font-semibold text-[var(--md-sys-color-on-surface)] block">
            Regulatory Disposition Recommendation
          </span>
          <span className="text-[var(--md-sys-color-on-surface-variant)] block mt-0.5">
            {regulatoryRecommendation}
          </span>
        </div>
      </div>
    </M3Card>
  );
};
