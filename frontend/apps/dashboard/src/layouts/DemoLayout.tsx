import React from 'react';
import { Outlet } from 'react-router-dom';
import { IconEye, IconLogin } from '@tabler/icons-react';
import { AnimatedButton, GlassCard } from '@nexus-v1/frontend-shared';

export const DemoLayout: React.FC = () => {

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden relative">
       {/* Public / Demo Banner */}
       <div className="absolute top-0 left-0 right-0 h-10 bg-cyan-900/40 backdrop-blur-md flex items-center justify-center gap-2 border-b border-cyan-500/20 z-50">
          <IconEye size={16} className="text-cyan-400" />
          <span className="text-sm font-medium text-cyan-100">VIEW ONLY MODE &bull; Live Demo</span>
       </div>

       <div className="flex flex-col flex-1 pt-10">
          <main className="flex-1 overflow-y-auto p-8 relative opacity-80 bg-[url('/bg-obsidian.png')] bg-cover grayscale-[30%]">
             <div className="absolute top-4 right-4 z-40">
                <GlassCard className="flex items-center gap-4 !p-3">
                   <div className="text-xs text-neutral-400 max-w-[150px]">
                      You are exploring the platform in demo mode. Data is simulated.
                   </div>
                   <AnimatedButton
                      size="sm"
                      onClick={() => window.location.href = 'http://localhost:5173'} // Redirect to landing (port 5173 usually)
                   >
                      <span className="flex items-center gap-2">
                         <IconLogin size={16} /> Sign Up
                      </span>
                   </AnimatedButton>
                </GlassCard>
             </div>

             <Outlet />
          </main>
       </div>
    </div>
  );
};
