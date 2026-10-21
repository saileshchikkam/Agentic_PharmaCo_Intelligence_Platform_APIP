import React, { useState } from 'react';
import { M3Card } from '../../core/M3Card';
import { M3TextField } from '../../core/M3TextField';
import { M3Select } from '../../core/M3Select';
import { M3Button } from '../../core/M3Button';
import { M3Checkbox } from '../../core/M3Checkbox';

export interface PvHumanDecisionAreaProps {
  id?: string;
  caseNumber: string;
  onCommitDecision?: (decision: {
    decisionType: string;
    clinicalRationale: string;
    expeditedReportRequired: boolean;
    reviewerName: string;
  }) => void;
  className?: string;
}

/**
 * PvHumanDecisionArea - Safety Officer / Physician Review Workspace
 * Enforces human-in-the-loop sign-off with clear clinical rationale.
 */
export const PvHumanDecisionArea: React.FC<PvHumanDecisionAreaProps> = ({
  id = 'pv-human-decision-area',
  caseNumber,
  onCommitDecision,
  className = '',
}) => {
  const [decisionType, setDecisionType] = useState('approve_icsr');
  const [rationale, setRationale] = useState(
    'Event occurred with strong temporal plausibility following suspect medication initiation. Known adverse reaction profile corroborated in prescribing information.'
  );
  const [expedited, setExpedited] = useState(false);
  const [reviewerName, setReviewerName] = useState('Elena Vance, RPh');
  const [isSigned, setIsSigned] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCommitDecision) {
      onCommitDecision({
        decisionType,
        clinicalRationale: rationale,
        expeditedReportRequired: expedited,
        reviewerName,
      });
    }
    setIsSigned(true);
  };

  return (
    <M3Card id={id} variant="outlined" className={`space-y-4 ${className}`}>
      <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
        <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
          Clinical Review Area
        </span>
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
          Human Sign-Off & Regulatory Action ({caseNumber})
        </h3>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          Qualified human reviewer assessment. Decisions commit formal audit records.
        </p>
      </div>

      {!isSigned ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <M3Select
              id={`${id}-decision-type`}
              label="Review disposition"
              value={decisionType}
              onChange={setDecisionType}
              options={[
                { value: 'approve_icsr', label: 'Approve ICSR for Safety Archive' },
                { value: 'request_clarification', label: 'Request Reporter Clarification' },
                { value: 'escalate_committee', label: 'Escalate to Safety Committee' },
                { value: 'close_unassessable', label: 'Close as Unassessable' },
              ]}
            />

            <M3TextField
              id={`${id}-reviewer-name`}
              label="Qualified PV Reviewer / Officer"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              required
            />
          </div>

          <M3TextField
            id={`${id}-rationale`}
            type="textarea"
            rows={3}
            label="Clinical rationale & findings"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            required
            supportingText="Record medical perspective regarding timing, dechallenge/rechallenge, and confounding conditions."
          />

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
            <M3Checkbox
              id={`${id}-expedited`}
              label="Flag for expedited regulatory assessment"
              supportingText="Review applicable jurisdiction-specific reporting requirements."
              checked={expedited}
              onChange={setExpedited}
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <M3Button
              id={`${id}-submit-decision`}
              variant="filled"
              label="Record Human Decision"
              leadingIcon="verified"
              type="submit"
            />
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-[var(--md-sys-color-secondary-container)]/70 text-[var(--md-sys-color-on-secondary-container)] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Review Recorded & Staged
          </div>
          <p className="text-xs">
            Review completed by <strong>{reviewerName}</strong>. Clinical rationale logged.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsSigned(false)}
              className="text-xs underline font-medium"
            >
              Modify or amend decision
            </button>
          </div>
        </div>
      )}
    </M3Card>
  );
};
