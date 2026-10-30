import React, { useEffect, useRef, useState, useCallback } from 'react';

interface IntroAnimationProps {
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'spark';
  gravity: number;
}

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFading, setIsFading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const handleFinish = useCallback(() => {
    if (isFading || isFinished) return;
    setIsFading(true);
    sessionStorage.setItem('gdgoc_intro_seen', 'true');
    setTimeout(() => {
      setIsFinished(true);
      onComplete?.();
    }, 600); // 600ms smooth curtain fade
  }, [isFading, isFinished, onComplete]);

  useEffect(() => {
    // Check if intro has already been displayed this session (unless ?intro=true is in URL)
    const hasSeen = sessionStorage.getItem('gdgoc_intro_seen');
    const urlParams = new URLSearchParams(window.location.search);
    const forceIntro = urlParams.get('intro') === 'true';

    if (hasSeen && !forceIntro) {
      setIsFinished(true);
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle system
    const particles: Particle[] = [];
    let hasExploded = false;
    let hasDissolved = false;

    const createExplosion = (cx: number, cy: number, count = 160) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 14 + 3;
        const color = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];
        const isSpark = Math.random() > 0.6;
        particles.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: isSpark ? Math.random() * 5 + 3 : Math.random() * 9 + 4,
          color,
          alpha: 1,
          decay: Math.random() * 0.016 + 0.008,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          shape: isSpark ? 'spark' : Math.random() > 0.5 ? 'rect' : 'circle',
          gravity: 0.18,
        });
      }
    };

    const createDissolveParticles = (cx: number, cy: number, count = 220) => {
      for (let i = 0; i < count; i++) {
        const spreadX = (Math.random() - 0.5) * 500;
        const spreadY = (Math.random() - 0.5) * 200;
        const color = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];
        particles.push({
          x: cx + spreadX,
          y: cy + spreadY,
          vx: (Math.random() - 0.5) * 5 + (spreadX > 0 ? 3 : -3),
          vy: (Math.random() - 0.5) * 5 - Math.random() * 3,
          size: Math.random() * 4 + 2,
          color,
          alpha: 0.9,
          decay: Math.random() * 0.025 + 0.015,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.3,
          shape: Math.random() > 0.5 ? 'spark' : 'circle',
          gravity: -0.05, // Float upwards like dust
        });
      }
    };

    // Drawing helper for rounded pills
    const drawPill = (
      x: number,
      y: number,
      len: number,
      thickness: number,
      angle: number,
      color: string,
      alpha = 1,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = color;

      // Soft shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;

      ctx.beginPath();
      const r = thickness / 2;
      ctx.roundRect(-len / 2, -r, len, thickness, r);
      ctx.fill();

      // Top highlight
      ctx.shadowColor = 'transparent';
      const grad = ctx.createLinearGradient(0, -r, 0, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-len / 2, -r, len, thickness, r);
      ctx.fill();

      ctx.restore();
    };

    // Draw Left Bracket (<): Top Red, Bottom Blue
    const drawLeftBracket = (x: number, y: number, scale = 1, alpha = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      const pillLen = 92;
      const pillThick = 40;
      // Top red arm (rotated ~ -45 deg)
      drawPill(0, -22, pillLen, pillThick, -Math.PI / 4, '#EA4335', alpha);
      // Bottom blue arm (rotated ~ +45 deg)
      drawPill(0, 22, pillLen, pillThick, Math.PI / 4, '#4285F4', alpha);
      ctx.restore();
    };

    // Draw Right Bracket (>): Top Green, Bottom Yellow
    const drawRightBracket = (x: number, y: number, scale = 1, alpha = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      const pillLen = 92;
      const pillThick = 40;
      // Top green arm (rotated ~ +45 deg)
      drawPill(0, -22, pillLen, pillThick, Math.PI / 4, '#34A853', alpha);
      // Bottom yellow arm (rotated ~ -45 deg)
      drawPill(0, 22, pillLen, pillThick, -Math.PI / 4, '#FBBC05', alpha);
      ctx.restore();
    };

    // Main animation loop
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000; // in seconds

      ctx.clearRect(0, 0, width, height);

      // Light mode pastel gradient background
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7,
      );
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.5, '#F8FAFC');
      bgGrad.addColorStop(1, '#EEF2F6');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft corner color glows matching video (blue left, warm coral right)
      const glowLeft = ctx.createRadialGradient(width * 0.1, height * 0.5, 0, width * 0.1, height * 0.5, width * 0.45);
      glowLeft.addColorStop(0, 'rgba(66, 133, 244, 0.08)');
      glowLeft.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowLeft;
      ctx.fillRect(0, 0, width, height);

      const glowRight = ctx.createRadialGradient(width * 0.9, height * 0.5, 0, width * 0.9, height * 0.5, width * 0.45);
      glowRight.addColorStop(0, 'rgba(234, 67, 53, 0.06)');
      glowRight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowRight;
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // -----------------------------------------------------------------------
      // CHOREOGRAPHY
      // 0.0s - 1.0s: Inward rush & clash at center
      // 1.0s - 1.6s: Explosion & recoil bounce
      // 1.6s - 3.4s: Letters appear and settle
      // 3.4s - 4.5s: Disintegration
      // 4.5s - 5.0s: Complete fade out
      // -----------------------------------------------------------------------

      let leftX = 0;
      let rightX = 0;
      let clashShockwave = 0;
      let textScale = 0;
      let textAlpha = 0;
      let bracketAlpha = 1;

      if (elapsed < 1.0) {
        // Fast rush from outside inwards
        const progress = elapsed / 1.0;
        // Ease in quad
        const ease = progress * progress * progress;
        leftX = centerX - (1 - ease) * (width * 0.45);
        rightX = centerX + (1 - ease) * (width * 0.45);
      } else if (elapsed < 1.6) {
        // Collision recoil & bounce
        if (!hasExploded) {
          hasExploded = true;
          createExplosion(centerX, centerY, 180);
        }
        const bounceProg = (elapsed - 1.0) / 0.6;
        // Elastic rebound
        const recoilDist = 200 * Math.min(width / 700, 1.2);
        const easeOut = Math.sin((bounceProg * Math.PI) / 2);
        leftX = centerX - easeOut * recoilDist;
        rightX = centerX + easeOut * recoilDist;
        clashShockwave = Math.max(0, 1 - (elapsed - 1.0) * 3);
      } else if (elapsed < 3.4) {
        // Formed layout: Brackets framing the logo text
        const settleDist = 210 * Math.min(width / 700, 1.2);
        leftX = centerX - settleDist;
        rightX = centerX + settleDist;

        // Text elastic spring up
        const textProg = Math.min(1, (elapsed - 1.6) / 0.7);
        // Spring overshoot
        const c4 = (2 * Math.PI) / 3;
        textScale =
          textProg === 0
            ? 0
            : textProg === 1
              ? 1
              : Math.pow(2, -10 * textProg) * Math.sin((textProg * 10 - 0.75) * c4) + 1;
        textAlpha = Math.min(1, textProg * 1.5);
      } else if (elapsed < 4.5) {
        // Disintegration phase
        if (!hasDissolved) {
          hasDissolved = true;
          createDissolveParticles(centerX, centerY, 240);
        }
        const dissolveProg = (elapsed - 3.4) / 1.1;
        bracketAlpha = Math.max(0, 1 - dissolveProg * 1.4);
        textAlpha = Math.max(0, 1 - dissolveProg * 1.2);
        textScale = 1 + dissolveProg * 0.08;

        const settleDist = 210 * Math.min(width / 700, 1.2);
        leftX = centerX - settleDist - dissolveProg * 30;
        rightX = centerX + settleDist + dissolveProg * 30;
      } else {
        // Auto-complete
        handleFinish();
      }

      // Draw collision impact shockwave & flash
      if (clashShockwave > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, (1 - clashShockwave) * 180 + 20, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${clashShockwave * 0.9})`;
        ctx.shadowColor = '#4285F4';
        ctx.shadowBlur = 40;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, (1 - clashShockwave) * 90, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 188, 5, ${clashShockwave})`;
        ctx.lineWidth = 6 * clashShockwave;
        ctx.stroke();
        ctx.restore();
      }

      // Draw brackets
      if (bracketAlpha > 0.01) {
        drawLeftBracket(leftX, centerY, Math.min(width / 700, 1.1), bracketAlpha);
        drawRightBracket(rightX, centerY, Math.min(width / 700, 1.1), bracketAlpha);
      }

      // Draw central text: GDGOC & TASKHUB (with 3D pop effect)
      if (textScale > 0.01 && textAlpha > 0.01) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(textScale, textScale);
        ctx.globalAlpha = textAlpha;

        const baseFontSize = Math.min(width * 0.08, 64);
        ctx.font = `900 ${baseFontSize}px 'Fredoka', 'Google Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 3D Drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        // Line 1: GDGOC
        const letters1 = [
          { char: 'G', color: '#4285F4' },
          { char: 'D', color: '#EA4335' },
          { char: 'G', color: '#4285F4' },
          { char: 'O', color: '#FBBC05' },
          { char: 'C', color: '#34A853' },
        ];

        // Measure letter widths
        const totalW1 = letters1.reduce((sum, l) => sum + ctx.measureText(l.char).width + 3, 0);
        let curX1 = -totalW1 / 2;
        const line1Y = -baseFontSize * 0.55;

        letters1.forEach((l) => {
          const w = ctx.measureText(l.char).width;
          ctx.fillStyle = l.color;
          ctx.fillText(l.char, curX1 + w / 2, line1Y);
          curX1 += w + 3;
        });

        // Line 2: TASKHUB
        const letters2 = [
          { char: 'T', color: '#EA4335' },
          { char: 'A', color: '#EA4335' },
          { char: 'S', color: '#4285F4' },
          { char: 'K', color: '#34A853' },
          { char: 'H', color: '#34A853' },
          { char: 'U', color: '#FBBC05' },
          { char: 'B', color: '#34A853' },
        ];

        const totalW2 = letters2.reduce((sum, l) => sum + ctx.measureText(l.char).width + 3, 0);
        let curX2 = -totalW2 / 2;
        const line2Y = baseFontSize * 0.55;

        letters2.forEach((l) => {
          const w = ctx.measureText(l.char).width;
          ctx.fillStyle = l.color;
          ctx.fillText(l.char, curX2 + w / 2, line2Y);
          curX2 += w + 3;
        });

        ctx.restore();
      }

      // Update & render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.rotation += p.vRot;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Spark star
          ctx.beginPath();
          for (let s = 0; s < 4; s++) {
            ctx.rotate(Math.PI / 2);
            ctx.lineTo(p.size, 0);
            ctx.lineTo(p.size * 0.25, p.size * 0.25);
          }
          ctx.fill();
        }

        ctx.restore();
      }

      if (!isFinished) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Keyboard escape to skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFinish, isFinished, onComplete]);

  if (isFinished) return null;

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white select-none transition-opacity duration-600 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ cursor: 'pointer' }}
      title="Click anywhere to skip intro"
    >
      {/* Background Subtle Doodle Layer from video */}
      <div
        className="absolute inset-0 bg-repeat bg-[length:650px_auto] opacity-[0.07] mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: 'url(/login-bg.jpg)' }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Discreet Skip Button in Top Right */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleFinish();
        }}
        className="absolute top-5 right-6 z-10 px-4 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold text-gdgoc-gray-700 hover:text-gdgoc-blue shadow-xs border border-gray-200/80 backdrop-blur-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
      >
        <span>Skip</span>
        <span className="text-[10px] text-gray-400">ESC ↵</span>
      </button>

      {/* Subtle bottom note */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <p className="text-[11px] text-gray-400 tracking-wider font-medium uppercase">
          Google Developer Groups on Campus · PSIT Kanpur
        </p>
      </div>
    </div>
  );
};
