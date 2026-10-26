import { TeamDirectoryStatus } from '../components/common/TeamDirectoryStatus';
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LeaderSidebar } from '../components/leader/LeaderSidebar';
import { Menu, Users } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { ThemeToggle } from '../theme/ThemeToggle';
import { NotificationBell } from '../components/common/NotificationBell';

export const LeaderLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-background min-h-screen flex text-gdgoc-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
        <LeaderSidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#E9EDF2] transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <LeaderSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <header className="bg-white/90 backdrop-blur-xs border-b border-gdgoc-gray-200 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-gdgoc-gray-200 text-gdgoc-gray-700 hover:bg-gdgoc-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden min-[420px]:block lg:hidden">
              <Logo size="sm" showSubtitle={false} />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-gdgoc-gray-500 font-medium">
              <span className="font-bold text-gdgoc-gray-800">GDGOC PSIT</span>
              <span>•</span>
              <span className="text-gdgoc-gray-600">Squad Leadership</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gdgoc-blue bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full shadow-2xs">
              <Users className="w-3 h-3 text-gdgoc-blue" />
              <span className="sr-only sm:not-sr-only">Squad Lead</span>
            </span>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col">
          <TeamDirectoryStatus />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
