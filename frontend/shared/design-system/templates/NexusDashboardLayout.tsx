import React, { useState } from 'react';
import { NexusSidebar } from '../organisms/NexusSidebar';
import { SmoothScroll } from '../../components/SmoothScroll';
import { BrandWatermark } from '../atoms/BrandWatermark';
import { m } from 'framer-motion';

// Removed unused cn declaration to satisfy tsc

export interface NexusDashboardLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

export const NexusDashboardLayout: React.FC<NexusDashboardLayoutProps> = ({
  children,
  activePath,
  onNavigate,
  onLogout
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <SmoothScroll>
      <div className="flex h-screen w-full bg-[#020617] text-slate-200 overflow-hidden font-sans relative">
        <BrandWatermark />
        {/* Background Decorative Elements */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Sidebar */}
        <NexusSidebar
          activePath={activePath}
          onNavigate={onNavigate}
          onLogout={onLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <m.main
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col relative overflow-hidden"
        >
          {/* Header stub for top actions if needed */}
          <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 backdrop-blur-md bg-slate-950/20 z-10">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-slate-400 capitalize">
                {activePath?.replace('/', '') || 'Overview'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Search / Notifications placeholders */}
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]"></span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </div>
        </m.main>
      </div>
    </SmoothScroll>
  );
};
