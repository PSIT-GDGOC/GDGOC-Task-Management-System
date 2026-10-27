import React from 'react';

interface LetterConfig {
  char: string;
  color: string;
}

// Line 1: "GDGoC TASKHUB" styled with Google's iconic four colors
const LINE1_DATA: LetterConfig[] = [
  { char: 'G', color: '#4285F4' }, // Blue
  { char: 'D', color: '#EA4335' }, // Red
  { char: 'G', color: '#FBBC04' }, // Yellow
  { char: 'o', color: '#4285F4' }, // Blue
  { char: 'C', color: '#34A853' }, // Green
  { char: ' ', color: 'transparent' },
  { char: 'T', color: '#4285F4' }, // Blue
  { char: 'A', color: '#EA4335' }, // Red
  { char: 'S', color: '#FBBC04' }, // Yellow
  { char: 'K', color: '#34A853' }, // Green
  { char: 'H', color: '#4285F4' }, // Blue
  { char: 'U', color: '#EA4335' }, // Red
  { char: 'B', color: '#34A853' }, // Green
];

/**
 * Steady Webapp Branding: GDGoC TASKHUB / GDGoC PSIT
 * Kept steady with zero animation as requested.
 */
export const TypewriterBranding: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`select-none text-left flex flex-col justify-center ${className}`}
      role="banner"
      aria-label="GDGoC TASKHUB — GDGoC PSIT"
    >
      {/* Line 1: Steady GDGoC TASKHUB */}
      <div className="flex items-baseline">
        <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-none font-sans drop-shadow-2xs">
          {LINE1_DATA.map((item, idx) => (
            <span
              key={`l1-${idx}`}
              style={{ color: item.color }}
              className="inline-block"
            >
              {item.char === ' ' ? '\u00A0' : item.char}
            </span>
          ))}
        </h1>
      </div>

      {/* Line 2: Steady GDGoC PSIT */}
      <div className="flex items-baseline pt-2">
        <p className="text-xs sm:text-sm font-extrabold tracking-[0.28em] uppercase leading-none font-sans text-black dark:text-white">
          GDGoC PSIT
        </p>
      </div>
    </div>
  );
};
