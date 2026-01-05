import { motion } from 'framer-motion';
import { useState } from 'react';

interface Settings {
  notifications: boolean;
  darkMode: boolean;
  autoSave: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    darkMode: true,
    autoSave: true,
  });

  const toggleSetting = (key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
    </label>
  );

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
        <p className="text-gray-400">Configura tu experiencia a nivel dios</p>
      </motion.div>

      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-6"
        >
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <p className="text-sm text-gray-400">Receive system notifications</p>
            </div>
            <ToggleSwitch
              checked={settings.notifications}
              onChange={() => toggleSetting('notifications')}
            />
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Dark Mode</h3>
              <p className="text-sm text-gray-400">Use dark theme interface</p>
            </div>
            <ToggleSwitch checked={settings.darkMode} onChange={() => toggleSetting('darkMode')} />
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Auto Save</h3>
              <p className="text-sm text-gray-400">Automatically save changes</p>
            </div>
            <ToggleSwitch checked={settings.autoSave} onChange={() => toggleSetting('autoSave')} />
          </div>

          <div className="pt-4 border-t border-white/10">
            <button className="btn-primary w-full">Save Changes</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
