import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'elevated' | 'glass' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 min-h-[40px]',
    lg: 'text-base px-6 py-3 rounded-2xl gap-2.5 min-h-[48px]',
  }[size];

  const variantStyles = {
    primary:
      'bg-teal-600 hover:bg-teal-700 text-white shadow-sm border border-teal-500/20 focus-visible:ring-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 focus-visible:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700',
    elevated:
      'bg-white text-slate-900 shadow-md hover:shadow-lg border border-slate-200/80 focus-visible:ring-teal-500 dark:bg-slate-800 dark:text-white dark:border-slate-700',
    glass:
      'apip-glass text-slate-800 hover:bg-white/90 active:bg-white/95 focus-visible:ring-teal-500 dark:text-slate-100 dark:hover:bg-slate-800/90',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-400 dark:hover:bg-slate-800 dark:text-slate-300',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-500/20 focus-visible:ring-rose-500 dark:bg-rose-500 dark:text-white',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
