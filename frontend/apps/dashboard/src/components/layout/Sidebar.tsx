import { useRole } from '@/context/RoleContext';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const elementosNavBase = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/docker', label: 'Docker', icon: '🐳' },
  { path: '/analytics', label: 'Analíticas', icon: '📈' },
  { path: '/tutorials', label: 'Tutoriales', icon: '🎓' },
  { path: '/risk-prevention', label: 'Riesgos Laborales', icon: '🛡️' },
  { path: '/credentials', label: 'Credenciales', icon: '🔐' },
  { path: '/subscription', label: 'Suscripción', icon: '💎' },
  { path: '/transcription', label: 'Transcripción', icon: '📝' },
  { path: '/settings', label: 'Configuración', icon: '⚙️' },
];

const elementosNavPorRol = {
  admin: [
    { path: '/admin/god', label: 'GOD MODE', icon: '⚡' },
    { path: '/admin', label: 'Panel Admin', icon: '👑' },
    ...elementosNavBase,
  ],
  developer: [
    ...elementosNavBase,
    { path: '/api-docs', label: 'Documentación API', icon: '📚' },
    { path: '/ci-cd', label: 'CI/CD', icon: '🔄' },
  ],
  analyst: [
    ...elementosNavBase,
    { path: '/reports', label: 'Reportes', icon: '📋' },
    { path: '/data', label: 'Fuentes de Datos', icon: '🗄️' },
  ],
  operator: [
    ...elementosNavBase,
    { path: '/logs', label: 'Logs del Sistema', icon: '📜' },
    { path: '/alerts', label: 'Alertas', icon: '🚨' },
  ],
  demo: [
    { path: '/dashboard', label: 'Vista Demo', icon: '🌟' },
    { path: '/analytics', label: 'Analíticas', icon: '📈' },
    { path: '/settings', label: 'Configuración', icon: '⚙️' },
  ],
};

const coloresRol = {
  admin: 'from-purple-600 to-pink-600',
  developer: 'from-cyan-600 to-blue-600',
  analyst: 'from-violet-600 to-purple-600',
  operator: 'from-emerald-600 to-teal-600',
  demo: 'from-amber-500 to-orange-500',
};

const iconosRol = {
  admin: '👑',
  developer: '💻',
  analyst: '📊',
  operator: '🔧',
  demo: '🌟',
};

const nombresRol = {
  admin: 'Administrador',
  developer: 'Desarrollador',
  analyst: 'Analista',
  operator: 'Operador',
  demo: 'Demo Cliente',
};

export default function Sidebar() {
  const location = useLocation();
  const { role, user } = useRole();
  const elementosNav = elementosNavPorRol[role] ?? elementosNavBase;
  const colorRol = coloresRol[role];
  const iconoRol = iconosRol[role];
  const nombreRol = nombresRol[role];

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-72 glass-effect p-6 border-r border-white/10 flex flex-col"
    >
      {/* Logo / Marca */}
      <motion.div className="mb-12 mt-4 px-2" whileHover={{ scale: 1.05 }}>
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${colorRol} flex items-center justify-center shadow-2xl relative overflow-hidden`}
            animate={{
              boxShadow: [
                '0 0 30px rgba(139, 92, 246, 0.4)',
                '0 0 60px rgba(139, 92, 246, 0.7)',
                '0 0 30px rgba(139, 92, 246, 0.4)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {/* Glossy Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 blur-md -skew-y-12 transform -translate-y-4" />
            <span className="text-6xl filter drop-shadow-md">{iconoRol}</span>
          </motion.div>
          <div>
            <h1
              className={`text-3xl font-black bg-gradient-to-r ${colorRol} bg-clip-text text-transparent tracking-tighter`}
            >
              AI GESTION NEXT
            </h1>
            <p className="text-sm text-gray-400 font-medium tracking-widest mt-1 uppercase opacity-80 border-t border-white/10 pt-2 mx-8">
              {nombreRol}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info del Usuario */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorRol} flex items-center justify-center`}
          >
            <span className="text-lg">{user?.avatar ?? '👤'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user?.name}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-4">Navegación</p>
        {elementosNav.map((item, index) => (
          <Link key={item.path} to={item.path}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                location.pathname === item.path
                  ? `bg-gradient-to-r ${colorRol} bg-opacity-20 border border-white/20 shadow-lg`
                  : 'hover:bg-white/5',
              )}
            >
              <motion.span
                className="text-xl"
                animate={location.pathname === item.path ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {item.icon}
              </motion.span>
              <span
                className={clsx(
                  'font-medium',
                  location.pathname === item.path ? 'text-white' : 'text-gray-300',
                )}
              >
                {item.label}
              </span>
              {location.pathname === item.path && (
                <motion.div
                  layoutId="indicadorActivo"
                  className={`ml-auto w-2 h-2 rounded-full bg-gradient-to-r ${colorRol}`}
                />
              )}
            </motion.div>
          </Link>
        ))}
      </nav>

      {/* Estado del Sistema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 pt-6 border-t border-white/10"
      >
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Estado del Sistema</p>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">Todos los Sistemas Operativos</span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">99.9% activo</span>
            <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">4 servicios</span>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
}
