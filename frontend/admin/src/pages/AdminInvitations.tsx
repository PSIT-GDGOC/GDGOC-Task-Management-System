import React, { useState } from 'react';
import { KeyRound, Plus, Copy, Check, Clock, ShieldAlert } from 'lucide-react';
import { apiClient } from '../services/api';

interface InvitationRecord {
  id: string;
  role: string;
  position: string;
  expiresAt: string;
  used: boolean;
  rawCode?: string;
}

export const AdminInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<InvitationRecord[]>([
    {
      id: 'inv_sample_1',
      role: 'ADMIN',
      position: 'Tech Lead',
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      used: false,
    },
  ]);

  const [positionInput, setPositionInput] = useState('');
  const [roleInput, setRoleInput] = useState('ADMIN');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const res = await apiClient<{ success: boolean; data: any }>('/auth/invitations', {
        method: 'POST',
        body: JSON.stringify({
          role: roleInput,
          position: positionInput || undefined,
          expiresInHours: 48,
        }),
      });

      if (res.data?.rawCode) {
        setGeneratedCode(res.data.rawCode);
        setInvitations((prev) => [
          {
            id: res.data.invitationId,
            role: roleInput,
            position: positionInput || 'Administrator',
            expiresAt: res.data.expiresAt,
            used: false,
            rawCode: res.data.rawCode,
          },
          ...prev,
        ]);
        setPositionInput('');
      }
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Failed to generate invitation. Ensure you are signed in as System Owner or President.',
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Invitation Management</h1>
        <p className="text-xs text-gray-500 mt-1">
          Issue single-use, cryptographically hashed invitation tokens to onboard new club administrators.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Code Generation Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
          <KeyRound className="w-4 h-4 mr-2 text-indigo-600" />
          Generate New Single-Use Invitation Code
        </h2>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Target Role</label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
            >
              <option value="ADMIN">ADMIN (Core Lead)</option>
              <option value="PRESIDENT">PRESIDENT</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Position Title</label>
            <input
              type="text"
              placeholder="e.g. Media Lead"
              value={positionInput}
              onChange={(e) => setPositionInput(e.target.value)}
              className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Generate Token
            </button>
          </div>
        </form>

        {/* Display generated code alert */}
        {generatedCode && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
            <p className="text-xs font-bold text-indigo-900">
              🔑 Single-Use Token Generated (Displaying Once):
            </p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white px-3 py-1.5 rounded border border-indigo-200 text-xs font-mono font-bold text-indigo-800 break-all">
                {generatedCode}
              </code>
              <button
                onClick={() => copyToClipboard(generatedCode)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors flex items-center"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-indigo-600">
              Only a cryptographic SHA-256 hash is retained on the server. Share this code securely with the recipient.
            </p>
          </div>
        )}
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-xs text-gray-800">Recent Admin Invitation Tokens</h3>
          <span className="text-[11px] text-gray-400">Default expiry: 48 hours</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Invitation ID</th>
              <th className="px-4 py-3 text-left font-semibold">Intended Role</th>
              <th className="px-4 py-3 text-left font-semibold">Position</th>
              <th className="px-4 py-3 text-left font-semibold">Expires</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 font-mono text-gray-600 text-[11px]">{inv.id}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded font-mono font-semibold bg-indigo-50 text-indigo-700">
                    {inv.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-800">{inv.position}</td>
                <td className="px-4 py-3 text-gray-500 text-[11px]">
                  {new Date(inv.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {inv.used ? (
                    <span className="text-gray-400">Redeemed</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Active / Unused
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
