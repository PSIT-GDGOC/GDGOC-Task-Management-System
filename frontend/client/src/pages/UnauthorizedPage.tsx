import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleReturnToWorkspace = () => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    switch (user.role) {
      case 'ADMIN':
        navigate('/admin', { replace: true });
        break;
      case 'TEAM_LEADER':
        navigate('/leader/overview', { replace: true });
        break;
      case 'MEMBER':
        navigate('/member', { replace: true });
        break;
      default:
        navigate('/login', { replace: true });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch { /* AuthProvider displays the server error. */ }
  };

  return (
    <div className="min-h-screen bg-gdgoc-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gdgoc-gray-200 p-8 shadow-sm text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-gdgoc-red flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gdgoc-gray-900">
            Access Restricted
          </h1>
          <p className="mt-2 text-sm text-gdgoc-gray-600">
            You do not have administrative permission to view this section. Your current role is{' '}
            <strong className="text-gdgoc-gray-900 font-mono">{user?.role || 'UNASSIGNED'}</strong>.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleReturnToWorkspace}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gdgoc-blue text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Workspace</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gdgoc-gray-300 text-gdgoc-gray-700 text-sm font-medium hover:bg-gdgoc-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
