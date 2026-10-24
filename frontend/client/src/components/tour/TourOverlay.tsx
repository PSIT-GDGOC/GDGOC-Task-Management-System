import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTour, setTourPref } from '../../context/TourContext';
import { useAuth } from '../../auth/authContext';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';

export const TourOverlay: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isTourActive,
    activeTourId,
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    endTour,
  } = useTour();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isSearchingTarget, setIsSearchingTarget] = useState<boolean>(true);
  const [fallbackCenter, setFallbackCenter] = useState<boolean>(false);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Find & scroll target element
  const locateAndPositionTarget = useCallback(() => {
    if (!isTourActive || !currentStep) return;

    setIsSearchingTarget(true);
    setFallbackCenter(false);

    let attempts = 0;
    const maxAttempts = 25; // 25 * 80ms = 2000ms

    const checkElement = () => {
      // Find element by [data-tour="..."]
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`) as HTMLElement | null;

      if (el) {
        setIsSearchingTarget(false);
        setFallbackCenter(false);

        // Scroll smoothly into view
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

        // Update rect after scrolling settles
        setTimeout(() => {
          if (el.isConnected) {
            setTargetRect(el.getBoundingClientRect());
          }
        }, 150);
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkElement, 80);
        } else {
          // Fallback: target not found on this view, show centered fallback tooltip
          setIsSearchingTarget(false);
          setFallbackCenter(true);
          setTargetRect(null);
        }
      }
    };

    checkElement();
  }, [isTourActive, currentStep]);

  // Trigger positioning whenever active, step index, or location changes
  useEffect(() => {
    if (isTourActive) {
      locateAndPositionTarget();
    } else {
      setTargetRect(null);
      setFallbackCenter(false);
    }
  }, [isTourActive, currentStepIndex, location.pathname, locateAndPositionTarget]);

  // Keep rect updated on scroll and resize
  useEffect(() => {
    if (!isTourActive || !currentStep || fallbackCenter) return;

    const handleUpdate = () => {
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isTourActive, currentStep, fallbackCenter]);

  // Keyboard navigation support
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        if (!isLastStep) nextStep();
      } else if (e.key === 'ArrowLeft') {
        if (!isFirstStep) prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, isLastStep, isFirstStep, nextStep, prevStep]);

  // Handle Skip Tour
  const handleSkip = () => {
    if (user?.id) {
      setTourPref(user.id, 'tourSkipped', 'true');
      setTourPref(user.id, 'welcomeSeen', 'true');
    }
    endTour(false);

    // Return to role specific landing page
    if (user?.role === 'TEAM_LEADER' || user?.role === 'ADMIN') {
      navigate('/leader/overview');
    } else {
      navigate('/member');
    }
  };

  // Handle Finish Tour
  const handleFinish = () => {
    if (user?.id) {
      setTourPref(user.id, 'tourCompleted', 'true');
      setTourPref(user.id, 'welcomeSeen', 'true');
    }
    endTour(true);

    // If it was a full tour, ensure we return to the main dashboard
    if (activeTourId === 'leader-full') {
      navigate('/leader/overview');
    } else if (activeTourId === 'member-full') {
      navigate('/member');
    }
  };

  if (!isTourActive || !currentStep) return null;

  // Tooltip positioning math
  const getTooltipPositionStyle = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 640;
    const tooltipWidth = Math.min(window.innerWidth - 32, 400);

    if (isMobile) {
      // On mobile, render as bottom-sheet modal to guarantee readability
      return {
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        width: 'calc(100% - 32px)',
        maxHeight: '80vh',
        zIndex: 9999,
      };
    }

    if (fallbackCenter || !targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`,
        zIndex: 9999,
      };
    }

    const margin = 16;
    const estimatedHeight = 240;
    let top = 0;
    let left = 0;

    const preferredPos = currentStep.position || 'auto';

    // Vertical positioning
    if (preferredPos === 'top' && targetRect.top > estimatedHeight + margin) {
      top = targetRect.top - estimatedHeight - margin;
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    } else if (preferredPos === 'right' && targetRect.right + tooltipWidth + margin < window.innerWidth) {
      top = targetRect.top + (targetRect.height / 2) - (estimatedHeight / 2);
      left = targetRect.right + margin;
    } else if (preferredPos === 'left' && targetRect.left > tooltipWidth + margin) {
      top = targetRect.top + (targetRect.height / 2) - (estimatedHeight / 2);
      left = targetRect.left - tooltipWidth - margin;
    } else {
      // Default to bottom or fallback above
      if (targetRect.bottom + estimatedHeight + margin < window.innerHeight) {
        top = targetRect.bottom + margin;
      } else if (targetRect.top > estimatedHeight + margin) {
        top = targetRect.top - estimatedHeight - margin;
      } else {
        top = Math.max(margin, window.innerHeight - estimatedHeight - margin);
      }
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    }

    // Viewport clamping
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - estimatedHeight - margin));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9999,
    };
  };

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="Guided Tour">
      {/* Dimmed Overlay with Spotlight Hole */}
      {targetRect && !fallbackCenter ? (
        <div className="fixed inset-0 z-[9990] pointer-events-none transition-all duration-300 ease-out">
          {/* Spotlight cutout */}
          <div
            className="absolute rounded-xl pointer-events-none transition-all duration-300 ease-out"
            style={{
              top: `${Math.max(0, targetRect.top - 6)}px`,
              left: `${Math.max(0, targetRect.left - 6)}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
              border: '2.5px solid #4285F4',
              boxShadow: '0 0 0 4px rgba(66, 133, 244, 0.3), 0 0 0 9999px rgba(15, 23, 42, 0.65)',
            }}
          />
        </div>
      ) : (
        /* Full background dim for loading or centered fallback */
        <div className="fixed inset-0 z-[9990] bg-slate-900/65 backdrop-blur-[1px] transition-opacity" />
      )}

      {/* Floating Tooltip Card */}
      <div
        style={getTooltipPositionStyle()}
        className="bg-white rounded-2xl border-2 border-[#111111] shadow-2xl p-5 sm:p-6 card-bb text-left animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header: Step counter & close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-gdgoc-blue uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-gdgoc-blue" />
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="p-1 rounded-lg text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 transition-colors cursor-pointer"
            title="Skip Tour"
            aria-label="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Title */}
        <h3 className="text-base sm:text-lg font-extrabold text-gdgoc-gray-900 leading-snug mb-1.5">
          {currentStep.title}
        </h3>

        {/* Step Description */}
        <p className="text-xs sm:text-sm text-gdgoc-gray-600 leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {isSearchingTarget && (
          <div className="flex items-center gap-2 mb-3 text-xs text-gdgoc-blue animate-pulse">
            <span className="w-2 h-2 rounded-full bg-gdgoc-blue" />
            <span>Finding target element...</span>
          </div>
        )}

        {/* Gradient Progress Indicator */}
        <div className="w-full bg-gdgoc-gray-100 h-1.5 rounded-full mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853] h-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Actions Toolbar */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={prevStep}
            disabled={isFirstStep}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
              isFirstStep
                ? 'border-transparent text-gdgoc-gray-300 cursor-not-allowed'
                : 'border-gdgoc-gray-200 text-gdgoc-gray-700 hover:bg-gdgoc-gray-50 active:bg-gdgoc-gray-100 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-medium text-gdgoc-gray-500 hover:text-gdgoc-gray-800 px-2 py-1 transition-colors cursor-pointer"
            >
              Skip Tour
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gdgoc-green hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer card-bb"
              >
                <span>Finish Tour</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer card-bb"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
