import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LeaderSidebar } from '../components/leader/LeaderSidebar';
import { Menu } from 'lucide-react';
import { Logo } from '../components/common/Logo';

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
        {/* Mobile Top Header */}
        <header className="lg:hidden bg-white border-b border-gdgoc-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-gdgoc-gray-200 text-gdgoc-gray-700 hover:bg-gdgoc-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size="sm" showSubtitle={false} />
          <span className="text-[10px] font-bold text-gdgoc-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            Lead
          </span>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
