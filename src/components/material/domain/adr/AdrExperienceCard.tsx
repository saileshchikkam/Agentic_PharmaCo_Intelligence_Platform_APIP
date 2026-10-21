import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';
import { AdrReviewStatus } from './AdrReviewStatus';
import { AdrExperienceModel } from '../types';

export interface AdrExperienceCardProps {
  id?: string;
  experience: AdrExperienceModel;
  onReview?: (exp: AdrExperienceModel) => void;
  onEdit?: (exp: AdrExperienceModel) => void;
  className?: string;
}

/**
 * AdrExperienceCard - Possible Adverse Reaction Summary Card
 * Employs cautious safety terminology. Never asserts speculative causality as factual.
 */
export const AdrExperienceCard: React.FC<AdrExperienceCardProps> = ({
  id,
  experience,
  onReview,
  onEdit,
  className = '',
}) => {
  return (
    <M3Card
      id={id || `adr-card-${experience.id}`}
      variant="outlined"
      className={`space-y-4 hover:border-[var(--md-sys-color-primary)]/50 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Possible medication reaction
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            {experience.reportedReaction}
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Associated medication: <span className="font-medium text-[var(--md-sys-color-on-surface)]">{experience.suspectMedication}</span> {experience.dosage ? `(${experience.dosage})` : ''}
          </p>
        </div>
        <AdrReviewStatus state={experience.reviewState} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-xs">
        <div>
          <span className="text-[var(--md-sys-color-on-surface-variant)] block">First noticed</span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)] mt-0.5 block">
            {experience.firstNoticed}
          </span>
        </div>
        <div>
          <span className="text-[var(--md-sys-color-on-surface-variant)] block">Reported severity</span>
          <span className="font-medium text-[var(--md-sys-color-on-surface)] mt-0.5 block">
            {experience.reportedSeverity || 'Unspecified'}
          </span>
        </div>
        {experience.narrative && (
          <div className="sm:col-span-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <span className="text-[var(--md-sys-color-on-surface-variant)] block">Reported narrative</span>
            <p className="text-[var(--md-sys-color-on-surface)] mt-0.5 line-clamp-2 leading-relaxed">
              {experience.narrative}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic">
          Causality is evaluated separately through professional pharmacovigilance review.
        </span>
        <div className="flex items-center gap-2">
          {onEdit && (
            <M3Button
              id={`btn-edit-exp-${experience.id}`}
              variant="text"
              label="Edit"
              onClick={() => onEdit(experience)}
            />
          )}
          {onReview && (
            <M3Button
              id={`btn-review-exp-${experience.id}`}
              variant="tonal"
              label="Review experience"
              leadingIcon="fact_check"
              onClick={() => onReview(experience)}
            />
          )}
        </div>
      </div>
    </M3Card>
  );
};
