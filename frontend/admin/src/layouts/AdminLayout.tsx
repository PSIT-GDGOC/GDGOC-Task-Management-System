import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  History,
  User,
  Users,
  KeyRound,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

interface AdminLayoutProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onLogout?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Strict Admin Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-slate-800 flex items-center space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white text-sm tracking-tight">
            GDGOC <span className="font-normal text-slate-400">Admin Console</span>
          </span>
        </div>

        {/* Admin Nav Links: Exact Match to Approved Scope */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 mr-2.5 text-indigo-400" />
            Task Board
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <History className="w-4 h-4 mr-2.5 text-slate-400" />
            My Work History
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <User className="w-4 h-4 mr-2.5 text-slate-400" />
            My Profile
          </NavLink>

          <NavLink
            to="/members-teams"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Users className="w-4 h-4 mr-2.5 text-slate-400" />
            Members & Teams
          </NavLink>

          <NavLink
            to="/invitations"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <KeyRound className="w-4 h-4 mr-2.5 text-slate-400" />
            Admin Invitations
          </NavLink>
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-indigo-300 font-mono truncate">{user.role}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ml-2"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Admin Sign In
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
