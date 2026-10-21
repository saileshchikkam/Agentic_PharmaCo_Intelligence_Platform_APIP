import React, { useState } from 'react';
import { M3Card } from '../../core/M3Card';
import { M3TextField } from '../../core/M3TextField';
import { M3Button } from '../../core/M3Button';

export interface AdrClarificationRequestProps {
  id?: string;
  prompt?: string;
  question: string;
  fieldLabel: string;
  placeholder?: string;
  onSaveClarification?: (value: string) => void;
  className?: string;
}

/**
 * AdrClarificationRequest - Supportive Follow-Up Question
 * Invites patients to provide specific missing dates or batch details without being interrogative.
 */
export const AdrClarificationRequest: React.FC<AdrClarificationRequestProps> = ({
  id = 'adr-clarification-request',
  prompt = 'More information may help complete your report.',
  question = 'When did the rash first appear?',
  fieldLabel = 'Date or approximate time',
  placeholder = 'e.g., 2 days after first dose, or Oct 12th morning...',
  onSaveClarification,
  className = '',
}) => {
  const [value, setValue] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveClarification && value.trim()) {
      onSaveClarification(value);
      setIsSaved(true);
    }
  };

  return (
    <M3Card
      id={id}
      variant="filled"
      className={`bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-3.5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            help_outline
          </span>
        </div>
        <div>
          <span className="m3-label-small text-[var(--md-sys-color-primary)] font-semibold uppercase tracking-wider block">
            Follow-Up Clarification
          </span>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            {prompt}
          </p>
          <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-1">
            {question}
          </h4>
        </div>
      </div>

      {!isSaved ? (
        <form onSubmit={handleSave} className="flex flex-col sm:flex-row items-end gap-3 pt-1">
          <div className="flex-1 w-full">
            <M3TextField
              id={`${id}-input`}
              label={fieldLabel}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              supportingText="Approximate estimates are acceptable if exact date is unknown."
            />
          </div>
          <M3Button
            id={`${id}-submit`}
            variant="tonal"
            label="Save detail"
            leadingIcon="save"
            type="submit"
            disabled={!value.trim()}
          />
        </form>
      ) : (
        <div className="p-3 rounded-lg bg-[var(--md-sys-color-secondary-container)]/70 text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Detail recorded: "{value}"
          </span>
          <button
            type="button"
            onClick={() => setIsSaved(false)}
            className="text-[11px] underline font-semibold"
          >
            Edit
          </button>
        </div>
      )}
    </M3Card>
  );
};
