import React from 'react';
import { M3Card } from '../../core/M3Card';
import { EvidenceRecordModel } from '../types';

export interface EvidenceSummaryProps {
  id?: string;
  substanceName: string;
  reactionTerm: string;
  totalReferencesCount: number;
  literatureRecords: EvidenceRecordModel[];
  monographExcerpt?: string;
  className?: string;
}

/**
 * EvidenceSummary - Aggregated Clinical & Monograph Scientific Synthesis
 * Presents structured literature corroboration without synthetic over-claims.
 */
export const EvidenceSummary: React.FC<EvidenceSummaryProps> = ({
  id = 'evidence-summary',
  substanceName = 'Amoxicillin',
  reactionTerm = 'Cutaneous rash (maculopapular)',
  totalReferencesCount = 3,
  literatureRecords,
  monographExcerpt = 'Cutaneous reactions represent known adverse effects of aminopenicillins. Incidence of non-allergic maculopapular rash is documented at 3-10%, typically emerging 5-11 days post initiation.',
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Scientific Literature Corroboration
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            {substanceName} — {reactionTerm}
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Summary of peer-reviewed biomedical literature and regulatory product information.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-mono">
          {totalReferencesCount} Sources
        </span>
      </div>

      <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-xs border border-[var(--md-sys-color-outline-variant)]/30 space-y-1.5">
        <span className="font-semibold text-[var(--md-sys-color-on-surface)] block">
          Official Product Information (FDA Prescribing Information / EU SmPC)
        </span>
        <p className="text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          {monographExcerpt}
        </p>
      </div>

      {literatureRecords && literatureRecords.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] block">
            Indexed Literature References
          </span>
          <ul className="divide-y divide-[var(--md-sys-color-outline-variant)]/30 text-xs">
            {literatureRecords.map((item) => (
              <li key={item.id} className="py-2 flex items-start justify-between gap-3">
                <div>
                  <span className="font-medium text-[var(--md-sys-color-on-surface)] block">
                    {item.sourceTitle}
                  </span>
                  <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {item.sourceType} • {item.retrievedDate}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--md-sys-color-primary)] font-mono shrink-0">
                  PMID Available
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </M3Card>
  );
};
