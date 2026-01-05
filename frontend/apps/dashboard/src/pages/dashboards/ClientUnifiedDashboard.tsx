import { GlowingOrb, ParticleBackground } from '@/components/effects';
import {
  MetricCard,
  NotificationCenter,
  RealTimeChart,
  useNotifications,
} from '@/components/shared';
import { useAnalyticsOverview } from '@/hooks/useApi';
import { useSocket } from '@/hooks/useSocket';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// === DASHBOARD UNIFICADO CLIENTE PREMIUM ===

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'pending';
}

const INTEGRATIONS: Integration[] = [
  {
    id: '1',
    name: 'Neural WiFi',
    description: 'Optimización de red y captura de leads',
    icon: '📡',
    status: 'active',
  },
  {
    id: '2',
    name: 'Vision Cameras',
    description: 'Análisis de tráfico y seguridad IA',
    icon: '📷',
    status: 'active',
  },
  {
    id: '3',
    name: 'Sales Bot V4',
    description: 'Agente de ventas automáticas 24/7',
    icon: '🤖',
    status: 'active',
  },
  {
    id: '4',
    name: 'Risk Sentinel',
    description: 'Prevención de riesgos laborales',
    icon: '🛡️',
    status: 'inactive',
  },
  {
    id: '5',
    name: 'Voice Center',
    description: 'Centralita telefónica inteligente',
    icon: '📞',
    status: 'pending',
  },
];

function BillingSection({ success }: { success: (title: string, message: string) => void }) {
  const [budgetStatus, setBudgetStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleBudgetSubmit = () => {
    setBudgetStatus('sending');
    setTimeout(() => {
      setBudgetStatus('sent');
      success('Solicitud Enviada', 'Un asesor NEXUS contactará contigo en breve.');
      setTimeout(() => setBudgetStatus('idle'), 3000);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[
        {
          name: 'NEXUS V1 Pyme',
          setup: '2.497€',
          monthly: '497€',
          color: 'purple',
          features: ['10 Usuarios', 'Agentes IA', 'Integración WhatsApp'],
        },
        {
          name: 'NEXUS V1 Corp',
          setup: '4.997€',
          monthly: '997€',
          color: 'blue',
          features: ['Ilimitados', 'Soporte 24/7', 'Custom Dev'],
        },
      ].map((plan) => (
        <div
          key={plan.name}
          className={`p-6 rounded-2xl border border-${plan.color}-500/20 bg-${plan.color}-500/5 backdrop-blur-xl`}
        >
          <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
          <p className="text-3xl font-black mb-1">
            {plan.monthly}
            <span className="text-xs opacity-50 font-normal">/mes</span>
          </p>
          <p className="text-[10px] text-gray-500 mb-6 uppercase">Setup fee: {plan.setup}</p>
          <ul className="space-y-2 mb-8">
            {plan.features.map((f) => (
              <li key={f} className="text-xs text-gray-400">
                ✓ {f}
              </li>
            ))}
          </ul>
          <button className="w-full py-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase">
            Mejorar Plan
          </button>
        </div>
      ))}
      <div className="lg:col-span-1 bg-gradient-to-br from-indigo-500/10 to-transparent p-6 rounded-2xl border border-indigo-500/20">
        <h3 className="text-sm font-bold mb-4">Solicitar Custom Dev</h3>
        <textarea
          className="w-full h-24 bg-black/40 rounded-xl p-3 text-xs border border-white/10 mb-4 resize-none"
          placeholder="Describe tu necesidad técnica..."
        />
        <button
          onClick={handleBudgetSubmit}
          disabled={budgetStatus !== 'idle'}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest"
        >
          {budgetStatus === 'sent' ? '✓ Enviado' : 'Enviar IA Request'}
        </button>
      </div>
    </div>
  );
}

export default function ClientUnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'control' | 'integrations' | 'billing'>(
    'overview',
  );
  const { notifications, dismissNotification, success } = useNotifications();
  const { data: analytics } = useAnalyticsOverview();
  const { socket } = useSocket();

  const [trafficHistory, setTrafficHistory] = useState<{ timestamp: number; value: number }[]>([]);

  useEffect(() => {
    if (!socket) return;
    socket.on('analytics:update', (data: any) => {
      setTrafficHistory((prev) =>
        [...prev, { timestamp: Date.now(), value: data.requestsPerSecond || 0 }].slice(-40),
      );
    });
  }, [socket]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden p-6">
      <ParticleBackground color="blue" count={30} opacity={0.2} />
      <GlowingOrb color="blue" size="xl" position={{ top: '-10%', right: '-5%' }} />
      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              NEXUS ENTERPRISE
            </h1>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-[0.3em]">
              Status: <span className="text-emerald-500 font-bold">Operational</span> | v9.0.2
            </p>
          </div>

          <nav className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-xl">
            {[
              { id: 'overview', label: 'Dashboard', icon: '📊' },
              { id: 'control', label: 'IoT Control', icon: '🎮' },
              { id: 'integrations', label: 'Nexus Store', icon: '🧩' },
              { id: 'billing', label: 'Servicios', icon: '💎' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'text-gray-400 hover:text-white'}`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="ov"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Sales Revenue"
                  value={`€${(analytics?.totalRequests || 12000) * 0.12}`}
                  icon="💰"
                  color="blue"
                />
                <MetricCard
                  title="Total Leads"
                  value={analytics?.activeUsers || 0}
                  icon="👥"
                  color="purple"
                />
                <MetricCard
                  title="AI Optimizations"
                  value="1,284"
                  icon="🤖"
                  color="green"
                />
                <MetricCard title="Satisfaction" value="98%" icon="⭐" color="orange" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-xs font-bold text-blue-400 mb-6 uppercase tracking-widest">
                  Neural Network Performance
                </h3>
                <RealTimeChart
                  data={trafficHistory}
                  label="System Load"
                  color="#3b82f6"
                  fillColor="rgba(59, 130, 246, 0.1)"
                  height={300}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'control' && (
            <motion.div
              key="ctrl"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {['Recepción Central', 'Almacén Principal', 'Zona de Carga'].map((cam, i) => (
                <div
                  key={i}
                  className="aspect-video bg-black rounded-xl border border-white/5 relative flex items-center justify-center group overflow-hidden"
                >
                  <div className="absolute top-2 left-2 flex gap-1 items-center bg-black/50 px-2 py-0.5 rounded backdrop-blur">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-white uppercase">
                      Live Cam {i + 1}
                    </span>
                  </div>
                  <span className="text-gray-700 text-[10px] font-mono italic">
                    Re-establishing link...
                  </span>
                  <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white tracking-widest shadow-lg">
                    {cam}
                  </div>
                </div>
              ))}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col justify-center items-center gap-4">
                <h3 className="text-xs font-bold text-cyan-400">Smart HVAC System</h3>
                <div className="w-24 h-24 rounded-full border-4 border-cyan-500/20 flex items-center justify-center text-2xl font-black">
                  21°C
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10">
                    -
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10">
                    +
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div
              key="int"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {INTEGRATIONS.map((item) => (
                <div
                  key={item.id}
                  className={`p-6 rounded-2xl border ${item.status === 'active' ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/10 bg-white/5'}`}
                >
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-md font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-xs text-gray-500 mb-6">{item.description}</p>
                  <button
                    className={`w-full py-2 rounded font-bold text-[10px] uppercase tracking-widest ${item.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                  >
                    {item.status === 'active' ? 'Configurar' : 'Instalar'}
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div key="bill" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <BillingSection success={success} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
