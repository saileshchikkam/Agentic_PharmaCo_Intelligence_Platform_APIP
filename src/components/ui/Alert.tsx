import React from 'react';
import { AlertCircle, AlertTriangle, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'critical' | 'success' | 'disclaimer' | 'signal';
  title?: string;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  icon,
  className = '',
  ...props
}) => {
  const configs = {
    info: {
      bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200',
      iconColor: 'text-sky-600 dark:text-sky-400',
      defaultIcon: <Info className="w-5 h-5 shrink-0" />,
      defaultTitle: 'Clinical Information',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
      iconColor: 'text-amber-600 dark:text-amber-400',
      defaultIcon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      defaultTitle: 'Clinical Caution',
    },
    critical: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200',
      iconColor: 'text-rose-600 dark:text-rose-400',
      defaultIcon: <ShieldAlert className="w-5 h-5 shrink-0" />,
      defaultTitle: 'Serious Safety Notice',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      defaultIcon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
      defaultTitle: 'Validation Succeeded',
    },
    disclaimer: {
      bg: 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200',
      iconColor: 'text-teal-600 dark:text-teal-400',
      defaultIcon: <Info className="w-5 h-5 shrink-0" />,
      defaultTitle: 'Medical Non-Diagnostic Notice',
    },
    signal: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200',
      iconColor: 'text-amber-600 dark:text-amber-400',
      defaultIcon: <AlertCircle className="w-5 h-5 shrink-0" />,
      defaultTitle: 'Potential Disproportionality Signal',
    },
  }[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3.5 p-4 rounded-xl border text-sm leading-relaxed ${configs.bg} ${className}`}
      {...props}
    >
      <div className={`mt-0.5 shrink-0 ${configs.iconColor}`}>
        {icon || configs.defaultIcon}
      </div>
      <div className="flex-1 space-y-1">
        {title !== undefined ? (
          title && <h4 className="font-semibold text-xs tracking-tight uppercase opacity-90">{title}</h4>
        ) : (
          <h4 className="font-semibold text-xs tracking-tight uppercase opacity-90">{configs.defaultTitle}</h4>
        )}
        <div className="text-xs sm:text-sm">{children}</div>
      </div>
    </div>
  );
};
