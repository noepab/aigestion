import { useEffect, useRef } from 'react';
import './aigLogo.css';

export default function AIGLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 600 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);

    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }> = [];

    let frameCount = 0;
    const MAX_PARTICLES = 60;
    const PARTICLE_CREATE_INTERVAL = 5; // Solo crear cada 5 frames

    const createParticles = () => {
      if (frameCount % PARTICLE_CREATE_INTERVAL !== 0) return;

      for (let i = 0; i < 2; i++) {
        particles.push({
          x: 80 + Math.random() * 440,
          y: 40 + Math.random() * 120,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: Math.random(),
        });
      }
      if (particles.length > MAX_PARTICLES) {
        particles = particles.slice(-MAX_PARTICLES);
      }
    };

    let lastFrameTime = 0;
    let animationId = 0;

    const animate = (currentTime: number) => {
      // Limitar a 60 FPS
      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime < 16.67) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;
      frameCount++;

      // Clear más eficiente
      ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
      ctx.fillRect(0, 0, 600, 200);

      // Gradiente adicional (creado una sola vez fuera del loop sería mejor)
      const bgSecondGradient = ctx.createLinearGradient(0, 0, 600, 200);
      bgSecondGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      bgSecondGradient.addColorStop(1, 'rgba(26, 15, 46, 0.5)');
      ctx.fillStyle = bgSecondGradient;
      ctx.fillRect(0, 0, 600, 200);

      // Partículas de fondo
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.005;

        if (p.x < 0 || p.x > 600) p.vx *= -1;
        if (p.y < 0 || p.y > 200) p.vy *= -1;

        const alpha = Math.sin(p.life * Math.PI) * 0.3;
        ctx.fillStyle = `rgba(0, 245, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Conexiones
        particles.forEach((p2, j) => {
          if (i >= j) return;
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(157, 0, 255, ${0.1 * (1 - dist / 100)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // Cerebro digital (icono simplificado)
      const brainX = 100;
      const brainY = 100;
      const time = Date.now() * 0.001;

      // Glow del cerebro
      const brainGradient = ctx.createRadialGradient(brainX, brainY, 0, brainX, brainY, 60);
      brainGradient.addColorStop(0, 'rgba(0, 245, 255, 0.4)');
      brainGradient.addColorStop(1, 'rgba(0, 245, 255, 0)');
      ctx.fillStyle = brainGradient;
      ctx.fillRect(brainX - 60, brainY - 60, 120, 120);

      // Circuitos del cerebro
      ctx.strokeStyle = `rgba(0, 245, 255, ${0.6 + Math.sin(time * 2) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 15;

      // Forma de cerebro simplificada
      ctx.beginPath();
      ctx.arc(brainX - 15, brainY - 10, 25, 0, Math.PI * 2);
      ctx.arc(brainX + 15, brainY - 10, 25, 0, Math.PI * 2);
      ctx.stroke();

      // Ondas de energía
      for (let i = 0; i < 3; i++) {
        const radius = 30 + ((time * 30 + i * 20) % 40);
        const alpha = 1 - ((time * 30 + i * 20) % 40) / 40;
        ctx.strokeStyle = `rgba(255, 0, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.arc(brainX, brainY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Letras NEXUS V1 con efecto holográfico
      const letters = ['A', 'G', 'P'];
      const startX = 250;
      const spacing = 110;

      letters.forEach((letter, i) => {
        const x = startX + i * spacing;
        const y = 120;
        const offset = Math.sin(time * 2 + i * 0.5) * 3;

        // Sombras de color
        ctx.shadowBlur = 30;
        ctx.shadowColor = i === 0 ? '#00f5ff' : i === 1 ? '#ff00ff' : '#9d00ff';

        // Texto con gradiente
        const textGradient = ctx.createLinearGradient(x - 30, y - 50, x + 30, y + 20);
        textGradient.addColorStop(0, '#00f5ff');
        textGradient.addColorStop(0.5, '#ff00ff');
        textGradient.addColorStop(1, '#9d00ff');

        ctx.fillStyle = textGradient;
        ctx.font = 'bold 90px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, x, y + offset);

        // Borde brillante
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 3 + i) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.strokeText(letter, x, y + offset);

        // Partículas alrededor de cada letra
        const particleCount = 5;
        for (let j = 0; j < particleCount; j++) {
          const angle = (time + i + j / particleCount) * 2;
          const radius = 50 + Math.sin(time * 2 + j) * 10;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;

          ctx.shadowBlur = 10;
          ctx.fillStyle = `rgba(0, 245, 255, ${0.6 + Math.sin(time * 3 + j) * 0.3})`;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.shadowBlur = 0;

      createParticles();
      requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="aig-logo-container">
      <canvas ref={canvasRef} className="aig-logo-canvas" />
      <div className="aig-logo-tagline">AIG NEXUS</div>
    </div>
  );
}

