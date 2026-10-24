import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { Logo } from '../common/Logo';
import { 
  FolderKanban, 
  Users, 
  KeyRound, 
  BarChart3, 
  ShieldCheck, 
  LogOut, 
  X,
  ExternalLink
} from 'lucide-react';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItemClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
      isActive
        ? 'bg-red-50 text-gdgoc-red font-semibold shadow-2xs'
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
    <aside className="w-64 h-full bg-white border-r border-gdgoc-gray-200 flex flex-col justify-between select-none">
      {/* Top Branding Section */}
      <div>
        <div className="p-4 sm:p-5 border-b border-gdgoc-gray-100 flex items-center justify-between">
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

        {/* Admin Badge */}
        <div className="px-5 pt-3 pb-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200/70 text-gdgoc-red">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[11px] font-bold tracking-wide uppercase">Admin Console</span>
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

        {/* Quick Links Section */}
        <div className="px-5 pt-6 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400">
            Switch Perspective
          </span>
        </div>
        <div className="px-3 space-y-1">
          <NavLink
            to="/leader/overview"
            onClick={onCloseMobile}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gdgoc-gray-600 hover:bg-gdgoc-gray-100 hover:text-gdgoc-gray-900 transition-colors"
          >
            <span>Lead Workspace</span>
            <ExternalLink className="w-3 h-3 text-gdgoc-gray-400" />
          </NavLink>
          <NavLink
            to="/member"
            onClick={onCloseMobile}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gdgoc-gray-600 hover:bg-gdgoc-gray-100 hover:text-gdgoc-gray-900 transition-colors"
          >
            <span>Member My Work</span>
            <ExternalLink className="w-3 h-3 text-gdgoc-gray-400" />
          </NavLink>
        </div>
      </div>

      {/* Bottom Profile & Logout Footer */}
      <div className="p-3 border-t border-gdgoc-gray-100 bg-white">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gdgoc-gray-50 border border-gdgoc-gray-200">
          <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 text-gdgoc-red flex items-center justify-center font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gdgoc-gray-900 truncate">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-gdgoc-gray-500 truncate">
              {user?.email || 'admin@psit.gdgoc.dev'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gdgoc-gray-400 hover:text-gdgoc-red hover:bg-red-50 rounded-md transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
