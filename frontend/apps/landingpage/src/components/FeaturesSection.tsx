import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@nexus-v1/frontend-shared';
import {
  IconBrain,
  IconChartBar,
  IconLock,
  IconRocket
} from '@tabler/icons-react';

const features = [
  {
    title: "AI Core Engine",
    description: "Powered by advanced LLMs for real-time decision making.",
    icon: <IconBrain className="w-8 h-8 text-purple-400" />,
    className: "md:col-span-2",
  },
  {
    title: "Real-time Analytics",
    description: "Live data streaming via WebSockets.",
    icon: <IconChartBar className="w-8 h-8 text-blue-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Enterprise Security",
    description: "Bank-grade encryption and role-based access control.",
    icon: <IconLock className="w-8 h-8 text-green-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Instant Deployment",
    description: "Docker-ready containers with CI/CD integration.",
    icon: <IconRocket className="w-8 h-8 text-orange-400" />,
    className: "md:col-span-2",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500"
        >
          Built for Scale. Designed for Speed.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          {features.map((feature, i) => (
            <GlassCard
              key={i}
              className={`flex flex-col justify-between p-8 ${feature.className}`}
              variant="default" // Default glass style
            >
              <div className="bg-white/5 w-12 h-12 rounded-lg flex items-center justify-center border border-white/10 backdrop-blur-sm">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-neutral-400">{feature.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};
