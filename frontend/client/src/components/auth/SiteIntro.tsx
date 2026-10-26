import React, { useEffect, useState } from 'react';
import './SiteIntro.css';

const DICE_FACES = [
  { side: 'front', color: '#FBBC04', pips: [0, 2, 4, 6, 8] },
  { side: 'back', color: '#EA4335', pips: [0, 8] },
  { side: 'right', color: '#4285F4', pips: [4] },
  { side: 'left', color: '#34A853', pips: [0, 2, 3, 5, 6, 8] },
  { side: 'top', color: '#34A853', pips: [0, 4, 8] },
  { side: 'bottom', color: '#1A73E8', pips: [0, 2, 6, 8] },
];

const GOOGLE_LETTERS = [
  ['G', '#4285F4'], ['D', '#EA4335'], ['G', '#FBBC04'], ['o', '#4285F4'], ['C', '#34A853'],
] as const;
const TASKHUB_LETTERS = Array.from('TaskHub');

export const SiteIntro: React.FC = () => {
  const [visible, setVisible] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => setVisible(false), 4100);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  // Drop the Google-colored die first, then reveal the theme-matched TaskHub wordmark.
  return (
    <div className="site-intro" role="status" aria-label="Loading GDGoC TaskHub">
      <div className="site-intro-lockup" aria-hidden="true">
        <div className="site-intro-die-wrap">
          <span className="site-intro-die-shadow" />
          <div className="site-intro-die-mover">
            <div className="site-intro-cube">
              {DICE_FACES.map(({ side, color, pips }) => (
                <div className={`site-intro-face ${side}`} key={side} style={{ '--face-color': color } as React.CSSProperties}>
                  {Array.from({ length: 9 }, (_, index) => (
                    <i className={pips.includes(index) ? 'pip' : undefined} key={index} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="site-intro-wordmark">
          <div className="site-intro-wordmark-text">
            {GOOGLE_LETTERS.map(([letter, color], index) => (
              <span key={`${letter}-${index}`} style={{ color }}>{letter}</span>
            ))}
            <span className="site-intro-wordmark-space">&nbsp;</span>
            <span className="site-intro-taskhub">
              {TASKHUB_LETTERS.map((letter, index) => (
                <span key={`${letter}-${index}`}>{letter}</span>
              ))}
            </span>
          </div>
          <i className="site-intro-underline" />
        </div>
      </div>
      <button className="site-intro-skip" type="button" onClick={() => setVisible(false)}>
        Skip intro
      </button>
    </div>
  );
};
