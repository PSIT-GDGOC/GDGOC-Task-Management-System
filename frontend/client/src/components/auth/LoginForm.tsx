import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { DevAccount } from '../../auth/mockAuthService';
import { DevAccountSelector } from './DevAccountSelector';
import { MembershipStatus } from '../../types/auth';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, Info, CheckCircle2 } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  // Email format validation
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

  // Password validation
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

  // Membership validation
  const validateMembership = (val: MembershipStatus | null): boolean => {
    if (!val) {
      setMembershipError('Please select whether you are a core member or regular member.');
      return false;
    }
    setMembershipError(null);
    return true;
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

  const handleSelectMembership = (status: MembershipStatus) => {
    setMembershipStatus(status);
    setMembershipError(null);
    if (formError) setFormError(null);
  };

  const handleSelectDevAccount = (account: DevAccount) => {
    setEmail(account.user.email);
    setPassword(account.password);
    setMembershipStatus(account.user.membershipStatus || 'CORE_MEMBER');
    setEmailError(null);
    setPasswordError(null);
    setMembershipError(null);
    setFormError(null);
    setForgotPasswordNotice(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setForgotPasswordNotice(false);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isMembershipValid = validateMembership(membershipStatus);

    if (!isEmailValid || !isPasswordValid || !isMembershipValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login({
        email: email.trim(),
        password,
        membershipStatus: membershipStatus!,
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
    <div className="w-full max-w-[420px] mx-auto">
      {/* Form Header with Google 4-Color Brackets Emblem */}
      <div className="mb-6 text-left flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200/80 p-2 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
            <path d="M12 20L19 13L16 10L6 20L16 30L19 27L12 20Z" fill="#EA4335" />
            <path d="M28 20L21 27L24 30L34 20L24 10L21 13L28 20Z" fill="#4285F4" />
            <circle cx="20" cy="9" r="2.5" fill="#34A853" />
            <circle cx="20" cy="31" r="2.5" fill="#FBBC04" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gdgoc-gray-900 tracking-tight leading-tight">
            Welcome to TaskHub
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gdgoc-gray-500">
            Sign in with your GitHub-linked account
          </p>
        </div>
      </div>

      {/* Global Form Error Message */}
      {formError && (
        <div 
          role="alert" 
          className="mb-5 p-3 rounded-xl bg-red-50/90 border border-red-200 text-sm text-red-800 flex items-start gap-2.5 transition-all shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-gdgoc-red flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium text-xs leading-relaxed">{formError}</div>
        </div>
      )}

      {/* Forgot Password Informational Banner */}
      {forgotPasswordNotice && (
        <div 
          role="status" 
          className="mb-5 p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-sm text-blue-900 flex items-start gap-2.5 transition-all shadow-2xs"
        >
          <Info className="w-4 h-4 text-gdgoc-blue flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed">
            Password recovery for GDGoC PSIT is currently managed by workspace leads. Please contact your Chapter Administrator for credentials reset.
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
        {/* Email Field */}
        <div>
          <label 
            htmlFor="email-input" 
            className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1.5"
          >
            GitHub-linked Gmail
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
              aria-describedby={emailError ? 'email-error-text' : 'email-helper-text'}
              className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white border rounded-xl transition-all placeholder:text-gdgoc-gray-400 focus:outline-none focus:ring-4 ${
                emailError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100/70'
                  : 'border-gray-200 hover:border-gray-300 focus:border-[#4285F4] focus:ring-blue-100/70'
              }`}
            />
          </div>
          <p id="email-helper-text" className="mt-1 text-[11px] text-gdgoc-gray-500">
            Use the Gmail address associated with your GitHub account.
          </p>
          {emailError && (
            <p id="email-error-text" role="alert" className="mt-1 text-xs text-gdgoc-red flex items-center gap-1">
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
            <p id="password-error-text" role="alert" className="mt-1 text-xs text-gdgoc-red flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {passwordError}
            </p>
          )}
        </div>

        {/* Membership Question (Required) */}
        <div className="pt-1">
          <label 
            id="membership-question-label"
            className="block text-xs font-semibold text-gdgoc-gray-800 mb-2"
          >
            Are you a GDGoC PSIT core member? <span className="text-gdgoc-red">*</span>
          </label>
          <div 
            role="radiogroup" 
            aria-labelledby="membership-question-label"
            aria-required="true"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            {/* Option 1: Yes, I'm a core member */}
            <button
              type="button"
              role="radio"
              aria-checked={membershipStatus === 'CORE_MEMBER'}
              onClick={() => handleSelectMembership('CORE_MEMBER')}
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-gdgoc-blue ${
                membershipStatus === 'CORE_MEMBER'
                  ? 'border-gdgoc-blue bg-blue-50/60 text-gdgoc-gray-900 ring-1 ring-gdgoc-blue shadow-2xs'
                  : 'border-gdgoc-gray-200 bg-white text-gdgoc-gray-700 hover:border-gdgoc-gray-300 hover:bg-gdgoc-gray-50/80'
              }`}
            >
              <span>Yes, I'm a core member</span>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ml-1.5 ${
                membershipStatus === 'CORE_MEMBER'
                  ? 'bg-gdgoc-blue border-gdgoc-blue text-white'
                  : 'border-gdgoc-gray-300 bg-white'
              }`}>
                {membershipStatus === 'CORE_MEMBER' && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
              </span>
            </button>

            {/* Option 2: No, I'm a regular member */}
            <button
              type="button"
              role="radio"
              aria-checked={membershipStatus === 'REGULAR_MEMBER'}
              onClick={() => handleSelectMembership('REGULAR_MEMBER')}
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-gdgoc-blue ${
                membershipStatus === 'REGULAR_MEMBER'
                  ? 'border-gdgoc-blue bg-blue-50/60 text-gdgoc-gray-900 ring-1 ring-gdgoc-blue shadow-2xs'
                  : 'border-gdgoc-gray-200 bg-white text-gdgoc-gray-700 hover:border-gdgoc-gray-300 hover:bg-gdgoc-gray-50/80'
              }`}
            >
              <span>No, I'm a regular member</span>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ml-1.5 ${
                membershipStatus === 'REGULAR_MEMBER'
                  ? 'bg-gdgoc-blue border-gdgoc-blue text-white'
                  : 'border-gdgoc-gray-300 bg-white'
              }`}>
                {membershipStatus === 'REGULAR_MEMBER' && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
              </span>
            </button>
          </div>
          {membershipError && (
            <p role="alert" className="mt-1.5 text-xs text-gdgoc-red flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {membershipError}
            </p>
          )}
        </div>

        {/* Primary Continue Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[#1A73E8] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-xs hover:shadow focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Continuing...</span>
            </>
          ) : (
            <span>Continue →</span>
          )}
        </button>
      </form>

      {/* Discreet Development Testing Adapter in DEV mode */}
      <DevAccountSelector 
        onSelectAccount={handleSelectDevAccount} 
        selectedEmail={email} 
      />

      {/* Clean Brand Footnote */}
      <div className="mt-8 pt-4 border-t border-gdgoc-gray-100 text-center text-xs text-gdgoc-gray-400">
        <span>GDGoC PSIT Kanpur</span>
        <span className="mx-2 text-gdgoc-gray-300">•</span>
        <span className="font-medium text-gdgoc-gray-500">TaskHub</span>
      </div>
    </div>
  );
};
