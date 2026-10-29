import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { Logo } from '../common/Logo';
import { ProfilePanel } from '../common/ProfilePanel';
import { useTasks } from '../../context/TaskContext';
import { 
  CheckSquare, 
  History,
  LogOut, 
  UserCircle2,
  X 
} from 'lucide-react';

interface MemberSidebarProps {
  onCloseMobile?: () => void;
}

export const MemberSidebar: React.FC<MemberSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch { /* AuthProvider displays the server error. */ }
  };

  return (
    <>
    <aside data-tour="member-sidebar" className="w-64 h-full bg-[#E9EDF2] border-r-2 border-[#111111] flex flex-col justify-between select-none">
      {/* Top Branding Section */}
      <div>
        <div className="p-4 sm:p-5 border-b border-[#111111] flex items-center justify-between">
          <Logo size="sm" showSubtitle={true} />
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-[#DEE3EA]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section Label */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400">
            Workspace
          </span>
        </div>

        {/* Primary Navigation: MY WORK ONLY */}
        <nav className="px-3 space-y-1">
          <NavLink
            to="/history"
            onClick={onCloseMobile}
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${isActive ? 'bg-[#DDE8F8] text-gdgoc-blue font-semibold shadow-2xs' : 'text-gdgoc-gray-700 hover:bg-[#DEE3EA] hover:text-gdgoc-gray-900'}`}
          >
            <History className="w-4 h-4 flex-shrink-0" />
            <span>My Work History</span>
          </NavLink>
          <NavLink
            to="/member"
            end
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#DDE8F8] text-gdgoc-blue font-semibold shadow-2xs'
                  : 'text-gdgoc-gray-700 hover:bg-[#DEE3EA] hover:text-gdgoc-gray-900'
              }`
            }
          >
            <CheckSquare className="w-4 h-4 flex-shrink-0" />
            <span>My Work</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom Profile and Logout Section */}
      <div className="p-3 border-t border-[#111111] bg-[#E9EDF2] space-y-2">
        <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400">
          Profile
        </div>
        {/* User Profile Card */}
        <button type="button" aria-haspopup="dialog" onClick={() => setProfileOpen(true)} data-tour="member-profile-card" className="profile-card-trigger w-full flex items-center gap-2.5 p-2 rounded-lg bg-white card-bb-sm text-left">
          <UserCircle2 className="w-8 h-8 text-gdgoc-blue flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-gdgoc-gray-900 truncate">
              {user?.name || 'Not provided'}
            </p>
            <p className="text-[10px] text-gdgoc-gray-500 truncate font-mono">
              {user?.email || 'Not provided'}
            </p>
            <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gdgoc-blue bg-blue-50 px-1.5 py-0.2 rounded border border-[#111111]">
              Regular Member
            </span>
          </div>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-red-50 hover:text-gdgoc-red text-xs font-semibold text-gdgoc-gray-700 transition-colors card-bb-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    {profileOpen && <ProfilePanel user={user} tasks={tasks} onClose={() => setProfileOpen(false)} />}
    </>
  );
};
