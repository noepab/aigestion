import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IconLayoutDashboard,
  IconChartDots,
  IconSettings,
  IconCreditCard,
  IconLogout
} from '@tabler/icons-react'; // Assuming tabler icons are available or will switch to lucide if needed
import { GlassCard, AnimatedButton } from '@nexus-v1/frontend-shared';
import { useRole } from '../context/RoleContext';

export const ClientLayout: React.FC = () => {
  const { logout } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <IconLayoutDashboard />, label: 'Overview', path: '/dashboard' },
    { icon: <IconCreditCard />, label: 'Billing', path: '/subscription' },
    { icon: <IconChartDots />, label: 'Analytics', path: '/analytics' },
    { icon: <IconSettings />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden bg-[url('/bg-obsidian.png')] bg-cover">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20" />
          <span className="font-bold text-xl tracking-tight">NEXUS V1</span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg border border-white/10'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
           <GlassCard variant="dark" className="p-4 mb-4">
              <div className="text-xs text-neutral-400 mb-1">Plan</div>
              <div className="flex justify-between items-center mb-2">
                 <span className="font-bold text-cyan-400">Pro Tier</span>
                 <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="w-full bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-cyan-500 w-[75%] h-full rounded-full" />
              </div>
              <div className="text-[10px] text-neutral-500 mt-1 text-right">7,500 / 10K req</div>
           </GlassCard>

           <button
             onClick={() => { logout(); navigate('/'); }}
             className="flex items-center gap-3 text-neutral-400 hover:text-red-400 transition-colors px-4"
           >
             <IconLogout size={20} />
             <span>Logout</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <header className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold">Dashboard</h1>
           <div className="flex gap-4 items-center">
              <AnimatedButton variant="ghost" size="sm">Help</AnimatedButton>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border-2 border-white/20" />
           </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};
