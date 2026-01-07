import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'default' | 'outline';
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  isHoverable?: boolean;
}

export const NexusCard: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  className = '',
  padding = 'md',
  isHoverable = false,
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-300';

  const variants = {
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20',
    default: 'bg-slate-800 border border-slate-700 shadow-xl',
    outline: 'bg-transparent border-2 border-slate-700/50',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5 md:p-6',
    lg: 'p-8 md:p-10',
  };

  const hoverEffect = isHoverable ? 'hover:scale-[1.01] hover:bg-white/10 cursor-pointer active:scale-100' : '';

  return (
    <div className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverEffect} ${className}`}>
      {children}
    </div>
  );
};
