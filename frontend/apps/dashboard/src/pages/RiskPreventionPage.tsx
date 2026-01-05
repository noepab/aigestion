import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useSciFiSound } from '../hooks/useSciFiSound';

const risks = [
    {
        id: 1,
        area: 'Oficina Central',
        risk: 'Ergonomía Inadecuada',
        level: 'Medio',
        probability: 'Alta',
        impact: 'Bajo',
        status: 'Pendiente',
        action: 'Revisión de sillas'
    },
    {
        id: 2,
        area: 'Almacén',
        risk: 'Caída de Objetos',
        level: 'Alto',
        probability: 'Media',
        impact: 'Alto',
        status: 'En Progreso',
        action: 'Instalar mallas'
    },
    {
        id: 3,
        area: 'Servidores',
        risk: 'Riesgo Eléctrico',
        level: 'Bajo',
        probability: 'Baja',
        impact: 'Crítico',
        status: 'Controlado',
        action: 'Mantenimiento anual'
    }
];

export default function RiskPreventionPage() {
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [incidentDescription, setIncidentDescription] = useState('');
    const { playHover, playClick, playSuccess, playError } = useSciFiSound();

    const handleAIAnalyze = () => {
        if (!incidentDescription) {
            playError();
            return;
        }
        playClick();
        setAnalyzing(true);
        setAiAnalysis(null);

        // Simulate AI processing
        setTimeout(() => {
            playSuccess();
            setAnalyzing(false);
            setAiAnalysis(`Basado en "${incidentDescription}", el sistema detecta un riesgo potencial de TIPO B. \n\nRecomendación Inmediata:\n1. Aislar la zona afectada.\n2. Notificar al supervisor de turno.\n3. Revisar protocolo ISO-45001 sección 4.2.`);
        }, 2000);
    };

    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Gestión de Riesgos 4.0 🛡️
            </h1>
            <p className="text-gray-400 mt-2">
              Seguridad laboral potenciada por IA y análisis predictivo
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onMouseEnter={playHover}
              onClick={playClick}
              className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-medium"
            >
              📄 Exportar ISO
            </button>
            <button
              onMouseEnter={playHover}
              onClick={playClick}
              className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2 rounded-xl text-white font-bold shadow-lg hover:shadow-orange-500/20 transition-all hover:scale-105"
            >
              + Nuevo Incidente
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Assistant Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden"
          >
            {/* Scanning effect */}
            {analyzing && (
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)] animate-[scan_2s_linear_infinite]" />
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                🤖
              </div>
              <h3 className="text-xl font-bold text-white">AI Safety Advisor</h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-300">
                Describe una situación o zona para recibir un análisis de riesgos inmediato.
              </p>
              <textarea
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="Ej: Hay cables sueltos cerca del área de carga y descarga donde transitan montacargas..."
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 h-32 resize-none transition-colors"
              />
              <button
                onClick={handleAIAnalyze}
                onMouseEnter={playHover}
                disabled={analyzing || !incidentDescription}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
              >
                {analyzing ? 'Analizando...' : 'Analizar Riesgos'}
              </button>
            </div>

            <AnimatePresence>
              {aiAnalysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm whitespace-pre-line"
                >
                  {aiAnalysis}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Risk Matrix Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Matriz de Calor de Riesgos</h3>
            <div className="relative h-64 w-full bg-slate-800/50 rounded-lg p-4 grid grid-cols-3 grid-rows-3 gap-1">
              {/* Labels */}
              <div className="absolute -left-8 top-1/2 -rotate-90 text-xs text-gray-400">
                PROBABILIDAD
              </div>
              <div className="absolute bottom-[-1.5rem] left-1/2 text-xs text-gray-400">
                IMPACTO
              </div>

              {/* Grid Cells */}
              {['Bajo', 'Medio', 'Alto'].map((_prob, i) =>
                ['Bajo', 'Medio', 'Alto'].map((_impact, j) => {
                  // Calculate color based on severity
                  const severity = i + j;
                  let bgClass = 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20';
                  if (severity >= 3)
                    bgClass = 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20';
                  else if (severity >= 2)
                    bgClass = 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20';

                  return (
                    <motion.div
                      key={`${i}-${j}`}
                      onMouseEnter={playHover}
                      className={`border rounded flex items-center justify-center relative ${bgClass} transition-colors cursor-crosshair`}
                    >
                      {/* Randomly place dots for effect */}
                      {i === 2 && j === 2 && (
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-ping absolute" />
                      )}
                      {i === 2 && j === 2 && (
                        <div className="w-3 h-3 rounded-full bg-red-500 absolute" />
                      )}

                      {i === 1 && j === 0 && (
                        <div className="w-3 h-3 rounded-full bg-yellow-500 absolute" />
                      )}
                    </motion.div>
                  );
                }),
              )}
            </div>
            <div className="flex justify-between mt-8 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" /> Riesgo Aceptable
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" /> Requiere Atención
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" /> Crítico
              </div>
            </div>
          </motion.div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'Días sin Accidentes',
              value: '142',
              color: 'from-green-500 to-emerald-600',
              icon: '🗓️',
            },
            {
              label: 'Nivel de Riesgo Global',
              value: 'Bajo',
              color: 'from-blue-500 to-cyan-600',
              icon: '📊',
            },
            {
              label: 'Cumplimiento Normativo',
              value: '98%',
              color: 'from-purple-500 to-indigo-600',
              icon: '✅',
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={playHover}
              whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <h2
                    className={`text-3xl font-bold mt-1 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </h2>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Risk Map / Personalized Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Mapa de Riesgos Personalizado</h3>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-green-500 uppercase">Live Monitor</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Área</th>
                  <th className="px-6 py-4">Riesgo Identificado</th>
                  <th className="px-6 py-4">Nivel</th>
                  <th className="px-6 py-4">Probabilidad</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acción Requerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {risks.map((risk, idx) => (
                  <motion.tr
                    key={risk.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onMouseEnter={playHover}
                    onClick={playClick}
                  >
                    <td className="px-6 py-4 font-medium text-white">{risk.area}</td>
                    <td className="px-6 py-4">{risk.risk}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          risk.level === 'Alto'
                            ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                            : risk.level === 'Medio'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {risk.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">{risk.probability}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-2 ${
                          risk.status === 'Controlado' ? 'text-green-400' : 'text-orange-400'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            risk.status === 'Controlado'
                              ? 'bg-green-400'
                              : 'bg-orange-400 animate-pulse'
                          }`}
                        />
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{risk.action}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
}
