import { motion } from 'framer-motion';
import { useState } from 'react';
import apiService from '../services/api';
import MainLayout from '../components/layout/MainLayout';

const PLANS = [
  {
    id: 'price_1Q...', // Replace with real price IDs
    name: 'Starter',
    price: '$29',
    features: ['Basic Analytics', '5 Team Members', 'Standard Support'],
    recommended: false,
  },
  {
    id: 'price_1Q_pro...',
    name: 'Pro',
    price: '$99',
    features: ['Advanced Analytics', 'Unlimited Team Members', 'Priority Support', 'AI Insights'],
    recommended: true,
  },
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const response = await apiService.stripe.createCheckoutSession(
        priceId,
        `${window.location.origin}/success`,
        `${window.location.origin}/cancel`
      );
      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
            Upgrade Your Experience
          </h1>
          <p className="text-slate-400 text-lg">Choose the plan that fits your needs.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.02 }}
              className={`relative p-8 rounded-2xl border ${
                plan.recommended
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-white/10 bg-white/5'
              } backdrop-blur-xl`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-500/50">
                  Recommended
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-sm font-normal text-slate-400">/mo</span></div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-slate-300">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!loading}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  plan.recommended
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-lg hover:shadow-purple-500/25'
                    : 'bg-white/10 hover:bg-white/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? 'Processing...' : 'Subscribe Now'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
