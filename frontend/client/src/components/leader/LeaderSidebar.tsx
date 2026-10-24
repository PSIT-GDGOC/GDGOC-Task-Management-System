import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { Logo } from '../common/Logo';
import { TEAMS } from '../../data/mockData';
import { useTasks } from '../../context/TaskContext';
import { ProfilePanel } from '../common/ProfilePanel';
import { 
  LayoutDashboard, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  PlusCircle, 
  Layers, 
  LogOut, 
  UserCircle2,
  X
} from 'lucide-react';

interface LeaderSidebarProps {
  onCloseMobile?: () => void;
}

export const LeaderSidebar: React.FC<LeaderSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  // Keep Team section expanded by default or if current route is a team route
  const isTeamActive = location.pathname.startsWith('/leader/teams');
  const [isTeamExpanded, setIsTeamExpanded] = useState<boolean>(true);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItemClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
      isActive
        ? 'bg-[#DDE8F8] text-gdgoc-blue font-semibold shadow-2xs'
        : 'text-gdgoc-gray-700 hover:bg-[#DEE3EA] hover:text-gdgoc-gray-900'
    }`;

  const subItemClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 py-1.5 pl-6 pr-3 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'text-gdgoc-blue font-semibold bg-[#DDE8F8]/60'
        : 'text-gdgoc-gray-600 hover:text-gdgoc-gray-900 hover:bg-[#DEE3EA]'
    }`;

  return (
    <>
    <aside className="w-64 h-full bg-[#E9EDF2] border-r-2 border-[#111111] flex flex-col justify-between select-none">
      {/* Top Branding Section */}
      <div>
        <div className="p-4 sm:p-5 border-b border-[#111111] flex items-center justify-between">
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
            Workspace
          </span>
        </div>

        {/* Primary Navigation List */}
        <nav className="px-3 space-y-1">
          {/* 1. Overview */}
          <NavLink
            to="/leader/overview"
            onClick={onCloseMobile}
            className={navItemClasses}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span>Overview</span>
          </NavLink>

          {/* 2. Team (Expandable / Collapsible) */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setIsTeamExpanded(!isTeamExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isTeamActive
                  ? 'text-gdgoc-blue font-semibold bg-[#DDE8F8]/60'
                  : 'text-gdgoc-gray-700 hover:bg-[#DEE3EA] hover:text-gdgoc-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Team</span>
              </div>
              <span className="text-gdgoc-gray-400">
                {isTeamExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {/* Subsections: Core, Tech, Media, Content */}
            {isTeamExpanded && (
              <div className="mt-1 ml-3 pl-2 border-l border-gdgoc-gray-300 space-y-1">
                {TEAMS.map((team) => (
                  <NavLink
                    key={team.id}
                    to={`/leader/teams/${team.id}`}
                    onClick={onCloseMobile}
                    className={subItemClasses}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        team.accent === 'red'
                          ? 'bg-gdgoc-red'
                          : team.accent === 'blue'
                          ? 'bg-gdgoc-blue'
                          : team.accent === 'yellow'
                          ? 'bg-amber-500'
                          : 'bg-gdgoc-green'
                      }`}
                    />
                    <span className="truncate">{team.name}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* 3. Assign Work */}
          <NavLink
            to="/leader/assign-work"
            onClick={onCloseMobile}
            className={navItemClasses}
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" />
            <span>Assign Work</span>
          </NavLink>

          {/* 4. View Work */}
          <NavLink
            to="/leader/view-work"
            onClick={onCloseMobile}
            className={navItemClasses}
          >
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span>View Work</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom Profile and Logout Section */}
      <div className="p-3 border-t border-[#111111] bg-[#E9EDF2] space-y-2">
        <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400">
          Profile
        </div>
        {/* User Profile Card */}
        <button type="button" aria-haspopup="dialog" onClick={() => setProfileOpen(true)} className="profile-card-trigger w-full flex items-center gap-2.5 p-2 rounded-lg bg-white card-bb-sm text-left">
          <UserCircle2 className="w-8 h-8 text-gdgoc-blue flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-gdgoc-gray-900 truncate">
              {user?.name || 'Not provided'}
            </p>
            <p className="text-[10px] text-gdgoc-gray-500 truncate font-mono">
              {user?.email}
            </p>
            <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gdgoc-blue bg-blue-50 px-1.5 py-0.2 rounded border border-[#111111]">
              {user?.role === 'TEAM_LEADER' ? 'Team Leader' : user?.role === 'ADMIN' ? 'Admin' : 'Member'}
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
