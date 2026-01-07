import { domAnimation, LazyMotion, m } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { useRole } from './context/RoleContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { WhatsAppFloatingButton } from './components/common/WhatsAppFloatingButton';
import { NexusChatWidget } from './components/widgets/NexusChatWidget';
import { ConnectivityBanner } from './components/common/ConnectivityBanner';

const GrowthDashboard = lazy(() => import('./pages/GrowthDashboard'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const RoleDashboard = lazy(() => import('./pages/RoleDashboard'));
const DockerPage = lazy(() => import('./pages/DockerPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TutorialsPage = lazy(() => import('./pages/TutorialsPage'));
const RiskPreventionPage = lazy(() => import('./pages/RiskPreventionPage'));
const BriefingPage = lazy(() => import('./pages/BriefingPage'));
const CredentialsDashboard = lazy(() => import('./pages/CredentialsDashboard'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const TranscriptionPage = lazy(() => import('./pages/TranscriptionPage'));

function App() {
  const { online, effectiveType, saveData } = useNetworkStatus();
  const isSlowConnection = effectiveType === '2g' || effectiveType === 'slow-2g' || saveData;
  const { logout } = useRole();
  const location = useLocation();

  const [activeDashboard, setActiveDashboard] = useState('Dashboard');

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin')) setActiveDashboard('Admin');
    else if (path.includes('/growth')) setActiveDashboard('Growth');
    else if (path.includes('/docker')) setActiveDashboard('Docker');
    else if (path.includes('/analytics')) setActiveDashboard('Analytics');
    else if (path.includes('/settings')) setActiveDashboard('Settings');
    else if (path.includes('/tutorials')) setActiveDashboard('Tutorials');
    else if (path.includes('/risk-prevention')) setActiveDashboard('Risk Prevention');
    else if (path.includes('/briefing')) setActiveDashboard('Briefing');
    else setActiveDashboard('Dashboard');
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const renderDashboard = () => (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-white">Loading...</div>
      }
    >
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/growth" element={<GrowthDashboard />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route
          path="/*"
          element={
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<RoleDashboard />} />
                <Route path="/docker" element={<DockerPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/tutorials" element={<TutorialsPage />} />
                <Route path="/risk-prevention" element={<RiskPreventionPage />} />
                <Route path="/briefing" element={<BriefingPage />} />
                <Route path="/credentials" element={<CredentialsDashboard />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/transcription" element={<TranscriptionPage />} />
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </Suspense>
  );

  return (
    <LazyMotion features={domAnimation}>
      <ConnectivityBanner />

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans relative overflow-hidden"
      >
        {/* Obsidian Background Layer */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'url("/bg-obsidian.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px)',
          }}
        />

        {/* --- Premium Navigation --- */}
        <nav className="z-10 bg-[#0f172a]/40 backdrop-blur-2xl border-b border-white/5 px-8 py-4 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-[#38bdf8]/10 to-[#fbbf24]/10 rounded-xl border border-white/10">
              <img
                src="/logo-epic.png"
                alt="NEXUS V1"
                className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight font-outfit bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              NEXUS V1{' '}
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.3em] font-light text-slate-500 ml-2">
                Executive Portal
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                {activeDashboard} Mode
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-300"
            >
              <span className="text-sm font-medium">Cerrar Sesión</span>
              <div className="p-2 group-hover:bg-red-500/10 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
            </button>
          </div>
        </nav>

        {/* --- Main Dashboard Content --- */}
        <main className="flex-1 overflow-y-auto z-10 p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">{renderDashboard()}</div>
        </main>

        <WhatsAppFloatingButton />
        <NexusChatWidget />
      </m.div>
    </LazyMotion>
  );
}

function HomeRedirect() {
  const { role } = useRole();

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Default to main dashboard for all roles (including demo/unauthenticated)
  return <Navigate to="/dashboard" replace />;
}

export default App;
