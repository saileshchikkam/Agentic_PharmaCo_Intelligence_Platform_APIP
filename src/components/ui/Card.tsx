import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: 'solid' | 'elevated' | 'glass' | 'floating';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  surface = 'solid',
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}) => {
  const surfaceStyles = {
    solid:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm',
    elevated:
      'bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-md',
    glass:
      'apip-glass text-slate-900 dark:text-slate-100',
    floating:
      'apip-glass-floating text-slate-900 dark:text-slate-100',
  }[surface];

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-7 sm:p-8',
  }[padding];

  const interactiveStyles = interactive
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0'
    : '';

  return (
    <div
      className={`rounded-2xl ${surfaceStyles} ${paddingStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
