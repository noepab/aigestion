import { GlowingOrb, ParticleBackground } from '@/components/effects';
import {
  DataTable,
  Column,
  RealTimeChart,
  NotificationCenter,
  useNotifications,
  HeavyComputationWidget,
} from '@/components/shared';
import {
  ActivityLog,
  ActivityRing,
  LogEntry,
  MetricCard,
  SystemMetricsWidget,
} from '@/components/widgets';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { useDockerContainers, useActiveAIModel } from '@/hooks/useApi';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import apiService from '@/services/api';

interface DataPoint {
  timestamp: number;
  value: number;
}

// Botón de Acción Rápida
function QuickAction({
  icono,
  etiqueta,
  color,
  onClick,
}: {
  icono: string;
  etiqueta: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group`}
    >
      <span className={`text-2xl mb-2 ${color}`}>{icono}</span>
      <span className="text-white text-xs font-medium uppercase tracking-wider">{etiqueta}</span>
    </motion.button>
  );
}

export default function AdminDashboard() {
  const { metrics, isConnected } = useSystemMetrics();
  const { data: containers = [], isLoading: containersLoading } = useDockerContainers();
  const { data: activeModel } = useActiveAIModel();
  const { notifications, dismissNotification, success } = useNotifications();

  const [cpuHistory, setCpuHistory] = useState<DataPoint[]>([]);

  // Fetch initial history on mount
  useEffect(() => {
    apiService.system
      .getHistory('cpu')
      .then((history) => {
        if (history && Array.isArray(history)) {
          setCpuHistory(history);
        }
      })
      .catch((err) => console.error('Error fetching CPU history:', err));
  }, []);
  const [logs] = useState<LogEntry[]>([
    {
      id: 1,
      user: 'Sistema',
      action: 'Optimización de kernel completada',
      time: 'Ahora',
      type: 'success',
    },
    {
      id: 2,
      user: 'Security',
      action: 'Escaneo de vulnerabilidades finalizado',
      time: 'Hace 5m',
      type: 'info',
    },
    {
      id: 3,
      user: 'Docker',
      action: 'Contenedor redis-cache reiniciado',
      time: 'Hace 12m',
      type: 'warning',
    },
  ]);

  // Actualizar historial de CPU para el gráfico (mantener últimos 60 puntos para más detalle)
  useEffect(() => {
    if (metrics.cpu) {
      const now = Date.now();
      setCpuHistory((prev) => [...prev, { timestamp: now, value: metrics.cpu }].slice(-60));
    }
  }, [metrics.cpu]);

  const containerColumns: Column<any>[] = [
    {
      key: 'Names',
      header: 'Contenedor',
      render: (item) => (
        <span className="font-mono text-cyan-400">{item.Names?.[0].replace('/', '')}</span>
      ),
    },
    {
      key: 'State',
      header: 'Estado',
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.State === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
        >
          {item.State}
        </span>
      ),
    },
    {
      key: 'Status',
      header: 'Uptime',
      render: (item) => <span className="text-gray-500 text-xs">{item.Status}</span>,
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {!metrics.lowPerformanceMode && (
        <>
          <ParticleBackground color="purple" count={40} opacity={0.3} />
          <GlowingOrb color="purple" size="xl" position={{ top: '-10%', right: '-10%' }} />
          <GlowingOrb color="blue" size="lg" position={{ bottom: '10%', left: '-5%' }} />
        </>
      )}

      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 p-6 space-y-6 max-w-[1600px] mx-auto"
      >
        {/* Header Unificado */}
        <header className="flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <motion.h1
              className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-400"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
            >
              NEXUS COMMAND CENTER
            </motion.h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-cyan-500/60 font-mono text-xs tracking-widest lowercase">
                system.root@nexus-v1
              </span>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} text-[10px] font-bold`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                />
                {isConnected ? 'WEBSOCKET LIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>

          <div className="hidden md:flex gap-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                Active Model
              </p>
              <p className="text-sm font-bold text-purple-400">
                {activeModel?.name || 'Loading engine...'}
              </p>
            </div>
          </div>
        </header>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="CPU Load"
            value={metrics.cpu}
            icon="⚡"
            trend={metrics.cpu > 50 ? 5.2 : -2.1}
            color="purple"
          />
          <MetricCard
            title="RAM usage"
            value={`${metrics.memory}%`}
            icon="🧠"
            color="blue"
            delay={0.1}
          />
          <MetricCard
            title="Docker Nodes"
            value={containers.length}
            icon="🐳"
            color="emerald"
            delay={0.2}
          />
          <MetricCard
            title="Uptime"
            value={`${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`}
            icon="⏱️"
            color="orange"
            delay={0.3}
          />
        </div>

        {/* Grid de Monitoreo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* System Metrics Widget - NEW */}
          <div className="lg:col-span-12">
            <SystemMetricsWidget />
          </div>

          {/* Gráfico Real-time */}
          <motion.div
            className="lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Fluctuación de Carga de Red
            </h3>
            <RealTimeChart
              data={cpuHistory}
              label="Consumo Global (%)"
              color="#a855f7"
              fillColor="rgba(168, 85, 247, 0.1)"
              height={300}
            />
          </motion.div>

          {/* Estado de Contenedores */}
          <motion.div
            className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Instancias Docker</h3>
              <button
                onClick={() => success('Sincronizado', 'Lista de contenedores actualizada')}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors uppercase font-bold tracking-tighter"
              >
                Refresh
              </button>
            </div>
            <div className="flex-1 min-h-[300px]">
              <DataTable
                data={containers.slice(0, 8)}
                columns={containerColumns}
                loading={containersLoading}
                pageSize={8}
                showPagination={false}
              />
            </div>
          </motion.div>
        </div>

        {/* Widgets de Actividad y Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col justify-center">
            <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-[10px] opacity-50 text-center">
              System Integration
            </h3>
            <div className="flex justify-around items-center">
              <ActivityRing value={78} max={100} color="#8b5cf6" label="Core Sync" />
              <ActivityRing
                value={isConnected ? 100 : 0}
                max={100}
                color="#06b6d4"
                label="Gateway"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <ActivityLog logs={logs} title="Flujo de Eventos Críticos" />
          </div>
        </div>

        {/* Acciones Rápidas y IA */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <QuickAction icono="👤" etiqueta="Usuarios" color="text-purple-400" />
              <QuickAction icono="🔐" etiqueta="Seguridad" color="text-blue-400" />
              <QuickAction icono="🐳" etiqueta="Docker" color="text-emerald-400" />
              <QuickAction icono="📊" etiqueta="Métricas" color="text-orange-400" />
              <QuickAction icono="🧠" etiqueta="AI Config" color="text-rose-400" />
              <QuickAction icono="💾" etiqueta="Respaldo" color="text-cyan-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4">
            <p className="text-[10px] text-purple-400 font-bold uppercase mb-2">Neural Processor</p>
            <HeavyComputationWidget />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

