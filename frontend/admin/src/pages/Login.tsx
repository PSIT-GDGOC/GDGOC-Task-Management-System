import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { ShieldAlert, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState('aditya.lead@example.com');
  const [devRole, setDevRole] = useState('SYSTEM_OWNER');

  const handleGoogleSignIn = async () => {
    try {
      const res = await apiClient<{ success: boolean; configured: boolean; url?: string }>(
        '/auth/google/url',
      );
      if (res.configured && res.url) {
        window.location.href = res.url;
      } else {
        setErrorMsg(
          'Google OAuth 2.0 credentials are not yet configured on the server. Use the Dev Role Session below for local testing.',
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate Google sign in');
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient<{ success: boolean; user: any }>('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({
          email: devEmail,
          name: devEmail.split('@')[0],
          role: devRole,
        }),
      });
      onLoginSuccess(res.user);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Dev login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Admin Console Sign In</h2>
        <p className="text-xs text-gray-500 mt-1">
          Restricted to authorized club administrators, team heads, and system owners.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-start">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Google OAuth Login */}
      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm mb-6"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        Sign in with Google
      </button>

      {/* Local Dev Role Session */}
      <form onSubmit={handleDevLogin} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <p className="text-[11px] font-medium text-slate-600">
          🧪 Local Development Role Tester:
        </p>

        <div>
          <label className="block text-[11px] text-gray-600 font-semibold mb-1">Email</label>
          <input
            type="email"
            value={devEmail}
            onChange={(e) => setDevEmail(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] text-gray-600 font-semibold mb-1">Role</label>
          <select
            value={devRole}
            onChange={(e) => setDevRole(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
          >
            <option value="SYSTEM_OWNER">SYSTEM_OWNER (System Lead / Aditya)</option>
            <option value="PRESIDENT">PRESIDENT (Club President)</option>
            <option value="ADMIN">ADMIN (Core Team Admin / Team Head)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Sign In as Admin
        </button>
      </form>
    </div>
  );
};
