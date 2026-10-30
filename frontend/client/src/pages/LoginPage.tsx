import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../auth/authContext';
import { useTheme } from '../theme/ThemeProvider';
import { Logo } from '../components/common/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { LoginAtmosphere } from '../components/auth/LoginAtmosphere';
import './login-page.css';

const LOGIN_QUOTES = [
  'Ideas grow when we build together.',
  'Learn boldly. Make something real.',
  'Small steps can spark big ideas.',
];

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, sessionError, retrySession } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
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

  // Rotate community quotes
  useEffect(() => {
    const quoteTimer = window.setInterval(() => {
      setQuoteIndex((currentIndex) => (currentIndex + 1) % LOGIN_QUOTES.length);
    }, 4800);

    return () => window.clearInterval(quoteTimer);
  }, []);

  return (
    <div className={`auth-shell theme-${theme}`} data-theme={theme}>
      <LoginAtmosphere theme={theme} />

      <header className="auth-topbar">
        <div className="auth-topbar-brand" aria-label="GDGoC TaskHub">
          <Logo size="md" showSubtitle={false} />
          <div className="auth-chapter-pill hidden sm:inline-flex">
            <span className="auth-status-dot" />
            <span>PSIT Chapter</span>
          </div>
        </div>
        <button
          type="button"
          className="auth-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </header>

      <main className="auth-main">
        <section className="auth-story" aria-labelledby="auth-story-title">
          <div className="auth-story-brand">
            <Logo size="lg" showSubtitle={true} />
          </div>
          <p className="auth-quote" key={quoteIndex} aria-live="polite">
            “{LOGIN_QUOTES[quoteIndex]}”
          </p>
          <h1 id="auth-story-title">
            <span className="auth-story-primary">Same people.</span>
            <br />
            <span className="auth-story-accent">Bigger ideas.</span>
          </h1>
          <p>
            At GDGoC, developers, creators and changemakers build what matters together.
          </p>
          <div className="auth-story-foot">
            <span className="auth-story-rule" />
            <span>Learn · Build · Grow</span>
          </div>
        </section>

        <section className="auth-panel" aria-label={isSignUp ? 'Create your account' : 'Sign in'}>
          <div className="auth-card">
            <nav
              aria-label="Account access"
              className="auth-tabs mb-5 grid grid-cols-2 rounded-xl border border-gdgoc-gray-200 dark:border-white/10 bg-gdgoc-gray-50 dark:bg-white/5 p-1"
            >
              <button
                type="button"
                aria-current={!isSignUp ? 'page' : undefined}
                onClick={() => setIsSignUp(false)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  !isSignUp
                    ? 'bg-white dark:bg-white/15 text-gdgoc-blue shadow-sm'
                    : 'text-gdgoc-gray-600 dark:text-gray-400 hover:text-gdgoc-gray-900'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-current={isSignUp ? 'page' : undefined}
                onClick={() => setIsSignUp(true)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  isSignUp
                    ? 'bg-white dark:bg-white/15 text-gdgoc-blue shadow-sm'
                    : 'text-gdgoc-gray-600 dark:text-gray-400 hover:text-gdgoc-gray-900'
                }`}
              >
                Sign up
              </button>
            </nav>

            {isLoading && (
              <p role="status" className="mb-4 text-sm text-gdgoc-gray-700 dark:text-gray-300">
                Checking your session. You can sign in while the server connects.
              </p>
            )}
            {sessionError && (
              <div role="alert" className="mb-4 text-sm text-gdgoc-gray-700 dark:text-gray-300">
                <p>Session check unavailable. Please retry or sign in.</p>
                <button type="button" onClick={() => void retrySession()} className="underline text-gdgoc-blue">
                  Retry session check
                </button>
              </div>
            )}

            {isSignUp ? (
              <SignUpForm onLogIn={() => setIsSignUp(false)} />
            ) : (
              <LoginForm />
            )}
          </div>

          {!isSignUp ? (
            <div className="auth-switch">
              <span>New to the community?</span>
              <button type="button" onClick={() => setIsSignUp(true)}>
                Create an account
              </button>
            </div>
          ) : (
            <div className="auth-switch">
              <span>Already have an account?</span>
              <button type="button" onClick={() => setIsSignUp(false)}>
                Sign in
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="auth-footer">
        <span>Google Developer Groups on Campus · PSIT Kanpur</span>
        <span>TaskHub Workspace</span>
      </footer>
    </div>
  );
};
