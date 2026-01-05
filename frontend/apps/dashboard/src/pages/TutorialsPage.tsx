import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSciFiSound } from '../hooks/useSciFiSound';

const tutorials = [
    {
        id: 1,
        title: 'Primeros Pasos en NEXUS V1',
        category: 'Básico',
        duration: '5 min',
        level: 'Principiante',
        image: '🚀',
        progress: 100, // Completed
        points: 50
    },
    {
        id: 2,
        title: 'Configuración de Docker',
        category: 'Infraestructura',
        duration: '15 min',
        level: 'Avanzado',
        image: '🐳',
        progress: 45,
        points: 150
    },
    {
        id: 3,
        title: 'Gestión de Usuarios y Roles',
        category: 'Administración',
        duration: '10 min',
        level: 'Intermedio',
        image: '👥',
        progress: 0,
        points: 100
    },
    {
        id: 4,
        title: 'Analíticas Avanzadas',
        category: 'Datos',
        duration: '12 min',
        level: 'Avanzado',
        image: '📈',
        progress: 0,
        points: 120
    },
    {
        id: 5,
        title: 'Automatización de Tareas',
        category: 'Productividad',
        duration: '8 min',
        level: 'Intermedio',
        image: '⚡',
        progress: 80,
        points: 80
    },
    {
        id: 6,
        title: 'Seguridad y Permisos',
        category: 'Seguridad',
        duration: '20 min',
        level: 'Avanzado',
        image: '🔒',
        progress: 0,
        points: 200
    }
];

const categories = ['Todos', 'Básico', 'Infraestructura', 'Administración', 'Datos', 'Seguridad'];

export default function TutorialsPage() {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const { playHover, playClick } = useSciFiSound();

    const filteredTutorials = selectedCategory === 'Todos'
        ? tutorials
        : tutorials.filter(t => t.category === selectedCategory);

    // Calculate global progress
    const totalPoints = tutorials.reduce((acc, curr) => acc + curr.points, 0);
    const earnedPoints = tutorials.reduce((acc, curr) => acc + (curr.points * (curr.progress / 100)), 0);
    const userLevel = Math.floor(earnedPoints / 200) + 1;

    return (
        <div className="space-y-8">
            {/* Gamification Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 p-8 border border-white/10"
            >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">🎓</span>
                            <h1 className="text-3xl font-bold text-white">Academia NEXUS V1</h1>
                        </div>
                        <p className="text-indigo-200">Nivel {userLevel} • Experto en Automatización</p>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="w-48 h-2 bg-black/40 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(earnedPoints / totalPoints) * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                                />
                            </div>
                            <span className="text-sm font-bold text-blue-300">{Math.round(earnedPoints)} XP</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-4 bg-white/5 rounded-xl border border-white/10 cursor-help"
                        >
                            <div className="text-2xl font-bold text-white">3</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Cursos</div>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-4 bg-white/5 rounded-xl border border-white/10 cursor-help"
                        >
                            <div className="text-2xl font-bold text-green-400">12</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Logros</div>
                        </motion.div>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl" />
            </motion.div>

            {/* Categories */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2"
            >
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => { playClick(); setSelectedCategory(cat); }}
                        onMouseEnter={playHover}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === cat
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </motion.div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutorials.map((tutorial, index) => (
                    <motion.div
                        key={tutorial.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                        onMouseEnter={playHover}
                        className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] transition-all flex flex-col cursor-pointer"
                    >
                        <div className={`h-2 w-full ${tutorial.progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-transparent'}`} />

                        <div className="p-6 relative z-10 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{tutorial.image}</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${tutorial.level === 'Principiante' ? 'bg-green-500/20 text-green-400' :
                                    tutorial.level === 'Intermedio' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                    {tutorial.level}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{tutorial.title}</h3>
                            <p className="text-gray-400 text-sm mb-4">Aprende los fundamentos clave en esta lección práctica.</p>

                            <div className="mt-auto">
                                {tutorial.progress > 0 && tutorial.progress < 100 && (
                                    <div className="mb-3">
                                        <div className="text-xs text-gray-400 mb-1 flex justify-between">
                                            <span>En progreso</span>
                                            <span>{tutorial.progress}%</span>
                                        </div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${tutorial.progress}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-white/5">
                                    <span className="flex items-center gap-1">⏱️ {tutorial.duration}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playClick(); }}
                                        className={`px-3 py-1 rounded-lg transition-colors text-xs font-medium ${tutorial.progress === 100
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-white/10 hover:bg-blue-600 hover:text-white text-white'
                                            }`}
                                    >
                                        {tutorial.progress === 100 ? 'Completado' : tutorial.progress > 0 ? 'Continuar' : 'Comenzar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

