import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { authApi } from '../../services/api';
import { MembershipStatus } from '../../types/auth';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Info,
  ShieldCheck,
  Crown,
  Users,
} from 'lucide-react';

type ClubTier = 'CREW' | 'LEAD' | 'PRESIDENT';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState<ClubTier>('CREW');
  const [selectedTeam, setSelectedTeam] = useState('tech');
  const [leadPosition, setLeadPosition] = useState('Tech Lead');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Validation state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  // Parse error passed back from OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      setFormError(oauthError);
    }
  }, [location.search]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFormError(null);
    try {
      const res = await authApi.getGoogleAuthUrl('member');
      if (res.configured && res.url) {
        window.location.href = res.url;
      } else {
        setFormError(
          res.message ||
            'Google OAuth 2.0 credentials are not yet configured on this server. Please sign in with your email or test accounts below.',
        );
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Google sign-in is unavailable. Please retry.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError('Please enter a valid Gmail address (e.g., you@gmail.com)');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Password is required');
      return false;
    }
    if (val.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const selectTier = (next: ClubTier) => {
    if (next === tier) return;
    setTier(next);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setForgotPasswordNotice(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
    if (formError) setFormError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setForgotPasswordNotice(false);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const isTeamHead = tier === 'LEAD' && leadPosition.toLowerCase().includes('lead');
      const membershipStatus: MembershipStatus =
        tier === 'CREW' ? 'REGULAR_MEMBER' : 'CORE_MEMBER';
      const position =
        tier === 'PRESIDENT' ? 'President' : tier === 'LEAD' ? leadPosition : 'Team Member';

      // Super admins, President, and Executive Officers govern club-wide and are never assigned to a squad
      let teamSlug: string | undefined = undefined;
      if (tier === 'CREW') {
        teamSlug = selectedTeam;
      } else if (tier === 'LEAD') {
        if (leadPosition.toLowerCase().includes('media')) teamSlug = 'media';
        else if (leadPosition.toLowerCase().includes('content')) teamSlug = 'content';
        else if (leadPosition.toLowerCase().includes('tech')) teamSlug = 'tech';
      }

      const user = await login({
        email: email.trim(),
        password,
        membershipStatus,
        position,
        teamSlug,
        isTeamHead,
        isSignUp: false,
      });

      // Role-based routing redirect
      const stateFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (stateFrom && !stateFrom.includes('/login')) {
        navigate(stateFrom, { replace: true });
        return;
      }

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
        default:
          navigate('/unauthorized', { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-form-content w-full max-w-[450px] mx-auto">
      {/* Form Header */}
      <div className="mb-6 text-left flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 p-2 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-[-0.02em] leading-tight">
            Welcome Back
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Sign in to continue to GDGOC.
          </p>
        </div>
      </div>

      {/* Forgot Password Notice */}
      {forgotPasswordNotice && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl border border-blue-200 bg-blue-50/90 text-xs text-blue-900 shadow-2xs"
        >
          <Info className="w-4 h-4 text-gdgoc-blue flex-shrink-0 mt-0.5" />
          <div>
            Use the password you chose during sign up, or continue with Google.
            If you cannot access your account, contact your chapter administrator.

          </div>
        </div>
      )}

      {/* Form-level Error Alert */}
      {formError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl border border-red-200 bg-red-50 text-xs text-gdgoc-red shadow-2xs animate-shake"
        >
          <AlertCircle className="w-4 h-4 text-gdgoc-red flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{formError}</div>
        </div>
      )}

      {/* Primary Google OAuth 2.0 Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isSubmitting}
        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60 disabled:cursor-not-allowed group"
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            <span className="text-gray-600">Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="group-hover:text-gray-900">Continue with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#FAFAFC] px-2 text-gray-400 font-medium uppercase tracking-wider">
            or sign in with password
          </span>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-3.5 text-left">
        {/* Tier Hierarchy Selection */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono mb-2">
            Joining As <span className="text-gdgoc-red">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Tier 1: Crew */}
            <button
              type="button"
              onClick={() => {
                selectTier('CREW');
              }}
              className={`px-3 py-3 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                tier === 'CREW'
                  ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-xs ring-4 ring-emerald-500/10 font-bold'
                  : 'border-stone-200/80 bg-stone-50/50 hover:bg-white hover:border-stone-300 text-stone-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-xs tracking-tight">Team Crew</span>
            </button>

            {/* Tier 2: Lead */}
            <button
              type="button"
              onClick={() => {
                selectTier('LEAD');
              }}
              className={`px-3 py-3 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                tier === 'LEAD'
                  ? 'border-blue-500 bg-blue-50/80 text-blue-950 shadow-xs ring-4 ring-blue-500/10 font-bold'
                  : 'border-stone-200/80 bg-stone-50/50 hover:bg-white hover:border-stone-300 text-stone-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs tracking-tight">Team Lead</span>
            </button>

            {/* Tier 3: President */}
            <button
              type="button"
              onClick={() => {
                selectTier('PRESIDENT');
                setEmail('paneertikkadedo@gmail.com');
              }}
              className={`px-3 py-3 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                tier === 'PRESIDENT'
                  ? 'border-amber-400 bg-amber-50/80 text-amber-950 shadow-xs ring-4 ring-amber-500/10 font-bold'
                  : 'border-stone-200/80 bg-stone-50/50 hover:bg-white hover:border-stone-300 text-stone-600'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span className="text-xs tracking-tight">President</span>
            </button>
          </div>
        </div>

        {/* Dynamic Context Fields */}
        {tier === 'CREW' && (
          <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="team-crew-select"
                className="text-xs font-bold text-stone-700"
              >
                Select Your Team
              </label>
              <span className="text-[10px] text-stone-500 font-medium">View & work on assigned tasks</span>
            </div>
            <select
              id="team-crew-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-stone-200 rounded-xl text-stone-900 shadow-2xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer auth-team-select"
            >
              <option value="tech">💻 Tech Team (Web, Cloud, AI)</option>
              <option value="media">🎨 Media Team (Design, Video, Branding)</option>
              <option value="content">📝 Content Team (Writing, PR, Documentation)</option>
            </select>
          </div>
        )}

        {tier === 'LEAD' && (
          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-2.5">
            <div>
              <label
                htmlFor="lead-position-select"
                className="block text-xs font-bold text-blue-950 mb-1"
              >
                Leadership Position
              </label>
              <select
                id="lead-position-select"
                value={leadPosition}
                onChange={(e) => setLeadPosition(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-blue-200 rounded-xl text-stone-900 shadow-2xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                onChange={(e) => { setLeadPosition(e.target.value); setEmail(''); setPassword(''); setFormError(null); }}
                className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg text-gdgoc-gray-900 focus:outline-none focus:ring-2 focus:ring-gdgoc-blue"
              >
                <option value="Tech Lead">💻 Tech Lead (Creates & Assigns Tech Tasks)</option>
                <option value="Media Lead">🎨 Media Lead (Oversees Design & Media)</option>
                <option value="Content Lead">📝 Content Lead (Oversees PR & Writing)</option>
                <option value="Secretary">📋 Secretary (Documentation & Records)</option>
                <option value="Organizer">🎯 Organizer (Events & Logistics)</option>
                <option value="Vice President">🛡️ Vice President (Executive Co-Lead)</option>
              </select>
            </div>

            <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200/90 text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-gdgoc-blue flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold text-blue-950">Verified Leadership Access:</span>{' '}
                Leads and Officers log in directly with their registered email & password.
              </div>
            </div>
          </div>
        )}

        {tier === 'PRESIDENT' && (
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/90 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-700" />
              <span>Executive Root of Trust</span>
            </div>
            <p className="text-[11px] text-amber-900/90 leading-relaxed font-normal">
              Authorized President accounts have full root access to manage chapter deliverables, invite leads, and review contributions.
            </p>
          </div>
        )}

        {/* Email Address Field */}
        <div>
          <label
            htmlFor="email-input"
            className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => validateEmail(email)}
              placeholder="you@gmail.com"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error-text' : undefined}
              className={`w-full pl-10 pr-3.5 py-3 text-sm bg-stone-50/60 hover:bg-stone-50 focus:bg-white border rounded-xl transition-all placeholder:text-stone-400 focus:outline-none focus:ring-4 shadow-2xs ${
                emailError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100/70'
                  : 'border-stone-200 hover:border-stone-300 focus:border-[#4285F4] focus:ring-blue-100/70'
              }`}
            />
          </div>
          {emailError && (
            <p
              id="email-error-text"
              role="alert"
              className="mt-1 text-xs text-gdgoc-red flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {emailError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password-input"
              className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setForgotPasswordNotice(true)}
              className="text-xs font-semibold text-gdgoc-blue hover:text-blue-700 transition-colors focus:outline-none focus:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => validatePassword(password)}
              placeholder="Enter your password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error-text' : undefined}
              className={`w-full pl-10 pr-11 py-3 text-sm bg-stone-50/60 hover:bg-stone-50 focus:bg-white border rounded-xl transition-all placeholder:text-stone-400 focus:outline-none focus:ring-4 shadow-2xs ${
                passwordError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100/70'
                  : 'border-stone-200 hover:border-stone-300 focus:border-[#4285F4] focus:ring-blue-100/70'
              }`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordError && (
            <p
              id="password-error-text"
              role="alert"
              className="mt-1 text-xs text-gdgoc-red flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {passwordError}
            </p>
          )}
        </div>

        {/* Primary Continue Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="login-submit w-full mt-3 py-3 px-5 rounded-xl bg-gradient-to-r from-[#1A73E8] to-[#1557B0] hover:from-[#1557B0] hover:to-[#0D47A1] text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>
              Sign In as {tier === 'PRESIDENT' ? 'President' : tier === 'LEAD' ? leadPosition : 'Member'} →
            </span>
          )}
        </button>
      </form>

      {/* Clean Brand Footnote */}
      <div className="mt-6 pt-3 border-t border-stone-100 text-center text-xs text-stone-400 font-medium">
        <span>GDGoC PSIT Kanpur</span>
        <span className="mx-2 text-stone-300">•</span>
        <span className="font-semibold text-stone-500">TaskHub</span>
      </div>
    </div>
  );
};
