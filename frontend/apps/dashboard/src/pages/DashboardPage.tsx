import { StatCard } from '@/components/dashboard';
import { Card } from '@/components/ui';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DashboardPage() {
  const [stats] = useState({
    users: 1247,
    revenue: '$45,678',
    projects: 23,
    tasks: 156,
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
        <p className="text-gray-400">Bienvenido al panel de control nivel dios</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={item}>
          <StatCard
            title="Total Users"
            value={stats.users.toLocaleString()}
            icon="👥"
            trend={12.5}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Revenue" value={stats.revenue} icon="💰" trend={8.2} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Active Projects" value={stats.projects} icon="📁" trend={-2.4} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Tasks Completed" value={stats.tasks} icon="✅" trend={15.7} />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <h2 className="text-2xl font-bold text-white mb-4">Activity Overview</h2>
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-xl">
              <p className="text-gray-400">Chart Component Here</p>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">Event {i}</p>
                    <p className="text-xs text-gray-400">Hace {i} horas</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
