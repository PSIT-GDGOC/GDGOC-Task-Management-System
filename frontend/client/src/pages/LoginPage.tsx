import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { Logo } from '../components/common/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { CollaborationVisual } from '../components/auth/CollaborationVisual';
import { TypewriterBranding } from '../components/auth/TypewriterBranding';
import { TypewriterTagline } from '../components/auth/TypewriterTagline';
import { MarqueeStrip } from '../components/auth/MarqueeStrip';

export const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
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

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#FAFAFC] text-gdgoc-gray-900 overflow-x-hidden selection:bg-blue-100 selection:text-gdgoc-blue">
      
      {/* =========================================================================
          BACKGROUND DECORATIVE LAYER (Full-Page Faded Doodle Image + Ambient Glows)
          ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Full-Page Background Doodle Image - Soft, Faded & Subtle */}
        <div 
          className="absolute inset-0 bg-repeat bg-[length:650px_auto] sm:bg-[length:800px_auto] opacity-[0.14] mix-blend-multiply"
          style={{ backgroundImage: 'url(/login-bg.jpg)' }}
        />

        {/* Soft White Overlay for natural blending and high readability */}
        <div className="absolute inset-0 bg-white/40" />

        {/* Soft Ambient Color Glows (Google 4-Colors) */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/35 blur-3xl" />
        <div className="absolute top-12 -right-32 w-80 h-80 rounded-full bg-red-100/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-amber-100/30 blur-3xl" />
        <div className="absolute bottom-12 -right-24 w-96 h-96 rounded-full bg-emerald-100/30 blur-3xl" />
      </div>

      {/* =========================================================================
          TOP NAVIGATION HEADER (Logo with Google Colors, PSIT Chapter Removed)
          ========================================================================= */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between animate-hero-reveal reveal-delay-1">
        <Logo size="sm" showSubtitle={false} />
      </header>

      {/* =========================================================================
          MAIN TWO-COLUMN WORKSPACE (Hero Reveal Staggered)
          ========================================================================= */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-8 py-4 sm:py-8 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          
          {/* -------------------------------------------------------------------
              LEFT COLUMN: BRANDING AND VISUAL IDENTITY
              ------------------------------------------------------------------- */}
          <section className="flex flex-col justify-center text-left space-y-6 sm:space-y-7 max-w-lg mx-auto lg:mx-0 order-2 lg:order-1 animate-hero-reveal reveal-delay-2">
            
            {/* Steady Webapp Name: GDGoC TASKHUB / GDGoC PSIT (Animation Removed) */}
            <div className="pt-1 pb-1">
              <TypewriterBranding className="max-w-[480px] w-full" />
            </div>

            {/* Dynamic Typewriter Tagline: "Plan together. Ship together." */}
            <TypewriterTagline />

            {/* Compact Team Collaboration Visual */}
            <div className="animate-hero-reveal reveal-delay-3">
              <CollaborationVisual />
            </div>

            {/* Black Marquee Strip */}
            <div className="pt-1 pb-1 animate-hero-reveal reveal-delay-4">
              <MarqueeStrip />
            </div>

          </section>

          {/* -------------------------------------------------------------------
              RIGHT COLUMN: LOGIN FORM (Rotating Circular Google Light Beam Border)
              ------------------------------------------------------------------- */}
          <section className="flex flex-col justify-center items-center w-full order-1 lg:order-2 animate-hero-reveal reveal-delay-2">
            <div className="google-border-beam-container w-full max-w-[450px]">
              {/* Soft ambient blur halo */}
              <div className="google-border-beam-ambient" aria-hidden="true" />
              {/* Sharp rotating conic gradient border beam */}
              <div className="google-border-beam-glow" aria-hidden="true" />
              {/* Card surface containing the login form */}
              <div className="google-border-beam-content p-6 sm:p-9 shadow-sm">
                {isSignUp ? (
                  <SignUpForm onLogIn={() => setIsSignUp(false)} />
                ) : (
                  <LoginForm />
                )}
              </div>
            </div>
            {!isSignUp && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gdgoc-gray-700">
                <span>New member here?</span>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="rounded-lg px-2 py-1 font-semibold text-gdgoc-blue transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gdgoc-blue"
                >
                  Sign Up
                </button>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* =========================================================================
          GLOBAL FOOTER
          ========================================================================= */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-5 text-center text-xs text-gdgoc-gray-400">
        <p>© 2026 Google Developer Groups on Campus — Pranveer Singh Institute of Technology. Built for collegiate builders.</p>
      </footer>
    </div>
  );
};
