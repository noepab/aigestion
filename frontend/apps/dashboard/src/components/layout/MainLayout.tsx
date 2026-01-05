import { m } from 'framer-motion';
import { ReactNode } from 'react';
import { BrandWatermark } from '../effects';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950">
      <BrandWatermark />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <Navbar />
        <m.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 p-8"
        >
          {children}
        </m.main>
      </div>
    </div>
  );
}
