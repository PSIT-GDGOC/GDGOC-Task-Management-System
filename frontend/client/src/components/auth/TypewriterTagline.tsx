import React, { useState, useEffect } from 'react';
import './TypewriterBranding.css';

interface CharConfig {
  char: string;
  color?: string;
}

// Line 1: "Great teams."
const LINE1_CHARS: CharConfig[] = [
  { char: 'G' },
  { char: 'r' },
  { char: 'e' },
  { char: 'a' },
  { char: 't' },
  { char: ' ' },
  { char: 't' },
  { char: 'e' },
  { char: 'a' },
  { char: 'm' },
  { char: 's' },
  { char: '.' },
];

// Line 2: "Great things done."
// "Great " in #4285F4 (Google Blue)
// "things " in #EA4335 (Google Red)
// "done" in #34A853 (Google Green)
// "." in #FBBC04 (Google Yellow)
const LINE2_CHARS: CharConfig[] = [
  { char: 'G', color: '#4285F4' },
  { char: 'r', color: '#4285F4' },
  { char: 'e', color: '#4285F4' },
  { char: 'a', color: '#4285F4' },
  { char: 't', color: '#4285F4' },
  { char: ' ', color: '#4285F4' },
  { char: 't', color: '#EA4335' },
  { char: 'h', color: '#EA4335' },
  { char: 'i', color: '#EA4335' },
  { char: 'n', color: '#EA4335' },
  { char: 'g', color: '#EA4335' },
  { char: 's', color: '#EA4335' },
  { char: ' ', color: '#EA4335' },
  { char: 'd', color: '#34A853' },
  { char: 'o', color: '#34A853' },
  { char: 'n', color: '#34A853' },
  { char: 'e', color: '#34A853' },
  { char: '.', color: '#FBBC04' },
];

type TaglineAnimState =
  | 'TYPING_L1'
  | 'PAUSE_AFTER_L1'
  | 'TYPING_L2'
  | 'PAUSE_FULL'
  | 'ERASING_L2'
  | 'PAUSE_AFTER_ERASE_L2'
  | 'ERASING_L1'
  | 'PAUSE_EMPTY';

export const TypewriterTagline: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [line1Count, setLine1Count] = useState<number>(0);
  const [line2Count, setLine2Count] = useState<number>(0);
  const [activeCursorLine, setActiveCursorLine] = useState<1 | 2>(1);
  const [animState, setAnimState] = useState<TaglineAnimState>('TYPING_L1');

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setLine1Count(LINE1_CHARS.length);
      setLine2Count(LINE2_CHARS.length);
      setActiveCursorLine(2);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    switch (animState) {
      case 'TYPING_L1': {
        setActiveCursorLine(1);
        if (line1Count < LINE1_CHARS.length) {
          timeoutId = setTimeout(() => {
            setLine1Count((prev) => prev + 1);
          }, 70);
        } else {
          setAnimState('PAUSE_AFTER_L1');
        }
        break;
      }

      case 'PAUSE_AFTER_L1': {
        setActiveCursorLine(2);
        timeoutId = setTimeout(() => {
          setAnimState('TYPING_L2');
        }, 180);
        break;
      }

      case 'TYPING_L2': {
        setActiveCursorLine(2);
        if (line2Count < LINE2_CHARS.length) {
          timeoutId = setTimeout(() => {
            setLine2Count((prev) => prev + 1);
          }, 70);
        } else {
          setAnimState('PAUSE_FULL');
        }
        break;
      }

      case 'PAUSE_FULL': {
        timeoutId = setTimeout(() => {
          setAnimState('ERASING_L2');
        }, 2500);
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
        }, 120);
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
        }, 500);
        break;
      }
    }

    return () => clearTimeout(timeoutId);
  }, [animState, line1Count, line2Count]);

  const isFullyTyped = line1Count === LINE1_CHARS.length && line2Count === LINE2_CHARS.length;

  return (
    <h2
      className={`text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gdgoc-gray-900 tracking-tight leading-[1.18] min-h-[72px] sm:min-h-[86px] lg:min-h-[100px] flex flex-col justify-center select-none ${className}`}
      aria-label="Great teams. Great things done."
    >
      {/* Line 1: Great teams. */}
      <div className="flex items-baseline min-h-[1.18em]">
        <span>
          {LINE1_CHARS.slice(0, line1Count).map((c, i) => (
            <span key={`l1-${i}`} style={{ color: c.color || 'inherit' }}>
              {c.char === ' ' ? '\u00A0' : c.char}
            </span>
          ))}
        </span>
        {activeCursorLine === 1 && (
          <span className="typewriter-cursor" aria-hidden="true" />
        )}
      </div>

      {/* Line 2: Great things done. */}
      <div className="flex items-baseline min-h-[1.18em]">
        <span>
          {LINE2_CHARS.slice(0, line2Count).map((c, i) => (
            <span key={`l2-${i}`} style={{ color: c.color }}>
              {c.char === ' ' ? '\u00A0' : c.char}
            </span>
          ))}
        </span>
        {activeCursorLine === 2 && (
          <span className="typewriter-cursor" aria-hidden="true" />
        )}

        {/* Playful Google brackets doodle accent from the reference design */}
        <span
          className={`inline-flex items-center ml-2.5 align-middle select-none transition-all duration-300 ${
            isFullyTyped
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-hidden="true"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8 inline-block drop-shadow-2xs" viewBox="0 0 40 40" fill="none">
            <path d="M13 20L20 13L17 10L7 20L17 30L20 27L13 20Z" fill="#EA4335" />
            <path d="M27 20L20 27L23 30L33 20L23 10L20 13L27 20Z" fill="#4285F4" />
            <circle cx="20" cy="8" r="2.5" fill="#34A853" />
            <circle cx="20" cy="32" r="2.5" fill="#FBBC04" />
          </svg>
        </span>
      </div>
    </h2>
  );
};
