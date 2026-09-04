import React from 'react';

export type M3ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';

export interface M3ButtonProps {
  id?: string;
  variant?: M3ButtonVariant;
  label?: string;
  children?: React.ReactNode;
  leadingIcon?: string;
  trailingIcon?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * M3Button - Google Material 3 Button Wrapper
 * Utilizes official @material/web button custom elements.
 * 
 * Hierarchy:
 * - filled: Primary actions (e.g., "Continue", "Report a reaction")
 * - tonal: Secondary prominent actions (e.g., "Save draft", "Draft note")
 * - outlined: Medium-emphasis actions (e.g., "Review report", "View timeline")
 * - text: Low-emphasis utility actions (e.g., "Cancel", "Back")
 */
export const M3Button: React.FC<M3ButtonProps> = ({
  id,
  variant = 'filled',
  label,
  children,
  leadingIcon,
  trailingIcon,
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  ariaLabel,
}) => {
  const content = children || label;
  const isDisabled = disabled || loading;

  const renderIcon = (iconName: string, isTrailing = false) => (
    <span
      slot={isTrailing ? 'trailing-icon' : 'icon'}
      className="material-symbols-outlined text-[18px] leading-none"
      aria-hidden="true"
    >
      {iconName}
    </span>
  );

  const renderLoadingSpinner = () => (
    <span
      slot="icon"
      className="material-symbols-outlined animate-spin text-[18px] leading-none text-current"
      aria-hidden="true"
    >
      progress_activity
    </span>
  );

  const commonProps = {
    id,
    disabled: isDisabled,
    onClick,
    type,
    'aria-label': ariaLabel,
    className: `transition-all select-none ${className}`,
  };

  switch (variant) {
    case 'tonal':
      return (
        <md-filled-tonal-button {...commonProps}>
          {loading ? renderLoadingSpinner() : leadingIcon && renderIcon(leadingIcon)}
          {content}
          {!loading && trailingIcon && renderIcon(trailingIcon, true)}
        </md-filled-tonal-button>
      );

    case 'outlined':
      return (
        <md-outlined-button {...commonProps}>
          {loading ? renderLoadingSpinner() : leadingIcon && renderIcon(leadingIcon)}
          {content}
          {!loading && trailingIcon && renderIcon(trailingIcon, true)}
        </md-outlined-button>
      );

    case 'text':
      return (
        <md-text-button {...commonProps}>
          {loading ? renderLoadingSpinner() : leadingIcon && renderIcon(leadingIcon)}
          {content}
          {!loading && trailingIcon && renderIcon(trailingIcon, true)}
        </md-text-button>
      );

    case 'elevated':
      return (
        <md-elevated-button {...commonProps}>
          {loading ? renderLoadingSpinner() : leadingIcon && renderIcon(leadingIcon)}
          {content}
          {!loading && trailingIcon && renderIcon(trailingIcon, true)}
        </md-elevated-button>
      );

    case 'filled':
    default:
      return (
        <md-filled-button {...commonProps}>
          {loading ? renderLoadingSpinner() : leadingIcon && renderIcon(leadingIcon)}
          {content}
          {!loading && trailingIcon && renderIcon(trailingIcon, true)}
        </md-filled-button>
      );
  }
};
