import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Shield, KeyRound, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState('aditya.lead@example.com');
  const [devRole, setDevRole] = useState('SYSTEM_OWNER');
  const [invitationCode, setInvitationCode] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      const res = await apiClient<{ success: boolean; configured: boolean; url?: string }>(
        '/auth/google/url',
      );
      if (res.configured && res.url) {
        window.location.href = res.url;
      } else {
        setErrorMsg(
          'Google OAuth 2.0 credentials are not yet configured on the server. Use the Dev Role Session below to test locally.',
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

  const handleRedeemInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient<{ success: boolean; message: string; user: any }>(
        '/auth/invitations/redeem',
        {
          method: 'POST',
          body: JSON.stringify({ code: invitationCode }),
        },
      );
      onLoginSuccess(res.user);
      alert(res.message);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to redeem invitation');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Sign in to GDGOC Tasks</h2>
        <p className="text-xs text-gray-500 mt-1">
          Open access to any verified Google account. First system owner is bootstrapped via server configuration.
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400 font-semibold tracking-wider">
            Local Scaffold Dev Tool
          </span>
        </div>
      </div>

      {/* Dev Quick Role Login */}
      <form onSubmit={handleDevLogin} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <p className="text-[11px] font-medium text-slate-600">
          🧪 Test roles instantly in local development:
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
            <option value="USER">USER (Regular Club Member)</option>
            <option value="ADMIN">ADMIN (Core Team Admin)</option>
            <option value="PRESIDENT">PRESIDENT (Club President)</option>
            <option value="SYSTEM_OWNER">SYSTEM_OWNER (System Lead / Aditya)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Initiate Dev Session
        </button>
      </form>

      {/* Invitation Redemption Box */}
      <form onSubmit={handleRedeemInvitation} className="mt-4 pt-4 border-t border-gray-100 space-y-2">
        <label className="flex items-center text-[11px] font-semibold text-gray-700">
          <KeyRound className="w-3.5 h-3.5 mr-1 text-gray-500" />
          Have an Admin Invitation Code?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="inv_..."
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
            className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Redeem
          </button>
        </div>
      </form>
    </div>
  );
};
