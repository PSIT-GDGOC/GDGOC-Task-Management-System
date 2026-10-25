import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { Eye, EyeOff, AlertCircle, Loader2, Key } from 'lucide-react';

type SignUpFormProps = {
  onLogIn: () => void;
};

type SignUpFields = {
  name: string;
  email: string;
  githubUsername: string;
  password: string;
  team: string;
  position: string;
  invitationKey: string;
};

type SignUpField = keyof SignUpFields;

const initialFields: SignUpFields = {
  name: '',
  email: '',
  githubUsername: '',
  password: '',
  team: 'TECH',
  position: 'Member',
  invitationKey: '',
};

export const SignUpForm: React.FC<SignUpFormProps> = ({ onLogIn }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<Partial<Record<SignUpField, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = (field: SignUpField, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: Partial<Record<SignUpField, string>> = {};

    if (!fields.name.trim()) nextErrors.name = 'Name is required.';
    if (!fields.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (fields.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    if (fields.position !== 'Member' && !fields.invitationKey.trim()) {
      nextErrors.invitationKey = 'President Key is required for Leads & Officers.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const isLead = fields.position !== 'Member';
      const user = await login({
        name: fields.name.trim(),
        email: fields.email.trim(),
        password: fields.password,
        position: fields.position === 'Member' ? 'Team Member' : fields.position,
        team: fields.team,
        teamSlug: fields.team.toLowerCase(),
        isTeamHead: isLead && fields.position.toLowerCase().includes('lead'),
        membershipStatus: isLead ? 'CORE_MEMBER' : 'REGULAR_MEMBER',
        invitationKey: isLead ? fields.invitationKey.trim() : undefined,
        isSignUp: true,
      });

      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'TEAM_LEADER') {
        navigate('/leader/overview', { replace: true });
      } else {
        navigate('/member', { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to register. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (field: SignUpField) =>
    `w-full rounded-xl border bg-white px-3 py-2 text-xs text-gdgoc-gray-900 placeholder:text-gdgoc-gray-400 transition-all focus:outline-none focus:ring-4 ${
      errors[field]
        ? 'border-red-300 focus:border-red-500 focus:ring-red-100/70'
        : 'border-gray-200 hover:border-gray-300 focus:border-[#4285F4] focus:ring-blue-100/70'
    }`;

  const renderError = (field: SignUpField) =>
    errors[field] ? (
      <p id={`${field}-error`} role="alert" className="mt-1 text-xs text-gdgoc-red">
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="mb-4 text-left">
        <h2 className="text-xl font-bold text-gdgoc-gray-900 tracking-tight leading-tight">
          Create Your Account
        </h2>
        <p className="text-xs text-gdgoc-gray-500 mt-0.5">
          Join GDGoC PSIT TaskHub to work on your assigned deliverables
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-gdgoc-red shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-gdgoc-red flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{submitError}</div>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-3 text-left">
        <div>
          <label
            htmlFor="signup-name"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700"
          >
            Full Name *
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            value={fields.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="e.g. Aman Verma"
            className={fieldClass('name')}
          />
          {renderError('name')}
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700"
          >
            Email Address *
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={fields.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="you@gmail.com"
            className={fieldClass('email')}
          />
          {renderError('email')}
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700"
          >
            Password *
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={fields.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Min 6 characters"
              className={`${fieldClass('password')} pr-9`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gdgoc-gray-400 hover:text-gdgoc-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {renderError('password')}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="signup-team"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700"
            >
              Team *
            </label>
            <select
              id="signup-team"
              required
              value={fields.team}
              onChange={(event) => updateField('team', event.target.value)}
              className={fieldClass('team')}
            >
              <option value="TECH">💻 Tech Team</option>
              <option value="MEDIA">🎨 Media Team</option>
              <option value="CONTENT">📝 Content Team</option>
            </select>
            {renderError('team')}
          </div>

          <div>
            <label
              htmlFor="signup-role"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700"
            >
              Position *
            </label>
            <select
              id="signup-role"
              value={fields.position}
              onChange={(event) => updateField('position', event.target.value)}
              className={fieldClass('position')}
            >
              <option value="Member">👤 Team Member</option>
              <option value="Tech Lead">💻 Tech Lead</option>
              <option value="Media Lead">🎨 Media Lead</option>
              <option value="Content Lead">📝 Content Lead</option>
              <option value="Secretary">📋 Secretary</option>
              <option value="Organizer">🎯 Organizer</option>
              <option value="Vice President">🛡️ Vice President</option>
            </select>
          </div>
        </div>

        {fields.position !== 'Member' && (
          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
            <label
              htmlFor="signup-key"
              className="text-xs font-semibold text-gdgoc-blue flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5" />
              <span>President Invitation Key *</span>
            </label>
            <input
              id="signup-key"
              type="text"
              value={fields.invitationKey}
              onChange={(event) => updateField('invitationKey', event.target.value)}
              placeholder={`Enter President Key for ${fields.position}`}
              className={fieldClass('invitationKey')}
            />
            {renderError('invitationKey')}
            <p className="text-[10px] text-gdgoc-gray-500">
              Enter the constant key provided by the President for {fields.position}.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#1A73E8] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-70 gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account & Enter TaskHub →</span>
          )}
        </button>
      </form>

      <div className="mt-4 border-t border-gdgoc-gray-100 pt-3 text-center text-xs text-gdgoc-gray-600">
        <span>Already have an account?</span>{' '}
        <button
          type="button"
          onClick={onLogIn}
          className="font-semibold text-gdgoc-blue transition-colors hover:text-blue-700 hover:underline"
        >
          Log In
        </button>
      </div>
    </div>
  );
};
