import React, { useState, useEffect } from 'react';
import './TypewriterBranding.css';

interface LetterConfig {
  char: string;
  color: string;
}

// Line 1: "GDGoC TASKHUB" styled with Google's four colors
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

// Line 2: "GDGoC PSIT" styled with Google's four colors
const LINE2_DATA: LetterConfig[] = [
  { char: 'G', color: '#4285F4' }, // Blue
  { char: 'D', color: '#EA4335' }, // Red
  { char: 'G', color: '#FBBC04' }, // Yellow
  { char: 'o', color: '#4285F4' }, // Blue
  { char: 'C', color: '#34A853' }, // Green
  { char: ' ', color: 'transparent' },
  { char: 'P', color: '#4285F4' }, // Blue
  { char: 'S', color: '#EA4335' }, // Red
  { char: 'I', color: '#FBBC04' }, // Yellow
  { char: 'T', color: '#34A853' }, // Green
];

type TypewriterState =
  | 'TYPING_L1'
  | 'PAUSE_AFTER_L1'
  | 'TYPING_L2'
  | 'PAUSE_FULL'
  | 'ERASING_L2'
  | 'PAUSE_AFTER_ERASE_L2'
  | 'ERASING_L1'
  | 'PAUSE_EMPTY';

export const TypewriterBranding: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [line1Count, setLine1Count] = useState<number>(0);
  const [line2Count, setLine2Count] = useState<number>(0);
  const [activeCursorLine, setActiveCursorLine] = useState<1 | 2>(1);
  const [animState, setAnimState] = useState<TypewriterState>('TYPING_L1');

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setLine1Count(LINE1_DATA.length);
      setLine2Count(LINE2_DATA.length);
      setActiveCursorLine(2);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    switch (animState) {
      case 'TYPING_L1': {
        setActiveCursorLine(1);
        if (line1Count < LINE1_DATA.length) {
          timeoutId = setTimeout(() => {
            setLine1Count((prev) => prev + 1);
          }, 65);
        } else {
          setAnimState('PAUSE_AFTER_L1');
        }
        break;
      }

      case 'PAUSE_AFTER_L1': {
        setActiveCursorLine(2);
        timeoutId = setTimeout(() => {
          setAnimState('TYPING_L2');
        }, 220);
        break;
      }

      case 'TYPING_L2': {
        setActiveCursorLine(2);
        if (line2Count < LINE2_DATA.length) {
          timeoutId = setTimeout(() => {
            setLine2Count((prev) => prev + 1);
          }, 55);
        } else {
          setAnimState('PAUSE_FULL');
        }
        break;
      }

      case 'PAUSE_FULL': {
        setActiveCursorLine(2);
        // Pause when full so users can comfortably read
        timeoutId = setTimeout(() => {
          setAnimState('ERASING_L2');
        }, 2800);
        break;
      }

      case 'ERASING_L2': {
        setActiveCursorLine(2);
        if (line2Count > 0) {
          timeoutId = setTimeout(() => {
            setLine2Count((prev) => prev - 1);
          }, 35);
        } else {
          setAnimState('PAUSE_AFTER_ERASE_L2');
        }
        break;
      }

      case 'PAUSE_AFTER_ERASE_L2': {
        setActiveCursorLine(1);
        timeoutId = setTimeout(() => {
          setAnimState('ERASING_L1');
        }, 150);
        break;
      }

      case 'ERASING_L1': {
        setActiveCursorLine(1);
        if (line1Count > 0) {
          timeoutId = setTimeout(() => {
            setLine1Count((prev) => prev - 1);
          }, 35);
        } else {
          setAnimState('PAUSE_EMPTY');
        }
        break;
      }

      case 'PAUSE_EMPTY': {
        setActiveCursorLine(1);
        timeoutId = setTimeout(() => {
          setAnimState('TYPING_L1');
        }, 600);
        break;
      }
    }

    return () => clearTimeout(timeoutId);
  }, [animState, line1Count, line2Count]);

  return (
    <div 
      className={`select-none text-left min-h-[72px] sm:min-h-[84px] lg:min-h-[92px] flex flex-col justify-center ${className}`}
      role="banner"
      aria-label="GDGoC TASKHUB — GDGoC PSIT"
    >
      {/* Line 1: GDGoC TASKHUB */}
      <div className="flex items-baseline h-[36px] sm:h-[44px] lg:h-[48px]">
        <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-none font-sans">
          {LINE1_DATA.slice(0, line1Count).map((item, idx) => (
            <span
              key={`l1-${idx}`}
              style={{ color: item.color }}
              className="inline-block transition-opacity duration-75"
            >
              {item.char === ' ' ? '\u00A0' : item.char}
            </span>
          ))}
        </h1>
        {activeCursorLine === 1 && (
          <span className="typewriter-cursor typewriter-cursor-line1" aria-hidden="true" />
        )}
      </div>

      {/* Line 2: GDGoC PSIT */}
      <div className="flex items-baseline h-[20px] sm:h-[24px] pt-1">
        <p className="text-sm sm:text-base font-extrabold tracking-[0.24em] uppercase leading-none font-sans">
          {LINE2_DATA.slice(0, line2Count).map((item, idx) => (
            <span
              key={`l2-${idx}`}
              style={{ color: item.color }}
              className="inline-block transition-opacity duration-75"
            >
              {item.char === ' ' ? '\u00A0' : item.char}
            </span>
          ))}
        </p>
        {activeCursorLine === 2 && (
          <span className="typewriter-cursor typewriter-cursor-line2" aria-hidden="true" />
        )}
      </div>
    </div>
  );
};
