import React from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'private';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  error:   'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  info:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
  neutral: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  private: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

export function Badge({ variant = 'neutral', children, className = '', pulse = false }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
      text-xs font-semibold border
      ${variantClasses[variant]}
      ${className}
    `}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'success' ? 'bg-emerald-400' :
            variant === 'error'   ? 'bg-red-400' :
            'bg-violet-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            variant === 'success' ? 'bg-emerald-400' :
            variant === 'error'   ? 'bg-red-400' :
            'bg-violet-400'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
}
