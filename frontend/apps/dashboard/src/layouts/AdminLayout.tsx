import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  IconServer,
  IconUsers,
  IconTerminal2,
  IconActivity,
  IconShieldLock
} from '@tabler/icons-react';
import { GlassCard } from '@nexus-v1/frontend-shared';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-black text-white font-mono overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-20 md:w-64 border-r border-red-900/30 flex flex-col bg-[#050000]">
        <div className="p-6 border-b border-red-900/20">
           <div className="flex items-center gap-3 text-red-500">
             <IconShieldLock />
             <span className="font-bold tracking-widest hidden md:inline">GOD MODE</span>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
           {[
             { icon: <IconActivity />, label: 'System Health', path: '/admin' },
             { icon: <IconUsers />, label: 'Users', path: '/admin/users' },
             { icon: <IconServer />, label: 'Infrastructure', path: '/admin/infra' },
             { icon: <IconTerminal2 />, label: 'Logs', path: '/admin/logs' },
           ].map((item) => (
             <button
               key={item.path}
               onClick={() => navigate(item.path)}
               className="w-full flex items-center gap-3 px-4 py-3 text-red-400/70 hover:bg-red-900/10 hover:text-red-400 transition-colors rounded"
             >
               {item.icon}
               <span className="hidden md:inline">{item.label}</span>
             </button>
           ))}
        </nav>

        <div className="p-4 border-t border-red-900/20">
          <GlassCard variant="neo" className="p-3 !bg-red-950/20 !border-red-900/30">
             <div className="text-xs text-red-500 mb-1">CPU Load</div>
             <div className="w-full bg-red-900/30 h-1 rounded-full mb-2">
                <div className="bg-red-600 w-[45%] h-full rounded-full animate-pulse" />
             </div>
             <div className="text-xs text-red-500 mb-1">Memory</div>
             <div className="w-full bg-red-900/30 h-1 rounded-full">
                <div className="bg-red-600 w-[72%] h-full rounded-full" />
             </div>
          </GlassCard>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black">
         <header className="flex justify-between items-center mb-8 border-b border-red-900/20 pb-4">
            <h1 className="text-2xl font-bold text-red-500">System Overview</h1>
            <div className="text-xs text-red-800 font-mono">
               SECURE CONNECTION // ENCRYPTED
            </div>
         </header>
         <Outlet />
      </main>
    </div>
  );
};
