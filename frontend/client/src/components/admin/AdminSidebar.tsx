import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { useTasks } from '../../context/TaskContext';
import { Logo } from '../common/Logo';
import { ProfilePanel } from '../common/ProfilePanel';
import { 
  FolderKanban, 
  Users, 
  KeyRound, 
  BarChart3, 
  ShieldCheck, 
  LogOut, 
  X,
  PlusCircle
} from 'lucide-react';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItemClasses = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium transition-all before:absolute before:left-1 before:top-2 before:bottom-2 before:w-px before:bg-[#111111] ${
      isActive
        ? 'rounded-md bg-red-50 text-gdgoc-red font-semibold'
        : 'text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 hover:text-gdgoc-gray-900'
    }`;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <>
    <aside className="w-64 h-full bg-[#E9EDF2] border-r border-gdgoc-gray-200 flex flex-col justify-between select-none">
      {/* Top Branding Section */}
      <div>
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" showSubtitle={true} />
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mx-4 sm:mx-5 border-b border-black/50" aria-hidden="true" />

        {/* Admin / Executive Badge */}
        <div className="px-5 pt-3 pb-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200/70 text-gdgoc-red">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[11px] font-bold tracking-wide uppercase">
              {user?.position ? `${user.position} Console` : 'President Console'}
            </span>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400">
            Governance & Operations
          </span>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1">
          {/* 1. Club Deliverables */}
          <NavLink
            to="/admin/tasks"
            onClick={onCloseMobile}
            className={navItemClasses}
          >
            <FolderKanban className="w-4 h-4 flex-shrink-0" />
            <span>Club Deliverables</span>
          </NavLink>

          {/* 2. Assign Deliverable */}
          <NavLink
            to="/admin/assign-work"
            onClick={onCloseMobile}
            className={navItemClasses}
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" />
            <span>Assign Deliverable</span>
          </NavLink>

          {/* 2. Members & Teams */}
          <NavLink
            to="/admin/teams"
            onClick={onCloseMobile}
            className={navItemClasses}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Members & Teams</span>
          </NavLink>

          {/* 3. Invitations */}
          <NavLink
            to="/admin/invitations"
            onClick={onCloseMobile}
            className={navItemClasses}
          >
            <KeyRound className="w-4 h-4 flex-shrink-0" />
            <span>President's Key Vault</span>
          </NavLink>

          {/* 4. Analytics */}
          <NavLink
            to="/admin/analytics"
            onClick={onCloseMobile}
            className={navItemClasses}
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            <span>Chapter Analytics</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom Profile & Logout Footer */}
      <div className="p-3 border-t border-gdgoc-gray-100 bg-[#E9EDF2] space-y-2">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setProfileOpen(true)}
          className="w-full flex items-center gap-3 p-2 rounded-lg bg-gdgoc-gray-50 text-left hover:bg-gdgoc-gray-100 transition-all cursor-pointer group card-bb-sm"
          title="Click to view President Profile"
        >
          <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 text-gdgoc-red flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gdgoc-gray-900 truncate">
              {user?.name || user?.position || 'President'}
            </p>
            <p className="text-[10px] text-gdgoc-gray-500 truncate">
              {user?.position ? `${user.position} • ` : 'Executive • '}{user?.email || 'admin@psit.gdgoc.dev'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 hover:text-gdgoc-red text-xs font-semibold text-gdgoc-gray-700 transition-colors card-bb-sm"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    {profileOpen && <ProfilePanel user={user} tasks={tasks} onClose={() => setProfileOpen(false)} />}
    </>
  );
};
