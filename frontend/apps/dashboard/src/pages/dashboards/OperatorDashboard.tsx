import { GlowingOrb, ParticleBackground } from '@/components/effects';
import {
  DataTable,
  Column,
  RealTimeChart,
  NotificationCenter,
  useNotifications,
} from '@/components/shared';
import { MetricCard } from '@/components/widgets';
import { useDockerContainers, useRecentLogs } from '@/hooks/useApi';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import apiService from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
}

export default function OperatorDashboard() {
  const { notifications, dismissNotification, success, error, warning, info } = useNotifications();
  const queryClient = useQueryClient();
  const { metrics, isConnected } = useSystemMetrics();
  const { data: containers = [], isLoading: containersLoading } = useDockerContainers();
  const { data: logs = [] } = useRecentLogs(30);

  const [cpuHistory, setCpuHistory] = useState<DataPoint[]>([]);
  const [memHistory, setMemHistory] = useState<DataPoint[]>([]);

  const startContainerMutation = useMutation({
    mutationFn: (id: string) => apiService.docker.startContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker', 'containers'] });
      success('Nodo Iniciado', 'Instancia Docker activa correctamente');
    },
    onError: () => error('Error Crítico', 'No se pudo iniciar el nodo'),
  });

  const stopContainerMutation = useMutation({
    mutationFn: (id: string) => apiService.docker.stopContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker', 'containers'] });
      warning('Nodo Detenido', 'Instancia Docker fuera de línea');
    },
    onError: () => error('Error Crítico', 'No se pudo detener el nodo'),
  });

  useEffect(() => {
    if (metrics.cpu) {
      const now = Date.now();
      setCpuHistory((prev) => [...prev, { timestamp: now, value: metrics.cpu }].slice(-30));
      setMemHistory((prev) => [...prev, { timestamp: now, value: metrics.memory }].slice(-30));
    }
  }, [metrics.cpu, metrics.memory]);

  const containerColumns: Column<any>[] = [
    {
      key: 'Names',
      header: 'Servicio',
      render: (item) => (
        <div className="flex items-center gap-2 font-mono">
          <div
            className={`w-1.5 h-1.5 rounded-full ${item.State === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
          />
          <span className="text-cyan-400 text-xs">{item.Names?.[0].replace('/', '')}</span>
        </div>
      ),
    },
    {
      key: 'Status',
      header: 'Estado Temporal',
      render: (item) => <span className="text-gray-500 text-[10px] italic">{item.Status}</span>,
    },
    {
      key: 'actions',
      header: 'Terminal',
      render: (item) => (
        <div className="flex gap-2">
          {item.State !== 'running' ? (
            <button
              onClick={() => startContainerMutation.mutate(item.ID)}
              className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-tighter hover:bg-emerald-500/20"
            >
              Boot
            </button>
          ) : (
            <button
              onClick={() => stopContainerMutation.mutate(item.ID)}
              className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-tighter hover:bg-rose-500/20"
            >
              Kill
            </button>
          )}
        </div>
      ),
    },
  ];

  const alerts = logs.filter((l) => l.level === 'error' || l.level === 'warn').slice(0, 5);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden font-sans">
      <ParticleBackground color="orange" count={30} opacity={0.2} />
      <GlowingOrb color="orange" size="xl" position={{ top: '-10%', right: '10%' }} />

      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 p-6 space-y-6 max-w-[1600px] mx-auto"
      >
        <header className="flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-orange-400 to-rose-600 bg-clip-text text-transparent italic uppercase tracking-tighter">
              OPS CENTER
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-orange-500/60 font-mono text-[10px] tracking-widest uppercase italic">
                nexus.operator@center
              </span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} text-[10px] font-bold`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                />
                LIVE NODE: {isConnected ? 'ACTIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Running Nodes"
            value={`${containers.filter((c) => c.State === 'running').length}/${containers.length}`}
            icon="🐳"
            color="orange"
          />
          <MetricCard title="System Load" value={metrics.cpu} icon="⚡" color="red" />
          <MetricCard
            title="Mem Buffer"
            value={`${metrics.memory}%`}
            icon="💾"
            color="pink"
          />
          <MetricCard
            title="Active Alerts"
            value={alerts.length}
            icon="🚨"
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-6">
                Real-time Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RealTimeChart
                  data={cpuHistory}
                  label="CPU (%)"
                  color="#f97316"
                  fillColor="rgba(249, 115, 22, 0.1)"
                  height={200}
                />
                <RealTimeChart
                  data={memHistory}
                  label="RAM (%)"
                  color="#e11d48"
                  fillColor="rgba(225, 29, 72, 0.1)"
                  height={200}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Global Container Registry
                </h3>
                <div className="flex gap-4">
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {containers.filter((c) => c.State === 'running').length} UP
                  </span>
                  <span className="text-[10px] text-rose-400 font-bold">
                    {containers.filter((c) => c.State !== 'running').length} DOWN
                  </span>
                </div>
              </div>
              <DataTable
                data={containers}
                columns={containerColumns}
                loading={containersLoading}
                pageSize={5}
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-6 border-l-2 border-red-500 pl-2">
                Critical Alerts
              </h3>
              <div className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.map((a, i) => (
                    <div
                      key={i}
                      className="flex flex-col p-3 rounded bg-red-500/5 border border-red-500/10"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-black text-rose-400 uppercase">
                          {a.level}
                        </span>
                        <span className="text-[9px] text-gray-600 font-mono italic">
                          {new Date(a.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">{a.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-30 italic text-sm">
                    No critical events detected
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10 rounded-2xl p-6">
              <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-4">
                Maintenance Mode
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => info('Maintenance', 'Iniciando purga de logs estériles...')}
                  className="w-full p-2 text-[10px] font-black rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  Cleanup Logs
                </button>
                <button
                  onClick={() => info('Maintenance', 'Optimizando índices de caché...')}
                  className="w-full p-2 text-[10px] font-black rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  Flush Cache
                </button>
                <button
                  onClick={() => info('Maintenance', 'Reiniciando orquestador de AI...')}
                  className="w-full p-2 text-[10px] font-black rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  Cycle AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
