import React from 'react';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'code';

export interface TypographyProps {
  variant?: TypographyVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'error';
  className?: string;
  children: React.ReactNode;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export const NexusTypography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  className = '',
  children,
  weight = 'normal',
}) => {
  const Component = variant.startsWith('h') ? (variant as keyof JSX.IntrinsicElements) : 'p';

  const baseStyles = 'leading-relaxed';

  const variants = {
    h1: 'text-4xl md:text-5xl lg:text-6xl tracking-tight',
    h2: 'text-3xl md:text-4xl tracking-tight',
    h3: 'text-2xl md:text-3xl tracking-tight',
    h4: 'text-xl md:text-2xl tracking-tight',
    body: 'text-base md:text-lg',
    small: 'text-sm',
    code: 'font-mono text-sm bg-slate-800 px-1.5 py-0.5 rounded',
  };

  const colors = {
    primary: 'text-slate-50',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
    accent: 'text-blue-400',
    error: 'text-rose-400',
  };

  const weights = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${colors[color]} ${weights[weight]} ${className}`}
    >
      {children}
    </Component>
  );
};
