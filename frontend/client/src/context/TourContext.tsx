/**
 * TourContext.tsx
 * Central state management for the onboarding tour system.
 * Handles: welcome popup visibility, active tour, step navigation,
 * persistence per user (keyed by userId+role), cross-route navigation.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TourStep {
  /** data-tour attribute value on the target element, e.g. "overview-heading" */
  target: string;
  /** Route to navigate to before highlighting, e.g. "/leader/overview" */
  route?: string;
  title: string;
  description: string;
  /** Preferred tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export type TourId =
  | 'leader-full'
  | 'member-full'
  | 'leader-overview'
  | 'leader-assign'
  | 'leader-view'
  | 'member-mywork'
  | 'member-history';

interface TourState {
  isWelcomeOpen: boolean;
  isTourActive: boolean;
  activeTourId: TourId | null;
  currentStepIndex: number;
  steps: TourStep[];
}

interface TourContextValue extends TourState {
  openWelcome: () => void;
  closeWelcome: () => void;
  startTour: (tourId: TourId, steps: TourStep[]) => void;
  endTour: (completed?: boolean) => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

/** Stable storage key scoped to a specific user so accounts don't share state */
export function tourStorageKey(userId: string, suffix: string): string {
  return `taskhub_tour_${userId}_${suffix}`;
}

export function getTourPref(userId: string, suffix: string): string | null {
  if (!userId) return null;
  return localStorage.getItem(tourStorageKey(userId, suffix));
}

export function setTourPref(userId: string, suffix: string, value: string): void {
  if (!userId) return;
  localStorage.setItem(tourStorageKey(userId, suffix), value);
}

/** Returns true if the welcome popup should be shown to this user */
export function shouldShowWelcome(userId: string): boolean {
  if (!userId) return false;
  const seen = getTourPref(userId, 'welcomeSeen');
  return !seen;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TourContext = createContext<TourContextValue | undefined>(undefined);

export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [state, setState] = useState<TourState>({
    isWelcomeOpen: false,
    isTourActive: false,
    activeTourId: null,
    currentStepIndex: 0,
    steps: [],
  });

  // Track pending navigation so we don't double-navigate
  const navigatingRef = useRef(false);

  const openWelcome = useCallback(() => {
    setState((s) => ({ ...s, isWelcomeOpen: true }));
  }, []);

  const closeWelcome = useCallback(() => {
    setState((s) => ({ ...s, isWelcomeOpen: false }));
  }, []);

  const startTour = useCallback(
    (tourId: TourId, steps: TourStep[]) => {
      setState({
        isWelcomeOpen: false,
        isTourActive: true,
        activeTourId: tourId,
        currentStepIndex: 0,
        steps,
      });
      // Navigate to the first step's route if provided
      if (steps[0]?.route && !navigatingRef.current) {
        navigatingRef.current = true;
        navigate(steps[0].route);
        setTimeout(() => { navigatingRef.current = false; }, 600);
      }
    },
    [navigate]
  );

  const endTour = useCallback((completed = false) => {
    setState({
      isWelcomeOpen: false,
      isTourActive: false,
      activeTourId: null,
      currentStepIndex: 0,
      steps: [],
    });
    // Restore body scroll
    document.body.style.overflow = '';
    return completed;
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      setState((s) => {
        if (index < 0 || index >= s.steps.length) return s;
        const step = s.steps[index];
        // Navigate if step has a different route
        if (step?.route && !navigatingRef.current) {
          navigatingRef.current = true;
          navigate(step.route);
          setTimeout(() => { navigatingRef.current = false; }, 600);
        }
        return { ...s, currentStepIndex: index };
      });
    },
    [navigate]
  );

  const nextStep = useCallback(() => {
    setState((s) => {
      const next = s.currentStepIndex + 1;
      if (next >= s.steps.length) return s; // caller handles completion
      const step = s.steps[next];
      if (step?.route && !navigatingRef.current) {
        navigatingRef.current = true;
        navigate(step.route);
        setTimeout(() => { navigatingRef.current = false; }, 600);
      }
      return { ...s, currentStepIndex: next };
    });
  }, [navigate]);

  const prevStep = useCallback(() => {
    setState((s) => {
      const prev = s.currentStepIndex - 1;
      if (prev < 0) return s;
      const step = s.steps[prev];
      if (step?.route && !navigatingRef.current) {
        navigatingRef.current = true;
        navigate(step.route);
        setTimeout(() => { navigatingRef.current = false; }, 600);
      }
      return { ...s, currentStepIndex: prev };
    });
  }, [navigate]);

  return (
    <TourContext.Provider
      value={{ ...state, openWelcome, closeWelcome, startTour, endTour, goToStep, nextStep, prevStep }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextValue => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
};
