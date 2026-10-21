import React from 'react';
import { M3Card } from '../../core/M3Card';

export interface CaseActivityItem {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  role: string;
  note?: string;
}

export interface PvCaseActivityProps {
  id?: string;
  activities: CaseActivityItem[];
  className?: string;
}

/**
 * PvCaseActivity - Case Audit Trail & History Log
 * Tracks chronological human actions, triage changes, and follow-ups.
 */
export const PvCaseActivity: React.FC<PvCaseActivityProps> = ({
  id = 'pv-case-activity',
  activities,
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-4 ${className}`}>
      <div className="border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2.5">
        <span className="m3-label-small text-[var(--md-sys-color-primary)] font-semibold uppercase tracking-wider block">
          Audit Trail
        </span>
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
          Case Activity History
        </h3>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
          Log of human reviewer interventions and status transitions.
        </p>
      </div>

      <div className="space-y-3 pt-1">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-xs border border-[var(--md-sys-color-outline-variant)]/20"
          >
            <div className="p-1.5 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                history_edu
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                  {act.action}
                </span>
                <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  {act.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                {act.author} • <span className="italic">{act.role}</span>
              </p>
              {act.note && (
                <p className="text-[11px] text-[var(--md-sys-color-on-surface)] mt-1.5 p-2 rounded bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30">
                  {act.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </M3Card>
  );
};
