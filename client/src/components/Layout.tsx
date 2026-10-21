import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, LogOut, CheckCircle2 } from 'lucide-react';

interface LayoutProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight">
                GDGOC <span className="font-normal text-gray-500">Task Management</span>
              </span>
            </Link>

            {/* Sync Badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
              Polling Sync Active (12s)
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Board
            </Link>

            <Link
              to="/history"
              className="flex items-center text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <History className="w-4 h-4 mr-1.5" />
              My History
            </Link>
          </nav>

          {/* User profile / session */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-900">{user.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    <span className="uppercase text-blue-600 font-semibold">{user.role}</span>
                  </p>
                </div>
                {onLogout ? (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};
