import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { Logo } from '../common/Logo';
import { 
  CheckSquare, 
  LogOut, 
  UserCircle2,
  X 
} from 'lucide-react';

interface MemberSidebarProps {
  onCloseMobile?: () => void;
}

export const MemberSidebar: React.FC<MemberSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-gdgoc-gray-200 flex flex-col justify-between select-none">
      {/* Top Branding Section */}
      <div>
        <div className="p-4 sm:p-5 border-b border-gdgoc-gray-100 flex items-center justify-between">
          <Logo size="sm" showSubtitle={true} />
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section Label */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400">
            Member Workspace
          </span>
        </div>

        {/* Primary Navigation: MY WORK ONLY */}
        <nav className="px-3 space-y-1">
          <NavLink
            to="/member"
            end
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-gdgoc-blue font-semibold shadow-2xs'
                  : 'text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 hover:text-gdgoc-gray-900'
              }`
            }
          >
            <CheckSquare className="w-4 h-4 flex-shrink-0" />
            <span>My Work</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom Profile and Logout Section */}
      <div className="p-3 border-t border-gdgoc-gray-200 bg-gdgoc-gray-50/70 space-y-2">
        <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400">
          Profile
        </div>
        {/* User Profile Card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-gdgoc-gray-200 shadow-2xs">
          <UserCircle2 className="w-8 h-8 text-gdgoc-green flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-gdgoc-gray-900 truncate">
              {user?.name || 'Rohan Gupta'}
            </p>
            <p className="text-[10px] text-gdgoc-gray-500 truncate font-mono">
              {user?.email}
            </p>
            <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gdgoc-green bg-green-50 px-1.5 py-0.2 rounded border border-green-200">
              Regular Member
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gdgoc-gray-200 bg-white hover:bg-red-50 hover:text-gdgoc-red hover:border-red-200 text-xs font-semibold text-gdgoc-gray-700 transition-colors shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
