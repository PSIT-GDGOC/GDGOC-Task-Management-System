import React, { useState } from 'react';
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
  Shield,
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

  // Validation state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try { window.location.assign(await authApi.getGoogleUrl()); }
    catch (err) {
      setFormError(err instanceof Error ? err.message : 'Google sign-in is unavailable.');
      setIsSubmitting(false);
    }
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

      // Auto-derive teamSlug based on selection or lead position
      let teamSlug = selectedTeam;
      if (tier === 'LEAD') {
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
    <div className="w-full max-w-[440px] mx-auto">
      {/* Form Header with Google 4-Color Brackets Emblem */}
      <div className="mb-5 text-left flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200/80 p-2 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
            <path d="M12 20L19 13L16 10L6 20L16 30L19 27L12 20Z" fill="#EA4335" />
            <path d="M28 20L21 27L24 30L34 20L24 10L21 13L28 20Z" fill="#4285F4" />
            <circle cx="20" cy="9" r="2.5" fill="#34A853" />
            <circle cx="20" cy="31" r="2.5" fill="#FBBC04" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gdgoc-gray-900 tracking-tight leading-snug">
            Welcome to TaskHub
          </h2>
          <p className="text-xs text-gdgoc-gray-500 mt-0.5">
            GDG on Campus PSIT • Chapter Task Operations
          </p>
        </div>
      </div>

      {/* Forgot Password Notice */}
      {forgotPasswordNotice && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 bg-blue-50/90 text-xs text-blue-900 shadow-2xs"
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
          className="mb-4 flex items-start gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-gdgoc-red shadow-2xs animate-shake"
        >
          <AlertCircle className="w-4 h-4 text-gdgoc-red flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{formError}</div>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-3.5 text-left">
        {/* Tier Hierarchy Selection */}
        <div>
          <label className="block text-xs font-semibold text-gdgoc-gray-800 mb-1.5 uppercase tracking-wider">
            Joining As <span className="text-gdgoc-red">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Tier 1: Crew */}
            <button
              type="button"
              onClick={() => {
                selectTier('CREW');
              }}
              className={`px-2.5 py-2 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 ${
                tier === 'CREW'
                  ? 'border-gdgoc-green bg-green-50/70 text-green-900 ring-2 ring-green-500/30 font-semibold'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users
                className={`w-4 h-4 ${tier === 'CREW' ? 'text-gdgoc-green' : 'text-gray-400'}`}
              />
              <span className="text-xs">Team Crew</span>
            </button>

            {/* Tier 2: Lead */}
            <button
              type="button"
              onClick={() => {
                selectTier('LEAD');
              }}
              className={`px-2.5 py-2 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 ${
                tier === 'LEAD'
                  ? 'border-gdgoc-blue bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/30 font-semibold'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield
                className={`w-4 h-4 ${tier === 'LEAD' ? 'text-gdgoc-blue' : 'text-gray-400'}`}
              />
              <span className="text-xs">Team Lead</span>
            </button>

            {/* Tier 3: President */}
            <button
              type="button"
              onClick={() => {
                selectTier('PRESIDENT');
                setEmail('adityarajput.86046@gmail.com');
              }}
              className={`px-2.5 py-2 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 ${
                tier === 'PRESIDENT'
                  ? 'border-amber-400 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/30 font-semibold'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Crown
                className={`w-4 h-4 ${tier === 'PRESIDENT' ? 'text-amber-600' : 'text-gray-400'}`}
              />
              <span className="text-xs">President</span>
            </button>
          </div>
        </div>

        {/* Dynamic Context Fields */}
        {tier === 'CREW' && (
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="team-crew-select"
                className="text-xs font-semibold text-gdgoc-gray-700"
              >
                Select Your Team
              </label>
              <span className="text-[10px] text-gdgoc-gray-500">View & work on assigned tasks</span>
            </div>
            <select
              id="team-crew-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gdgoc-gray-900 focus:outline-none focus:ring-2 focus:ring-gdgoc-blue"
            >
              <option value="tech">💻 Tech Team (Web, Cloud, AI)</option>
              <option value="media">🎨 Media Team (Design, Video, Branding)</option>
              <option value="content">📝 Content Team (Writing, PR, Documentation)</option>
            </select>
          </div>
        )}

        {tier === 'LEAD' && (
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
            <div>
              <label
                htmlFor="lead-position-select"
                className="block text-xs font-semibold text-gdgoc-gray-800 mb-1"
              >
                Leadership Position
              </label>
              <select
                id="lead-position-select"
                value={leadPosition}
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

            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/90 text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-gdgoc-blue flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold text-blue-950">Verified Leadership Access:</span>{' '}
                Leads and Officers who signed up with their President Key log in directly with their registered email & password.
              </div>
            </div>
          </div>
        )}

        {tier === 'PRESIDENT' && (
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-700" />
              <span>Executive Root of Trust</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Authorized President emails have root executive access, can generate lead keys, and
              manage chapter deliverables.
            </p>
          </div>
        )}

        {/* Email Address Field */}
        <div>
          <label
            htmlFor="email-input"
            className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gdgoc-gray-400">
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
              className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white border rounded-xl transition-all placeholder:text-gdgoc-gray-400 focus:outline-none focus:ring-4 ${
                emailError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100/70'
                  : 'border-gray-200 hover:border-gray-300 focus:border-[#4285F4] focus:ring-blue-100/70'
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
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password-input"
              className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setForgotPasswordNotice(true)}
              className="text-xs font-medium text-gdgoc-blue hover:text-blue-700 transition-colors focus:outline-none focus:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gdgoc-gray-400">
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
              className={`w-full pl-9 pr-10 py-2.5 text-sm bg-white border rounded-xl transition-all placeholder:text-gdgoc-gray-400 focus:outline-none focus:ring-4 ${
                passwordError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100/70'
                  : 'border-gray-200 hover:border-gray-300 focus:border-[#4285F4] focus:ring-blue-100/70'
              }`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gdgoc-gray-400 hover:text-gdgoc-gray-600 transition-colors focus:outline-none"
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
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1A73E8] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-xs hover:shadow focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      <button type="button" disabled={isSubmitting} onClick={handleGoogleSignIn}
        className="mt-4 w-full rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold disabled:opacity-70">
        Continue with Google
      </button>

      {/* Clean Brand Footnote */}
      <div className="mt-6 pt-3 border-t border-gdgoc-gray-100 text-center text-xs text-gdgoc-gray-400">
        <span>GDGoC PSIT Kanpur</span>
        <span className="mx-2 text-gdgoc-gray-300">•</span>
        <span className="font-medium text-gdgoc-gray-500">TaskHub</span>
      </div>
    </div>
  );
};
