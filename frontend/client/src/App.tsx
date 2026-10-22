import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './auth/authContext';
import { TaskProvider } from './context/TaskContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPlaceholder } from './pages/AdminDashboardPlaceholder';
import { LeaderLayout } from './layouts/LeaderLayout';
import { LeaderOverview } from './pages/leader/LeaderOverview';
import { TeamDetailPage } from './pages/leader/TeamDetailPage';
import { AssignWorkPage } from './pages/leader/AssignWorkPage';
import { LeaderWorkOverview } from './pages/leader/LeaderWorkOverview';
import { MemberLayout } from './layouts/MemberLayout';
import { MemberMyWork } from './pages/member/MemberMyWork';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Smart Root Redirector
 * Resolves root URL '/' to user's assigned role dashboard or to '/login'
 */
const RootRedirector: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gdgoc-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gdgoc-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'TEAM_LEADER':
      return <Navigate to="/leader/overview" replace />;
    case 'MEMBER':
      return <Navigate to="/member" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TaskProvider>
            <Routes>
              {/* Root */}
              <Route path="/" element={<RootRedirector />} />

              {/* Public Login Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboardPlaceholder />
                  </ProtectedRoute>
                }
              />

              {/* Team Leader Routes (Protected) */}
              <Route
                path="/leader"
                element={
                  <ProtectedRoute allowedRoles={['TEAM_LEADER']}>
                    <LeaderLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/leader/overview" replace />} />
                <Route path="overview" element={<LeaderOverview />} />
                <Route path="teams/:teamId" element={<TeamDetailPage />} />
                <Route path="assign-work" element={<AssignWorkPage />} />
                <Route path="view-work" element={<LeaderWorkOverview />} />
              </Route>

              {/* Member Routes (Protected: MY WORK ONLY) */}
              <Route
                path="/member"
                element={
                  <ProtectedRoute allowedRoles={['MEMBER']}>
                    <MemberLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<MemberMyWork />} />
              </Route>

              {/* Error & Fallback Routes */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </TaskProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
