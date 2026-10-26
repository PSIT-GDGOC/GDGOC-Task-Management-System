import { localPreferences, sessionPreferences } from '../../utils/storage';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/authContext';
import { UserCheck, Sparkles, AlertCircle, X } from 'lucide-react';

export const FullNameModal: React.FC = () => {
  const { user, isAuthenticated, updateUserName } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsOpen(false);
      return;
    }

    const confirmedKey = `gdgoc_name_confirmed_${user.id}`;
    const dismissedKey = `gdgoc_name_prompt_dismissed_${user.id}`;

    const isConfirmed = localPreferences.getItem(confirmedKey) === 'true';
    const isDismissed = sessionPreferences.getItem(dismissedKey) === 'true';

    const legacyHandle = user.name.toLowerCase() === user.email.split('@')[0].toLowerCase() && /[\d._-]/.test(user.name);
    if ((isConfirmed || isDismissed) && !legacyHandle) {
      setIsOpen(false);
      return;
    }

    const emailPrefix = user.email ? user.email.split('@')[0].toLowerCase() : '';
    const currentName = (user.name || '').trim();
    const currentNameLower = currentName.toLowerCase();

    // Check if name is missing, equals email prefix, or looks like raw email username (e.g. adityarajput.86046)
    const isPrefixOrHandle =
      !currentName ||
      currentNameLower === emailPrefix ||
      currentName.includes('@') ||
      (/\d/.test(currentName) && currentNameLower === emailPrefix);

    if (isPrefixOrHandle) {
      // Suggest clean candidate from prefix if possible
      const candidate = emailPrefix
        .replace(/[0-9]/g, '')
        .split(/[._-]/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');

      setName(candidate.length >= 2 ? candidate : currentName);
      setIsOpen(true);
    }
  }, [isAuthenticated, user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Please enter your full name.');
      return;
    }

    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (trimmed.toLowerCase() === user.email.split('@')[0].toLowerCase()) {
      setError('Please enter your real full name instead of your email handle.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateUserName(trimmed);
      localPreferences.setItem(`gdgoc_name_confirmed_${user.id}`, 'true');
      setIsOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save full name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    sessionPreferences.setItem(`gdgoc_name_prompt_dismissed_${user.id}`, 'true');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fullname-modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gdgoc-gray-200 relative animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gdgoc-gray-400 hover:text-gdgoc-gray-600 p-1 rounded-lg hover:bg-gdgoc-gray-100 transition-colors"
          title="Dismiss for now"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-gdgoc-blue">
            <Sparkles className="w-5 h-5 text-gdgoc-blue" />
          </div>
          <div>
            <h3 id="fullname-modal-title" className="text-lg font-bold text-gdgoc-gray-900">
              Welcome to GDGOC PSIT! 🎓
            </h3>
            <p className="text-xs text-gdgoc-gray-600">Complete your member profile</p>
          </div>
        </div>

        <p className="text-sm text-gdgoc-gray-600 mb-4 leading-relaxed">
          Please confirm your real <strong className="text-gdgoc-gray-900 font-semibold">Full Name</strong> so it
          appears accurately on your chapter badge, task assignments, certificates, and team rosters.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-gdgoc-red font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-fullname-input" className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Your Full Name
            </label>
            <div className="relative">
              <input
                id="user-fullname-input"
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Aditya Rajput"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gdgoc-gray-300 text-sm font-medium text-gdgoc-gray-900 focus:outline-none focus:border-gdgoc-blue focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gdgoc-gray-400"
              />
            </div>
            <p className="mt-1 text-[11px] text-gdgoc-gray-600">
              Logged in as: <span className="font-mono text-gdgoc-gray-700">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3.5 py-2 text-xs font-semibold text-gdgoc-gray-600 hover:text-gdgoc-gray-800 hover:bg-gdgoc-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Remind Me Later
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gdgoc-blue hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Confirm Full Name</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
