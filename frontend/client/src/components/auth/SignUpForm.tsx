import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

type SignUpFormProps = {
  onLogIn: () => void;
};

type SignUpFields = {
  name: string;
  email: string;
  githubUsername: string;
  password: string;
  team: string;
};

type SignUpField = keyof SignUpFields;

const initialFields: SignUpFields = {
  name: '',
  email: '',
  githubUsername: '',
  password: '',
  team: '',
};

export const SignUpForm: React.FC<SignUpFormProps> = ({ onLogIn }) => {
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<Partial<Record<SignUpField, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);

  const updateField = (field: SignUpField, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setValidated(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<SignUpField, string>> = {};

    if (!fields.name.trim()) nextErrors.name = 'Name is required.';
    if (!fields.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!fields.githubUsername.trim()) nextErrors.githubUsername = 'GitHub username is required.';
    if (!fields.password) nextErrors.password = 'Password is required.';
    if (!fields.team) nextErrors.team = 'Please select your team.';

    setErrors(nextErrors);
    setValidated(Object.keys(nextErrors).length === 0);
  };

  const fieldClass = (field: SignUpField) =>
    `w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gdgoc-gray-900 placeholder:text-gdgoc-gray-400 transition-all focus:outline-none focus:ring-4 ${
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
    <div className="w-full max-w-[420px] mx-auto">
      <div className="mb-5 text-left">
        <h2 className="text-2xl font-bold text-gdgoc-gray-900 tracking-tight leading-tight">
          Sign Up
        </h2>
      </div>

      {validated && (
        <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50/90 p-3 text-xs text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gdgoc-green" />
          <span>Form validated successfully. Account registration is not enabled yet.</span>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-3 text-left">
        <div>
          <label htmlFor="signup-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700">Name</label>
          <input id="signup-name" type="text" autoComplete="name" required value={fields.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Enter your full name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} className={fieldClass('name')} />
          {renderError('name')}
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700">Email</label>
          <input id="signup-email" type="email" autoComplete="email" required value={fields.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Enter your email address" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} className={fieldClass('email')} />
          {renderError('email')}
        </div>

        <div>
          <label htmlFor="signup-github" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700">GitHub Username</label>
          <input id="signup-github" type="text" autoComplete="username" required value={fields.githubUsername} onChange={(event) => updateField('githubUsername', event.target.value)} placeholder="Enter your GitHub username" aria-invalid={!!errors.githubUsername} aria-describedby={errors.githubUsername ? 'githubUsername-error' : undefined} className={fieldClass('githubUsername')} />
          {renderError('githubUsername')}
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700">Password</label>
          <div className="relative">
            <input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={fields.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Create a password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} className={`${fieldClass('password')} pr-10`} />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((shown) => !shown)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gdgoc-gray-400 transition-colors hover:text-gdgoc-gray-600">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {renderError('password')}
        </div>

        <div>
          <label htmlFor="signup-team" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-700">Team</label>
          <select id="signup-team" required value={fields.team} onChange={(event) => updateField('team', event.target.value)} aria-invalid={!!errors.team} aria-describedby={errors.team ? 'team-error' : undefined} className={fieldClass('team')}>
            <option value="" disabled>Select Your Team</option>
            <option value="TECH">Tech Team</option>
            <option value="MEDIA">Media Team</option>
            <option value="CONTENT">Content Team</option>
          </select>
          {renderError('team')}
        </div>

        <button type="submit" className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#1A73E8] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
          Sign Up
        </button>
      </form>

      <div className="mt-5 border-t border-gdgoc-gray-100 pt-4 text-center text-xs text-gdgoc-gray-600">
        <span>Already have an account?</span>{' '}
        <button type="button" onClick={onLogIn} className="font-semibold text-gdgoc-blue transition-colors hover:text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gdgoc-blue">
          Log In
        </button>
      </div>
    </div>
  );
};
