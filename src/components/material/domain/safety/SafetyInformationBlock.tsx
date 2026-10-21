import React from 'react';
import { M3Card } from '../../core/M3Card';

export interface SafetyInformationBlockProps {
  id?: string;
  title?: string;
  standard?: string;
  principles?: string[];
  regulatoryNote?: string;
  className?: string;
}

/**
 * SafetyInformationBlock - Regulatory & Safety Standards Informational Block
 * Displays official pharmacovigilance framework context with calm professionalism.
 */
export const SafetyInformationBlock: React.FC<SafetyInformationBlockProps> = ({
  id = 'safety-information-block',
  title = 'Pharmacovigilance Compliance Framework',
  standard = 'ICH E2B(R3) & EMA GVP Module VI',
  principles = [
    'Minimum ICSR reporting elements (identifiable patient, identifiable reporter, suspect product, adverse event)',
    'Standardized MedDRA hierarchical terminology alignment',
    'Preserved patient privacy & de-identified transmission',
  ],
  regulatoryNote = 'Individual Case Safety Reports (ICSRs) captured by APIP are structured according to international regulatory harmonisation criteria.',
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            policy
          </span>
        </div>
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            {standard}
          </span>
          <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            {title}
          </h4>
        </div>
      </div>

      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
        {regulatoryNote}
      </p>

      <ul className="space-y-1 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30 text-xs">
        {principles.map((pr, i) => (
          <li key={i} className="flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
            <span className="material-symbols-outlined text-sm text-[var(--md-sys-color-secondary)] shrink-0">
              check_circle
            </span>
            <span>{pr}</span>
          </li>
        ))}
      </ul>
    </M3Card>
  );
};
