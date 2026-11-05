import React, { useEffect, useRef, useState } from 'react';

// Exact cartoon glove vector geometry from Originkit
const GLOVE_PATH =
  'M9 14V3.6a2.5 2.5 0 0 1 5 0V12.2a2.2 2.2 0 0 1 4.4 0.4a2.2 2.2 0 0 1 4.4 0.8a2.2 2.2 0 0 1 4.2 1.6V22c0 4-2.6 7-6 7H14.6c-3 0-5.4-1.8-6.6-4.4L4.1 18.6a2.3 2.3 0 0 1 3.6-2.8L9 17.4Z';
const GLOVE_LINES_PATH = 'M18.4 12.6V17.2M22.8 13.4V17.6M14 12.2V16.6';
const CUFF_PATH =
  'M12.6 28.6h12.2a1.6 1.6 0 0 1 1.6 1.6v3.4a1.6 1.6 0 0 1-1.6 1.6H12.6a1.6 1.6 0 0 1-1.6-1.6v-3.4a1.6 1.6 0 0 1 1.6-1.6Z';
const CUFF_LINES_PATH = 'M15.4 29.2v5.4M18.7 29.2v5.4M22 29.2v5.4';

// Hotspot in 32x36 viewBox is at (11.5, 1)
const HOT_X = 11.5;
const HOT_Y = 1;
const SCALE = 1.45;

export const GlobalGloveCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const posRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if pointer is a mouse/pen
    const isTouchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
    if (isTouchOnly) return;

    const onPointerMove = (e: PointerEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      if (cursorRef.current) {
        const x = posRef.current.x - HOT_X * SCALE;
        const y = posRef.current.y - HOT_Y * SCALE;
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const onPointerDown = () => setPressed(true);
    const onPointerUp = () => setPressed(false);
    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  return (
    <>
      {/* Global CSS to replace regular OS cursor across the whole website */}
      <style>{`
        *, *::before, *::after {
          cursor: none !important;
        }
      `}</style>

      {/* Floating high-precision Cartoon Glove Cursor */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 32 * SCALE,
          height: 36 * SCALE,
          pointerEvents: 'none',
          zIndex: 999999,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.15s ease, transform 0.04s linear',
          willChange: 'transform',
        }}
      >
        <svg
          width={32 * SCALE}
          height={36 * SCALE}
          viewBox="0 0 32 36"
          style={{
            transform: pressed ? 'scale(0.92) rotate(-2deg)' : 'scale(1)',
            transformOrigin: `${HOT_X}px ${HOT_Y}px`,
            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.28))',
            display: 'block',
          }}
        >
          {/* Cuff background & stroke */}
          <path
            d={CUFF_PATH}
            fill="#ffffff"
            stroke="#0b0b0b"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path
            d={CUFF_LINES_PATH}
            stroke="#0b0b0b"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          {/* Glove hand body & stroke */}
          <path
            d={GLOVE_PATH}
            fill="#ffffff"
            stroke="#0b0b0b"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          {/* Finger creases */}
          <path
            d={GLOVE_LINES_PATH}
            stroke="#0b0b0b"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
};

export default GlobalGloveCursor;
