import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Chip } from '../../core/M3Chip';
import { PatientHealthProfile } from '../types';

export interface HealthProfileSummaryProps {
  id?: string;
  profile: PatientHealthProfile;
  onEditProfile?: () => void;
  className?: string;
}

/**
 * HealthProfileSummary - Material 3 Patient Profile Overview
 * Displays minimal, privacy-conscious health context without social profile tropes.
 */
export const HealthProfileSummary: React.FC<HealthProfileSummaryProps> = ({
  id = 'health-profile-summary',
  profile,
  onEditProfile,
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
              Health Profile Overview
            </span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-outline)] font-normal italic">
              Synthetic demonstration
            </span>
          </div>
          <h2 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            Individual Context ({profile.initials})
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            {profile.age} • {profile.gender}
          </p>
        </div>
        {onEditProfile && (
          <button
            type="button"
            onClick={onEditProfile}
            className="text-xs font-medium text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Update
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-1.5">
            Documented Conditions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {profile.knownConditions.map((cond) => (
              <M3Chip key={cond} type="assist" label={cond} />
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block mb-1.5">
            Documented Allergies
          </span>
          <div className="flex flex-wrap gap-1.5">
            {profile.allergies.map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60"
              >
                {allergy}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)] pt-2 border-t border-[var(--md-sys-color-outline-variant)]/40">
        <span>Active medicines recorded: <strong>{profile.activeMedicationsCount}</strong></span>
        <span>Last updated: {profile.lastUpdated}</span>
      </div>
    </M3Card>
  );
};
