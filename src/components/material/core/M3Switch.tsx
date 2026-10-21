import React, { useRef, useEffect } from 'react';

export interface M3SwitchProps {
  id?: string;
  name?: string;
  selected: boolean;
  onChange: (selected: boolean) => void;
  label?: React.ReactNode;
  supportingText?: string;
  disabled?: boolean;
  icons?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * M3Switch - Google Material 3 Switch Component
 * Compliant with Material 3 switch specifications with optional checkmark icons.
 */
export const M3Switch: React.FC<M3SwitchProps> = ({
  id,
  name,
  selected,
  onChange,
  label,
  supportingText,
  disabled = false,
  icons = true,
  className = '',
  ariaLabel,
}) => {
  const switchRef = useRef<any>(null);
  const generatedId = id || `m3-sw-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const el = switchRef.current;
    if (!el) return;

    el.selected = selected;

    const handleChange = (e: Event) => {
      const target = e.target as any;
      onChange(target.selected);
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [selected, onChange]);

  return (
    <div className={`inline-flex items-center justify-between gap-4 select-none ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      {label && (
        <label
          htmlFor={generatedId}
          className={`flex flex-col text-sm leading-snug cursor-pointer pr-2 ${
            disabled
              ? 'text-[var(--md-sys-color-on-surface)]/38 cursor-not-allowed'
              : 'text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <span className="font-medium">{label}</span>
          {supportingText && (
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              {supportingText}
            </span>
          )}
        </label>
      )}
      <div className="shrink-0 flex items-center">
        <md-switch
          ref={switchRef}
          id={generatedId}
          name={name}
          selected={selected || undefined}
          disabled={disabled || undefined}
          icons={icons || undefined}
          aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
        />
      </div>
    </div>
  );
};
