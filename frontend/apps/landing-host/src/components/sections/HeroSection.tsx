import { trackEvent } from '../../utils/analytics';

interface HeroSectionProps {
    onLoginClick: () => void;
    onAuditClick: () => void;
}

export default function HeroSection({ onLoginClick, onAuditClick }: HeroSectionProps) {
    return (
        <section className="hero-section">
            <div className="container hero-grid">
                <div className="hero-content">
                    <div className="hero-badge">:: SYSTEM ONLINE V4.0 ::</div>
                    <h1 className="hero-title">
                        Inteligencia Artificial<br />
                        <span style={{ color: 'var(--neon-cyan)' }}>Sin Límites.</span>
                    </h1>
                    <p className="hero-sub">
                        Transformación digital integral: Desde la instalación de equipos hasta la automatización neural.
                        <br />
                        <strong>Optimiza Hardware. Conecta Equipos. Domina Datos.</strong>
                    </p>

                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn-glitch"
                            onClick={() => { trackEvent('Hero CTA'); onLoginClick(); }}
                        >
                            INICIAR SISTEMA
                        </button>
                        <button
                            className="btn-cyber"
                            onClick={() => { trackEvent('Hero Demo'); onAuditClick(); }}
                        >
                            AUDITORÍA GRATUITA
                        </button>
                    </div>
                </div>

                <div className="hero-visual">
                    <img src="/images/android-hero.png" alt="NEXUS V1 Android AI Interface" />
                </div>
            </div>
        </section>
    );
}

