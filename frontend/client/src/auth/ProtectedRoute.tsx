import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';
import { SessionRecovery } from './SessionRecovery';
import { Role } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading, sessionError } = useAuth();
  const location = useLocation();

  if (sessionError) return <SessionRecovery />;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gdgoc-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-gdgoc-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gdgoc-gray-600 font-medium">Verifying workspace session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
