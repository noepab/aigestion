import { FuturisticDashboard } from './AdminPage';

// Ruta de los assets del proyecto landingpage (se sirven desde la carpeta public del mismo host)
const LOGO_SRC = '/aig-brain-logo.svg'; // logo usado en landingpage
const HERO_VIDEO_SRC = '/videos/presentacion.mp4'; // video hero de landingpage

export default function AdminLandingDashboard() {
  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-blue font-mono relative overflow-hidden">
      {/* Fondo de video hero */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        src={HERO_VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-blue/10 to-transparent" />

      {/* Header con logo */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-cyber-blue/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <img src={LOGO_SRC} alt="NEXUS V1 Logo" className="w-12 h-12" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-blue to-cyber-purple">
            NEXUS V1 GOD MODE
          </h1>
        </div>
        <button
          className="px-4 py-2 bg-cyber-purple text-white rounded hover:bg-cyber-purple/80 transition"
          onClick={() => console.log('Acción principal')}
        >
          Acceso al Dashboard
        </button>
      </header>

      {/* Contenido principal: FuturisticDashboard */}
      <main className="relative z-10 p-6">
        <FuturisticDashboard />
      </main>
    </div>
  );
}

