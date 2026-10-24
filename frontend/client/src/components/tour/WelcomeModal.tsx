/**
 * WelcomeModal.tsx
 * First-time welcome popup shown after login.
 * Matches TaskHub design: rounded-xl, card-bb shadow, gdgoc-blue primary button.
 */
import React, { useEffect } from 'react';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { useTour, setTourPref } from '../../context/TourContext';
import { useTourStarter } from './useTourStarter';
import { Role } from '../../types/auth';

interface WelcomeModalProps {
  userId: string;
  role: Role;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ userId, role }) => {
  const { isWelcomeOpen, closeWelcome } = useTour();
  const { startFullTour } = useTourStarter();

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isWelcomeOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isWelcomeOpen]);

  if (!isWelcomeOpen) return null;

  const isLeader = role === 'TEAM_LEADER' || role === 'ADMIN';

  const title = isLeader
    ? 'Welcome to TaskHub! 👋'
    : 'Welcome to Your TaskHub Workspace! 👋';

  const description = isLeader
    ? 'Welcome to your team\'s workspace! Let\'s take a quick tour to help you understand your dashboard, organise your team, assign tasks, and track everyone\'s progress.'
    : 'Your workspace helps you see what needs to be done, understand your assignments, and track your progress. Let\'s take a quick tour so you can get started with confidence.';

  const handleStartTour = () => {
    closeWelcome();
    startFullTour(role);
  };

  const handleMaybeLater = () => {
    // Mark as seen but NOT completed — prevents re-showing on every page load
    setTourPref(userId, 'welcomeSeen', 'dismissed');
    closeWelcome();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl border-2 border-[#111111] shadow-2xl w-full max-w-md p-7 card-bb animate-in fade-in zoom-in-95 duration-200">
          {/* Icon header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-gdgoc-blue" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                First Time Here?
              </span>
            </div>
          </div>

          {/* Title */}
          <h2
            id="welcome-title"
            className="text-xl font-extrabold text-gdgoc-gray-900 leading-tight mb-3"
          >
            {title}
          </h2>

          {/* Description */}
          <p className="text-sm text-gdgoc-gray-600 leading-relaxed mb-7">
            {description}
          </p>

          {/* Progress dots hint */}
          <div className="flex items-center gap-1.5 mb-7">
            {Array.from({ length: isLeader ? 7 : 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === 0
                    ? 'w-6 bg-gdgoc-blue'
                    : 'w-1.5 bg-gdgoc-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartTour}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold transition-all card-bb"
            >
              <span>Start Tour</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleMaybeLater}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gdgoc-gray-200 bg-white hover:bg-gdgoc-gray-50 text-sm font-medium text-gdgoc-gray-700 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Maybe Later</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
