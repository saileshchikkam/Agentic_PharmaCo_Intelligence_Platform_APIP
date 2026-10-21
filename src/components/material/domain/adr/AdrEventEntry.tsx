import React, { useState } from 'react';
import { M3Card } from '../../core/M3Card';
import { M3TextField } from '../../core/M3TextField';
import { M3Select } from '../../core/M3Select';
import { M3RadioGroup } from '../../core/M3Radio';
import { M3Button } from '../../core/M3Button';

export interface AdrEventEntryProps {
  id?: string;
  medicationName: string;
  onSaveEvent?: (data: {
    eventDescription: string;
    onset: string;
    duration: string;
    severity: string;
    outcomeStatus: string;
  }) => void;
  className?: string;
}

/**
 * AdrEventEntry - Structured Adverse Reaction Form Component
 * Accessible, clear hierarchy for capturing event timing, duration, and patient-reported severity.
 */
export const AdrEventEntry: React.FC<AdrEventEntryProps> = ({
  id = 'adr-event-entry',
  medicationName,
  onSaveEvent,
  className = '',
}) => {
  const [eventDescription, setEventDescription] = useState('Mild itching and erythematous macular rash on forearms.');
  const [onset, setOnset] = useState('2-days-after');
  const [duration, setDuration] = useState('2-to-3-days');
  const [severity, setSeverity] = useState('mild');
  const [outcomeStatus, setOutcomeStatus] = useState('recovering');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveEvent) {
      onSaveEvent({
        eventDescription,
        onset,
        duration,
        severity,
        outcomeStatus,
      });
    }
  };

  return (
    <M3Card id={id} variant="outlined" className={`space-y-5 ${className}`}>
      <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
        <span className="m3-label-small text-[var(--md-sys-color-primary)] font-semibold uppercase tracking-wider block">
          Event Documentation
        </span>
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
          Adverse Experience Details
        </h3>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          Documenting symptoms noticed in connection with <strong>{medicationName}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <M3TextField
          id={`${id}-desc`}
          type="textarea"
          rows={3}
          label="Event description"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          required
          supportingText="Describe the specific physical sensation, appearance, or change you experienced."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <M3Select
            id={`${id}-onset`}
            label="Onset relative to medication"
            value={onset}
            onChange={setOnset}
            options={[
              { value: 'same-day', label: 'Same day (hours after dose)' },
              { value: '2-days-after', label: '2 days after first dose' },
              { value: '3-5-days-after', label: '3 to 5 days after starting' },
              { value: 'over-a-week', label: 'More than 1 week after starting' },
            ]}
          />

          <M3Select
            id={`${id}-duration`}
            label="Approximate duration"
            value={duration}
            onChange={setDuration}
            options={[
              { value: 'hours', label: 'A few hours' },
              { value: '1-day', label: 'About 24 hours' },
              { value: '2-to-3-days', label: '2 to 3 days' },
              { value: 'ongoing', label: 'Currently ongoing' },
            ]}
          />
        </div>

        <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3">
          <M3RadioGroup
            name={`${id}-severity`}
            label="Patient-reported severity"
            supportingText="This reflects how the event felt to you. It is not an automated medical determination."
            direction="horizontal"
            value={severity}
            onChange={setSeverity}
            options={[
              { value: 'mild', label: 'Mild (tolerable)' },
              { value: 'moderate', label: 'Moderate (interferes partially)' },
              { value: 'severe', label: 'Severe (incapacitating)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30">
          <M3Select
            id={`${id}-outcome`}
            label="Current symptom status"
            value={outcomeStatus}
            onChange={setOutcomeStatus}
            options={[
              { value: 'recovered', label: 'Fully resolved / Recovered' },
              { value: 'recovering', label: 'Improving / Recovering' },
              { value: 'unchanged', label: 'Unchanged / Still present' },
              { value: 'worsening', label: 'Worsening' },
            ]}
          />

          <div className="flex justify-end pt-2">
            <M3Button
              id={`${id}-save-btn`}
              variant="filled"
              label="Save event details"
              leadingIcon="check"
              type="submit"
            />
          </div>
        </div>
      </form>
    </M3Card>
  );
};
