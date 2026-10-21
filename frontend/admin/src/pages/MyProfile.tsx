import React, { useState } from 'react';
import { Mail, Github, ShieldAlert, Check } from 'lucide-react';

interface MyProfileProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    position?: string | null;
    githubUsername?: string | null;
  } | null;
}

export const MyProfile: React.FC<MyProfileProps> = ({ user }) => {
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || 'cryptobitter');
  const [position, setPosition] = useState(user?.position || 'System Lead');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile & Credentials</h1>
        <p className="text-xs text-gray-500 mt-1">
          View your administrative privileges, manage linked GitHub identity, and club position title.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name || 'Administrator'}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <ShieldAlert className="w-3 h-3 mr-1" />
                {user?.role || 'ADMIN'}
              </span>
              <span className="text-xs text-gray-500">• {position}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" />
              Verified Email
            </label>
            <input
              type="email"
              disabled
              value={user?.email || 'admin@gdgoc-club.org'}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Position Title</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
              <Github className="w-3.5 h-3.5 mr-1 text-gray-600" />
              GitHub Username
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            {saved && (
              <span className="text-xs text-emerald-600 font-medium flex items-center">
                <Check className="w-4 h-4 mr-1" /> Profile saved
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
