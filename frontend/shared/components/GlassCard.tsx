import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps } from 'framer-motion';

// Utility for merging tailwind classes safely
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'light' | 'neo';
  hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, variant = 'default', hoverEffect = true, ...props }, ref) => {

    const variants = {
      default: 'bg-white/10 border-white/20 text-white',
      dark: 'bg-black/40 border-white/10 text-gray-100',
      light: 'bg-white/60 border-white/40 text-gray-900',
      neo: 'bg-[#0f172a]/80 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-50'
    };

    const hoverClasses = hoverEffect
      ? 'hover:bg-white/20 hover:border-white/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300'
      : '';

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'backdrop-blur-md rounded-2xl border p-6 shadow-xl overflow-hidden relative',
          variants[variant],
          hoverClasses,
          className
        )}
        {...props}
      >
        {/* Shine effect overlay */}
        {hoverEffect && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        )}
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
