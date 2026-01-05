import { UserRole, useRole } from '@/context/RoleContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const roles: { id: UserRole; label: string; icon: string; color: string; description: string }[] = [
  { id: 'demo', label: 'Demo Cliente', icon: '🌟', color: 'from-amber-500 to-orange-500', description: 'Vista ejecutiva' },
  { id: 'admin', label: 'Administrador', icon: '👑', color: 'from-purple-500 to-pink-500', description: 'Control total' },
  { id: 'developer', label: 'Desarrollador', icon: '💻', color: 'from-cyan-500 to-blue-500', description: 'Código y Deploy' },
  { id: 'analyst', label: 'Analista', icon: '📊', color: 'from-violet-500 to-purple-500', description: 'Datos e insights' },
  { id: 'operator', label: 'Operador', icon: '🔧', color: 'from-emerald-500 to-teal-500', description: 'Infraestructura' },
];

export default function RoleSwitcher() {
  const { role, setRole, user } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  const currentRole = roles.find(r => r.id === role) ?? roles[0];

  return (
    <div className="relative">
      {/* Botón de Activación */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${currentRole.color} bg-opacity-20 border border-white/10 backdrop-blur-xl transition-all`}
      >
        <span className="text-xl">{currentRole.icon}</span>
        <div className="text-left">
          <p className="text-white text-sm font-medium">{user?.name ?? currentRole.label}</p>
          <p className="text-white/60 text-xs">{currentRole.description}</p>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-white/60"
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Menú Desplegable */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Fondo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Menú */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-72 bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-4 border-b border-white/10">
                <p className="text-gray-400 text-sm">Cambiar Rol</p>
                <p className="text-white text-xs opacity-50">Modo demo - cambio instantáneo</p>
              </div>

              <div className="p-2">
                {roles.map((roleOption, index) => (
                  <motion.button
                    key={roleOption.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setRole(roleOption.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${role === roleOption.id
                        ? `bg-gradient-to-r ${roleOption.color} bg-opacity-20`
                        : 'hover:bg-white/5'
                      }`}
                  >
                    <motion.span
                      className="text-2xl"
                      animate={role === roleOption.id ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {roleOption.icon}
                    </motion.span>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${role === roleOption.id ? 'text-white' : 'text-gray-300'}`}>
                        {roleOption.label}
                      </p>
                      <p className="text-gray-500 text-xs">{roleOption.description}</p>
                    </div>
                    {role === roleOption.id && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-emerald-400"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="p-3 border-t border-white/10 bg-white/5">
                <p className="text-center text-gray-500 text-xs">
                  Cada rol tiene un dashboard único
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
