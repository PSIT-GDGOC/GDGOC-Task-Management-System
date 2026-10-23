import React, { useState } from 'react';
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
import { AdminProfilePanel } from '../components/AdminProfilePanel';

interface AdminLayoutProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    team?: string | null;
    githubUsername?: string | null;
    avatarUrl?: string | null;
  } | null;
  onLogout?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

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

        <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">WORKSPACE</div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {(user?.role === 'SYSTEM_OWNER' || user?.role === 'PRESIDENT') && <NavLink
            to="/invitations"
            className={({ isActive }) => `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <KeyRound className="w-4 h-4 mr-2.5 text-slate-400" />
            Admin Invitations
          </NavLink>}
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

        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {user ? (
            <div className="flex items-center justify-between">
              <button type="button" aria-haspopup="dialog" onClick={() => setProfileOpen(true)} className="min-w-0 flex-1 cursor-pointer truncate text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-indigo-300 font-mono truncate">{user.role}</p>
              </button>
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

      {profileOpen && user && <AdminProfilePanel user={user} onClose={() => setProfileOpen(false)} />}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
