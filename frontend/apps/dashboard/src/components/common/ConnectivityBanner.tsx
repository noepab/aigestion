import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { NexusTypography, NexusCard } from '@shared/design-system';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ConnectivityBanner: React.FC = () => {
  const { online, effectiveType, saveData } = useNetworkStatus();
  const isSlowConnection = effectiveType === '2g' || effectiveType === 'slow-2g' || saveData;

  if (online && !isSlowConnection) return null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md"
      >
        <NexusCard
          variant="glass"
          padding="sm"
          className={`flex items-center gap-3 border-l-4 ${!online ? 'border-l-rose-500' : 'border-l-amber-500'}`}
        >
          <div className={`p-2 rounded-full ${!online ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {!online ? <WifiOff size={18} /> : <AlertTriangle size={18} />}
          </div>

          <div className="flex-1">
            <NexusTypography variant="small" weight="semibold">
              {!online ? 'Offline Mode Active' : 'Limited Connectivity'}
            </NexusTypography>
            <NexusTypography variant="small" color="secondary" className="text-[10px]">
              {!online
                ? 'Using cached data. Changes will sync when online.'
                : 'Slow network detected. Using low-bandwidth mode.'}
            </NexusTypography>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-[8px] uppercase tracking-tighter text-slate-500 border border-white/5">
            <ShieldCheck size={10} />
            Offline-First Enabled
          </div>
        </NexusCard>
      </m.div>
    </AnimatePresence>
  );
};
