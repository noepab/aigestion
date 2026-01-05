import { motion } from 'framer-motion';

export interface LogEntry {
  id: number;
  user: string;
  action: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export function ActivityLog({ logs, title }: { logs: LogEntry[]; title: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <h3 className="font-bold text-white mb-4">{title}</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="text-sm text-gray-300">
            <span className="font-bold text-purple-400">{log.user}</span>: {log.action} <span className="text-gray-500 text-xs">({log.time})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="#333" strokeWidth="4" fill="none" />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke={color}
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${(percentage / 100) * 175} 175`}
          />
        </svg>
        <span className="absolute text-xs font-bold">{Math.round(percentage)}%</span>
      </div>
      <span className="text-xs mt-2 text-gray-400">{label}</span>
    </div>
  );
}

export function MetricCard({ title, value, icon, trend, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`p-6 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 backdrop-blur-xl`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-${color}-400 font-bold uppercase tracking-wider text-xs`}>{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-black text-white mb-2">{value}</div>
      {trend && (
        <div className={`text-xs font-bold ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </motion.div>
  );
}

export function SystemMetricsWidget() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">System Metrics</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black/20 p-4 rounded-xl">
          <div className="text-xs text-gray-400">Total Requests</div>
          <div className="text-xl font-bold">1,234</div>
        </div>
        <div className="bg-black/20 p-4 rounded-xl">
          <div className="text-xs text-gray-400">Error Rate</div>
          <div className="text-xl font-bold text-emerald-400">0.01%</div>
        </div>
        <div className="bg-black/20 p-4 rounded-xl">
          <div className="text-xs text-gray-400">Avg Latency</div>
          <div className="text-xl font-bold">45ms</div>
        </div>
      </div>
    </div>
  );
}

export function BuildStatusWidget(_props: any) {
    return <div>Build Status Widget</div>;
}

export function GitActivityFeed() {
    return <div>Git Activity Feed</div>;
}

export function InteractiveChart(props: any) {
    return <div>Interactive Chart: {props.title}</div>;
}
