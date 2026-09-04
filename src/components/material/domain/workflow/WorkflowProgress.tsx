import React from 'react';
import { M3Card } from '../../core/M3Card';
import { WorkflowStep } from './WorkflowStep';
import { WorkflowStepItem } from '../types';

export interface WorkflowProgressProps {
  id?: string;
  title?: string;
  steps: WorkflowStepItem[];
  currentStepId?: string;
  onStepClick?: (step: WorkflowStepItem) => void;
  className?: string;
}

/**
 * WorkflowProgress - Material 3 Multistep Workflow Tracker
 * Clean, connecting progression line with no neon glow or artificial animation.
 */
export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  id = 'workflow-progress',
  title = 'Intake & Review Progression',
  steps,
  currentStepId,
  onStepClick,
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-3.5 ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/40 pb-2">
          <span className="m3-label-small text-[var(--md-sys-color-primary)] font-semibold uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            Stage {steps.findIndex((s) => s.state === 'current' || s.id === currentStepId) + 1} of {steps.length}
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-2 relative">
        {steps.map((st, idx) => (
          <React.Fragment key={st.id}>
            <div className="flex-1">
              <WorkflowStep
                step={st}
                onClick={onStepClick}
              />
            </div>
            {idx < steps.length - 1 && (
              <div
                className="hidden md:block w-8 h-px bg-[var(--md-sys-color-outline-variant)]/60 shrink-0 self-center"
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </M3Card>
  );
};
