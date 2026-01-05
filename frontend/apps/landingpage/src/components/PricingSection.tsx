import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, AnimatedButton } from '@nexus-v1/frontend-shared';
import { IconCheck } from '@tabler/icons-react';

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "Perfect for exploring AI capabilities.",
    features: ["100 API Requests/day", "Basic Analytics", "Community Support", "1 Project"],
    cta: "Start Free",
    variant: "default"
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For professionals requiring scale.",
    features: ["Unlimited API Requests", "Real-time Analytics", "Priority Support", "Unlimited Projects", "Custom Models"],
    cta: "Upgrade to Pro",
    variant: "neo", // Special glowing variant
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Bank-grade security and dedicated hardware.",
    features: ["Dedicated GPU Cluster", "SLA 99.99%", "24/7 Phone Support", "On-premise Deployment"],
    cta: "Contact Sales",
    variant: "default"
  }
];

export const PricingSection: React.FC = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-24 px-4 relative z-10 bg-gradient-to-b from-black to-neutral-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-neutral-400 text-lg mb-8">
            Choose the plan that fits your scale.
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!annual ? 'text-white' : 'text-neutral-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-14 h-8 bg-neutral-800 rounded-full relative p-1 transition-colors hover:bg-neutral-700"
            >
              <motion.div
                className="w-6 h-6 bg-cyan-500 rounded-full"
                animate={{ x: annual ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${annual ? 'text-white' : 'text-neutral-500'}`}>
              Yearly <span className="text-xs text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded-full ml-1">-20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <GlassCard
              key={i}
              variant={plan.variant as any}
              className={`relative flex flex-col ${plan.popular ? 'border-cyan-500/50 shadow-cyan-500/20' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {annual && plan.price !== "Custom" ? `$${parseInt(plan.price.slice(1)) * 0.8 * 12}` : plan.price}
                  </span>
                  <span className="text-neutral-400">{annual && plan.price !== "Custom" ? "/yr" : plan.period}</span>
                </div>
                <p className="text-sm text-neutral-400 mt-2">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-neutral-300">
                    <IconCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <AnimatedButton variant={plan.popular ? 'glow' : 'secondary'} className="w-full">
                {plan.cta}
              </AnimatedButton>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};
