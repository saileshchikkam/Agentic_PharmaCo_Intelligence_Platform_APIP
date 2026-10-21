import React, { useRef, useEffect } from 'react';

export interface M3ProgressProps {
  id?: string;
  type?: 'linear' | 'circular';
  indeterminate?: boolean;
  value?: number; // 0 to 1
  label?: string;
  valueLabel?: string;
  className?: string;
}

/**
 * M3Progress - Google Material 3 Process Indicator
 * 
 * Rules:
 * - Represents UI/process workflow state only (e.g. form completeness, data intake sync).
 * - Never implies AI diagnostic confidence or medical diagnosis percentage.
 */
export const M3Progress: React.FC<M3ProgressProps> = ({
  id,
  type = 'linear',
  indeterminate = false,
  value = 0,
  label,
  valueLabel,
  className = '',
}) => {
  const progressRef = useRef<any>(null);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;

    if (!indeterminate && value !== undefined) {
      el.value = Math.max(0, Math.min(1, value));
    }
  }, [value, indeterminate]);

  if (type === 'circular') {
    return (
      <div id={id} className={`inline-flex items-center gap-3 ${className}`}>
        <md-circular-progress
          ref={progressRef}
          indeterminate={indeterminate || undefined}
          value={!indeterminate ? value : undefined}
          aria-label={label || 'Progress'}
        />
        {(label || valueLabel) && (
          <div className="flex flex-col text-xs">
            {label && <span className="font-medium text-[var(--md-sys-color-on-surface)]">{label}</span>}
            {valueLabel && (
              <span className="text-[var(--md-sys-color-on-surface-variant)]">{valueLabel}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div id={id} className={`w-full space-y-1.5 ${className}`}>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-[var(--md-sys-color-on-surface)]">{label}</span>}
          {valueLabel && (
            <span className="text-[var(--md-sys-color-on-surface-variant)] font-mono">{valueLabel}</span>
          )}
        </div>
      )}
      <md-linear-progress
        ref={progressRef}
        indeterminate={indeterminate || undefined}
        value={!indeterminate ? value : undefined}
        aria-label={label || 'Process progress'}
        className="w-full rounded-full"
      />
    </div>
  );
};
