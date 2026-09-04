import React, { useRef, useEffect } from 'react';

export type M3ChipType = 'assist' | 'filter' | 'input' | 'suggestion';

export interface M3ChipProps {
  id?: string;
  type?: M3ChipType;
  label: string;
  icon?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

/**
 * M3Chip - Google Material 3 Chips
 * Demonstrates:
 * 1. Assist: Smart contextual actions (e.g., "View timeline")
 * 2. Filter: Group or filter toggle (e.g., "Current medicines")
 * 3. Input: Discrete entity representation with dismissal (e.g., "Amoxicillin 500 mg")
 * 4. Suggestion: Prompt or recommendation shortcut (e.g., "Add medication")
 */
export const M3Chip: React.FC<M3ChipProps> = ({
  id,
  type = 'assist',
  label,
  icon,
  selected = false,
  disabled = false,
  onClick,
  onRemove,
  className = '',
}) => {
  const chipRef = useRef<any>(null);

  useEffect(() => {
    const el = chipRef.current;
    if (!el) return;

    if (type === 'filter') {
      el.selected = selected;
    }

    const handleRemove = (e: Event) => {
      e.stopPropagation();
      if (onRemove) {
        onRemove();
      }
    };

    el.addEventListener('remove', handleRemove);
    return () => {
      el.removeEventListener('remove', handleRemove);
    };
  }, [type, selected, onRemove]);

  const renderIcon = () =>
    icon ? (
      <span
        slot="icon"
        className="material-symbols-outlined text-[18px] leading-none"
        aria-hidden="true"
      >
        {icon}
      </span>
    ) : null;

  switch (type) {
    case 'filter':
      return (
        <md-filter-chip
          ref={chipRef}
          id={id}
          label={label}
          selected={selected || undefined}
          disabled={disabled || undefined}
          onClick={onClick}
          className={className}
        >
          {renderIcon()}
        </md-filter-chip>
      );

    case 'input':
      return (
        <md-input-chip
          ref={chipRef}
          id={id}
          label={label}
          disabled={disabled || undefined}
          onClick={onClick}
          className={className}
        >
          {renderIcon()}
        </md-input-chip>
      );

    case 'suggestion':
      return (
        <md-suggestion-chip
          ref={chipRef}
          id={id}
          label={label}
          disabled={disabled || undefined}
          onClick={onClick}
          className={className}
        >
          {renderIcon()}
        </md-suggestion-chip>
      );

    case 'assist':
    default:
      return (
        <md-assist-chip
          ref={chipRef}
          id={id}
          label={label}
          disabled={disabled || undefined}
          onClick={onClick}
          className={className}
        >
          {renderIcon()}
        </md-assist-chip>
      );
  }
};
