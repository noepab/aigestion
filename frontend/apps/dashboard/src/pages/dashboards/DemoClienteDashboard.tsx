import { GlowingOrb, ParticleBackground } from '@/components/effects';
import { GuidedTour, TourStep } from '@/components/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// ... (Existing helper components: ContadorAnimado, TarjetaKPI, etc. - keeping them as is)

// Contador animado
function ContadorAnimado({
  valor,
  prefijo = '',
  sufijo = '',
}: {
  valor: number;
  prefijo?: string;
  sufijo?: string;
}) {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const duracion = 2500;
    const pasos = 80;
    const incremento = valor / pasos;
    let paso = 0;

    const timer = setInterval(() => {
      paso++;
      if (paso >= pasos) {
        setActual(valor);
        clearInterval(timer);
      } else {
        setActual(Math.floor(incremento * paso));
      }
    }, duracion / pasos);

    return () => clearInterval(timer);
  }, [valor]);

  return (
    <span>
      {prefijo}
      {actual.toLocaleString('es-ES')}
      {sufijo}
    </span>
  );
}

// Tarjeta de KPI Principal
function TarjetaKPI({
  titulo,
  valor,
  icono,
  tendencia,
  descripcion,
  color,
}: {
  titulo: string;
  valor: number | string;
  icono: string;
  tendencia?: number;
  descripcion: string;
  color: 'morado' | 'azul' | 'verde' | 'naranja' | 'rosa';
}) {
  const colores = {
    morado: {
      bg: 'from-purple-600/20 to-pink-600/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    },
    azul: {
      bg: 'from-cyan-600/20 to-blue-600/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
    },
    verde: {
      bg: 'from-emerald-600/20 to-teal-600/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
    },
    naranja: {
      bg: 'from-orange-600/20 to-amber-600/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
    },
    rosa: {
      bg: 'from-pink-600/20 to-rose-600/20',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
    },
  };

  const config = colores[color];
  const valorNumerico = typeof valor === 'number' ? valor : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} backdrop-blur-xl p-6`}
    >
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.span
            className="text-4xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {icono}
          </motion.span>
          {tendencia !== undefined && (
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-sm font-bold ${tendencia >= 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center gap-1`}
            >
              {tendencia >= 0 ? 'ðŸ“ˆ' : 'ðŸ“‰'}
              {tendencia >= 0 ? '+' : ''}
              {tendencia}%
            </motion.span>
          )}
        </div>

        <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">{titulo}</p>

        <p className="text-4xl font-bold text-white mb-2">
          {typeof valor === 'number' ? <ContadorAnimado valor={valorNumerico} /> : valor}
        </p>

        <p className="text-gray-500 text-sm">{descripcion}</p>
      </div>
    </motion.div>
  );
}

