import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { TourId } from '../../context/TourContext';
import { useTourStarter } from './useTourStarter';
import { useAuth } from '../../auth/authContext';

interface HelpButtonProps {
  sectionTourId: TourId;
  sectionTitle?: string;
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({
  sectionTourId,
  sectionTitle = 'this section',
  className = '',
}) => {
  const { user } = useAuth();
  const { startSectionTour, startFullTour } = useTourStarter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleStartSectionTour = () => {
    setIsOpen(false);
    startSectionTour(sectionTourId);
  };

  const handleStartFullTour = () => {
    setIsOpen(false);
    if (user?.role) {
      startFullTour(user.role);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gdgoc-gray-50 active:bg-gdgoc-gray-100 text-xs font-semibold text-gdgoc-gray-700 hover:text-gdgoc-blue border border-gdgoc-gray-200 card-bb transition-colors cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Help & Guided Tours"
      >
        <HelpCircle className="w-3.5 h-3.5 text-gdgoc-blue" />
        <span>Help</span>
        <ChevronDown className="w-3 h-3 text-gdgoc-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border-2 border-[#111111] shadow-xl p-1.5 z-50 card-bb text-left animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={handleStartSectionTour}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gdgoc-gray-800 hover:bg-blue-50 hover:text-gdgoc-blue transition-colors text-left cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-gdgoc-blue flex-shrink-0" />
            <div className="flex-1">
              <div>Page Tour</div>
              <div className="text-[10px] text-gdgoc-gray-500 font-normal">Quick guide to {sectionTitle}</div>
            </div>
          </button>

          <div className="my-1 border-t border-gdgoc-gray-100" />

          <button
            type="button"
            onClick={handleStartFullTour}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gdgoc-gray-800 hover:bg-gdgoc-gray-50 hover:text-gdgoc-gray-900 transition-colors text-left cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gdgoc-gray-500 flex-shrink-0" />
            <div className="flex-1">
              <div>Replay Full Tour</div>
              <div className="text-[10px] text-gdgoc-gray-500 font-normal">Complete onboarding walk-through</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
