import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MemberSidebar } from '../components/member/MemberSidebar';
import { Menu, Moon, Sun, UserCheck } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { NotificationBell } from '../components/common/NotificationBell';
import './member-theme.css';

const MEMBER_THEME_STORAGE_KEY = 'gdgoc-login-theme';

const getInitialTheme = (): 'dark' | 'light' => {
  try {
    const savedTheme = localStorage.getItem(MEMBER_THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  } catch (error) {
    console.warn('[Member] Could not read the saved theme preference:', error);
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const MemberLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem(MEMBER_THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn('[Member] Could not save the theme preference:', error);
    }
  };

  return (
    <div className={`member-workspace theme-${theme} min-h-screen flex text-gdgoc-gray-900`} data-theme={theme}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
        <MemberSidebar />
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
        className={`member-sidebar-drawer lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <MemberSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <header className="member-topbar bg-white/90 backdrop-blur-xs border-b border-gdgoc-gray-200 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-gdgoc-gray-200 text-gdgoc-gray-700 hover:bg-gdgoc-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <Logo size="sm" showSubtitle={false} className="member-sidebar-logo" />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-gdgoc-gray-500 font-medium">
              <span className="font-bold text-gdgoc-gray-800">GDGOC PSIT</span>
              <span>•</span>
              <span className="text-gdgoc-gray-600">Member Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="member-theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <NotificationBell />
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gdgoc-green bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shadow-2xs">
              <UserCheck className="w-3 h-3 text-gdgoc-green" />
              <span>Squad Crew</span>
            </span>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
