import React from 'react';

export interface EvidenceSourceProps {
  id?: string;
  sourceType: string;
  sourceTitle: string;
  sourceCitation?: string;
  referenceUrl?: string;
  className?: string;
}

/**
 * EvidenceSource - Standardized Reference Citation Header
 * Displays peer-reviewed journals, regulatory product labels (SmPC), or signal registers.
 */
export const EvidenceSource: React.FC<EvidenceSourceProps> = ({
  id,
  sourceType = 'PubMed Peer-Reviewed Study',
  sourceTitle,
  sourceCitation,
  referenceUrl,
  className = '',
}) => {
  return (
    <div id={id} className={`flex items-start gap-3 ${className}`}>
      <div className="p-2 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-lg" aria-hidden="true">
          article
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] block">
          {sourceType}
        </span>
        <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5 leading-snug">
          {sourceTitle}
        </h4>
        {sourceCitation && (
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-mono">
            {sourceCitation}
          </p>
        )}
      </div>
    </div>
  );
};
