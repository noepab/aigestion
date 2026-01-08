import { AnimatePresence, motion } from 'framer-motion';
import { Search, Monitor, BarChart2, Shield, FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const actions = [
    { id: 'home', label: 'Go to Command Center', icon: Monitor, path: '/dashboard' },
    { id: 'analytics', label: 'View Analytics', icon: BarChart2, path: '/analytics' },
    { id: 'security', label: 'Security & Risk', icon: Shield, path: '/risk-prevention' },
    { id: 'docs', label: 'Read Documentation', icon: FileText, path: '/tutorials' },
  ];

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="flex items-center px-4 py-3 border-b border-white/10">
              <Search className="w-5 h-5 text-white/50 mr-3" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 text-lg"
              />
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {filteredActions.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/40">No results found.</div>
              ) : (
                filteredActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => handleSelect(action.path)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 text-white/80 hover:text-white transition-colors group"
                  >
                    <div className="p-2 rounded bg-white/5 group-hover:bg-[var(--nexus-primary)]/20 transition-colors">
                      <action.icon className="w-4 h-4 group-hover:text-[var(--nexus-primary)] transition-colors" />
                    </div>
                    <span className="flex-1">{action.label}</span>
                    {index < 3 && <span className="text-xs text-white/20">Jump to</span>}
                  </button>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-white/5 bg-white/5 flex justify-between items-center text-xs text-white/30">
              <span>Press <kbd className="font-sans px-1 py-0.5 rounded bg-white/10">Esc</kbd> to close</span>
              <span>AIGestion Nexus V1</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
