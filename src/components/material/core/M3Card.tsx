import React from 'react';

export type M3CardVariant = 'elevated' | 'filled' | 'outlined';

export interface M3CardProps {
  id?: string;
  variant?: M3CardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

/**
 * M3Card - Google Material 3 Surface Container
 * 
 * Variants:
 * - elevated: Level 1 shadow, subtle tonal resting state (default)
 * - filled: Surface Container Highest, flat tonal separation
 * - outlined: Surface with 1px Outline Variant border, crisp clinical grouping
 * 
 * Rules:
 * - Cards are grouping boundaries; never nest cards inside other cards.
 * - Respects M3 shape tokens and flat surface depth principles.
 */
export const M3Card: React.FC<M3CardProps> = ({
  id,
  variant = 'outlined',
  children,
  className = '',
  onClick,
  interactive = false,
}) => {
  const isClickable = interactive || !!onClick;

  let variantStyles = '';
  switch (variant) {
    case 'elevated':
      variantStyles =
        'bg-[var(--md-sys-color-surface-container-low)] shadow-xs hover:shadow-md border-none';
      break;
    case 'filled':
      variantStyles =
        'bg-[var(--md-sys-color-surface-container-highest)] border-none';
      break;
    case 'outlined':
    default:
      variantStyles =
        'bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]';
      break;
  }

  const interactiveStyles = isClickable
    ? 'cursor-pointer active:scale-[0.99] transition-transform transition-shadow'
    : '';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`rounded-2xl p-5 text-[var(--md-sys-color-on-surface)] transition-all ${variantStyles} ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  );
};
