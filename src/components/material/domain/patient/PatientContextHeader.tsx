import React from 'react';

export interface PatientContextHeaderProps {
  id?: string;
  greeting?: string;
  question?: string;
  contextText?: string;
  className?: string;
}

/**
 * PatientContextHeader - Restrained Patient Health Space Header
 * Material 3 compliant header with calm typography and supportive tone.
 * Avoids marketing hero clichés, oversized headings, or flashy gradients.
 */
export const PatientContextHeader: React.FC<PatientContextHeaderProps> = ({
  id = 'patient-context-header',
  greeting = 'Good morning',
  question = 'How are you feeling today?',
  contextText = 'This is your private health space. You can track your medications, document symptom experiences, or prepare a medication safety report.',
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`py-4 px-1 border-b border-[var(--md-sys-color-outline-variant)]/40 ${className}`}
    >
      <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
        {greeting}
      </span>
      <h1 className="m3-headline-medium text-[var(--md-sys-color-on-surface)] mt-1 tracking-tight font-medium">
        {question}
      </h1>
      {contextText && (
        <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-1.5 max-w-3xl leading-relaxed">
          {contextText}
        </p>
      )}
    </div>
  );
};
