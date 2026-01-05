import { motion } from 'framer-motion';
import { Card } from '../ui';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: number;
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.05 }}>
      <Card className="h-full" hoverEffect={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
          <span className="text-3xl">{icon}</span>
        </div>
        <p className="text-4xl font-bold gradient-text mb-2">{value}</p>
        {trend !== undefined && (
          <p className={`text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}% desde ayer
          </p>
        )}
      </Card>
    </motion.div>
  );
}
