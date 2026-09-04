import React, { useRef, useEffect } from 'react';

export interface M3SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface M3SelectProps {
  id?: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: M3SelectOption[];
  supportingText?: string;
  error?: boolean;
  errorText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * M3Select - Google Material 3 Outlined Select Wrapper
 * Uses official md-outlined-select and md-select-option custom elements.
 */
export const M3Select: React.FC<M3SelectProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  options,
  supportingText,
  error = false,
  errorText,
  disabled = false,
  required = false,
  className = '',
}) => {
  const selectRef = useRef<any>(null);

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;

    if (el.value !== value) {
      el.value = value;
    }

    const handleChange = (e: Event) => {
      const target = e.target as any;
      if (target && target.value !== undefined) {
        onChange(target.value);
      }
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [value, onChange]);

  return (
    <div className={`w-full text-left font-sans ${className}`}>
      <md-outlined-select
        ref={selectRef}
        id={id}
        name={name}
        label={label}
        value={value}
        supporting-text={supportingText}
        error={error || undefined}
        error-text={errorText}
        disabled={disabled || undefined}
        required={required || undefined}
        className="w-full"
      >
        {options.map((opt) => (
          <md-select-option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled || undefined}
            selected={opt.value === value || undefined}
          >
            <div slot="headline">{opt.label}</div>
          </md-select-option>
        ))}
      </md-outlined-select>
    </div>
  );
};
