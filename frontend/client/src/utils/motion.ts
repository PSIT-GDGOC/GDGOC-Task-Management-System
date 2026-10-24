import { useEffect, useRef, useState } from 'react';
import { Variants } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const defaultEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * FRAMER MOTION VARIANTS
 * Cohesive motion design tokens for components, containers, and micro-interactions
 */

// Stagger container for child elements
export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Directional upward reveal with restrained scale and smooth cubic bezier
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: defaultEase,
    },
  },
};

// Lateral entrance for sidebar and panels
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: defaultEase,
    },
  },
};

// Navigation item reveal
export const navItemVariant: Variants = {
  hidden: {
    opacity: 0,
    x: -12,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: defaultEase,
    },
  },
};

// Card scale and fade in
export const cardVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: defaultEase,
    },
  },
};

// Interactive card hover inspired by APEX-01
export const cardHoverProps = {
  whileHover: {
    y: -3,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  whileTap: {
    scale: 0.985,
    transition: { duration: 0.1 },
  },
};

// Button press interaction
export const buttonTapProps = {
  whileHover: {
    scale: 1.015,
    transition: { duration: 0.15 },
  },
  whileTap: {
    scale: 0.975,
    transition: { duration: 0.1 },
  },
};

// Modal transition with spring physics
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: defaultEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
};

/**
 * ANIMATED COUNTER HOOK (APEX-01 Reference)
 * Smoothly animates numbers from 0 up to actual target value when element is reached
 */
export function useAnimatedCounter(targetValue: number, duration = 1.2): number {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const targetRef = useRef<number>(targetValue);
  targetRef.current = targetValue;

  useEffect(() => {
    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }

    let animationFrameId: number;
    startTimeRef.current = null;

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const updateCounter = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);
      const easedProgress = easeOutExpo(progress);
      
      const current = Math.round(easedProgress * targetRef.current);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(targetRef.current);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration]);

  return displayValue;
}

/**
 * GSAP SCROLL REVEAL HOOK
 * Safely attaches ScrollTrigger to target container without interfering with Framer Motion
 */
export function useGSAPScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: {
    y?: number;
    duration?: number;
    stagger?: number;
    threshold?: string;
  } = {}
) {
  const ref = useRef<T>(null);
  const { y = 25, duration = 0.65, stagger = 0.08, threshold = 'top 85%' } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const childTargets = el.querySelectorAll('[data-gsap-reveal]');
      const targets = childTargets.length > 0 ? childTargets : el;

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: threshold,
            toggleActions: 'play none none none',
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [y, duration, stagger, threshold]);

  return ref;
}
