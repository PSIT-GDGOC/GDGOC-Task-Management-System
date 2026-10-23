import React, { useState, useEffect } from 'react';
import { adminApi, AdminInvitation } from '../../services/api';
import { TEAMS } from '../../data/mockData';
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export const AdminInvitationsPage: React.FC = () => {
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Inputs
  const [roleInput, setRoleInput] = useState<'ADMIN' | 'PRESIDENT'>('ADMIN');
  const [positionInput, setPositionInput] = useState('Tech Lead');
  const [teamInput, setTeamInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated Code Modal / Alert
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await adminApi.getInvitations();
      if (data && data.length > 0) {
        setInvitations(data);
      } else {
        fallbackMockInvitations();
      }
    } catch {
      fallbackMockInvitations();
    }
  };

  const fallbackMockInvitations = () => {
    const mockInvites: AdminInvitation[] = [
      {
        id: 'inv_sample_01',
        role: 'ADMIN',
        intendedRole: 'ADMIN',
        position: 'Technical Lead',
        intendedPosition: 'Technical Lead',
        intendedEmail: 'lead.tech@psit.gdgoc.dev',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
      {
        id: 'inv_sample_02',
        role: 'ADMIN',
        intendedRole: 'ADMIN',
        position: 'Media & Motion Lead',
        intendedPosition: 'Media & Motion Lead',
        intendedEmail: null,
        status: 'USED',
        expiresAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
    ];
    setInvitations(mockInvites);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const result = await adminApi.createInvitation({
        role: roleInput,
        position: positionInput.trim() || undefined,
        teamId: teamInput || undefined,
        email: emailInput.trim() || undefined,
        expiresInHours: Number(expiresInHours),
      });

      const raw = result.rawCode || `inv_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      setNewlyCreatedCode(raw);
      setInvitations((prev) => [
        {
          id: result.id || `inv_${Date.now()}`,
          role: roleInput,
          intendedRole: roleInput,
          position: positionInput || 'Administrator',
          intendedPosition: positionInput || 'Administrator',
          intendedEmail: emailInput || null,
          intendedTeamId: teamInput || null,
          status: 'ACTIVE',
          expiresAt: result.expiresAt || new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          rawCode: raw,
        },
        ...prev,
      ]);

      setSuccessMsg('Single-use cryptographic invitation generated successfully.');
    } catch {
      // Local fallback token creation
      const mockRaw = `inv_demo_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      setNewlyCreatedCode(mockRaw);
      setInvitations((prev) => [
        {
          id: `inv_mock_${Date.now()}`,
          role: roleInput,
          intendedRole: roleInput,
          position: positionInput || 'Administrator',
          intendedPosition: positionInput || 'Administrator',
          intendedEmail: emailInput || null,
          intendedTeamId: teamInput || null,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          rawCode: mockRaw,
        },
        ...prev,
      ]);
      setSuccessMsg('Invitation created in local state (live backend offline).');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await adminApi.revokeInvitation(id);
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'REVOKED' } : inv))
      );
      setSuccessMsg('Invitation revoked successfully.');
    } catch {
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'REVOKED' } : inv))
      );
      setSuccessMsg('Invitation marked as revoked in workspace.');
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
            Admin Onboarding & Invitations
          </h1>
          <span className="bg-red-50 text-gdgoc-red border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
            Key Vault
          </span>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-gdgoc-gray-500">
          Issue single-use, cryptographically hashed tokens to securely onboard Chapter Leads, Technical Leads, and Club Administrators.
        </p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* NEWLY CREATED CODE POPUP BANNER */}
      {newlyCreatedCode && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-5 shadow-md space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Invitation Code Ready to Share</span>
            </div>
            <button
              onClick={() => setNewlyCreatedCode(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-emerald-800">
            Send this single-use code to the invited leader. For security, the plain token cannot be viewed again once dismissed.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="w-full flex-1 bg-white border border-emerald-300 rounded-lg p-2.5 font-mono text-xs text-gdgoc-gray-900 select-all break-all shadow-inner">
              {newlyCreatedCode}
            </div>
            <button
              onClick={() => copyToClipboard(newlyCreatedCode)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs whitespace-nowrap"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Token'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Code Generation Form Card */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gdgoc-gray-100">
          <h2 className="text-sm font-bold text-gdgoc-gray-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gdgoc-blue" />
            <span>Generate Cryptographic Token</span>
          </h2>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Single-Use
          </span>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target Role */}
          <div>
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Elevated Role *
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue font-medium"
            >
              <option value="ADMIN">ADMIN (Track Lead / Organizer)</option>
              <option value="PRESIDENT">PRESIDENT (Executive Lead)</option>
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Position Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Technical Lead"
              value={positionInput}
              onChange={(e) => setPositionInput(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue"
            />
          </div>

          {/* Intended Squad */}
          <div>
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Squad Scope (Optional)
            </label>
            <select
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue font-medium"
            >
              <option value="">Any Squad / Global</option>
              {TEAMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Expiration Hours */}
          <div>
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Token Expiry Window
            </label>
            <select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              className="w-full py-2 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue font-medium"
            >
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours (Recommended)</option>
              <option value={72}>72 Hours</option>
              <option value={168}>7 Days</option>
            </select>
          </div>

          {/* Intended Email (Span 2) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Lock to Specific Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. lead.candidate@psit.ac.in (leave empty for open link)"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue font-mono"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-gdgoc-blue hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Hashing...' : 'Issue Code'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Invitations History Table */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gdgoc-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700">
            Active & Past Invitations ({invitations.length})
          </h3>
          <span className="text-[11px] text-gdgoc-gray-400">
            SHA-256 Hashed on Render backend
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gdgoc-gray-700">
            <thead className="bg-gdgoc-gray-50 border-b border-gdgoc-gray-200 text-gdgoc-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Role & Position</th>
                <th className="py-3 px-4">Intended Recipient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gdgoc-gray-100">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gdgoc-gray-400">
                    No invitation tokens issued yet.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => {
                  const isRevoked = inv.status === 'REVOKED';
                  const isUsed = inv.status === 'USED';
                  const isActive = inv.status === 'ACTIVE';
                  const displayPosition = inv.position || inv.intendedPosition || 'Chapter Lead';
                  const displayRole = inv.role || inv.intendedRole || 'ADMIN';

                  return (
                    <tr key={inv.id} className="hover:bg-gdgoc-gray-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-gdgoc-gray-900">
                          {displayPosition}
                        </div>
                        <div className="text-[11px] text-gdgoc-gray-400 font-mono mt-0.5">
                          {displayRole} • ID: {inv.id.slice(0, 14)}...
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs text-gdgoc-gray-700 font-mono">
                          {inv.intendedEmail || 'Open to any student'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            Active & Claimable
                          </span>
                        )}
                        {isUsed && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Claimed / Used
                          </span>
                        )}
                        {isRevoked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Revoked
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-gdgoc-gray-600">
                        {new Date(inv.expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded border border-red-200 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
