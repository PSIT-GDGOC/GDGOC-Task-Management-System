import React, { useEffect, useRef } from 'react';

interface LoginAtmosphereProps {
  theme: 'dark' | 'light';
}

interface Viewport {
  width: number;
  height: number;
  ratio: number;
}

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

export const LoginAtmosphere: React.FC<LoginAtmosphereProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viewport: Viewport = { width: 0, height: 0, ratio: 1 };
    let frameId = 0;
    let elapsed = 0;
    let lastTimestamp = 0;
    let isVisible = document.visibilityState === 'visible';

    const resize = () => {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      viewport.ratio = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(viewport.width * viewport.ratio);
      canvas.height = Math.round(viewport.height * viewport.ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(viewport.ratio, 0, 0, viewport.ratio, 0, 0);
      if (reducedMotion.matches) draw(0);
    };

    const drawDark = (time: number) => {
      const { width, height } = viewport;
      context.fillStyle = '#050912';
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'screen';

      const stars = [
        [0.08, 0.2, 1.1], [0.17, 0.78, 0.8], [0.29, 0.12, 0.7], [0.41, 0.88, 1.1],
        [0.57, 0.17, 0.8], [0.68, 0.77, 1], [0.83, 0.18, 0.9], [0.94, 0.72, 0.8],
        [0.49, 0.55, 0.65], [0.23, 0.47, 0.65], [0.76, 0.48, 0.7], [0.9, 0.38, 0.65],
      ];
      stars.forEach(([x, y, radius], index) => {
        const alpha = 0.22 + (Math.sin(time * 0.8 + index * 1.7) + 1) * 0.16;
        context.beginPath();
        context.arc(width * x, height * y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(188,211,255,${alpha})`;
        context.fill();
      });

      const ribbon = (
        points: [number, number, number, number, number, number, number, number],
        colors: [string, string, string, string],
        thickness: number,
        phase: number,
        flow: number,
      ) => {
        const [sx, sy, c1x, c1y, c2x, c2y, ex, ey] = points;
        const wave = Math.sin(time * 0.48 + phase);
        const counterWave = Math.cos(time * 0.34 + phase * 1.7);
        const drift = Math.sin(time * flow + phase) * 0.11;
        const startX = width * (sx + drift);
        const startY = height * (sy + wave * 0.045);
        const control1X = width * (c1x + drift + Math.sin(time * 0.4 + phase) * 0.045);
        const control1Y = height * (c1y - wave * 0.16);
        const control2X = width * (c2x + drift - Math.cos(time * 0.3 + phase) * 0.05);
        const control2Y = height * (c2y + counterWave * 0.16);
        const endX = width * (ex + drift);
        const endY = height * (ey - counterWave * 0.045);
        const gradient = context.createLinearGradient(startX, startY, endX, endY);
        colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color));

        context.beginPath();
        context.moveTo(startX, startY);
        context.bezierCurveTo(control1X, control1Y, control2X, control2Y, endX, endY);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = gradient;
        context.lineWidth = thickness;
        context.globalAlpha = 0.8 + Math.sin(time * 0.58 + phase) * 0.12;
        context.shadowColor = colors[1];
        context.shadowBlur = thickness * 0.72;
        context.stroke();

        context.shadowBlur = 0;
        context.beginPath();
        context.moveTo(startX, startY - thickness * 0.12);
        context.bezierCurveTo(control1X, control1Y - thickness * 0.12, control2X, control2Y - thickness * 0.12, endX, endY - thickness * 0.12);
        context.strokeStyle = 'rgba(219,232,255,0.17)';
        context.lineWidth = Math.max(1, thickness * 0.045);
        context.stroke();
        context.globalAlpha = 1;
      };

      const band = Math.max(46, height * 0.12);
      const blueGlass = [
        'rgba(66,133,244,0.015)',
        'rgba(66,133,244,0.52)',
        'rgba(155,126,255,0.34)',
        'rgba(78,163,255,0.025)',
      ] as [string, string, string, string];
      const redGlass = [
        'rgba(234,67,53,0.015)',
        'rgba(234,67,53,0.44)',
        'rgba(255,111,125,0.28)',
        'rgba(255,159,131,0.02)',
      ] as [string, string, string, string];
      const yellowGlass = [
        'rgba(251,188,5,0.015)',
        'rgba(251,188,5,0.4)',
        'rgba(255,214,100,0.27)',
        'rgba(255,177,69,0.02)',
      ] as [string, string, string, string];
      const greenGlass = [
        'rgba(52,168,83,0.015)',
        'rgba(52,168,83,0.4)',
        'rgba(106,224,165,0.28)',
        'rgba(92,219,204,0.02)',
      ] as [string, string, string, string];

      ribbon([-0.18, 0.1, 0.12, -0.08, 0.42, 0.3, 0.76, 0.04], blueGlass, band * 0.88, 0.2, 0.035);
      ribbon([-0.2, 0.28, 0.18, 0.05, 0.3, 0.52, 0.74, 0.38], redGlass, band * 0.46, 2.2, 0.042);
      ribbon([0.24, 1.12, 0.42, 0.72, 0.8, 1.1, 1.14, 0.56], blueGlass, band * 1.02, 1.3, 0.03);
      ribbon([0.02, 0.86, 0.3, 0.66, 0.4, 1.02, 0.72, 0.9], greenGlass, band * 0.5, 3.4, 0.04);
      ribbon([1.16, 0.08, 0.88, 0.3, 1.02, 0.7, 0.68, 1.14], yellowGlass, band * 0.52, 4.8, 0.032);
      ribbon([1.12, 0.2, 0.84, 0.34, 1.04, 0.64, 0.76, 0.9], redGlass, band * 0.42, 5.7, 0.045);

      context.shadowBlur = 0;

      context.globalCompositeOperation = 'source-over';
      const vignette = context.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.12,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75,
      );
      vignette.addColorStop(0, 'rgba(7,10,18,0.12)');
      vignette.addColorStop(1, 'rgba(7,10,18,0.68)');
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
    };

    const drawLight = (time: number) => {
      const { width, height } = viewport;
      context.fillStyle = '#FBFAF6';
      context.fillRect(0, 0, width, height);

      const cornerGlows = [
        [0.02, 0.03, 'rgba(244, 132, 116, 0.14)'],
        [0.98, 0.02, 'rgba(112, 164, 244, 0.13)'],
        [0.02, 0.98, 'rgba(112, 164, 244, 0.13)'],
        [0.98, 0.98, 'rgba(67, 190, 135, 0.12)'],
      ] as const;
      cornerGlows.forEach(([x, y, color]) => {
        const radius = Math.max(width, height) * 0.3;
        const glow = context.createRadialGradient(width * x, height * y, 0, width * x, height * y, radius);
        glow.addColorStop(0, color);
        glow.addColorStop(1, 'rgba(251,250,246,0)');
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      });

      // Quiet drafting grid, like the light "Grid + Motion" reference.
      const gridStep = Math.max(48, Math.round(Math.min(width, height) / 12));
      context.lineWidth = 1;
      for (let x = 0, column = 0; x <= width; x += gridStep, column += 1) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.strokeStyle = column % 4 === 0 ? 'rgba(54,72,98,0.075)' : 'rgba(54,72,98,0.035)';
        context.stroke();
      }
      for (let y = 0, row = 0; y <= height; y += gridStep, row += 1) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.strokeStyle = row % 4 === 0 ? 'rgba(54,72,98,0.075)' : 'rgba(54,72,98,0.035)';
        context.stroke();
      }

      const paths = [
        { color: GOOGLE_COLORS[0], phase: 0.1, direction: 1, points: [[-0.08, 0.88], [0.13, 0.82], [0.06, 0.2], [0.32, 0.16], [0.53, 0.12], [0.57, 0.58], [0.8, 0.54]] },
        { color: GOOGLE_COLORS[1], phase: 1.4, direction: -1, points: [[-0.08, 0.54], [0.13, 0.45], [0.12, 0.12], [0.39, 0.2], [0.62, 0.28], [0.79, 0.06], [1.08, 0.14]] },
        { color: GOOGLE_COLORS[2], phase: 2.8, direction: 1, points: [[0.18, -0.08], [0.2, 0.19], [0.42, 0.25], [0.55, 0.34], [0.76, 0.41], [0.69, 0.76], [0.91, 0.72]] },
        { color: GOOGLE_COLORS[3], phase: 4.1, direction: -1, points: [[0.3, 1.08], [0.31, 0.81], [0.53, 0.7], [0.62, 0.6], [0.8, 0.51], [0.73, 0.19], [1.08, 0.25]] },
        { color: GOOGLE_COLORS[0], phase: 5.2, direction: 1, points: [[0.58, -0.08], [0.55, 0.16], [0.74, 0.25], [0.84, 0.39], [0.94, 0.56], [0.77, 0.83], [1.08, 0.94]] },
        { color: GOOGLE_COLORS[1], phase: 0.8, direction: -1, points: [[-0.08, 0.98], [0.12, 0.9], [0.29, 0.72], [0.42, 0.69], [0.65, 0.63], [0.81, 0.91], [1.08, 0.82]] },
      ];

      paths.forEach((path, index) => {
        // Each route bends in its own direction and gently changes shape over time.
        const flow = time * 0.22 + path.phase;
        const animatedPoints = path.points.map(([x, y], pointIndex) => [
          x + Math.sin(flow * 0.7 + pointIndex * 1.15 + index) * 0.025,
          y + Math.cos(flow + pointIndex * 0.9) * 0.045,
        ]);
        const [p0, p1, p2, p3, p4, p5, p6] = animatedPoints;
        const point = (t: number, a: number[], b: number[], c: number[], d: number[]) => {
          const inverse = 1 - t;
          return [
            inverse ** 3 * a[0] + 3 * inverse ** 2 * t * b[0] + 3 * inverse * t ** 2 * c[0] + t ** 3 * d[0],
            inverse ** 3 * a[1] + 3 * inverse ** 2 * t * b[1] + 3 * inverse * t ** 2 * c[1] + t ** 3 * d[1],
          ];
        };

        context.beginPath();
        context.moveTo(width * p0[0], height * p0[1]);
        context.bezierCurveTo(width * p1[0], height * p1[1], width * p2[0], height * p2[1], width * p3[0], height * p3[1]);
        context.bezierCurveTo(width * p4[0], height * p4[1], width * p5[0], height * p5[1], width * p6[0], height * p6[1]);
        context.strokeStyle = `${path.color}9A`;
        context.lineWidth = 2.4;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.shadowColor = `${path.color}30`;
        context.shadowBlur = 8;
        context.stroke();
        context.shadowBlur = 0;

        // Moving markers follow the animated bezier route rather than the screen.
        const t = (time * 0.065 * path.direction + path.phase) % 1;
        const normalizedT = t < 0 ? t + 1 : t;
        const marker = normalizedT < 0.5
          ? point(normalizedT * 2, p0, p1, p2, p3)
          : point((normalizedT - 0.5) * 2, p3, p4, p5, p6);
        context.beginPath();
        context.arc(width * marker[0], height * marker[1], 3.2, 0, Math.PI * 2);
        context.fillStyle = path.color;
        context.shadowColor = path.color;
        context.shadowBlur = 12;
        context.fill();
        context.shadowBlur = 0;
      });
    };

    const draw = (time: number) => {
      if (theme === 'dark') drawDark(time);
      else drawLight(time);
    };

    const animate = (timestamp: number) => {
      if (!isVisible || reducedMotion.matches) return;
      if (lastTimestamp) elapsed += (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      draw(elapsed);
      frameId = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(frameId);
      lastTimestamp = 0;
      if (reducedMotion.matches) {
        draw(0);
      } else if (isVisible) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
      lastTimestamp = 0;
      if (isVisible) start();
      else window.cancelAnimationFrame(frameId);
    };

    resize();
    start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotion.addEventListener('change', start);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotion.removeEventListener('change', start);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="auth-atmosphere" aria-hidden="true" />;
};
