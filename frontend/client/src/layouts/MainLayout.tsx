import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, User, LogOut, CheckCircle2 } from 'lucide-react';

interface MainLayoutProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onLogout?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Strict Member Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center space-x-2.5">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">
            GDGOC <span className="font-normal text-gray-500">Member Portal</span>
          </span>
        </div>

        {/* Member Nav Links: Exact Match */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 mr-2.5 text-blue-600" />
            Task Board
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <History className="w-4 h-4 mr-2.5 text-slate-500" />
            My Work History
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <User className="w-4 h-4 mr-2.5 text-slate-500" />
            My Profile
          </NavLink>
        </nav>

        {/* Sync Status & User Profile in Footer */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
            <span>Polling Sync Active (12s)</span>
          </div>

          {user ? (
            <div className="flex items-center justify-between pt-1">
              <div className="truncate">
                <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500 font-mono truncate">{user.email}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
