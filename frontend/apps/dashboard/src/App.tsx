import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { useNavigate, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { useRole } from './context/RoleContext';
import { WhatsAppFloatingButton } from './components/common/WhatsAppFloatingButton';
import { NexusChatWidget } from './components/widgets/NexusChatWidget';
import { ConnectivityBanner } from './components/common/ConnectivityBanner';
import { NexusDashboardLayout } from '@shared/design-system/templates/NexusDashboardLayout';
import { CustomCursor } from './components/ui/CustomCursor';
import { CommandPalette } from './components/ui/CommandPalette';

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
const ChatPage = lazy(() => import('./pages/ChatPage'));

import { Play } from 'lucide-react';
import { GuidedTour, useGuidedTour } from './components/shared/GuidedTour';

function App() {
  const { logout } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen: isTourOpen, startTour } = useGuidedTour();

  const tourSteps = [
    { target: '#sidebar-logo', title: 'Welcome to Nexus V1', content: 'Our new Atomic Design system provides a unified interface for your AI operations.' },
    { target: '#nav-dashboard', title: 'Command Center', content: 'Access your main overview and key performance indicators here.' },
    { target: '#nav-chat', title: 'AI Assistant', content: 'Engage with our cognitive layer to perform complex analysis and codebase exploration.' },
    { target: '#assistant-widget', title: 'Quick Help', content: 'Always available chat widget for instant answers and context-aware help.' },
    { target: '#user-profile', title: 'Your Identity', content: 'Manage your pro account and security preferences from the profile section.' },
  ];

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
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/growth" element={<GrowthDashboard />} />
          <Route path="/admin/*" element={<AdminPage />} />
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
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );

  return (
    <LazyMotion features={domAnimation}>
      <CustomCursor />
      <CommandPalette />
      <ConnectivityBanner />
      <GuidedTour steps={tourSteps} isOpen={isTourOpen} />

      <NexusDashboardLayout
        activePath={location.pathname}
        onNavigate={(path) => navigate(path)}
        onLogout={handleLogout}
      >
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {renderDashboard()}
          <WhatsAppFloatingButton />
          <NexusChatWidget />

          {/* Debug/Manual Tour Trigger */}
          <button
            onClick={startTour}
            className="fixed bottom-24 right-6 pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 backdrop-blur border border-white/10 text-white rounded-full text-[10px] font-bold hover:bg-slate-700 transition-all opacity-40 hover:opacity-100"
          >
            <Play size={10} fill="currentColor" /> REPLAY TOUR
          </button>
        </m.div>
      </NexusDashboardLayout>
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
