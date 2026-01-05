import { motion } from 'framer-motion';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleExternalLink = (url: string, destination: string) => {
    console.log(`Landing button clicked: ${destination}`);
    window.open(url, '_blank');
  };

  const handleLogin = () => {
    console.log('Landing button clicked: Login');
    navigate('/dashboard');
  };

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log('Email captured:', email);
      setEmail('');
      setShowEmailForm(false);
      alert('¡Gracias! Te contactaremos pronto.');
    }
  };

  const features = [
    '⚡ Deploy en 1 click - Vercel, Railway, Oracle Cloud',
    '🤖 IA integrada - Claude, GPT, Gemini',
    '🌐 Presencia metaverso - Decentraland',
    '📊 Analytics en tiempo real',
    '🔐 Seguridad nivel enterprise',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-cyber-dark bg-gradient-to-br from-cyber-blue via-cyber-purple to-cyber-black text-cyber-blue font-mono overflow-hidden"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Hero */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-cyber-dark/80 backdrop-blur-xl p-8 rounded-xl shadow-3xl border border-cyber-blue/30"
          >
            <div className="inline-block px-4 py-2 bg-cyber-purple/20 border border-cyber-purple rounded-full text-xs uppercase tracking-wider text-cyber-purple mb-6">
              🚀 Powered by AI
            </div>

            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-green drop-shadow-[0_0_15px_rgba(0,243,255,0.6)] leading-tight">
              NEXUS V1 GOD MODE
            </h1>

            <p className="text-xl text-cyber-gray mb-4 leading-relaxed">
              La plataforma de{' '}
              <span className="text-cyber-purple font-semibold">crecimiento empresarial</span> más
              avanzada del mercado.
            </p>

            <p className="text-base text-cyber-gray/80 mb-8 leading-relaxed">
              Automatiza tu negocio, integra con Google Suite, Oracle Cloud, inteligencia artificial
              y metaversos.
              <span className="text-cyber-green font-semibold"> Todo en un solo lugar.</span>
            </p>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 text-sm text-cyber-gray"
                >
                  <span className="text-cyber-green">{feature.split(' - ')[0]}</span>
                  <span>{feature.split(' - ')[1]}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="grid gap-4">
              {showEmailForm ? (
                <motion.form
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full px-4 py-3 bg-cyber-dark border-2 border-cyber-blue rounded-lg text-cyber-blue placeholder-cyber-gray/50 focus:outline-none focus:border-cyber-purple transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-bold rounded-lg hover:shadow-neon-purple transition-all"
                    >
                      Enviar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="px-4 py-3 border border-cyber-gray/30 text-cyber-gray rounded-lg hover:bg-cyber-dark/50"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.form>
              ) : (
                <>
                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="w-full py-4 bg-gradient-to-r from-cyber-blue to-cyber-purple hover:from-cyber-purple hover:to-cyber-blue transition-all duration-300 rounded-lg shadow-neon-blue text-white font-bold text-lg transform hover:scale-105"
                  >
                    🎯 Empieza Gratis Ahora
                  </button>
                  <button
                    onClick={() =>
                      handleExternalLink(
                        'https://vercel.com/new/clone?repository-url=https://github.com/yourusername/aig',
                        'Vercel',
                      )
                    }
                    className="w-full py-3 bg-cyber-dark border-2 border-cyber-blue hover:bg-cyber-blue/20 transition-colors rounded-lg shadow-neon-blue"
                  >
                    Deploy on Vercel →
                  </button>
                  <button
                    onClick={() => handleExternalLink('https://decentraland.org', 'Decentraland')}
                    className="w-full py-3 bg-cyber-dark border-2 border-cyber-purple hover:bg-cyber-purple/20 transition-colors rounded-lg shadow-neon-purple"
                  >
                    Explora en Decentraland 🌐
                  </button>
                  <button
                    onClick={handleLogin}
                    className="w-full py-3 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green/10 transition-colors rounded-lg font-semibold"
                  >
                    Login / Acceso →
                  </button>
                  <button
                    onClick={() => navigate('/growth')}
                    className="w-full py-3 border-2 border-green-500 text-green-500 hover:bg-green-500/10 transition-colors rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <span>🚀</span> Growth Engine (LinkedIn)
                  </button>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-cyber-blue/20">
              <p className="text-xs text-cyber-gray/60 text-center">
                Trusted by <span className="text-cyber-green font-semibold">500+</span> empresas |
                <span className="text-cyber-purple font-semibold"> 99.9%</span> uptime
              </p>
            </div>
          </motion.div>

          {/* Right Column - News */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <NewsPanel />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function NewsPanel() {
  const [news] = useState([
    {
      id: 1,
      title: 'NEXUS V1 launches AI‑driven growth platform',
      summary:
        'NEXUS V1 unveils its revolutionary AI platform designed to accelerate business growth through predictive analytics and automation.',
      image:
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
      link: 'https://example.com/news/aig-launch',
    },
    {
      id: 2,
      title: 'Partnership between NEXUS V1 and Decentraland announced',
      summary:
        'A strategic partnership to bring NEXUS V1 tools into the metaverse, enabling virtual commerce management.',
      image:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      link: 'https://example.com/news/aig-decentraland',
    },
    {
      id: 3,
      title: 'NEXUS V1 receives "Innovation of the Year" award',
      summary:
        'Recognized for its outstanding contribution to AI accessibility and business integration.',
      image:
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
      link: 'https://example.com/news/aig-award',
    },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cyber-dark/80 backdrop-blur-xl p-6 rounded-xl shadow-3xl border border-cyber-blue/30"
    >
      <h2 className="text-xl font-bold text-cyber-purple mb-4">📰 Noticias del gremio</h2>
      <div className="grid gap-6">
        {news.map((item) => (
          <div
            key={item.id}
            className="bg-cyber-dark/60 rounded-lg overflow-hidden border border-cyber-blue/20"
          >
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
            </a>
            <div className="p-4">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-lg font-semibold text-cyber-blue hover:underline mb-2"
              >
                {item.title}
              </a>
              {item.summary && (
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">{item.summary}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

