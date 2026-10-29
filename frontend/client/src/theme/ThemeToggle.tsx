import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
      className="theme-toggle inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gdgoc-gray-300 bg-white px-3 text-xs font-semibold text-gdgoc-gray-800 focus-visible:ring-2 focus-visible:ring-gdgoc-blue"
    >
      {theme === 'dark' ? (
        <Sun size={17} aria-hidden="true" />
      ) : (
        <Moon size={17} aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}
