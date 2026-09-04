import React, { useState } from 'react';
import { M3Card } from '../../core/M3Card';
import { M3TextField } from '../../core/M3TextField';
import { M3Select } from '../../core/M3Select';
import { M3Button } from '../../core/M3Button';

export interface HealthExperienceEntryProps {
  id?: string;
  onSubmitExperience?: (data: { narrative: string; timing: string }) => void;
  defaultNarrative?: string;
  defaultTiming?: string;
  className?: string;
}

/**
 * HealthExperienceEntry - Patient Symptom Narrative Intake
 * Plain-language intake allowing patients to describe changes in their own words.
 * Composes Pass A M3TextField, M3Select, and M3Button.
 */
export const HealthExperienceEntry: React.FC<HealthExperienceEntryProps> = ({
  id = 'health-experience-entry',
  onSubmitExperience,
  defaultNarrative = '',
  defaultTiming = 'today',
  className = '',
}) => {
  const [narrative, setNarrative] = useState(defaultNarrative);
  const [timing, setTiming] = useState(defaultTiming);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) {
      setError('Please describe what you experienced before continuing.');
      return;
    }
    setError(null);
    if (onSubmitExperience) {
      onSubmitExperience({ narrative, timing });
    }
  };

  return (
    <M3Card id={id} variant="outlined" className={`space-y-4 ${className}`}>
      <div>
        <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
          Patient Experience Intake
        </span>
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
          How are you feeling?
        </h3>
        <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          Describe what you noticed in your own words.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <M3TextField
          id={`${id}-narrative`}
          type="textarea"
          rows={3}
          label="Describe your experience"
          placeholder="For example: I noticed a redness on my arms two days after taking the new capsule..."
          value={narrative}
          onChange={(e) => {
            setNarrative(e.target.value);
            if (error) setError(null);
          }}
          required
          error={!!error}
          errorText={error || undefined}
          supportingText="Take your time. Specific details about timing or physical changes are helpful."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <M3Select
            id={`${id}-timing`}
            label="When did you first notice this?"
            value={timing}
            onChange={setTiming}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: '2-3-days-ago', label: '2–3 days ago' },
              { value: 'within-past-week', label: 'Within the past week' },
              { value: 'more-than-a-week', label: 'More than a week ago' },
            ]}
          />

          <div className="flex justify-end pb-1">
            <M3Button
              id={`${id}-continue-btn`}
              variant="filled"
              label="Continue"
              trailingIcon="arrow_forward"
              type="submit"
            />
          </div>
        </div>
      </form>
    </M3Card>
  );
};
