/**
 * GDGOC Vibrant Confetti & Celebration Burst Utility
 * Lightweight, zero-dependency HTML5 Canvas particle system themed in Google colors.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star';
  opacity: number;
  decay: number;
}

const GOOGLE_COLORS = [
  '#4285F4', // Google Blue
  '#EA4335', // Google Red
  '#FBBC04', // Google Yellow
  '#34A853', // Google Green
  '#A142F4', // Purple accent
  '#FF7043', // Warm Coral
];

export interface ConfettiOptions {
  x?: number; // Normalized 0..1 or absolute pixel coords
  y?: number;
  count?: number;
  colors?: string[];
  spread?: number;
}

let activeCanvas: HTMLCanvasElement | null = null;
let animationFrameId: number | null = null;
let particles: Particle[] = [];

function getOrCreateCanvas(): HTMLCanvasElement {
  if (activeCanvas && document.body.contains(activeCanvas)) {
    return activeCanvas;
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
  };
  resize();
  window.addEventListener('resize', resize);

  activeCanvas = canvas;
  return canvas;
}

export function triggerCelebrationBurst(options: ConfettiOptions = {}) {
  const canvas = getOrCreateCanvas();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const count = options.count ?? 70;
  const colors = options.colors ?? GOOGLE_COLORS;

  const originX =
    options.x !== undefined
      ? options.x <= 1
        ? options.x * canvas.width
        : options.x * window.devicePixelRatio
      : canvas.width * 0.5;

  const originY =
    options.y !== undefined
      ? options.y <= 1
        ? options.y * canvas.height
        : options.y * window.devicePixelRatio
      : canvas.height * 0.45;

  const spread = options.spread ?? 360;

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180) - Math.PI / 2;
    const speed = 7 + Math.random() * 14;
    const shapes: ('rect' | 'circle' | 'star')[] = ['rect', 'circle', 'star'];

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
      vy: Math.sin(angle) * speed - (Math.random() * 3 + 2),
      size: (6 + Math.random() * 6) * window.devicePixelRatio,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      opacity: 1,
      decay: 0.012 + Math.random() * 0.015,
    });
  }

  if (!animationFrameId) {
    animate();
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(
      Math.cos(((18 + i * 72) * Math.PI) / 180) * r + x,
      -Math.sin(((18 + i * 72) * Math.PI) / 180) * r + y
    );
    ctx.lineTo(
      Math.cos(((54 + i * 72) * Math.PI) / 180) * (r / 2) + x,
      -Math.sin(((54 + i * 72) * Math.PI) / 180) * (r / 2) + y
    );
  }
  ctx.closePath();
  ctx.fill();
}

function animate() {
  if (!activeCanvas) return;
  const ctx = activeCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.38; // gravity
    p.vx *= 0.985; // air drag
    p.rotation += p.rotationSpeed;
    p.opacity -= p.decay;

    if (p.opacity <= 0 || p.y > activeCanvas.height + 50) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, p.opacity);
    ctx.fillStyle = p.color;

    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    } else if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawStar(ctx, 0, 0, p.size * 0.7);
    }

    ctx.restore();
  }

  if (particles.length > 0) {
    animationFrameId = requestAnimationFrame(animate);
  } else {
    animationFrameId = null;
    if (activeCanvas && document.body.contains(activeCanvas)) {
      document.body.removeChild(activeCanvas);
      activeCanvas = null;
    }
  }
}
