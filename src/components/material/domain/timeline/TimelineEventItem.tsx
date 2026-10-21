import React from 'react';
import { HealthEventType, HealthTimelineEvent } from '../types';

export interface TimelineEventItemProps {
  event: HealthTimelineEvent;
  isLast?: boolean;
  onSelectEvent?: (event: HealthTimelineEvent) => void;
  className?: string;
}

/**
 * TimelineEventItem - Material 3 Chronological Event Node
 * Clean, restrained timeline node with semantic icon, date/time, and clear typography.
 * Completely free of neon connectors, excessive glowing animations, or futuristic clichés.
 */
export const TimelineEventItem: React.FC<TimelineEventItemProps> = ({
  event,
  isLast = false,
  onSelectEvent,
  className = '',
}) => {
  // Determine semantic color and icon according to event type
  let iconName = 'schedule';
  let iconBg = 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-outline-variant)]';
  let typeLabel = 'Event';

  switch (event.type) {
    case 'medication':
      iconName = 'medication';
      iconBg = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/30';
      typeLabel = 'Medication Event';
      break;

    case 'symptom':
      iconName = 'personal_injury';
      iconBg = 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]/30';
      typeLabel = 'Symptom Noted';
      break;

    case 'healthcare':
      iconName = 'medical_services';
      iconBg = 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]/30';
      typeLabel = 'Healthcare Visit';
      break;

    case 'adr':
      iconName = 'warning';
      iconBg = 'bg-[var(--md-sys-color-error-container)]/80 text-[var(--md-sys-color-on-error-container)] border-[var(--md-sys-color-error)]/30';
      typeLabel = 'Possible Reaction';
      break;
  }

  return (
    <div className={`relative flex items-start gap-4 group ${className}`}>
      {/* Vertical Connecting Rule */}
      {!isLast && (
        <div
          className="absolute left-4 top-8 -bottom-3 w-px bg-[var(--md-sys-color-outline-variant)]/60"
          aria-hidden="true"
        />
      )}

      {/* Semantic Icon Circle */}
      <div
        className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}
      >
        <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
          {iconName}
        </span>
      </div>

      {/* Content Container */}
      <div
        onClick={() => onSelectEvent && onSelectEvent(event)}
        className={`flex-1 min-w-0 pb-6 rounded-xl transition-colors ${
          onSelectEvent ? 'cursor-pointer hover:bg-[var(--md-sys-color-surface-container-low)]/50 p-2 -mt-2' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              {typeLabel}
            </span>
            {event.badgeText && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
                {event.badgeText}
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            {event.date}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">
          {event.title}
        </h4>

        {event.subtitle && (
          <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            {event.subtitle}
          </p>
        )}

        {event.description && (
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
            {event.description}
          </p>
        )}

        {event.status && (
          <div className="mt-2">
            <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40">
              {event.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
