import React from 'react';
import { M3Button } from '../../core/M3Button';

export interface ReviewActionGroupProps {
  id?: string;
  onRequestClarification?: () => void;
  onFlagForInvestigation?: () => void;
  onApproveSignOff?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ReviewActionGroup - Qualified Pharmacovigilance Decision Actions
 * Supports human-in-the-loop validation, clarification routing, or committee escalation.
 */
export const ReviewActionGroup: React.FC<ReviewActionGroupProps> = ({
  id = 'review-action-group',
  onRequestClarification,
  onFlagForInvestigation,
  onApproveSignOff,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {onRequestClarification && (
          <M3Button
            id={`${id}-clarify`}
            variant="outlined"
            label="Request clarification"
            leadingIcon="help_outline"
            disabled={disabled}
            onClick={onRequestClarification}
          />
        )}
        {onFlagForInvestigation && (
          <M3Button
            id={`${id}-flag`}
            variant="tonal"
            label="Flag for investigation"
            leadingIcon="flag"
            disabled={disabled}
            onClick={onFlagForInvestigation}
          />
        )}
      </div>

      {onApproveSignOff && (
        <M3Button
          id={`${id}-signoff`}
          variant="filled"
          label="Complete PV reviewer sign-off"
          leadingIcon="verified"
          disabled={disabled}
          onClick={onApproveSignOff}
        />
      )}
    </div>
  );
};
