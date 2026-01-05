import { motion } from 'framer-motion';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRole } from '../context/RoleContext';
import { useSciFiSound } from '../hooks/useSciFiSound';

const MOCK_DATA = [
  { name: 'Jan', revenue: 4000, automation: 2400 },
  { name: 'Feb', revenue: 3000, automation: 1398 },
  { name: 'Mar', revenue: 2000, automation: 9800 },
  { name: 'Apr', revenue: 2780, automation: 3908 },
  { name: 'May', revenue: 1890, automation: 4800 },
  { name: 'Jun', revenue: 2390, automation: 3800 },
  { name: 'Jul', revenue: 3490, automation: 4300 },
];

const PIE_DATA = [
  { name: 'Active Agents', value: 400 },
  { name: 'Idle', value: 300 },
  { name: 'Training', value: 300 },
  { name: 'Error', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const { playHover, playClick, playSuccess } = useSciFiSound();
  const [deploying, setDeploying] = useState(false);
  const { user } = useRole();

  const handleDeploy = () => {
    playClick();
    setDeploying(true);
    setTimeout(() => {
      playSuccess();
      setDeploying(false);
      // Could simulate data update here
    }, 2500);
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-end"
      >
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
            Command Center
          </h1>
          <p className="text-gray-400">
            Bienvenido, {user?.name || 'Comandante'}. Estado del sistema:{' '}
            <span className="text-green-400">NOMINAL</span>
          </p>
        </div>

        <button
          onClick={handleDeploy}
          onMouseEnter={playHover}
          disabled={deploying}
          className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 ${
            deploying
              ? 'bg-gray-700 text-gray-500 cursor-wait'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)]'
          }`}
        >
          {deploying ? 'Deploying Neural Agent...' : '+ Deploy New Agent'}
        </button>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Revenue', val: '€124,592', change: '+12%', color: 'text-green-400' },
          { label: 'Active Sessions', val: '1,293', change: '+5%', color: 'text-cyan-400' },
          { label: 'Avg. Response', val: '0.4s', change: '-12%', color: 'text-purple-400' },
          { label: 'Neural Load', val: '43%', change: 'Stable', color: 'text-yellow-400' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onMouseEnter={playHover}
            className="bg-slate-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl hover:border-cyan-500/50 transition-colors"
          >
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{kpi.label}</p>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-mono text-white">{kpi.val}</span>
              <span className={`text-sm ${kpi.color}`}>{kpi.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-xl p-6 min-h-[400px]"
        >
          <h3 className="text-xl font-bold text-white mb-6">Neural Network Efficiency</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="automation"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorAuto)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Action / Secondary Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900/50 border border-white/10 rounded-xl p-6 flex flex-col"
        >
          <h3 className="text-xl font-bold text-white mb-6">Agent Distribution</h3>
          <div className="h-[250px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PIE_DATA.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <p className="text-xs text-cyan-400 mb-1">RECOMMENDATION</p>
              <p className="text-sm text-gray-300">
                Increase "Sales Agent" capacity by 15% to meet predicted demand.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
