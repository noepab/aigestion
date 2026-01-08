import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface NexusInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'glass' | 'ghost';
  fullWidth?: boolean;
}

export const NexusInput = forwardRef<HTMLInputElement, NexusInputProps>(
  ({ label, error, icon: Icon, variant = 'default', fullWidth = false, className = '', ...props }, ref) => {
    const baseStyles =
      'flex items-center gap-2 rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2';

    const variants = {
      default: 'bg-slate-800 border border-slate-700 focus-within:ring-blue-500 focus-within:border-blue-500 text-white',
      glass: 'bg-white/5 backdrop-blur-md border border-white/10 focus-within:ring-blue-400/50 focus-within:border-white/20 text-white',
      ghost: 'bg-transparent border-none focus-within:ring-0 text-white placeholder-slate-400',
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const errorClass = error ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500' : '';

    return (
      <div className={`${widthClass} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
            {label}
          </label>
        )}

        <div
          className={`
            ${baseStyles}
            ${variants[variant]}
            ${errorClass}
            px-3 py-2.5
          `}
        >
          {Icon && <Icon className="w-5 h-5 text-slate-400" />}

          <input
            ref={ref}
            placeholder={props.placeholder} className="bg-transparent border-none outline-none flex-1 text-sm placeholder-slate-500 text-white w-full"
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1.5 ml-1 text-xs text-red-400 animate-pulse">
            {error}
          </p>
        )}
      </div>
    );
  }
);

NexusInput.displayName = 'NexusInput';
