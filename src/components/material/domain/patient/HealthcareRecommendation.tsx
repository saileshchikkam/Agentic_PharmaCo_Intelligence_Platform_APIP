import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';

export interface HealthcareRecommendationProps {
  id?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  urgencyLevel?: 'informational' | 'prompt_consultation';
  className?: string;
}

/**
 * HealthcareRecommendation - Calm, Non-Diagnostic Healthcare Guidance
 * Material 3 based guidance reminding patients to consult qualified clinicians.
 * Never outputs diagnostic conclusions or artificial clinical certainty.
 */
export const HealthcareRecommendation: React.FC<HealthcareRecommendationProps> = ({
  id = 'healthcare-recommendation',
  title = 'Healthcare support',
  message = 'Based on the information you provided, consider speaking with a qualified healthcare professional, pharmacist, or prescriber regarding these symptoms.',
  actionLabel = 'Find healthcare support',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  urgencyLevel = 'informational',
  className = '',
}) => {
  return (
    <M3Card
      id={id}
      variant={urgencyLevel === 'prompt_consultation' ? 'filled' : 'outlined'}
      className={`border border-[var(--md-sys-color-outline-variant)]/60 space-y-4 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            local_hospital
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Guidance & consultation support
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            {title}
          </h3>
          <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
        <M3Button
          id={`${id}-action`}
          variant="tonal"
          label={actionLabel}
          leadingIcon="support_agent"
          onClick={onAction}
        />
        {secondaryActionLabel && (
          <M3Button
            id={`${id}-sec-action`}
            variant="text"
            label={secondaryActionLabel}
            onClick={onSecondaryAction}
          />
        )}
      </div>

      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] block italic">
        Note: This platform does not provide medical diagnoses, treatment decisions, or emergency dispatch.
      </span>
    </M3Card>
  );
};
