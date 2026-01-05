import { GlowingOrb, ParticleBackground } from '@/components/effects';
import {
  DataTable,
  Column,
  RealTimeChart,
  NotificationCenter,
  useNotifications,
} from '@/components/shared';
import { MetricCard, InteractiveChart } from '@/components/widgets';
import { useAnalyticsOverview, useAnalyticsUserActivity } from '@/hooks/useApi';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useSocket } from '@/hooks/useSocket';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
}

export default function AnalystDashboard() {
  const { data: overview } = useAnalyticsOverview();
  const { data: userActivity, isLoading: isLoadingActivity } = useAnalyticsUserActivity();
  const { data: analyticsData } = useAnalyticsData();
  const { notifications, dismissNotification, info } = useNotifications();
  const { socket } = useSocket();

  const [trafficHistory, setTrafficHistory] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!socket) return;
    const handleAnalyticsUpdate = (data: any) => {
      const now = Date.now();
      setTrafficHistory((prev) =>
        [...prev, { timestamp: now, value: data.requestsPerSecond || 0 }].slice(-50),
      );
    };
    socket.on('analytics:update', handleAnalyticsUpdate);
    return () => {
      socket.off('analytics:update', handleAnalyticsUpdate);
    };
  }, [socket]);

  const activityColumns: Column<any>[] = [
    {
      key: 'hour',
      header: 'Hora',
      render: (item) => <span className="text-gray-500 font-mono text-[10px]">{item.hour}:00</span>,
    },
    {
      key: 'users',
      header: 'Usuarios',
      render: (item) => <span className="text-cyan-400 font-bold text-xs">{item.users}</span>,
    },
    {
      key: 'sessions',
      header: 'Sesiones',
      render: (item) => <span className="text-purple-400 font-bold text-xs">{item.sessions}</span>,
    },
    {
      key: 'engagement',
      header: 'Ratio',
      render: (item) => (
        <span className="text-gray-400 text-xs">{(item.sessions / item.users).toFixed(2)}x</span>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden font-sans">
      <ParticleBackground color="green" count={30} opacity={0.2} />
      <GlowingOrb color="green" size="xl" position={{ top: '-10%', left: '20%' }} />

      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 p-6 space-y-6 max-w-[1600px] mx-auto"
      >
        <header className="flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent uppercase tracking-tighter">
              ANALYTICS HUB
            </h1>
            <p className="text-emerald-500/60 font-mono text-[10px] tracking-[0.4em] mt-1 italic">
              INTELLECTUAL PROCESSING ENGINE v4.2
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                info('Export', 'Generando reporte CSV...');
                import('@/services/api').then(({ default: api }) => {
                  api.analytics.exportReport().catch(() => {
                    info('Error', 'Fallo al descargar el reporte');
                  });
                });
              }}
              className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
            >
              Export Report
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Traffic"
            value={overview?.totalRequests || 0}
            icon="🌐"
            color="cyan"
          />
          <MetricCard
            title="Live Users"
            value={overview?.activeUsers || 0}
            icon="👥"
            color="emerald"
            delay={0.1}
          />
          <MetricCard
            title="Latency"
            value={`${overview?.avgResponseTime || 0}ms`}
            icon="⚡"
            color="purple"
            delay={0.2}
          />
          <MetricCard
            title="Error Rate"
            value={`${overview?.errorRate || 0}%`}
            icon="🛡️"
            color="pink"
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InteractiveChart
            title="Revenue (YTD)"
            data={analyticsData.revenue}
            dataKey="value"
            categoryKey="name"
            color="#10b981"
            defaultType="area"
          />
          <InteractiveChart
            title="User Growth (14 Days)"
            data={analyticsData.users}
            dataKey="value"
            categoryKey="name"
            color="#8b5cf6"
            defaultType="line"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6">
              Real-time Traffic
            </h3>
            <RealTimeChart
              data={trafficHistory}
              label="Req/s"
              color="#10b981"
              fillColor="rgba(16, 185, 129, 0.1)"
              height={250}
            />
          </div>
          <InteractiveChart
            title="Conversion Funnel"
            data={analyticsData.conversions}
            dataKey="value"
            categoryKey="name"
            color="#f43f5e"
            defaultType="bar"
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-2 border-l-2 border-emerald-500">
            24h Historical User Activity
          </h3>
          <DataTable
            data={userActivity?.data || []}
            columns={activityColumns}
            loading={isLoadingActivity}
            pageSize={6}
          />
        </div>
      </motion.div>
    </div>
  );
}
