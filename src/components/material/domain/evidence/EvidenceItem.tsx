import React from 'react';
import { M3Card } from '../../core/M3Card';
import { M3Button } from '../../core/M3Button';
import { EvidenceStatus } from './EvidenceStatus';
import { EvidenceSource } from './EvidenceSource';
import { EvidenceRecordModel } from '../types';

export interface EvidenceItemProps {
  id?: string;
  evidence: EvidenceRecordModel;
  onViewSource?: (evidence: EvidenceRecordModel) => void;
  className?: string;
}

/**
 * EvidenceItem - Medical Literature & Monograph Reference Card
 * Structured scientific reference presentation adhering to Material 3 principles.
 * Avoids conversational AI chatbot styling.
 */
export const EvidenceItem: React.FC<EvidenceItemProps> = ({
  id,
  evidence,
  onViewSource,
  className = '',
}) => {
  return (
    <M3Card
      id={id || `evidence-item-${evidence.id}`}
      variant="outlined"
      className={`space-y-4 hover:border-[var(--md-sys-color-primary)]/50 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <EvidenceSource
          sourceType={evidence.sourceType}
          sourceTitle={evidence.sourceTitle}
          sourceCitation={`Substance: ${evidence.substance} • Event: ${evidence.eventTerm}`}
        />
        <EvidenceStatus status={evidence.status} />
      </div>

      <div className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 text-xs">
        <span className="font-semibold text-[var(--md-sys-color-on-surface)] block mb-1">
          Documented Findings & Clinical Context:
        </span>
        <p className="text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          {evidence.summaryText}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30 text-xs">
        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
          Retrieved on: {evidence.retrievedDate}
        </span>
        {onViewSource && (
          <M3Button
            id={`btn-view-src-${evidence.id}`}
            variant="text"
            label="View publication"
            leadingIcon="open_in_new"
            onClick={() => onViewSource(evidence)}
          />
        )}
      </div>
    </M3Card>
  );
};
