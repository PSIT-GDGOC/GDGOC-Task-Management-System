import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './auth/authContext';
import { TaskProvider } from './context/TaskContext';
import { TourProvider } from './context/TourContext';
import { TourManager } from './components/tour/TourManager';
import { FullNameModal } from './components/common/FullNameModal';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminTasksPage } from './pages/admin/AdminTasksPage';
import { AdminMembersTeamsPage } from './pages/admin/AdminMembersTeamsPage';
import { AdminInvitationsPage } from './pages/admin/AdminInvitationsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { LeaderLayout } from './layouts/LeaderLayout';
import { LeaderOverview } from './pages/leader/LeaderOverview';
import { TeamDetailPage } from './pages/leader/TeamDetailPage';
import { AssignWorkPage } from './pages/leader/AssignWorkPage';
import { LeaderWorkOverview } from './pages/leader/LeaderWorkOverview';
import { MemberLayout } from './layouts/MemberLayout';
import { MemberMyWork } from './pages/member/MemberMyWork';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MyWorkHistory } from './pages/MyWorkHistory';

/**
 * Smart Root Redirector
 * Resolves root URL '/' to user's assigned role dashboard or to '/login'
 */
export const RootRedirector: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Public account access must not wait for a sleeping API to restore a session.
  // LoginPage redirects to the server-confirmed role once restoration finishes.
  if (isLoading || !isAuthenticated || !user) return <LoginPage />;

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/tasks" replace />;
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
          <TourProvider>
            <TaskProvider>
              <TourManager />
              <FullNameModal />
              <Routes>
                {/* Root */}
                <Route path="/" element={<RootRedirector />} />

                {/* Public Login Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Admin Routes (Protected: Full Club Governance) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/tasks" replace />} />
                  <Route path="tasks" element={<AdminTasksPage />} />
                  <Route path="assign-work" element={<AssignWorkPage />} />
                  <Route path="teams" element={<AdminMembersTeamsPage />} />
                  <Route path="invitations" element={<AdminInvitationsPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                </Route>

                {/* Team Leader Routes (Protected: Leaders and Super Admins/President) */}
                <Route
                  path="/leader"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'TEAM_LEADER']}>
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

                {/* Member Routes (Protected: All Roles can view personal work) */}
                <Route
                  path="/member"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'TEAM_LEADER', 'MEMBER']}>
                      <MemberLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<MemberMyWork />} />
                </Route>

                <Route
                  path="/history"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'TEAM_LEADER', 'MEMBER']}>
                      <MemberLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<MyWorkHistory />} />
                </Route>

                {/* Error & Fallback Routes */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </TaskProvider>
          </TourProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
