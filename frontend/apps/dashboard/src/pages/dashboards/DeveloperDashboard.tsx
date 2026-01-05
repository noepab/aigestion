import { GlowingOrb, ParticleBackground } from '@/components/effects';
import {
  DataTable,
  Column,
  RealTimeChart,
  NotificationCenter,
  useNotifications,
} from '@/components/shared';
import { MetricCard, BuildStatusWidget } from '@/components/widgets';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { useBuildStatus } from '@/hooks/useBuildStatus';
import { useGitCommits, useHealthCheck, useRecentLogs } from '@/hooks/useApi';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Componente Terminal local (mantenido por estética dev)
function Terminal() {
  const [lineas, setLineas] = useState([
    '$ npm run build',
    '> NEXUS-V1 build: success',
    '✓ 342 modules transformed.',
    '✓ deployment ready',
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const comandos = ['git status', 'npm test', 'docker ps', 'kubectl get pods'];
      const cmd = comandos[Math.floor(Math.random() * comandos.length)];
      setLineas((prev) => [...prev.slice(-6), `$ ${cmd}`, '✓ OK']);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden font-mono text-xs">
      <div className="flex gap-1.5 px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
      </div>
      <div className="p-4 h-40 overflow-hidden space-y-1 text-cyan-400/80">
        {lineas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

export default function DeveloperDashboard() {
  const { notifications, dismissNotification, info } = useNotifications();
  const { metrics, isConnected } = useSystemMetrics();
  const { data: commits = [] } = useGitCommits(10);
  useRecentLogs(30);
  const { data: health } = useHealthCheck();

  const [cpuHistory, setCpuHistory] = useState<{ timestamp: number; value: number }[]>([]);
  const { builds } = useBuildStatus();

  useEffect(() => {
    if (metrics.cpu) {
      setCpuHistory((prev) => [...prev, { timestamp: Date.now(), value: metrics.cpu }].slice(-30));
    }
  }, [metrics.cpu]);

  const commitColumns: Column<any>[] = [
    {
      key: 'hash',
      header: 'Hash',
      render: (item) => (
        <span className="text-cyan-500/60 font-mono text-[10px]">
          {item.hash?.substring(0, 7) || '---'}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Mensaje',
      render: (item) => (
        <span className="text-gray-300 text-xs truncate max-w-[200px]">
          {item.message || item.subject}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (item) => (
        <span className="text-gray-500 text-[10px]">
          {item.date ? new Date(item.date).toLocaleDateString() : '---'}
        </span>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden font-sans">
      <ParticleBackground color="blue" count={30} opacity={0.2} />
      <GlowingOrb color="blue" size="xl" position={{ top: '-10%', left: '-10%' }} />

      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 p-6 space-y-6 max-w-[1600px] mx-auto"
      >
        <header className="flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent italic">
              DEV HUB
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-blue-500/60 font-mono text-xs tracking-widest uppercase">
                nexus.developer@local
              </span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${health?.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} text-[10px] font-bold`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${health?.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                />
                API: {health?.status?.toUpperCase() || 'BUSY'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-full border ${isConnected ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} text-[9px] font-bold tracking-widest`}
            >
              {isConnected ? 'NODE CONNECTED' : 'NODE OFFLINE'}
            </div>
          </div>
        </header>

        {/* Dash Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="CPU Usage" value={metrics.cpu} icon="⚡" color="cyan" />
          <MetricCard
            title="Commits"
            value={commits.length > 0 ? commits.length + 42 : 42}
            icon="📝"
            color="blue"
          />
          <MetricCard title="Test Coverage" value="94.2%" icon="🧪" color="green" />
          <MetricCard title="PRs Active" value={8} icon="🔀" color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold opacity-50 mb-6 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-cyan-500 rounded-full" /> Performance Monitoring
              </h3>
              <RealTimeChart
                data={cpuHistory}
                label="CPU (%)"
                color="#22d3ee"
                fillColor="rgba(34, 211, 238, 0.1)"
                height={250}
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest">
                  Recent Commits
                </h3>
                <button
                  onClick={() => info('Git', 'Re-sincronizando repositorio...')}
                  className="text-xs text-blue-400 font-bold uppercase tracking-tighter"
                >
                  Sync Repo
                </button>
              </div>
              <DataTable data={commits.slice(0, 5)} columns={commitColumns} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold opacity-50 mb-6 uppercase tracking-widest">
                Pipeline CI/CD
              </h3>
              <div className="space-y-3">
                <BuildStatusWidget builds={builds} />
              </div>
            </div>

            <Terminal />

            <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">
                  Quick Access
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-2 text-[10px] font-bold rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors uppercase">
                  Docs
                </button>
                <button className="p-2 text-[10px] font-bold rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors uppercase">
                  Docker
                </button>
                <button className="p-2 text-[10px] font-bold rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors uppercase">
                  K8s
                </button>
                <button className="p-2 text-[10px] font-bold rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors uppercase">
                  Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
