import React, { useEffect, useState } from 'react';
import './TypewriterBranding.css';

const QUOTES = [
  'Great teams. Great things done.',
  'Build ideas. Ship together.',
  'Turn teamwork into impact.',
  'Create. Collaborate. Contribute.',
  'Small tasks. Big impact.',
];

type AnimationPhase = 'typing' | 'holding' | 'erasing' | 'gap';
interface AnimationState {
  quoteIndex: number;
  characterCount: number;
  phase: AnimationPhase;
}

const INITIAL_STATE: AnimationState = {
  quoteIndex: 0,
  characterCount: 0,
  phase: 'typing',
};

export const TypewriterTagline: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [animation, setAnimation] = useState<AnimationState>(() =>
    reducedMotion
      ? { quoteIndex: 0, characterCount: QUOTES[0].length, phase: 'holding' }
      : INITIAL_STATE,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      if (
        animation.quoteIndex !== 0 ||
        animation.characterCount !== QUOTES[0].length ||
        animation.phase !== 'holding'
      ) {
        setAnimation({ quoteIndex: 0, characterCount: QUOTES[0].length, phase: 'holding' });
      }
      return;
    }

    const currentQuote = QUOTES[animation.quoteIndex];
    let timeout: ReturnType<typeof setTimeout> | undefined;

    switch (animation.phase) {
      case 'typing':
        if (animation.characterCount < currentQuote.length) {
          timeout = setTimeout(() => {
            setAnimation((current) => ({
              ...current,
              characterCount: current.characterCount + 1,
            }));
          }, 70);
        } else {
          setAnimation((current) => ({ ...current, phase: 'holding' }));
        }
        break;

      case 'holding':
        timeout = setTimeout(() => {
          setAnimation((current) => ({ ...current, phase: 'erasing' }));
        }, 2000);
        break;

      case 'erasing':
        if (animation.characterCount > 0) {
          timeout = setTimeout(() => {
            setAnimation((current) => ({
              ...current,
              characterCount: current.characterCount - 1,
            }));
          }, 35);
        } else {
          setAnimation((current) => ({ ...current, phase: 'gap' }));
        }
        break;

      case 'gap':
        timeout = setTimeout(() => {
          setAnimation((current) => ({
            quoteIndex: (current.quoteIndex + 1) % QUOTES.length,
            characterCount: 0,
            phase: 'typing',
          }));
        }, 220);
        break;
    }

    return () => {
      if (timeout !== undefined) clearTimeout(timeout);
    };
  }, [animation, reducedMotion]);

  const quote = QUOTES[animation.quoteIndex];
  const visibleText = quote.slice(0, animation.characterCount);
  const isQuoteComplete = animation.characterCount === quote.length;

  return (
    <div
      className={`min-h-[2.4em] text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-gdgoc-gray-900 tracking-tight leading-[1.18] select-none ${className}`}
      aria-live="off"
    >
      <span aria-hidden="true">{visibleText}</span>
      {!reducedMotion && <span className="typewriter-cursor" aria-hidden="true" />}
      <span
        className={`ml-2 inline-flex align-middle transition-all duration-300 ${
          isQuoteComplete ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0'
        }`}
        aria-hidden="true"
      >
        <svg className="inline-block h-6 w-6 drop-shadow-2xs sm:h-7 sm:w-7" viewBox="0 0 40 40" fill="none">
          <path d="M13 20L20 13L17 10L7 20L17 30L20 27L13 20Z" fill="#EA4335" />
          <path d="M27 20L20 27L23 30L33 20L23 10L20 13L27 20Z" fill="#4285F4" />
          <circle cx="20" cy="8" r="2.5" fill="#34A853" />
          <circle cx="20" cy="32" r="2.5" fill="#FBBC04" />
        </svg>
      </span>
      <span className="sr-only">{quote}</span>
    </div>
  );
};
