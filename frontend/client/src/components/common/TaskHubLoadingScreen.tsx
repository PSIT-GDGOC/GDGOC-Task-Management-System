import React, { useEffect, useState } from 'react';

export const TaskHubLoadingScreen: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Loading TaskHub...');

  useEffect(() => {
    // Stage 1: Quick initial progress
    const t1 = setTimeout(() => {
      setProgress(60);
      setStatusText('Preparing workspace...');
    }, 400);

    // Stage 2: Near completion
    const t2 = setTimeout(() => {
      setProgress(100);
      setStatusText('Welcome to GDGoC TaskHub');
    }, 900);

    // Stage 3: Smooth dissolve fade out
    const t3 = setTimeout(() => {
      setFading(true);
    }, 1250);

    // Stage 4: Unmount completely
    const t4 = setTimeout(() => {
      setVisible(false);
    }, 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-label="Loading TaskHub"
      role="status"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050912',
        color: '#f5f7fb',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.02)' : 'scale(1)',
        pointerEvents: fading ? 'none' : 'auto',
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66, 133, 244, 0.15) 0%, rgba(234, 67, 53, 0.08) 40%, rgba(52, 168, 83, 0.05) 70%, transparent 100%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main branded card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '24px',
          maxWidth: '380px',
          width: '90%',
          textAlign: 'center',
        }}
      >
        {/* Animated Google Brackets Emblem */}
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            animation: 'taskhub-emblem-pulse 2s ease-in-out infinite',
          }}
        >
          <svg viewBox="0 0 48 48" style={{ width: '100%', height: '100%' }} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left bracket: Red */}
            <path d="M14 24L22 16L18.5 12.5L7 24L18.5 35.5L22 32L14 24Z" fill="#EA4335" />
            {/* Right bracket: Blue */}
            <path d="M34 24L26 32L29.5 35.5L41 24L29.5 12.5L26 16L34 24Z" fill="#4285F4" />
            {/* Top accent: Green */}
            <rect x="21" y="9" width="6" height="5" rx="1.5" transform="rotate(45 24 11.5)" fill="#34A853" />
            {/* Bottom accent: Yellow */}
            <rect x="21" y="34" width="6" height="5" rx="1.5" transform="rotate(-45 24 36.5)" fill="#FBBC04" />
          </svg>
        </div>

        {/* TaskHub Typography */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {/* GDGoC */}
            <span style={{ display: 'inline-flex' }}>
              <span style={{ color: '#4285F4' }}>G</span>
              <span style={{ color: '#EA4335' }}>D</span>
              <span style={{ color: '#FBBC04' }}>G</span>
              <span style={{ color: '#4285F4' }}>o</span>
              <span style={{ color: '#34A853' }}>C</span>
            </span>

            {/* TaskHub */}
            <span style={{ display: 'inline-flex' }}>
              <span style={{ color: '#4285F4' }}>T</span>
              <span style={{ color: '#EA4335' }}>a</span>
              <span style={{ color: '#FBBC04' }}>s</span>
              <span style={{ color: '#34A853' }}>k</span>
              <span style={{ color: '#4285F4' }}>H</span>
              <span style={{ color: '#EA4335' }}>u</span>
              <span style={{ color: '#34A853' }}>b</span>
            </span>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(255, 255, 255, 0.45)',
            }}
          >
            PSIT Kanpur Chapter
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '240px',
            marginTop: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #4285F4, #EA4335, #FBBC04, #34A853)',
                boxShadow: '0 0 12px rgba(66, 133, 244, 0.5)',
                transition: 'width 0.4s ease-out',
              }}
            />
          </div>

          {/* Status text */}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'opacity 0.2s ease',
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes taskhub-emblem-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 12px 36px rgba(66, 133, 244, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          }
        }
      `}</style>
    </div>
  );
};

export default TaskHubLoadingScreen;
