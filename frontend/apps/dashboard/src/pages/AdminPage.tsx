import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AdminLandingDashboard from './AdminLandingDashboard';
import AnalyticsPage from './AnalyticsPage';
import DashboardPage from './DashboardPage';
import AdminDashboard from './dashboards/AdminDashboard';
import DockerPage from './DockerPage';
import SettingsPage from './SettingsPage';

import apiService from '@/services/api';

export function FuturisticDashboard() {
  const navigate = useNavigate();
  const [cpuUsage, setCpuUsage] = useState(30);
  const [memoryUsage, setMemoryUsage] = useState(45);
  const [logs] = useState([
    'System initialized...',
    'Connecting to neural link...',
    'Agents synchronized.',
    'Monitoring global parameters...',
  ]);

  // Real-time updates
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const metrics = await apiService.system.getMetrics();
        // Assuming metrics.data.cpu.usage is the value
        if (metrics.data) {
          setCpuUsage(metrics.data.cpu.usage);
          setMemoryUsage(metrics.data.memory.percentage);
        }
      } catch (error) {
        console.error('Failed to fetch metrics', error);
      }
    };

    fetchMetrics(); // Initial
    const interval = setInterval(fetchMetrics, 5000); // Every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pt-16 bg-cyber-dark text-cyber-blue font-mono overflow-hidden relative selection:bg-cyber-purple selection:text-white">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-blue/5 to-transparent animate-scan pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-cyber-blue/30 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyber-blue rounded-full flex items-center justify-center shadow-neon-blue animate-pulse-slow">
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-purple drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
              NEXUS V1 GOD MODE
            </h1>
            <p className="text-xs text-cyber-purple uppercase tracking-[0.3em]">
              Advanced Growth Platform v2.0
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-cyber-gray">SYSTEM STATUS</span>
            <span className="text-cyber-green font-bold animate-pulse">ONLINE</span>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{new Date().toLocaleTimeString()}</p>
            <p className="text-xs text-cyber-gray">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6 grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
        {/* Left Column */}
        <div className="md:col-span-3 flex flex-col gap-6">
          <Panel title="CPU CORE">
            <div className="relative flex items-center justify-center h-32">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#1e1e1e"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#00f3ff"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${cpuUsage * 2.51} 251`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-2xl font-bold">{Math.round(cpuUsage)}%</span>
            </div>
          </Panel>
          <Panel title="MEMORY BANK">
            <div className="relative flex items-center justify-center h-32">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#1e1e1e"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#bc13fe"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${memoryUsage * 2.51} 251`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-2xl font-bold text-cyber-purple">
                {Math.round(memoryUsage)}%
              </span>
            </div>
          </Panel>
        </div>

        {/* Center Column */}
        <div className="md:col-span-6 flex flex-col gap-6">
          <Panel title="ACTIVE AGENTS MATRIX" className="flex-1">
            <div className="grid grid-cols-2 gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
              {['SocialBot-Alpha', 'MarketScanner-X', 'ContentGen-V3', 'DataMiner-01'].map(
                (agent) => (
                  <div
                    key={agent}
                    className="bg-cyber-dark/50 border border-cyber-blue/20 p-4 rounded hover:border-cyber-blue/60 hover:shadow-neon-blue transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white group-hover:text-cyber-blue">{agent}</h3>
                      <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                    </div>
                    <p className="text-xs text-cyber-gray mb-3">
                      Task: Optimizing engagement protocols...
                    </p>
                    <div className="w-full bg-cyber-gray/30 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-cyber-blue h-full"
                        style={{ width: `${Math.random() * 100}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </Panel>
        </div>

        {/* Right Column */}
        <div className="md:col-span-3 flex flex-col gap-6">
          <Panel title="SYSTEM LOGS" className="h-64 font-mono text-xs">
            <div className="flex flex-col gap-2 h-full overflow-hidden">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="border-l-2 border-cyber-purple pl-2 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <span className="text-cyber-gray">[{new Date().toLocaleTimeString()}]</span>{' '}
                  <br />
                  <span className="text-cyber-blue">{log}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="QUICK COMMANDS" className="flex-1">
            <div className="grid grid-cols-1 gap-3">
              <CommandButton
                icon="📊"
                label="ANALYTICS"
                color="blue"
                onClick={() => navigate('/analytics')}
              />
              <CommandButton
                icon="🐳"
                label="DOCKER OPS"
                color="purple"
                onClick={() => navigate('/docker')}
              />
              <CommandButton
                icon="⚙️"
                label="SETTINGS"
                color="green"
                onClick={() => navigate('/settings')}
              />
              <CommandButton
                icon="⚠️"
                label="EMERGENCY STOP"
                color="red"
                onClick={() => console.log('Emergency Stop')}
              />
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-cyber-dark/80 backdrop-blur-xl border border-cyber-blue/20 p-4 rounded-lg shadow-lg relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-blue opacity-50" />
      <h2 className="text-sm font-bold text-cyber-blue mb-4 tracking-wider flex items-center gap-2">
        <span className="w-1 h-4 bg-cyber-purple inline-block" />
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function CommandButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: string;
  label: string;
  color: 'blue' | 'purple' | 'green' | 'red';
  onClick: () => void;
}) {
  const colorClasses = {
    blue: 'border-cyber-blue text-cyber-blue hover:bg-cyber-blue/10 hover:shadow-neon-blue',
    purple:
      'border-cyber-purple text-cyber-purple hover:bg-cyber-purple/10 hover:shadow-neon-purple',
    green: 'border-cyber-green text-cyber-green hover:bg-cyber-green/10',
    red: 'border-cyber-red text-cyber-red hover:bg-cyber-red/10',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full py-3 px-4 border border-dashed rounded flex items-center justify-center gap-3 transition-all duration-300 group ${colorClasses[color]}`}
    >
      <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-bold tracking-wider">{label}</span>
    </button>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const views = [
    { path: '/admin/god', label: 'GOD MODE', component: <AdminDashboard /> },
    { path: '/admin/futuristic', label: 'Futuristic', component: <FuturisticDashboard /> },
    { path: '/admin/dashboard', label: 'Dashboard', component: <DashboardPage /> },
    { path: '/admin/docker', label: 'Docker', component: <DockerPage /> },
    { path: '/admin/analytics', label: 'Analytics', component: <AnalyticsPage /> },
    { path: '/admin/settings', label: 'Settings', component: <SettingsPage /> },
    { path: '/admin/landing', label: 'Landing', component: <AdminLandingDashboard /> },
  ];

  const currentView = views.find((v) => location.pathname.startsWith(v.path)) ?? views[0];

  return (
    <MainLayout>
      <div className="p-6 bg-cyber-dark text-cyber-blue min-h-screen">
        <nav className="flex gap-4 mb-6 border-b border-cyber-blue/30 pb-2">
          {views.map((view) => (
            <Link
              key={view.path}
              to={view.path}
              className={`px-4 py-2 rounded ${
                location.pathname === view.path
                  ? 'bg-cyber-purple text-white'
                  : 'text-cyber-blue hover:bg-cyber-blue/10'
              }`}
            >
              {view.label}
            </Link>
          ))}
        </nav>
        <motion.div
          key={currentView?.path ?? 'default'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-cyber-dark/80 backdrop-blur-xl p-4 rounded-lg shadow-lg"
        >
          {currentView?.component}
        </motion.div>
      </div>
    </MainLayout>
  );
}

