import { useEffect, useRef } from 'react';
import './VideoHero.css';

interface VideoHeroProps {
    videoSrc: string;
    overlayText?: string;
    onCtaClick?: () => void;
}

export default function VideoHero({ videoSrc, overlayText, onCtaClick }: VideoHeroProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.8; // Slightly slower for majestic feel
        }
    }, []);

    return (
        <div className="video-hero-container">
            <div className="video-wrapper">
                <video
                    ref={videoRef}
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="hero-video"
                />
                <div className="video-overlay-gradient"></div>
            </div>

            <div className="hero-content container">
                <div className="glass-card hero-card">
                    <h1 className="hero-title">
                        <span className="text-gradient-gold">NEXUS V1</span> Nexus
                    </h1>
                    <p className="hero-subtitle">
                        {overlayText || 'Liderazgo Digital. Evolución Empresarial.'}
                    </p>

                    <div className="hero-actions">
                        <button className="btn-premium glow-effect" onClick={onCtaClick}>
                            Iniciar Evolución
                        </button>
                        <button className="btn-glass">
                            Ver Demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

