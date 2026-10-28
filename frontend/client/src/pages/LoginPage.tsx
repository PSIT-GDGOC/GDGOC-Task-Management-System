import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../auth/authContext';
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

      <header className="auth-topbar">
        <div className="auth-topbar-brand" aria-label="GDGoC TaskHub">
          <img src="/gdgoc-siliguri-transparent.png" alt="" />
          <span className="auth-brand-gdgoc" aria-hidden="true">
            <span>G</span><span>D</span><span>G</span><span>o</span><span>C</span>
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

      <main className="auth-main">
        <section className="auth-story" aria-labelledby="auth-story-title">
          <div className="auth-story-brand">
            <img
              className="auth-gdg-logo"
              src="/gdgoc-siliguri-transparent.png"
              alt="GDG logo"
            />
            <div className="auth-brand-wordmark" aria-label="GDGoC TaskHub">
              <span className="auth-brand-gdgoc" aria-hidden="true">
                <span>G</span><span>D</span><span>G</span><span>o</span><span>C</span>
              </span>
              <span className="auth-brand-taskhub">TaskHub</span>
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

        <section className="auth-panel" aria-label={isSignUp ? 'Create your account' : 'Sign in'}>
          <div className="auth-card">
            {isSignUp ? (
              <SignUpForm onLogIn={() => setIsSignUp(false)} />
            ) : (
              <LoginForm />
            )}
          </div>
          {!isSignUp && (
            <div className="auth-switch">
              <span>New to the community?</span>
              <button type="button" onClick={() => setIsSignUp(true)}>
                Create an account
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
