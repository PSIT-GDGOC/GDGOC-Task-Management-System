import React, { useEffect } from 'react';
import { CheckCircle2, Award, X, Sparkles } from 'lucide-react';

export type CelebrationType = 'claim' | 'approve';

export interface CelebrationState {
  isOpen: boolean;
  type: CelebrationType;
  taskTitle: string;
  subtitle?: string;
}

interface CelebrationNotificationProps {
  state: CelebrationState | null;
  onClose: () => void;
}

export const CelebrationNotification: React.FC<CelebrationNotificationProps> = ({
  state,
  onClose,
}) => {
  useEffect(() => {
    if (state?.isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [state, onClose]);

  if (!state || !state.isOpen) return null;

  const isClaim = state.type === 'claim';

  return (
    <div className="fixed top-6 right-6 z-50 animate-hero-reveal max-w-md w-full p-4 select-none">
      <div className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl border-2 border-gdgoc-blue/30 shadow-2xl p-5 text-left">
        {/* Decorative Top Accent Bar in Google 4-Colors */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853]" />

        <div className="flex items-start gap-4">
          {/* Animated Icon Badge */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 animate-click-pop shadow-md ${
              isClaim
                ? 'bg-blue-50 text-[#4285F4] border border-blue-200'
                : 'bg-emerald-50 text-[#34A853] border border-emerald-200'
            }`}
          >
            {isClaim ? (
              <CheckCircle2 className="w-7 h-7 text-[#4285F4]" />
            ) : (
              <Award className="w-7 h-7 text-[#34A853]" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isClaim
                    ? 'bg-blue-50 text-[#4285F4] border-blue-200'
                    : 'bg-emerald-50 text-[#34A853] border-emerald-200'
                }`}
              >
                {isClaim ? '⚡ Task Claimed' : '🏆 Work Approved'}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#FBBC04] animate-spin" />
            </div>

            <h4 className="text-sm font-extrabold text-gdgoc-gray-900 leading-snug truncate">
              {isClaim ? 'You claimed this task!' : 'Deliverable approved & completed!'}
            </h4>

            <p className="text-xs text-gdgoc-gray-600 line-clamp-2 mt-0.5 font-medium">
              "{state.taskTitle}"
            </p>

            <p className="text-[11px] text-gdgoc-gray-400 mt-1">
              {state.subtitle ||
                (isClaim
                  ? 'Moved to "In Progress". Go build something awesome!'
                  : 'Milestone verified and recorded in club deliverables.')}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
