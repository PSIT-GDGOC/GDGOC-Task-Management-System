import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { Logo } from '../components/common/Logo';
import { LogOut, UserCircle2, Shield, Users, UserCheck } from 'lucide-react';
import { Role } from '../types/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch { /* AuthProvider displays the server error. */ }
  };

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'ADMIN':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-gdgoc-red" />,
          label: 'ADMINISTRATOR',
          color: 'bg-red-50 text-gdgoc-red border-red-200',
        };
      case 'TEAM_LEADER':
        return {
          icon: <Users className="w-3.5 h-3.5 text-gdgoc-blue" />,
          label: 'TEAM LEADER',
          color: 'bg-blue-50 text-gdgoc-blue border-blue-200',
        };
      case 'MEMBER':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-gdgoc-green" />,
          label: 'CORE MEMBER',
          color: 'bg-green-50 text-gdgoc-green border-green-200',
        };
      default:
        return {
          icon: null,
          label: 'UNKNOWN',
          color: 'bg-gray-50 text-gray-700 border-gray-200',
        };
    }
  };

  const roleMeta = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-gdgoc-gray-50 flex flex-col text-gdgoc-gray-900">
      {/* Top Application Header */}
      <header className="bg-white border-b border-gdgoc-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo and Brand */}
          <Logo size="md" />

          {/* Right User Bar & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Info Chip */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gdgoc-gray-50 border border-gdgoc-gray-200">
              <UserCircle2 className="w-6 h-6 text-gdgoc-gray-600" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-gdgoc-gray-900 leading-tight">
                  {user?.name || 'Workspace User'}
                </span>
                <span className="text-[10px] text-gdgoc-gray-500 font-mono leading-tight">
                  {user?.email}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta.color}`}>
                {roleMeta.icon}
                {roleMeta.label}
              </span>
            </div>

            {/* Logout Action Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gdgoc-gray-300 bg-white hover:bg-gdgoc-gray-50 active:bg-gdgoc-gray-100 text-xs font-medium text-gdgoc-gray-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gdgoc-blue"
              title="Sign out of TaskFlow"
            >
              <LogOut className="w-3.5 h-3.5 text-gdgoc-gray-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gdgoc-gray-200 py-4 text-center text-xs text-gdgoc-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GDGoC TaskFlow • PSIT Kanpur Chapter</span>
          <span className="text-gdgoc-gray-400">Phase 1 Architecture Active</span>
        </div>
      </footer>
    </div>
  );
};
