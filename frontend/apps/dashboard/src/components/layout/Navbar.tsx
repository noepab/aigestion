import { motion } from 'framer-motion';
import RoleSwitcher from '../RoleSwitcher';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-effect px-8 py-4 border-b border-white/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search IA GESTIONA commands..."
              className="w-80 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <kbd className="text-xs px-1.5 py-0.5 rounded bg-white/10 border border-white/10">⌘K</kbd>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative p-2 rounded-xl hover:bg-white/5 transition-all"
          >
            <span className="text-2xl">🔔</span>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
            >
              3
            </motion.span>
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl hover:bg-white/5 transition-all"
          >
            <span className="text-2xl">⚙️</span>
          </motion.button>

          {/* Role Switcher */}
          <RoleSwitcher />
        </div>
      </div>
    </motion.nav>
  );
}
