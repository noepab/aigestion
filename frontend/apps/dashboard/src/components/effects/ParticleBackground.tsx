import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

interface ParticleBackgroundProps {
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'mixed';
  count?: number;
  opacity?: number;
}

const colorPalettes = {
  blue: ['#00f3ff', '#0088ff', '#00d4ff'],
  purple: ['#bc13fe', '#8b5cf6', '#a855f7'],
  green: ['#0aff00', '#10b981', '#34d399'],
  orange: ['#f59e0b', '#fb923c', '#fbbf24'],
  mixed: ['#00f3ff', '#bc13fe', '#0aff00', '#f59e0b'],
};

export default function ParticleBackground({
  color = 'mixed',
  count = 50,
  opacity = 0.6,
}: ParticleBackgroundProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getRandomColor = useCallback(() => {
    const palette = colorPalettes[color];
    return palette[Math.floor(Math.random() * palette.length)];
  }, [color]);

  const particles = useMemo<Particle[]>(() => {
    if (dimensions.width === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      color: getRandomColor(),
    }));
  }, [count, dimensions, getRandomColor]);

  if (dimensions.width === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ opacity }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            left: particle.x,
            top: particle.y,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
