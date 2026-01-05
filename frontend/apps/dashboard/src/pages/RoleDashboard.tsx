import { useRole } from '@/context/RoleContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AdminDashboard,
  AnalystDashboard,
  ClientUnifiedDashboard,
  DeveloperDashboard,
  OperatorDashboard
} from './dashboards';

const dashboardComponents = {
  admin: AdminDashboard,
  developer: DeveloperDashboard,
  analyst: AnalystDashboard,
  operator: OperatorDashboard,
  demo: ClientUnifiedDashboard,
};

export default function RoleDashboard() {
  const { role } = useRole();
  const DashboardComponent = dashboardComponents[role];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={role}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        <DashboardComponent />
      </motion.div>
    </AnimatePresence>
  );
}
