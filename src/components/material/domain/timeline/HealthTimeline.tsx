import React from 'react';
import { M3Card } from '../../core/M3Card';
import { TimelineEventItem } from './TimelineEventItem';
import { HealthTimelineEvent } from '../types';

export interface HealthTimelineProps {
  id?: string;
  title?: string;
  description?: string;
  events: HealthTimelineEvent[];
  onSelectEvent?: (event: HealthTimelineEvent) => void;
  className?: string;
}

/**
 * HealthTimeline - Material 3 Health History Timeline
 * Displays sequential chronology of medications, symptoms, visits, and possible reactions.
 * Uses Material 3 outline, surface tokens, and clear optical spacing.
 */
export const HealthTimeline: React.FC<HealthTimelineProps> = ({
  id = 'health-timeline',
  title = 'Health Chronology',
  description = 'Sequential record of medication courses, symptom experiences, and healthcare appointments.',
  events,
  onSelectEvent,
  className = '',
}) => {
  return (
    <M3Card id={id} variant="outlined" className={`space-y-5 ${className}`}>
      <div className="flex items-start justify-between border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
        <div>
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] block">
            Health Event Chronology
          </span>
          <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              {description}
            </p>
          )}
        </div>
        <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] pt-1">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      <div className="pt-2">
        {events.map((evt, idx) => (
          <TimelineEventItem
            key={evt.id}
            event={evt}
            isLast={idx === events.length - 1}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </M3Card>
  );
};
