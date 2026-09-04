import React from 'react';

export interface ProgressRingProps {
  percentage: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  variant?: 'primary' | 'success' | 'warning' | 'critical';
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 64,
  strokeWidth = 6,
  label,
  variant = 'primary',
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const colorStyles = {
    primary: 'stroke-teal-600 dark:stroke-teal-400 text-teal-700 dark:text-teal-300',
    success: 'stroke-emerald-600 dark:stroke-emerald-400 text-emerald-700 dark:text-emerald-300',
    warning: 'stroke-amber-500 dark:stroke-amber-400 text-amber-700 dark:text-amber-300',
    critical: 'stroke-rose-600 dark:stroke-rose-400 text-rose-700 dark:text-rose-300',
  }[variant];

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-200 dark:text-slate-800"
          />
          {/* Animated Progress Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-700 ease-out ${colorStyles.split(' ')[0]}`}
          />
        </svg>
        <span className="absolute font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
          {clamped}%
        </span>
      </div>
      {label && (
        <span className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center">
          {label}
        </span>
      )}
    </div>
  );
};
