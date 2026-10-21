import React from 'react';

export interface M3DividerProps {
  id?: string;
  inset?: boolean;
  className?: string;
}

/**
 * M3Divider - Google Material 3 Divider
 * Thin 1px rule using outline-variant color.
 * Rule: Use dividers sparingly; whitespace should establish grouping before dividers are introduced.
 */
export const M3Divider: React.FC<M3DividerProps> = ({
  id,
  inset = false,
  className = '',
}) => {
  return (
    <div id={id} className={`my-4 ${className}`}>
      <md-divider inset={inset || undefined} />
    </div>
  );
};
