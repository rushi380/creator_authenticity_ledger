import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  isPrivate?: boolean;
}

export function Input({
  label,
  hint,
  error,
  isPrivate = false,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
        {isPrivate && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
            bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
            🔒 PRIVATE
          </span>
        )}
      </div>

      <input
        id={inputId}
        className={`
          w-full px-4 py-2.5 rounded-xl
          bg-gray-800/80 border text-white placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
          transition-all duration-200
          ${error ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'}
          ${className}
        `}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        aria-invalid={!!error}
        {...props}
      />

      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
