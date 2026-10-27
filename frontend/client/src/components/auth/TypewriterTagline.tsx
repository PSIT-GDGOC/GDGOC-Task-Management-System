import React, { useEffect, useState } from 'react';
import './TypewriterBranding.css';

const TAGLINES = [
  'Great Teams. Great Things Done.',
  'Build Together. Grow Together.',
  'Ideas Into Impact.',
  'Collaborate. Create. Contribute.',
  "Together, We Build What's Next.",
];

export const TypewriterTagline: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isErasing, setIsErasing] = useState(false);

  const tagline = TAGLINES[taglineIndex];
  const isFullyTyped = !isErasing && characterCount === tagline.length;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCharacterCount(tagline.length);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    if (!isErasing && characterCount < tagline.length) {
      timeoutId = setTimeout(() => setCharacterCount((count) => count + 1), 65);
    } else if (!isErasing) {
      timeoutId = setTimeout(() => setIsErasing(true), 1800);
    } else if (characterCount > 0) {
      timeoutId = setTimeout(() => setCharacterCount((count) => count - 1), 32);
    } else {
      timeoutId = setTimeout(() => {
        setTaglineIndex((index) => (index + 1) % TAGLINES.length);
        setIsErasing(false);
      }, 350);
    }

    return () => clearTimeout(timeoutId);
  }, [characterCount, isErasing, tagline]);

  return (
    <h2
      className={`text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-black dark:text-white tracking-tight leading-[1.18] min-h-[72px] sm:min-h-[86px] lg:min-h-[100px] flex flex-col justify-center select-none ${className}`}
      aria-label={tagline}
    >
      <span>
        {tagline.slice(0, characterCount)}
        <span className="typewriter-cursor" aria-hidden="true" />
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
      </span>
    </h2>
  );
};
