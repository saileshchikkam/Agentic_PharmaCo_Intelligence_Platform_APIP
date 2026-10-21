import React, { useRef, useEffect } from 'react';

export interface M3CheckboxProps {
  id?: string;
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  supportingText?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * M3Checkbox - Google Material 3 Checkbox Control
 * Provides accessible keyboard focus, touch target, and high-contrast state indication.
 */
export const M3Checkbox: React.FC<M3CheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
  supportingText,
  disabled = false,
  indeterminate = false,
  className = '',
  ariaLabel,
}) => {
  const checkboxRef = useRef<any>(null);
  const generatedId = id || `m3-chk-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const el = checkboxRef.current;
    if (!el) return;

    el.checked = checked;
    el.indeterminate = indeterminate;

    const handleChange = (e: Event) => {
      const target = e.target as any;
      onChange(target.checked);
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [checked, indeterminate, onChange]);

  return (
    <div className={`inline-flex items-start gap-3 select-none ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="pt-0.5">
        <md-checkbox
          ref={checkboxRef}
          id={generatedId}
          name={name}
          checked={checked || undefined}
          disabled={disabled || undefined}
          indeterminate={indeterminate || undefined}
          aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
        />
      </div>
      {label && (
        <label
          htmlFor={generatedId}
          className={`flex flex-col text-sm leading-snug cursor-pointer ${
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
    </div>
  );
};
