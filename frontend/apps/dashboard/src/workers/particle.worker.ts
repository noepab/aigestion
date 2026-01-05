// Worker context uses 'self' which is valid

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  angle: number;
  spinSpeed: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
}

const colorPalettes: Record<string, string[]> = {
  blue: ['#00f3ff', '#0088ff', '#00d4ff'],
  purple: ['#bc13fe', '#8b5cf6', '#a855f7'],
  green: ['#0aff00', '#10b981', '#34d399'],
  orange: ['#f59e0b', '#fb923c', '#fbbf24'],
  mixed: ['#00f3ff', '#bc13fe', '#0aff00', '#f59e0b'],
};

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let particles: Particle[] = [];
const config = {
  color: 'mixed',
  count: 50,
  opacity: 0.6,
};
let isAnimating = false;

const getColors = () => {
  return colorPalettes[config.color] ?? [config.color];
};

const initParticles = () => {
  if (!width || !height) return;
  particles = [];
  const colors = getColors();

  for (let i = 0; i < config.count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;

    particles.push({
      x,
      y,
      size,
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: Math.random() * 0.02 - 0.01,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      alpha: Math.random() * 0.5 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    });
  }
};

const animate = (time: number) => {
  if (!ctx || !isAnimating) return;

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'screen';

  const timeScale = time * 0.001;

  particles.forEach((p) => {
    // Motion
    p.angle += p.spinSpeed;
    p.x += Math.cos(p.angle) * 0.5 + p.speedX;
    p.y += Math.sin(p.angle) * 0.5 + p.speedY;

    // Wrap
    if (p.x < -50) p.x = width + 50;
    if (p.x > width + 50) p.x = -50;
    if (p.y < -50) p.y = height + 50;
    if (p.y > height + 50) p.y = -50;

    // Pulse
    const currentAlpha = p.alpha + Math.sin(timeScale * p.pulseSpeed) * 0.15;

    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx!.fillStyle = p.color;
    ctx!.globalAlpha = Math.max(0, Math.min(1, currentAlpha * config.opacity));
    ctx!.fill();
  });

  ctx.globalCompositeOperation = 'source-over';
  requestAnimationFrame(animate);
};

self.onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === 'init') {
    const { canvas, width: w, height: h, ...rest } = payload;
    ctx = canvas.getContext('2d', { alpha: true });
    width = w;
    height = h;
    Object.assign(config, rest);
    initParticles();
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(animate);
    }
  } else if (type === 'resize') {
    width = payload.width;
    height = payload.height;
    if (ctx && ctx.canvas) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      ctx.scale(payload.dpr, payload.dpr);
      // We need to adjust width/height for logical coords if we scaled?
      // Actually standard canvas scale pattern:
      // canvas.width = width * dpr; canvas.height = height * dpr;
      // ctx.scale(dpr, dpr);
      // But in worker updates, we might just receive physical pixels or logical.
      // Let's assume payload.width/height are physical pixels for simple OffscreenCanvas handling or let the main thread handle sizing.
      // Actually, OffscreenCanvas doesn't have style.width. It uses its width/height attributes which are physical pixels.
      // So logic in initParticles (Math.random() * width) should use the same coordinate space as drawing.
      // To simulate DPR:
      // Main Thread: sends width * dpr, height * dpr.
      // Worker: draws to that size.
      // BUT if we want crisp lines we use scale.

      // Simpler approach for offscreen: Just use full resolution.
    }
  } else if (type === 'updateProps') {
    Object.assign(config, payload);
    initParticles();
  }
};
