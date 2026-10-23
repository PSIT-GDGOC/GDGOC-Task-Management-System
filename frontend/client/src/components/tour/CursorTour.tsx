import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, X, CheckCircle2 } from 'lucide-react';

export interface TourStep {
  selector: string;
  title: string;
  description: string;
  badge?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface CursorTourProps {
  steps: TourStep[];
  tourKey?: string;
}

export const CursorTour: React.FC<CursorTourProps> = ({
  steps,
  tourKey = 'gdgoc_taskhub_tour_completed',
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Automatically start tour immediately if system/user is new (no notification prompt)
  useEffect(() => {
    const isCompleted = localStorage.getItem(tourKey);
    if (!isCompleted) {
      // Start directly on mount after elements are rendered
      const timer = setTimeout(() => {
        setCurrentStepIndex(0);
        setIsActive(true);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [tourKey]);

  // Update target element coordinates
  const updateTargetPosition = useCallback(() => {
    if (!isActive || !steps[currentStepIndex]) return;

    const el = document.querySelector(steps[currentStepIndex].selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Small timeout to allow smooth scroll to finish before calculating rect
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }, 100);
    } else {
      setTargetRect(null);
    }
  }, [isActive, steps, currentStepIndex]);

  useEffect(() => {
    if (isActive) {
      updateTargetPosition();
      window.addEventListener('resize', updateTargetPosition);
      window.addEventListener('scroll', updateTargetPosition, true);
    }
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isActive, currentStepIndex, updateTargetPosition]);

  const handleStartTour = () => {
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleCompleteTour();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleCompleteTour = () => {
    localStorage.setItem(tourKey, 'true');
    setIsActive(false);
    setTargetRect(null);
  };

  const currentStep = steps[currentStepIndex];

  // Calculate smart tooltip coordinates
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return {};

    const tooltipWidth = 370;
    const tooltipHeight = 220;
    const margin = 16;

    // Check if target element is very tall (like the entire sprint table)
    const isLargeTarget = targetRect.height > 220;

    let top: number;
    let left = targetRect.left;

    if (isLargeTarget) {
      // Place tooltip above the target if space permits, or floating comfortably near top
      if (targetRect.top > tooltipHeight + margin) {
        top = targetRect.top - tooltipHeight - margin;
      } else {
        // Place tooltip at top-right inside or beside the screen
        top = Math.max(margin, targetRect.top + margin);
        left = Math.min(window.innerWidth - tooltipWidth - margin, targetRect.right - tooltipWidth);
      }
    } else {
      // Normal target: place below if space, otherwise above
      if (targetRect.bottom + tooltipHeight + margin < window.innerHeight) {
        top = targetRect.bottom + margin;
      } else {
        top = Math.max(margin, targetRect.top - tooltipHeight - margin);
      }
    }

    // Horizontal boundaries clamping
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    };
  };

  return (
    <>
      {/* -------------------------------------------------------------------
          1. FLOATING "PRODUCT TOUR" BUTTON (Always accessible to restart)
          ------------------------------------------------------------------- */}
      {!isActive && (
        <button
          type="button"
          onClick={handleStartTour}
          className="fixed bottom-6 right-6 z-40 px-3.5 py-2 rounded-full bg-white/95 hover:bg-blue-50 border border-gdgoc-gray-300 hover:border-gdgoc-blue text-xs font-semibold text-gdgoc-gray-700 hover:text-gdgoc-blue shadow-md transition-all flex items-center gap-2 cursor-pointer group select-none"
          title="Restart Beginner Tour"
        >
          <Sparkles className="w-4 h-4 text-gdgoc-blue group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Product Tour</span>
        </button>
      )}

      {/* -------------------------------------------------------------------
          2. CRYSTAL-CLEAR SPOTLIGHT CUTOUT & GUIDED CURSOR
          ------------------------------------------------------------------- */}
      {isActive && targetRect && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* 
            PUNCHOUT SPOTLIGHT FRAME:
            - The inside of this frame is 100% TRANSPARENT and CLEAR (ZERO BLUR, ZERO DARKNESS)
            - The massive 9999px spread box-shadow darkens everything OUTSIDE of this frame!
          */}
          <div
            className="absolute rounded-2xl pointer-events-none transition-all duration-300 ease-out"
            style={{
              top: `${Math.max(0, targetRect.top - 8)}px`,
              left: `${Math.max(0, targetRect.left - 8)}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`,
              border: '2.5px solid #4285F4',
              // 9999px shadow darkens the rest of the screen while keeping the interior 100% crisp
              boxShadow: '0 0 0 4px rgba(66, 133, 244, 0.35), 0 0 0 9999px rgba(15, 23, 42, 0.72)',
            }}
          />

          {/* Animated Guided Cursor pointing directly into the spotlight */}
          <div
            className="absolute pointer-events-none transition-all duration-300 ease-out animate-cursor-pulse z-50"
            style={{
              top: `${Math.max(10, targetRect.top - 18)}px`,
              left: `${Math.max(10, targetRect.left - 16)}px`,
            }}
          >
            <div className="relative">
              <svg
                className="w-10 h-10 text-gdgoc-blue drop-shadow-xl -rotate-12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 3L11.5 21L14.5 13.5L22 10.5L4 3Z"
                  fill="#4285F4"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EA4335]"></span>
              </span>
            </div>
          </div>

          {/* Interactive Tour Tooltip Card (Pointer events enabled for buttons) */}
          <div
            className="absolute z-50 pointer-events-auto bg-white rounded-2xl border-2 border-gdgoc-blue/30 shadow-2xl p-5 text-left transition-all duration-300 ease-out"
            style={getTooltipStyle()}
          >
            {/* Top Row: Badge & Step Count */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-gdgoc-blue uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-gdgoc-blue" />
                {currentStep.badge || 'Guided Step'}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-gdgoc-gray-500">
                  {currentStepIndex + 1} of {steps.length}
                </span>
                <button
                  type="button"
                  onClick={handleCompleteTour}
                  className="p-1 rounded-lg text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 transition-colors cursor-pointer"
                  title="Close Tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Content */}
            <h3 className="text-base font-extrabold text-gdgoc-gray-900 leading-snug mb-1">
              {currentStep.title}
            </h3>
            <p className="text-xs text-gdgoc-gray-600 leading-relaxed mb-4">
              {currentStep.description}
            </p>

            {/* Google-Gradient Progress Bar */}
            <div className="w-full bg-gdgoc-gray-100 h-1.5 rounded-full mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853] h-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  currentStepIndex === 0
                    ? 'border-transparent text-gdgoc-gray-300 cursor-not-allowed'
                    : 'border-gdgoc-gray-200 text-gdgoc-gray-700 hover:bg-gdgoc-gray-50 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCompleteTour}
                  className="text-xs text-gdgoc-gray-500 hover:text-gdgoc-gray-800 px-2 py-1 transition-colors cursor-pointer"
                >
                  Skip
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>
                    {currentStepIndex === steps.length - 1 ? 'Finish!' : 'Next'}
                  </span>
                  {currentStepIndex === steps.length - 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
