import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
  hoverEffect?: boolean;
}

export function Card({ className = '', children, hoverEffect = true }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white/5 rounded-xl p-4 border border-white/10',
        hoverEffect && 'hover:scale-[1.02] hover:shadow-3xl transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  color?: 'blue' | 'purple' | 'green' | 'red' | 'gray';
  children: ReactNode;
}

export function Badge({ color = 'gray', children }: BadgeProps) {
  const colorClasses = {
    blue: 'text-cyber-blue border-cyber-blue',
    purple: 'text-cyber-purple border-cyber-purple',
    green: 'text-cyber-green border-cyber-green',
    red: 'text-cyber-red border-cyber-red',
    gray: 'text-gray-300 border-gray-500',
  };

  return (
    <span className={clsx('inline-block text-xs px-2 py-1 border rounded', colorClasses[color])}>
      {children}
    </span>
  );
}

interface ButtonProps {
  variant?: 'default' | 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  variant = 'default',
  size = 'md',
  children,
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseClasses = 'rounded px-3 py-2 transition-all duration-200';
  const sizeClasses = {
    sm: 'text-sm py-1',
    md: '',
    lg: 'text-lg py-3',
  };
  const variantClasses = {
    default: 'bg-white/10 hover:bg-white/20',
    primary: 'bg-cyber-purple text-white hover:bg-cyber-purple/80',
    outline: 'border border-white/20 bg-transparent hover:bg-white/10',
  };

  return (
    <button
      type={type}
      className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface TableProps {
  children: ReactNode;
}

export function Table({ children }: TableProps) {
  return <table className="w-full text-left border-collapse">{children}</table>;
}

export { DarkModeToggle } from './DarkModeToggle';
export { LazyImage } from './LazyImage';
