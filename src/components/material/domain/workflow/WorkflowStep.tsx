import React from 'react';
import { WorkflowStepItem } from '../types';

export interface WorkflowStepProps {
  id?: string;
  step: WorkflowStepItem;
  onClick?: (step: WorkflowStepItem) => void;
  className?: string;
}

/**
 * WorkflowStep - Material 3 Workflow Step Node
 * Displays step states: Completed, Current, Pending, Review, Human Approval.
 * Uses Material 3 color tokens, clear typography, and accessible indicators.
 */
export const WorkflowStep: React.FC<WorkflowStepProps> = ({
  id,
  step,
  onClick,
  className = '',
}) => {
  let circleStyle = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]';
  let labelStyle = 'text-[var(--md-sys-color-on-surface-variant)] font-normal';
  let icon = <span>{step.stepNumber}</span>;

  switch (step.state) {
    case 'completed':
      circleStyle = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/40';
      labelStyle = 'text-[var(--md-sys-color-on-surface)] font-medium';
      icon = <span className="material-symbols-outlined text-[15px]">check</span>;
      break;

    case 'current':
      circleStyle = 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] shadow-xs';
      labelStyle = 'text-[var(--md-sys-color-primary)] font-semibold';
      icon = <span className="font-semibold">{step.stepNumber}</span>;
      break;

    case 'review':
      circleStyle = 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/40';
      labelStyle = 'text-[var(--md-sys-color-tertiary)] font-medium';
      icon = <span className="material-symbols-outlined text-[15px]">rate_review</span>;
      break;

    case 'human_approval':
      circleStyle = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/50';
      labelStyle = 'text-[var(--md-sys-color-secondary)] font-semibold';
      icon = <span className="material-symbols-outlined text-[15px]">verified</span>;
      break;

    case 'pending':
    default:
      circleStyle = 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]/70 border-[var(--md-sys-color-outline-variant)]/60';
      labelStyle = 'text-[var(--md-sys-color-on-surface-variant)]';
      icon = <span>{step.stepNumber}</span>;
      break;
  }

  return (
    <div
      id={id || `wf-step-${step.id}`}
      onClick={() => onClick && onClick(step)}
      className={`flex items-center gap-2.5 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <div
        className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs shrink-0 transition-transform ${circleStyle} ${
          onClick ? 'group-hover:scale-105' : ''
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <span className={`text-xs block leading-tight truncate ${labelStyle}`}>
          {step.label}
        </span>
        {step.description && (
          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] hidden sm:block truncate">
            {step.description}
          </span>
        )}
      </div>
    </div>
  );
};
