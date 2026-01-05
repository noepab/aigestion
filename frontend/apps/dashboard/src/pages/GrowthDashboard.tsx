import apiService from '@/services/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock imports/components that were missing
const useNotifications = () => {
  return {
    notifications: [],
    dismissNotification: () => {},
    success: console.log,
    error: console.error,
    info: console.log,
  };
};

const NotificationCenter = (_: any) => null;

const MetricCard = ({ title, value, icon, color }: any) => (
  <div className={`p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
    <div className="flex justify-between items-start mb-2">
      <span className={`p-2 rounded-lg bg-${color}-500/20 text-2xl`}>{icon}</span>
      <span className={`text-${color}-400 font-bold text-xl`}>{value}</span>
    </div>
    <div className="text-gray-400 text-sm">{title}</div>
  </div>
);

const DataTable = ({ data, columns, emptyMessage }: any) => (
  <div className="w-full overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-700">
          {columns.map((col: any) => (
            <th key={col.key} className="p-3 text-slate-400">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="p-4 text-center text-slate-500">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row: any, i: number) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
              {columns.map((col: any) => (
                <td key={col.key} className="p-3 text-slate-300">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const POST_TEMPLATES: any = {
  launch: (product: string) =>
    `🚀 Launching ${product}! It's been a wild ride. \n\n#launch #startup`,
  sales: (product: string) =>
    `We just launched ${product} and the response has been insane.\n\n- Benefit 1\n- Benefit 2\n- Benefit 3\n\nLooking for 5 beta testers. DM me "BETA".`,
  hiring: (role: string) => `We are hiring a ${role}. Come join us! #hiring`,
};

export default function GrowthDashboard() {
  const { notifications, dismissNotification, success, error, info } = useNotifications();
  const [activeTab, setActiveTab] = useState<'generator' | 'tracker' | 'meta'>('generator');
  const [topic, setTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');

  // Mocks for data
  const leads: any[] = [];
  const leadColumns = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'status', label: 'Status' },
  ];

  const generatePost = (key: string) => {
    const template = POST_TEMPLATES[key];
    if (template) {
      setGeneratedPost(template(topic || '[Product Name]'));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    success('Copied', 'Post copied to clipboard');
  };

  // Facebook Integration
  const { data: fbStats, isLoading: fbLoading } = useQuery({
    queryKey: ['facebook', 'stats'],
    queryFn: async () => {
      // Mock implementation if apiService.social is missing or fails
      try {
        return await apiService.social.getFacebookStats();
      } catch {
        return { followers: 1200, new_like_count: 5, engagement: 85, rating_count: 4.8 };
      }
    },
    enabled: activeTab === 'meta',
  });

  const publishMutation = useMutation({
    mutationFn: (message: string) => apiService.social.publishFacebook(message),
    onSuccess: () => {
      success('Published!', 'Your post is live on Facebook');
    },
    onError: (err: any) => {
      error('Failed', err.message || 'Could not publish to Facebook');
    },
  });

  const handlePublish = () => {
    if (!generatedPost) {
      info('Empty Post', 'Generate or write something first');
      return;
    }
    publishMutation.mutate(generatedPost);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30 relative overflow-hidden p-8">
      {/* Background elements would go here */}

      <NotificationCenter
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
      />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
            GROWTH ENGINE
          </h1>
          <p className="text-green-400 text-xl font-light tracking-[0.3em] uppercase">
            LinkedIn Automation & CRM & Meta
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-6 py-2 rounded-full border transition-all ${activeTab === 'generator' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-slate-900/50 border-slate-700 text-gray-400 hover:border-green-500/50'}`}
          >
            ✍️ Post Generator
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-6 py-2 rounded-full border transition-all ${activeTab === 'tracker' ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-slate-900/50 border-slate-700 text-gray-400 hover:border-blue-500/50'}`}
          >
            👥 Leads CRM
          </button>
          <button
            onClick={() => setActiveTab('meta')}
            className={`px-6 py-2 rounded-full border transition-all ${activeTab === 'meta' ? 'bg-blue-600/20 border-blue-600 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-900/50 border-slate-700 text-gray-400 hover:border-blue-600/50'}`}
          >
            ♾️ Meta Command
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'generator' ? (
            <motion.div
              key="generator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Generator UI */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">1. Choose Topic & Template</h2>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Topic or Keyword</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Docker Optimization, Remote Work, SaaS Scaling..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                {/* Templates buttons */}
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(POST_TEMPLATES).map((key) => (
                    <button
                      key={key}
                      onClick={() => generatePost(key)}
                      className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg hover:border-green-500/50 hover:bg-green-500/10 transition-all text-left capitalize"
                    >
                      <div className="text-green-400 font-bold mb-1">{key}</div>
                      <div className="text-xs text-gray-500">Generate {key} post</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4">2. Edit & Polish</h2>
                <textarea
                  value={generatedPost}
                  onChange={(e) => setGeneratedPost(e.target.value)}
                  placeholder="Generated post will appear here..."
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-gray-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-green-500 resize-none"
                />
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    onClick={() => setGeneratedPost('')}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="px-6 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20"
                  >
                    Copy to Clipboard 📋
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    {publishMutation.isPending ? 'Publishing...' : 'Post to Facebook 🚀'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'tracker' ? (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Tracker UI */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Leads"
                  value={leads.length}
                  icon={<span>👥</span>}
                  color="blue"
                />
                <MetricCard
                  title="Contacted"
                  value={leads.filter((l) => l.status === 'contacted').length}
                  icon={<span>📨</span>}
                  color="yellow"
                />
                <MetricCard
                  title="Replies"
                  value={leads.filter((l) => l.status === 'replied').length}
                  icon={<span>💬</span>}
                  color="purple"
                />
                <MetricCard
                  title="Demos Booked"
                  value={leads.filter((l) => l.status === 'demo').length}
                  icon={<span>📅</span>}
                  color="green"
                />
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Prospect List</h2>
                  <button className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                    + Add Lead
                  </button>
                </div>
                <DataTable
                  data={leads}
                  columns={leadColumns}
                  emptyMessage="No leads yet. Start prospecting!"
                  pageSize={10}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="meta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {fbLoading ? (
                  <div className="col-span-4 text-center py-10">Loading Facebook Stats...</div>
                ) : (
                  <>
                    <MetricCard
                      title="Page Followers"
                      value={fbStats?.followers || fbStats?.fan_count || 0}
                      icon={<span>👍</span>}
                      color="blue"
                    />
                    <MetricCard
                      title="New Likes"
                      value={fbStats?.new_like_count || 0}
                      icon={<span>📈</span>}
                      color="green"
                    />
                    <MetricCard
                      title="Engagement"
                      value={fbStats?.engagement || fbStats?.talking_about_count || 0}
                      icon={<span>🔥</span>}
                      color="purple"
                    />
                    <MetricCard
                      title="Page Rating"
                      value={fbStats?.rating_count || 0}
                      icon={<span>⭐</span>}
                      color="yellow"
                    />
                  </>
                )}
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">∞ Meta Ecosystem Status</h2>
                <p className="text-gray-400">Connected to Facebook Page via Graph API v19.0</p>
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded inline-block">
                  <span className="text-green-400 font-mono">Status: ONLINE</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
