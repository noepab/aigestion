import { motion } from 'framer-motion';
import { CSSProperties } from 'react';

export interface GlowingOrbProps {
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: {
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number
  };
  blur?: number;
  animate?: boolean;
}

const colors = {
  blue: 'bg-cyan-500',
  purple: 'bg-purple-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  red: 'bg-red-500',
};

const sizes = {
  sm: 'w-32 h-32',
  md: 'w-64 h-64',
  lg: 'w-96 h-96',
  xl: 'w-[32rem] h-[32rem]',
};

export default function GlowingOrb({
  color = 'purple',
  size = 'md',
  position = {},
  blur = 100,
  animate = true,
}: GlowingOrbProps) {
  const positionStyles: CSSProperties = {
    position: 'absolute',
    ...position,
  };

  return (
    <motion.div
      className={`${colors[color] || colors.purple} ${sizes[size]} rounded-full pointer-events-none opacity-30`}
      style={{
        ...positionStyles,
        filter: `blur(${blur}px)`,
      }}
      animate={
        animate
          ? {
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }
          : undefined
      }
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
