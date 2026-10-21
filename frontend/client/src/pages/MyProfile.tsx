import React, { useState } from 'react';
import { User, Github, Mail, Shield, Check } from 'lucide-react';

interface MyProfileProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    position?: string | null;
    githubUsername?: string | null;
  } | null;
  onUpdateProfile?: (updated: any) => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({ user }) => {
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate updating profile in current session
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your personal club profile, linked GitHub account, and team assignments.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name || 'Club Member'}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                {user?.role || 'USER'}
              </span>
              {user?.position && (
                <span className="text-xs text-gray-500">• {user.position}</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" />
              Google Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || 'member@gdgoc-club.org'}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">Verified via Google authentication</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
              <Github className="w-3.5 h-3.5 mr-1 text-gray-600" />
              GitHub Username
            </label>
            <input
              type="text"
              placeholder="e.g. octocat"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Required for automatic PR author mapping and task verification.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {saved && (
              <span className="text-xs text-emerald-600 font-medium flex items-center">
                <Check className="w-4 h-4 mr-1" /> Profile updated successfully
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
