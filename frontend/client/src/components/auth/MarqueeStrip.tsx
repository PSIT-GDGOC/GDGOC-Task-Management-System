import React from 'react';
import './MarqueeStrip.css';

const PHRASE_WITH_SEPARATOR = 'BUILD ✦ CONNECT ✦ GROW ✦ ';
const TRACK_COPY = PHRASE_WITH_SEPARATOR.repeat(3);

export const MarqueeStrip: React.FC<{ className?: string }> = ({ className = '' }) => {
  const copy = (key: number) => (
    <div className="marquee-track-content" key={key} aria-hidden="true">
      {TRACK_COPY}
    </div>
  );

  return (
    <div className={`marquee-strip-container ${className}`} aria-label="BUILD ✦ CONNECT ✦ GROW">
      <div className="marquee-track-wrapper">
        {copy(1)}
        {copy(2)}
      </div>
    </div>
  );
};
