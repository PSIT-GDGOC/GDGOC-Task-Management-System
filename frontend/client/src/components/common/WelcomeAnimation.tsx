import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface WelcomeAnimationProps {
  onComplete?: () => void;
}

export const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bracketsContainerRef = useRef<HTMLDivElement>(null);
  const bracketLeftRef = useRef<SVGSVGElement>(null);
  const bracketRightRef = useRef<SVGSVGElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check for user reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Fade out the entire overlay gracefully
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.45,
            ease: 'power2.inOut',
            onComplete: () => {
              setIsVisible(false);
              onComplete?.();
            },
          });
        },
      });

      // Safety timeout: ensure overlay never stays stuck if something interrupts GSAP
      const fallbackTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 6000);

      // --- PHASE 1: CHEVRON BRACKETS (0.0s - 2.1s) ---
      // Initial positioning of brackets offscreen horizontally without CSS transform conflicts
      gsap.set(bracketLeftRef.current, { xPercent: -180, opacity: 0, scale: 1 });
      gsap.set(bracketRightRef.current, { xPercent: 180, opacity: 0, scale: 1 });

      // Slide in toward center simultaneously with elastic spring (bounces back and forth ~4 times)
      tl.to([bracketLeftRef.current, bracketRightRef.current], {
        xPercent: 0,
        opacity: 1,
        duration: 1.6,
        ease: 'elastic.out(1.2, 0.3)',
      }, 0);

      // Settle and shrink/fade brackets together (1.7s -> 2.1s)
      tl.to(bracketsContainerRef.current, {
        scale: 0.6,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
      }, 1.7);

      // --- PHASE 2: WORD PILL CARDS (2.05s - 4.9s) ---
      const cards = cardsContainerRef.current?.querySelectorAll<HTMLDivElement>('.welcome-card');
      if (cards && cards.length > 0) {
        // Set initial state for all cards
        gsap.set(cards, { y: -120, opacity: 0, scale: 0.85 });

        cards.forEach((card, index) => {
          // Stagger starting times for rapid-fire overlapping effect
          // Timeline offsets: card 0: ~2.05s, card 1: ~2.65s, card 2: ~3.25s, card 3 (CLUBS): ~3.85s
          const enterTime = 2.05 + index * 0.62;

          // Card drops in from above with a slight, crisp single bounce
          tl.to(card, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.36,
            ease: 'back.out(1.5)',
          }, enterTime);

          if (index < cards.length - 1) {
            // Cards 1-3: Hold for ~0.26s, then smoothly drop downward while fading out
            tl.to(card, {
              y: 90,
              opacity: 0,
              scale: 1.08,
              duration: 0.28,
              ease: 'power2.in',
            }, enterTime + 0.36 + 0.26);
          } else {
            // Card 4 (CLUBS): Final card stays in center and performs a subtle scale pulse
            tl.to(card, {
              scale: 1.08,
              duration: 0.22,
              ease: 'power1.out',
              yoyo: true,
              repeat: 1,
            }, enterTime + 0.42);

            // Small final hold before full transition
            tl.to({}, { duration: 0.35 });
          }
        });
      }

      return () => {
        clearTimeout(fallbackTimer);
      };
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white overflow-hidden select-none pointer-events-auto"
      style={{ backgroundColor: '#FFFFFF' }}
      aria-label="Welcome to GDGOC TaskHub"
      role="dialog"
      aria-modal="true"
    >
      {/* Phase 1: Chevron Brackets Container */}
      <div
        ref={bracketsContainerRef}
        className="absolute flex items-center justify-center gap-6 sm:gap-10 pointer-events-none"
      >
        {/* Left Chevron < (Top: Red #EA4335, Bottom: Blue #4285F4) */}
        <svg
          ref={bracketLeftRef}
          className="w-24 h-40 sm:w-32 sm:h-52 md:w-40 md:h-64 drop-shadow-sm"
          viewBox="0 0 100 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Upper stroke: Google Red */}
          <path
            d="M86 18 L22 80"
            stroke="#EA4335"
            strokeWidth="24"
            strokeLinecap="round"
          />
          {/* Lower stroke: Google Blue */}
          <path
            d="M22 80 L86 142"
            stroke="#4285F4"
            strokeWidth="24"
            strokeLinecap="round"
          />
        </svg>

        {/* Right Chevron > (Top: Yellow #FBBC05, Bottom: Green #34A853) */}
        <svg
          ref={bracketRightRef}
          className="w-24 h-40 sm:w-32 sm:h-52 md:w-40 md:h-64 drop-shadow-sm"
          viewBox="0 0 100 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Upper stroke: Google Yellow */}
          <path
            d="M14 18 L78 80"
            stroke="#FBBC05"
            strokeWidth="24"
            strokeLinecap="round"
          />
          {/* Lower stroke: Google Green */}
          <path
            d="M78 80 L14 142"
            stroke="#34A853"
            strokeWidth="24"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Phase 2: Pill Cards Container */}
      <div
        ref={cardsContainerRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {/* Card 1: GOOGLE (#EA4335) */}
        <div
          className="welcome-card absolute px-8 py-4 sm:px-14 sm:py-6 rounded-full text-white font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-wider shadow-xl flex items-center justify-center min-w-[220px] sm:min-w-[340px]"
          style={{ backgroundColor: '#EA4335' }}
        >
          GOOGLE
        </div>

        {/* Card 2: DEVELOPER (#4285F4) */}
        <div
          className="welcome-card absolute px-8 py-4 sm:px-14 sm:py-6 rounded-full text-white font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-wider shadow-xl flex items-center justify-center min-w-[220px] sm:min-w-[340px]"
          style={{ backgroundColor: '#4285F4' }}
        >
          DEVELOPER
        </div>

        {/* Card 3: STUDENT (#34A853) */}
        <div
          className="welcome-card absolute px-8 py-4 sm:px-14 sm:py-6 rounded-full text-white font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-wider shadow-xl flex items-center justify-center min-w-[220px] sm:min-w-[340px]"
          style={{ backgroundColor: '#34A853' }}
        >
          STUDENT
        </div>

        {/* Card 4: CLUBS (#FBBC05) */}
        <div
          className="welcome-card absolute px-8 py-4 sm:px-14 sm:py-6 rounded-full text-white font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-wider shadow-xl flex items-center justify-center min-w-[220px] sm:min-w-[340px]"
          style={{ backgroundColor: '#FBBC05' }}
        >
          CLUBS
        </div>
      </div>
    </div>
  );
};
