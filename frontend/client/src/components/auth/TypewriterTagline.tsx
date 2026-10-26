import React, { useEffect, useState } from 'react';
import './TypewriterBranding.css';

interface CharConfig {
  char: string;
  color?: string;
}

interface TaglinePair {
  first: CharConfig[];
  second: CharConfig[];
}

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#34A853'];

const makeLine = (words: string[]): CharConfig[] => [
  ...words.flatMap((word, index) => [
    ...Array.from(word, (char) => ({ char, color: GOOGLE_COLORS[index % GOOGLE_COLORS.length] })),
    ...(index < words.length - 1 ? [{ char: ' ', color: GOOGLE_COLORS[index % GOOGLE_COLORS.length] }] : []),
  ]),
  { char: '.', color: '#FBBC04' },
];

// Each cycle changes both headline lines, with Google colors on the lower line.
const TAGLINE_PAIRS: TaglinePair[] = [
  { first: makeLine(['Great', 'teams']), second: makeLine(['Great', 'things', 'done']) },
  { first: makeLine(['Bright', 'ideas']), second: makeLine(['Bold', 'impact']) },
  { first: makeLine(['Work', 'together']), second: makeLine(['Go', 'further']) },
  { first: makeLine(['Good', 'teams']), second: makeLine(['Big', 'wins']) },
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
  const [line1Count, setLine1Count] = useState(0);
  const [line2Count, setLine2Count] = useState(0);
  const [pairIndex, setPairIndex] = useState(0);
  const [activeCursorLine, setActiveCursorLine] = useState<1 | 2>(1);
  const [animState, setAnimState] = useState<TaglineAnimState>('TYPING_L1');
  const currentPair = TAGLINE_PAIRS[pairIndex];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLine1Count(TAGLINE_PAIRS[0].first.length);
      setLine2Count(TAGLINE_PAIRS[0].second.length);
      setActiveCursorLine(2);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    switch (animState) {
      case 'TYPING_L1':
        setActiveCursorLine(1);
        if (line1Count < currentPair.first.length) {
          timeoutId = setTimeout(() => setLine1Count((count) => count + 1), 70);
        } else {
          setAnimState('PAUSE_AFTER_L1');
        }
        break;
      case 'PAUSE_AFTER_L1':
        setActiveCursorLine(2);
        timeoutId = setTimeout(() => setAnimState('TYPING_L2'), 180);
        break;
      case 'TYPING_L2':
        setActiveCursorLine(2);
        if (line2Count < currentPair.second.length) {
          timeoutId = setTimeout(() => setLine2Count((count) => count + 1), 70);
        } else {
          setAnimState('PAUSE_FULL');
        }
        break;
      case 'PAUSE_FULL':
        timeoutId = setTimeout(() => setAnimState('ERASING_L2'), 2500);
        break;
      case 'ERASING_L2':
        setActiveCursorLine(2);
        if (line2Count > 0) {
          timeoutId = setTimeout(() => setLine2Count((count) => count - 1), 35);
        } else {
          setAnimState('PAUSE_AFTER_ERASE_L2');
        }
        break;
      case 'PAUSE_AFTER_ERASE_L2':
        setActiveCursorLine(1);
        timeoutId = setTimeout(() => setAnimState('ERASING_L1'), 120);
        break;
      case 'ERASING_L1':
        setActiveCursorLine(1);
        if (line1Count > 0) {
          timeoutId = setTimeout(() => setLine1Count((count) => count - 1), 35);
        } else {
          setAnimState('PAUSE_EMPTY');
        }
        break;
      case 'PAUSE_EMPTY':
        setActiveCursorLine(1);
        timeoutId = setTimeout(() => {
          setPairIndex((index) => (index + 1) % TAGLINE_PAIRS.length);
          setAnimState('TYPING_L1');
        }, 300);
        break;
    }

    return () => clearTimeout(timeoutId);
  }, [animState, currentPair, line1Count, line2Count]);

  const isFullyTyped = line1Count === currentPair.first.length && line2Count === currentPair.second.length;
  const accessibleLabel = `${currentPair.first.map(({ char }) => char).join('')} ${currentPair.second.map(({ char }) => char).join('')}`;

  return (
    <h2
      className={`text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gdgoc-gray-900 tracking-tight leading-[1.18] min-h-[72px] sm:min-h-[86px] lg:min-h-[100px] flex flex-col justify-center select-none ${className}`}
      aria-label={accessibleLabel}
    >
      <div className="flex items-baseline min-h-[1.18em]">
        <span>
          {currentPair.first.slice(0, line1Count).map((char, index) => (
            <span key={`l1-${index}`} className="tagline-google-shadow">
              {char.char === ' ' ? '\u00A0' : char.char}
            </span>
          ))}
        </span>
        {activeCursorLine === 1 && <span className="typewriter-cursor" aria-hidden="true" />}
      </div>

      <div className="flex items-baseline min-h-[1.18em]">
        <span>
          {currentPair.second.slice(0, line2Count).map((char, index) => (
            <span key={`l2-${index}`} className="tagline-google-shadow" style={{ color: char.color }}>
              {char.char === ' ' ? '\u00A0' : char.char}
            </span>
          ))}
        </span>
        {activeCursorLine === 2 && <span className="typewriter-cursor" aria-hidden="true" />}
        <span
          className={`inline-flex items-center ml-2.5 align-middle select-none transition-all duration-300 ${
            isFullyTyped ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
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
