import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { motion } from 'framer-motion';
import { GlassCard, AnimatedButton } from '@nexus-v1/frontend-shared';

function Stars(props: any) {
  const ref = useRef<any>();
  const sphere = random.inSphere(new Float32Array(5000), { radius: 1.5 });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#ffa0e0"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export const HeroSection: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <Stars />
        </Canvas>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl px-4 text-center">
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 mb-6 font-sans tracking-tight">
            NEXUS V1
          </h1>
          <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto mb-10">
             The Ultimate AI-Powered Ecosystem. <br />
             <span className="text-cyan-400 font-semibold">Stripe Billing. Granular Analytics. 3D Experience.</span>
          </p>

          <div className="flex justify-center gap-6">
             <AnimatedButton size="lg" variant="primary">
               Get Started
             </AnimatedButton>
             <AnimatedButton size="lg" variant="secondary">
               View Demo
             </AnimatedButton>
          </div>

          <GlassCard className="mt-16 mx-auto max-w-2xl" variant="neo">
             <div className="text-sm text-cyan-200 uppercase tracking-widest mb-2 font-bold">System Status</div>
             <div className="flex justify-between items-center">
                <span>Core Engine</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> Online</span>
             </div>
             <div className="flex justify-between items-center mt-2">
                <span>Billing System</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> Active</span>
             </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};
