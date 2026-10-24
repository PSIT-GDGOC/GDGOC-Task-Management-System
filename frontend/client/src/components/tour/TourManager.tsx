import React, { useEffect } from 'react';
import { useAuth } from '../../auth/authContext';
import { useTour, shouldShowWelcome } from '../../context/TourContext';
import { WelcomeModal } from './WelcomeModal';
import { TourOverlay } from './TourOverlay';

export const TourManager: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openWelcome, isWelcomeOpen, isTourActive } = useTour();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) return;

    // Check if this specific user has already seen or completed the tour
    if (shouldShowWelcome(user.id) && !isWelcomeOpen && !isTourActive) {
      const timer = setTimeout(() => {
        openWelcome();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.id, isAuthenticated, isLoading, isWelcomeOpen, isTourActive, openWelcome]);

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <WelcomeModal userId={user.id} role={user.role} />
      <TourOverlay />
    </>
  );
};
