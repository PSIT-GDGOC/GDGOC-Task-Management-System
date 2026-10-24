import { useCallback } from 'react';
import { useTour, TourId } from '../../context/TourContext';
import { TOURS } from './tourSteps';
import { Role } from '../../types/auth';

export const useTourStarter = () => {
  const { startTour } = useTour();

  const startFullTour = useCallback((role: Role) => {
    const isLeader = role === 'TEAM_LEADER' || role === 'ADMIN';
    const tourId: TourId = isLeader ? 'leader-full' : 'member-full';
    startTour(tourId, TOURS[tourId]);
  }, [startTour]);

  const startSectionTour = useCallback((tourId: TourId) => {
    if (TOURS[tourId]) {
      startTour(tourId, TOURS[tourId]);
    }
  }, [startTour]);

  return {
    startFullTour,
    startSectionTour,
  };
};
