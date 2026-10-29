import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../auth/authContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { ThemeToggle } from '../theme/ThemeToggle';
import { Logo } from '../components/common/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { LoginAtmosphere } from '../components/auth/LoginAtmosphere';
import './login-page.css';

type LoginTheme = 'dark' | 'light';
const THEME_STORAGE_KEY = 'gdgoc-login-theme';
const LOGIN_QUOTES = [
  'Ideas grow when we build together.',
  'Learn boldly. Make something real.',
  'Small steps can spark big ideas.',
];

const getInitialTheme = (): LoginTheme => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  } catch (error) {
    console.warn('[Login] Could not read the saved theme preference:', error);
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [theme, setTheme] = useState<LoginTheme>(getInitialTheme);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'TEAM_LEADER':
          navigate('/leader/overview', { replace: true });
          break;
        case 'MEMBER':
          navigate('/member', { replace: true });
          break;
      }
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const quoteTimer = window.setInterval(() => {
      setQuoteIndex((currentIndex) => (currentIndex + 1) % LOGIN_QUOTES.length);
    }, 4800);

    return () => window.clearInterval(quoteTimer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn('[Login] Could not save the theme preference:', error);
    }
  };

  return (
    <div className={`auth-shell theme-${theme}`} data-theme={theme}>
      <LoginAtmosphere theme={theme} />

      {/* =========================================================================
          TOP NAVIGATION HEADER
          ========================================================================= */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <Logo size="sm" showSubtitle={false} />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden sm:flex text-[11px] font-medium text-gdgoc-gray-600 bg-white/90 border border-gdgoc-gray-200 px-3 py-1 rounded-full shadow-2xs backdrop-blur-xs flex items-center gap-1.5">
            <span>PSIT Chapter</span>
            <span className="text-gdgoc-gray-400 text-[10px]">▾</span>
          </span>
          <span className="auth-topbar-taskhub">TaskHub</span>
        </div>
        <button
          type="button"
          className="auth-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </header>

      {/* =========================================================================
          MAIN TWO-COLUMN WORKSPACE
          ========================================================================= */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-5 flex items-start lg:items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* -------------------------------------------------------------------
              LEFT COLUMN: BRANDING AND VISUAL IDENTITY
              ------------------------------------------------------------------- */}
          <section className="flex flex-col justify-center text-left space-y-6 sm:space-y-7 max-w-lg mx-auto lg:mx-0 order-2 lg:order-1">
            {/* Typewriter Branding: GDGoC TASKHUB / GDGoC PSIT */}
            <div className="pt-1 pb-1">
              <TypewriterBranding className="max-w-[480px] w-full" />
            </div>

            {/* Hero Heading: "Great teams. Great things done." */}
            <div className="space-y-2">
              <TypewriterTagline />
              <p className="text-sm sm:text-base text-gdgoc-gray-600 leading-relaxed font-normal pt-1">
                One workspace to assign tasks, track progress, and keep every GDGoC team moving
                forward.
              </p>
            </div>
          </div>
          <p className="auth-quote" key={quoteIndex} aria-live="polite">
            “{LOGIN_QUOTES[quoteIndex]}”
          </p>
          <h1 id="auth-story-title">
            <span className="auth-story-primary">Same people.</span>
            <br />
            <span className="auth-story-accent">Bigger    ideas.</span>
          </h1>
          <p>
            At GDGoC, developers, creators and changemakers build what matters together.
          </p>
          <div className="auth-story-foot">
            <span className="auth-story-rule" />
            <span>Learn · Build · Grow</span>
          </div>
        </section>

            {/* Compact Team Collaboration Visual */}
            <CollaborationVisual />

            {/* Black Marquee Strip (Left-to-Right Continuous Loop) */}
            <div className="pt-1 pb-1">
              <MarqueeStrip />
            </div>
          </section>

          {/* -------------------------------------------------------------------
              RIGHT COLUMN: LOGIN FORM (Rotating Circular Google Light Beam Border)
              ------------------------------------------------------------------- */}
          <section className="flex flex-col justify-center items-center w-full order-1 lg:order-2">
            <div className="google-border-beam-container w-full max-w-[450px]">
              {/* Soft ambient blur halo */}
              <div className="google-border-beam-ambient" aria-hidden="true" />
              {/* Sharp rotating conic gradient border beam */}
              <div className="google-border-beam-glow" aria-hidden="true" />
              {/* Card surface containing the login form */}
              <div className="google-border-beam-content p-5 sm:p-6 shadow-sm">
                <nav
                  aria-label="Account access"
                  className="auth-tabs mb-5 grid grid-cols-2 rounded-xl border border-gdgoc-gray-200 bg-gdgoc-gray-50 p-1"
                >
                  <button
                    type="button"
                    aria-current={!isSignUp ? 'page' : undefined}
                    onClick={() => setIsSignUp(false)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${!isSignUp ? 'bg-white text-gdgoc-blue shadow-sm' : 'text-gdgoc-gray-700'}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    aria-current={isSignUp ? 'page' : undefined}
                    onClick={() => setIsSignUp(true)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${isSignUp ? 'bg-white text-gdgoc-blue shadow-sm' : 'text-gdgoc-gray-700'}`}
                  >
                    Sign up
                  </button>
                </nav>
                {isLoading && (
                  <p role="status" className="mb-4 text-sm text-gdgoc-gray-700">
                    Checking your session. You can sign in while the server connects.
                  </p>
                )}
                {sessionError && (
                  <div role="alert" className="mb-4 text-sm text-gdgoc-gray-700">
                    <p>Session check unavailable. Please retry or sign in.</p>
                    <button type="button" onClick={() => void retrySession()} className="underline">
                      Retry session check
                    </button>
                  </div>
                )}
                {isSignUp ? <SignUpForm onLogIn={() => setIsSignUp(false)} /> : <LoginForm />}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="auth-footer">
        <span>Google Developer Groups on Campus · PSIT Kanpur</span>
        <span>TaskHub Workspace</span>
      </footer>
    </div>
  );
};
