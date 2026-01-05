/// <reference types="vite/client" />
import { lazy, Suspense, useState, useEffect } from 'react';
import './App.css';
import { authService } from './services/authService';
import { trackEvent } from './utils/analytics';

// Lazy load Modals
const LoginModal = lazy(() => import('./components/LoginModal'));
const DanielaChatbot = lazy(() => import('./components/DanielaChatbot'));

const COUNTDOWN_TARGET = new Date('2024-12-25T00:00:00');

function Countdown() {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(
    null,
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = COUNTDOWN_TARGET.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="countdown-container animate-fade-up" style={{ animationDelay: '0.6s' }}>
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.d}</span>
        <span className="countdown-label">Días</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.h}</span>
        <span className="countdown-label">Horas</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.m}</span>
        <span className="countdown-label">Min</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.s}</span>
        <span className="countdown-label">Seg</span>
      </div>
    </div>
  );
}

export default function App() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      trackEvent('Login Success');
      const token = authService.getToken();
      const user = authService.getCurrentUser();

      if (token) {
        const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173';
        window.location.href = `${dashboardUrl}/?token=${token}${user ? `&role=${user.role}` : ''}`;
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <>
      <div className="app-shell" style={{ background: '#020617', minHeight: '100vh' }}>
        <Suspense fallback={null}>
          {loginModalOpen && (
            <LoginModal
              open={loginModalOpen}
              onClose={() => setLoginModalOpen(false)}
              onLogin={handleLogin}
            />
          )}
          <DanielaChatbot />
        </Suspense>

        <nav
          className="glass-nav"
          style={{
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 5rem',
            boxSizing: 'border-box',
          }}
        >
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img
              src="/logo-epic.png"
              alt="NEXUS V1 Logo"
              style={{ height: '40px', filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))' }}
            />
            <span
              style={{
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: 'white',
                letterSpacing: '0.1em',
              }}
            >
              NEXUS V1
            </span>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <button className="btn-premium" onClick={() => setLoginModalOpen(true)}>
              Inicia Sesión
            </button>
          </div>
        </nav>

        <main
          style={{
            height: '100vh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'url("/hero-epic.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(rgba(2, 6, 23, 0.4) 0%, rgba(2, 6, 23, 0.95) 100%)',
              pointerEvents: 'none',
            }}
          />

          <section
            style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              maxWidth: '1000px',
              padding: '0 2rem',
            }}
          >
            <div className="countdown-header animate-fade-up">
              Gran Inauguración • 25 de Diciembre
            </div>

            <h1
              className="animate-fade-up"
              style={{
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                lineHeight: 1,
                marginBottom: '1.5rem',
                backgroundImage: 'var(--gradient-gold-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.2))',
              }}
            >
              Liderando la Evolución Humana.
            </h1>

            <p
              className="animate-fade-up"
              style={{
                animationDelay: '0.2s',
                fontSize: '1.25rem',
                color: '#94a3b8',
                marginBottom: '3rem',
                maxWidth: '700px',
                marginInline: 'auto',
              }}
            >
              La primera plataforma de inteligencia empresarial diseñada para personas reales. Sin
              miedos, sin barreras, solo resultados extraordinarios.
            </p>

            <div
              className="animate-fade-up"
              style={{
                animationDelay: '0.4s',
                display: 'flex',
                gap: '1.5rem',
                justifyContent: 'center',
              }}
            >
              <button className="btn-premium" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                Únete a la Revolución
              </button>
              <button
                className="btn-premium-outline"
                style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}
              >
                Conoce a Daniela
              </button>
            </div>

            <Countdown />
          </section>
        </main>
      </div>
    </>
  );
}


