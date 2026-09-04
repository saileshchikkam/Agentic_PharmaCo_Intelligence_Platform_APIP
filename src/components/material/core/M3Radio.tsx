import React, { useRef, useEffect } from 'react';

export interface M3RadioOption {
  value: string;
  label: string;
  supportingText?: string;
  disabled?: boolean;
}

export interface M3RadioProps {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label?: string;
  supportingText?: string;
  disabled?: boolean;
  className?: string;
}

export const M3Radio: React.FC<M3RadioProps> = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  supportingText,
  disabled = false,
  className = '',
}) => {
  const radioRef = useRef<any>(null);
  const generatedId = id || `m3-radio-${name}-${value}`;

  useEffect(() => {
    const el = radioRef.current;
    if (!el) return;

    el.checked = checked;

    const handleChange = () => {
      if (el.checked) {
        onChange(value);
      }
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [checked, value, onChange]);

  return (
    <div className={`inline-flex items-start gap-3 select-none ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="pt-0.5">
        <md-radio
          ref={radioRef}
          id={generatedId}
          name={name}
          value={value}
          checked={checked || undefined}
          disabled={disabled || undefined}
          aria-label={label}
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

export interface M3RadioGroupProps {
  name: string;
  label?: string;
  supportingText?: string;
  options: M3RadioOption[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export const M3RadioGroup: React.FC<M3RadioGroupProps> = ({
  name,
  label,
  supportingText,
  options,
  value,
  onChange,
  disabled = false,
  direction = 'vertical',
  className = '',
}) => {
  return (
    <fieldset className={`border-none p-0 m-0 ${className}`}>
      {label && (
        <legend className="text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1 block">
          {label}
        </legend>
      )}
      {supportingText && (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3">
          {supportingText}
        </p>
      )}
      <div
        className={`flex ${
          direction === 'horizontal' ? 'flex-row flex-wrap gap-6 items-center' : 'flex-col gap-3'
        }`}
      >
        {options.map((option) => (
          <M3Radio
            key={option.value}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            label={option.label}
            supportingText={option.supportingText}
            disabled={disabled || option.disabled}
          />
        ))}
      </div>
    </fieldset>
  );
};
