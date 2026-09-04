import React from 'react';

export type M3FeedbackType = 'info' | 'warning' | 'error' | 'success';

export interface M3FeedbackProps {
  id?: string;
  type?: M3FeedbackType;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * M3Feedback - Calm, Accessible Clinical System Notice
 * Follows Material 3 tone and restrained healthcare communication rules:
 * - Clear icon and supportive wording
 * - Avoids alarming alarmism, red hyperbole, or speculative diagnostic claims
 */
export const M3Feedback: React.FC<M3FeedbackProps> = ({
  id,
  type = 'info',
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}) => {
  let containerClasses = '';
  let iconName = '';
  let iconColor = '';

  switch (type) {
    case 'error':
      containerClasses =
        'bg-[var(--md-sys-color-error-container)]/80 text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/30';
      iconName = 'error';
      iconColor = 'text-[var(--md-sys-color-error)]';
      break;

    case 'warning':
      // Amber/warning using tertiary container or warm surface
      containerClasses =
        'bg-[var(--md-sys-color-tertiary-container)]/70 text-[var(--md-sys-color-on-tertiary-container)] border border-[var(--md-sys-color-tertiary)]/30';
      iconName = 'warning';
      iconColor = 'text-[var(--md-sys-color-tertiary)]';
      break;

    case 'success':
      containerClasses =
        'bg-[var(--md-sys-color-secondary-container)]/70 text-[var(--md-sys-color-on-secondary-container)] border border-[var(--md-sys-color-secondary)]/30';
      iconName = 'check_circle';
      iconColor = 'text-[var(--md-sys-color-secondary)]';
      break;

    case 'info':
    default:
      containerClasses =
        'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60';
      iconName = 'info';
      iconColor = 'text-[var(--md-sys-color-primary)]';
      break;
  }

  return (
    <div
      id={id}
      role={type === 'error' ? 'alert' : 'status'}
      className={`rounded-xl p-4 flex items-start gap-3.5 transition-colors ${containerClasses} ${className}`}
    >
      <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true">
        {iconName}
      </span>
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold leading-tight mb-0.5">{title}</h4>}
        <p className="text-xs leading-relaxed opacity-95">{message}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-semibold underline underline-offset-2 hover:opacity-80 shrink-0 ml-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