// GrÃ¡fico de Rendimiento Simulado
function GraficoRendimiento() {
  const datos = [35, 45, 40, 55, 65, 60, 75, 85, 78, 92, 88, 95];
  const meses = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  const max = Math.max(...datos);

  return (
    <motion.div
      id="demo-chart" // ADDED ID
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <h3 className="text-xl font-bold text-white mb-6">ðŸ“ˆ Crecimiento Anual del Negocio</h3>

      <div className="flex items-end gap-2 h-48 mb-4">
        {datos.map((valor, index) => (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${(valor / max) * 100}%` }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex-1 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg relative group cursor-pointer"
            style={{ minHeight: '4px' }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {valor}%
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        {meses.map((mes) => (
          <span key={mes}>{mes}</span>
        ))}
      </div>
    </motion.div>
  );
}

// Tarjeta de Caso de Ã‰xito
function CasoExito({
  empresa,
  logo,
  descripcion,
  resultado,
  sector,
}: {
  empresa: string;
  logo: string;
  descripcion: string;
  resultado: string;
  sector: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl">{logo}</span>
        <div>
          <h4 className="text-white font-bold">{empresa}</h4>
          <span className="text-xs text-purple-400 px-2 py-1 bg-purple-500/20 rounded-full">
            {sector}
          </span>
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-4">{descripcion}</p>
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-emerald-400 font-semibold text-sm">ðŸ“Š Resultado: {resultado}</p>
      </div>
    </motion.div>
  );
}

// CaracterÃ­stica del Producto
function CaracteristicaProducto({
  icono,
  titulo,
  descripcion,
  disponible = true,
}: {
  icono: string;
  titulo: string;
  descripcion: string;
  disponible?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className={`flex items-start gap-4 p-4 rounded-xl transition-all ${disponible ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-800/30 opacity-60'}`}
    >
      <span className="text-2xl">{icono}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-medium">{titulo}</h4>
          {!disponible && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
              PrÃ³ximamente
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm">{descripcion}</p>
      </div>
      {disponible && <span className="text-emerald-400">âœ“</span>}
    </motion.div>
  );
}

// Planes de Precios
function TarjetaPlan({
  nombre,
  precio,
  caracteristicas,
  destacado = false,
  popular = false,
}: {
  nombre: string;
  precio: string;
  caracteristicas: string[];
  destacado?: boolean;
  popular?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -10 }}
      className={`relative rounded-2xl p-6 ${
        destacado
          ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-500'
          : 'bg-white/5 border border-white/10'
      } backdrop-blur-xl`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold">
            ðŸ”¥ MÃS POPULAR
          </span>
        </div>
      )}

      <h3 className="text-xl font-bold text-white mb-2">{nombre}</h3>
      <p className="text-3xl font-bold text-purple-400 mb-6">
        {precio}
        <span className="text-sm text-gray-400">/mes</span>
      </p>

      <ul className="space-y-3">
        {caracteristicas.map((caracteristica, index) => (
          <li key={index} className="flex items-center gap-2 text-gray-300 text-sm">
            <span className="text-emerald-400">âœ“</span>
            {caracteristica}
          </li>
        ))}
      </ul>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-full mt-6 py-3 rounded-xl font-semibold ${
          destacado
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        Comenzar Ahora
      </motion.button>
    </motion.div>
  );
}

// Testimonio de Cliente
function Testimonio({
  nombre,
  cargo,
  empresa,
  texto,
  avatar,
}: {
  nombre: string;
  cargo: string;
  empresa: string;
  texto: string;
  avatar: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
    >
      <p className="text-gray-300 italic mb-4">"{texto}"</p>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{avatar}</span>
        <div>
          <p className="text-white font-medium">{nombre}</p>
          <p className="text-gray-400 text-sm">
            {cargo} en {empresa}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// SimulaciÃ³n de Workflow
function SimulacionWorkflow() {
  const [pasoActual, setPasoActual] = useState(0);
  const pasos = [
    {
      titulo: 'ConfiguraciÃ³n Inicial',
      descripcion: 'Integra tus herramientas en minutos',
      icono: 'âš™ï¸',
    },
    { titulo: 'AutomatizaciÃ³n', descripcion: 'Los agentes IA trabajan por ti 24/7', icono: 'ðŸ¤–' },
    { titulo: 'Crecimiento', descripcion: 'Observa cÃ³mo crecen tus mÃ©tricas', icono: 'ðŸ“ˆ' },
    { titulo: 'Escalado', descripcion: 'Expande sin lÃ­mites con NEXUS V1', icono: 'ðŸš€' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPasoActual((prev) => (prev + 1) % pasos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6"
    >
      <h3 className="text-xl font-bold text-white mb-6">ðŸ”„ AsÃ­ Funciona NEXUS V1</h3>

      <div className="relative">
        {/* LÃ­nea de progreso */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-white/10 rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((pasoActual + 1) / pasos.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>

        <div className="flex justify-between relative">
          {pasos.map((paso, index) => (
            <motion.div
              key={index}
              animate={{
                scale: index === pasoActual ? 1.1 : 1,
                y: index === pasoActual ? -10 : 0,
              }}
              className={`flex flex-col items-center text-center w-1/4 ${index <= pasoActual ? 'opacity-100' : 'opacity-40'}`}
            >
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 ${
                  index <= pasoActual
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                    : 'bg-white/10'
                }`}
                animate={
                  index === pasoActual
                    ? {
                        boxShadow: [
                          '0 0 0 0 rgba(139, 92, 246, 0)',
                          '0 0 0 20px rgba(139, 92, 246, 0.3)',
                          '0 0 0 0 rgba(139, 92, 246, 0)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {paso.icono}
              </motion.div>
              <h4 className="text-white text-sm font-medium">{paso.titulo}</h4>
              <p className="text-gray-400 text-xs mt-1">{paso.descripcion}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '#demo-hero',
    title: 'Welcome to NEXUS V1',
    content: 'Your all-in-one command center for business growth. Let us show you around!',
  },
  {
    target: '#demo-metrics',
    title: 'Real-time Metrics',
    content: 'Track companies, revenue, and automation stats in real-time.',
  },
  {
    target: '#demo-chart',
    title: 'Growth Analytics',
    content: 'Visualize your year-over-year growth with interactive charts.',
  },
  {
    target: '#demo-nav',
    title: 'Explore More',
    content: 'Switch between Success Stories and Pricing plans to see how we can help you scale.',
  },
];

export default function DemoClienteDashboard() {
  const [seccionActiva, setSeccionActiva] = useState<'resumen' | 'casos' | 'precios'>('resumen');
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    // Check if tour has been seen
    const hasSeenTour = localStorage.getItem('hasSeenDemoTour');
    if (!hasSeenTour) {
      // Delay slightly for effect
      setTimeout(() => setIsTourOpen(true), 1500);
    }
  }, []);

  const handleTourComplete = () => {
    localStorage.setItem('hasSeenDemoTour', 'true');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Tour Component */}
      <GuidedTour
        steps={TOUR_STEPS}
        isOpen={isTourOpen}
        onComplete={handleTourComplete}
      />

      {/* Efectos de Fondo */}
      <ParticleBackground color="purple" count={50} opacity={0.3} />
      <GlowingOrb color="purple" size="xl" position={{ top: '-15%', right: '-10%' }} />
      <GlowingOrb color="pink" size="lg" position={{ bottom: '5%', left: '-10%' }} />
      <GlowingOrb color="blue" size="md" position={{ top: '50%', right: '5%' }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 p-6 space-y-8 max-w-7xl mx-auto"
      >
        {/* Encabezado */}
        <motion.div id="demo-hero" variants={itemVariants} className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-block mb-4"
          >
            <span className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 text-purple-400 text-sm font-medium">
              ðŸŒŸ Plataforma de Crecimiento Empresarial #1
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-4"
            animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #06b6d4, #8b5cf6)',
              backgroundSize: '200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Advanced Growth Platform
          </motion.h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
            Automatiza tu negocio con IA, multiplica tus ingresos y escala sin lÃ­mites. La
            plataforma todo-en-uno que transforma empresas.
          </p>

          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg shadow-lg"
            >
              ðŸš€ Solicitar Demo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsTourOpen(true)}
              className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-lg"
            >
              ðŸ“¹ Iniciar Tour
            </motion.button>
          </div>
        </motion.div>

        {/* NavegaciÃ³n de Secciones */}
        <motion.div
          id="demo-nav"
          variants={itemVariants}
          className="flex justify-center gap-4 mb-8"
        >
          {[
            { id: 'resumen', label: 'ðŸ“Š Resumen', icon: 'ðŸ“Š' },
            { id: 'casos', label: 'ðŸ† Casos de Ã‰xito', icon: 'ðŸ†' },
            { id: 'precios', label: 'ðŸ’° Precios', icon: 'ðŸ’°' },
          ].map((seccion) => (
            <motion.button
              key={seccion.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSeccionActiva(seccion.id as typeof seccionActiva)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                seccionActiva === seccion.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {seccion.label}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {seccionActiva === 'resumen' && (
            <motion.div
              key="resumen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* KPIs Principales */}
              <div
                id="demo-metrics"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <TarjetaKPI
                  titulo="Empresas Activas"
                  valor={2847}
                  icono="ðŸ¢"
                  tendencia={32}
                  descripcion="Crecimiento mensual sostenido"
                  color="morado"
                />
                <TarjetaKPI
                  titulo="Ingresos Generados"
                  valor="â‚¬48.5M"
                  icono="ðŸ’°"
                  tendencia={45}
                  descripcion="Para nuestros clientes"
                  color="verde"
                />
                <TarjetaKPI
                  titulo="Automatizaciones"
                  valor={1458000}
                  icono="ðŸ¤–"
                  tendencia={67}
                  descripcion="Procesos automatizados/mes"
                  color="azul"
                />
                <TarjetaKPI
                  titulo="ROI Promedio"
                  valor="340%"
                  icono="ðŸ“ˆ"
                  tendencia={28}
                  descripcion="Retorno de inversiÃ³n"
                  color="naranja"
                />
              </div>

              {/* GrÃ¡fico y Workflow */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GraficoRendimiento />
                <SimulacionWorkflow />
              </div>

              {/* CaracterÃ­sticas */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
              >
                <h3 className="text-xl font-bold text-white mb-6">
                  🛠️ Todo lo que Necesitas en Una Plataforma
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CaracteristicaProducto
                    icono="ðŸ¤–"
                    titulo="Agentes IA AutÃ³nomos"
                    descripcion="Trabajan 24/7 para hacer crecer tu negocio"
                  />
                  <CaracteristicaProducto
                    icono="ðŸ“Š"
                    titulo="Analytics Avanzados"
                    descripcion="MÃ©tricas en tiempo real de todo tu negocio"
                  />
                  <CaracteristicaProducto
                    icono="ðŸ”—"
                    titulo="Integraciones"
                    descripcion="+150 herramientas conectadas"
                  />
                  <CaracteristicaProducto
                    icono="ðŸ”"
                    titulo="Seguridad Empresarial"
                    descripcion="EncriptaciÃ³n de nivel militar"
                  />
                  <CaracteristicaProducto
                    icono="ðŸ“±"
                    titulo="App MÃ³vil"
                    descripcion="Gestiona desde cualquier lugar"
                  />
                  <CaracteristicaProducto
                    icono="ðŸŽ¯"
                    titulo="Marketing Automation"
                    descripcion="CampaÃ±as inteligentes automatizadas"
                  />
                  <CaracteristicaProducto
                    icono="ðŸ’¬"
                    titulo="Soporte WhatsApp AI"
                    descripcion="Bot conversacional 24/7"
                    disponible={true}
                  />
                  <CaracteristicaProducto
                    icono="ðŸ”®"
                    titulo="Predicciones ML"
                    descripcion="Machine Learning predictivo"
                    disponible={false}
                  />
                </div>
              </motion.div>

              {/* Testimonios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Testimonio
                  nombre="MarÃ­a GarcÃ­a"
                  cargo="CEO"
                  empresa="TechStart SL"
                  texto="NEXUS V1 triplicÃ³ nuestras ventas en 6 meses. La automatizaciÃ³n IA es impresionante."
                  avatar="ðŸ‘©â€ðŸ’¼"
                />
                <Testimonio
                  nombre="Carlos RodrÃ­guez"
                  cargo="Director"
                  empresa="Innovatech"
                  texto="Pasamos de 50 a 500 clientes sin aumentar el equipo. IncreÃ­ble plataforma."
                  avatar="ðŸ‘¨â€ðŸ’»"
                />
                <Testimonio
                  nombre="Laura MartÃ­nez"
                  cargo="COO"
                  empresa="GrowFast Inc"
                  texto="El ROI fue visible desde el primer mes. La mejor inversiÃ³n que hicimos."
                  avatar="ðŸ‘©â€ðŸ”¬"
                />
              </div>
            </motion.div>
          )}

          {seccionActiva === 'casos' && (
            <motion.div
              key="casos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                ðŸ† Empresas que Crecieron con NEXUS V1
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CasoExito
                  empresa="TechStart SL"
                  logo="ðŸš€"
                  sector="SaaS"
                  descripcion="Startup de software que necesitaba escalar rÃ¡pidamente sin aumentar costes operativos."
                  resultado="+320% ingresos en 8 meses"
                />
                <CasoExito
                  empresa="Moda Express"
                  logo="ðŸ‘—"
                  sector="E-commerce"
                  descripcion="Tienda online que automatizÃ³ todo su proceso de atenciÃ³n al cliente y marketing."
                  resultado="+150% conversiones"
                />
                <CasoExito
                  empresa="ConsultorÃ­a Pro"
                  logo="ðŸ’¼"
                  sector="Servicios"
                  descripcion="Firma de consultorÃ­a que digitalizÃ³ sus procesos de captaciÃ³n y seguimiento de leads."
                  resultado="+280% leads cualificados"
                />
                <CasoExito
                  empresa="HealthTech"
                  logo="ðŸ¥"
                  sector="Salud"
                  descripcion="ClÃ­nica dental que automatizÃ³ citas, recordatorios y seguimiento de pacientes."
                  resultado="-65% no-shows"
                />
                <CasoExito
                  empresa="EduOnline"
                  logo="ðŸ“š"
                  sector="EducaciÃ³n"
                  descripcion="Academia online que escalÃ³ de 1.000 a 15.000 estudiantes sin aumentar staff."
                  resultado="+1400% estudiantes"
                />
                <CasoExito
                  empresa="LogiTrans"
                  logo="ðŸš›"
                  sector="LogÃ­stica"
                  descripcion="Empresa de transporte que optimizÃ³ rutas y comunicaciÃ³n con clientes."
                  resultado="-40% costes operativos"
                />
              </div>
            </motion.div>
          )}

          {seccionActiva === 'precios' && (
            <motion.div
              key="precios"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-4">
                ðŸ’° Planes que se Adaptan a Tu Negocio
              </h2>
              <p className="text-gray-400 text-center mb-8">
                Sin compromiso. Cancela cuando quieras.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <TarjetaPlan
                  nombre="Starter"
                  precio="â‚¬97"
                  caracteristicas={[
                    'Hasta 1.000 contactos',
                    '3 Agentes IA activos',
                    'Automatizaciones bÃ¡sicas',
                    'Soporte por email',
                    'Analytics bÃ¡sicos',
                  ]}
                />
                <TarjetaPlan
                  nombre="Business"
                  precio="â‚¬297"
                  destacado={true}
                  popular={true}
                  caracteristicas={[
                    'Hasta 10.000 contactos',
                    '10 Agentes IA activos',
                    'Automatizaciones avanzadas',
                    'Soporte prioritario 24/7',
                    'Analytics completos',
                    'Integraciones premium',
                    'API acceso completo',
                  ]}
                />
                <TarjetaPlan
                  nombre="Enterprise"
                  precio="â‚¬797"
                  caracteristicas={[
                    'Contactos ilimitados',
                    'Agentes IA ilimitados',
                    'Todas las caracterÃ­sticas',
                    'Account Manager dedicado',
                    'SLA garantizado 99.9%',
                    'FormaciÃ³n personalizada',
                    'Desarrollo custom',
                  ]}
                />
              </div>

              {/* GarantÃ­a */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl max-w-2xl mx-auto"
              >
                <span className="text-4xl mb-3 inline-block">ðŸ›¡ï¸</span>
                <h3 className="text-white font-bold text-lg">
                  GarantÃ­a de SatisfacciÃ³n 30 DÃ­as
                </h3>
                <p className="text-gray-400 text-sm">
                  Si no ves resultados, te devolvemos el 100% de tu dinero. Sin preguntas.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Final */}
        <motion.div
          variants={itemVariants}
          className="text-center py-12 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-3xl border border-purple-500/20"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Â¿Listo para Transformar tu Negocio?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Ãšnete a mÃ¡s de 2.800 empresas que ya estÃ¡n creciendo con NEXUS V1. Empieza tu prueba
            gratuita hoy.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl shadow-2xl"
          >
            ðŸŽ‰ Comenzar Prueba Gratuita
          </motion.button>
          <p className="text-gray-500 text-sm mt-4">No se requiere tarjeta de crÃ©dito</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
