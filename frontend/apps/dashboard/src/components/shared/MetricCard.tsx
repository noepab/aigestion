import { m } from 'framer-motion';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan';
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500/10 to-blue-600/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  green: {
    bg: 'from-emerald-500/10 to-emerald-600/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  orange: {
    bg: 'from-orange-500/10 to-orange-600/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/10',
  },
  red: {
    bg: 'from-rose-500/10 to-rose-600/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/10',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-600/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/10',
  },
};

export default function MetricCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = 'blue',
  loading = false,
  onClick,
}: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: onClick ? 1.02 : 1, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-sm
        bg-gradient-to-br ${colors.bg} ${colors.border}
        p-6 shadow-lg hover:shadow-xl ${colors.glow}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300
      `}
    >
      {/* Glow effect */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 ${colors.text} opacity-10 blur-3xl rounded-full`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              {title}
            </p>
          </div>
          {icon && (
            <div className={`${colors.text} text-2xl opacity-80`}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-700/50 rounded animate-pulse" />
            <div className="h-4 bg-gray-700/30 rounded w-2/3 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3 mb-2">
              <h3 className="text-3xl font-bold text-white font-mono">
                {value}
              </h3>
              {trend && (
                <div
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold
                    ${trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                  `}
                >
                  <span>{trend.isPositive ? '↑' : '↓'}</span>
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>

            {subtitle && (
              <p className="text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>

      {/* Animated border */}
      <m.div
        className={`absolute inset-0 border-2 ${colors.border} rounded-xl opacity-0`}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </m.div>
  );
}
