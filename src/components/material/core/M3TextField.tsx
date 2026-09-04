import React, { useRef, useEffect } from 'react';

export type M3TextFieldVariant = 'outlined' | 'filled';

export interface M3TextFieldProps {
  id?: string;
  name?: string;
  variant?: M3TextFieldVariant;
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string; name?: string } }) => void;
  onBlur?: (e: React.FocusEvent<any>) => void;
  onFocus?: (e: React.FocusEvent<any>) => void;
  placeholder?: string;
  supportingText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  type?: 'text' | 'textarea' | 'search' | 'number' | 'email' | 'password';
  rows?: number;
  leadingIcon?: string;
  trailingIcon?: string;
  className?: string;
  maxLength?: number;
}

/**
 * M3TextField - Google Material 3 Text Field Wrapper
 * Supports Outlined (APIP standard) and Filled variants,
 * with complete validation states (empty, populated, focus, error, disabled, readonly).
 */
export const M3TextField: React.FC<M3TextFieldProps> = ({
  id,
  name,
  variant = 'outlined',
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  supportingText,
  error = false,
  errorText,
  required = false,
  disabled = false,
  readOnly = false,
  type = 'text',
  rows = 3,
  leadingIcon,
  trailingIcon,
  className = '',
  maxLength,
}) => {
  const elementRef = useRef<any>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Synchronize custom element value with React state
    if (el.value !== value) {
      el.value = value;
    }

    const handleInput = (event: Event) => {
      const target = event.target as any;
      if (onChange) {
        onChange({
          target: {
            value: target.value,
            name: name || id,
          },
        });
      }
    };

    el.addEventListener('input', handleInput);
    return () => {
      el.removeEventListener('input', handleInput);
    };
  }, [value, onChange, name, id]);

  const isTextarea = type === 'textarea';

  const commonProps = {
    ref: elementRef,
    id,
    name,
    label,
    value,
    placeholder,
    'supporting-text': supportingText,
    error: error || undefined,
    'error-text': errorText,
    required: required || undefined,
    disabled: disabled || undefined,
    'read-only': readOnly || undefined,
    type: isTextarea ? 'textarea' : type,
    rows: isTextarea ? rows : undefined,
    maxlength: maxLength,
    onBlur,
    onFocus,
    className: `w-full text-left font-sans ${className}`,
  };

  const renderLeadingIcon = () =>
    leadingIcon ? (
      <span
        slot="leading-icon"
        className="material-symbols-outlined text-[20px] text-[var(--md-sys-color-on-surface-variant)]"
        aria-hidden="true"
      >
        {leadingIcon}
      </span>
    ) : null;

  const renderTrailingIcon = () =>
    trailingIcon ? (
      <span
        slot="trailing-icon"
        className="material-symbols-outlined text-[20px] text-[var(--md-sys-color-on-surface-variant)]"
        aria-hidden="true"
      >
        {trailingIcon}
      </span>
    ) : null;

  if (variant === 'filled') {
    return (
      <md-filled-text-field {...commonProps}>
        {renderLeadingIcon()}
        {renderTrailingIcon()}
      </md-filled-text-field>
    );
  }

  return (
    <md-outlined-text-field {...commonProps}>
      {renderLeadingIcon()}
      {renderTrailingIcon()}
    </md-outlined-text-field>
  );
};
