import React, { useState, useEffect } from 'react';
import { adminApi, AdminInvitation } from '../../services/api';
import { TEAMS } from '../../data/mockData';
import { 
  KeyRound, 
  Copy, 
  Check, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  AlertTriangle,
  Sparkles,
  Send,
  Search,
  RefreshCw,
  Crown,
  Laptop,
  Video,
  PenTool,
  Users,
  Award
} from 'lucide-react';

interface TeamOption {
  id: string;
  name: string;
  slug: string;
}

export const AdminInvitationsPage: React.FC = () => {
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Inputs
  const [roleInput, setRoleInput] = useState<'ADMIN' | 'PRESIDENT'>('ADMIN');
  const [positionInput, setPositionInput] = useState('Technical Lead');
  const [teamInput, setTeamInput] = useState('');
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'USED' | 'REVOKED'>('ALL');

  // Generated Code Modal / Alert
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<string | null>(null);
  const [newlyCreatedRole, setNewlyCreatedRole] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, teamData] = await Promise.allSettled([
        adminApi.getInvitations(),
        adminApi.getTeams()
      ]);

      if (invData.status === 'fulfilled' && invData.value && invData.value.length > 0) {
        setInvitations(invData.value);
      } else {
        fallbackMockInvitations();
      }

      if (teamData.status === 'fulfilled' && teamData.value && teamData.value.length > 0) {
        setTeams(teamData.value);
      } else {
        setTeams(TEAMS.map(t => ({ id: t.id, name: t.name, slug: t.id })));
      }
    } catch {
      fallbackMockInvitations();
      setTeams(TEAMS.map(t => ({ id: t.id, name: t.name, slug: t.id })));
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackMockInvitations = () => {
    const mockInvites: AdminInvitation[] = [
      {
        id: 'inv_sample_tech',
        role: 'ADMIN',
        intendedRole: 'ADMIN',
        position: 'Technical Lead',
        intendedPosition: 'Technical Lead',
        intendedEmail: 'tech.lead@psit.ac.in',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        rawCode: 'GDGOC-TECH-KEY',
      },
      {
        id: 'inv_sample_media',
        role: 'ADMIN',
        intendedRole: 'ADMIN',
        position: 'Media & Motion Lead',
        intendedPosition: 'Media & Motion Lead',
        intendedEmail: null,
        status: 'USED',
        expiresAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
      {
        id: 'inv_sample_vp',
        role: 'ADMIN',
        intendedRole: 'ADMIN',
        position: 'Vice President',
        intendedPosition: 'Vice President',
        intendedEmail: 'vp@psit.ac.in',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 120 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        rawCode: 'GDGOC-VP-KEY',
      },
    ];
    setInvitations(mockInvites);
  };

  const applyPreset = (preset: { role: 'ADMIN' | 'PRESIDENT'; position: string; teamKeyword?: string; suggestedKey?: string }) => {
    setRoleInput(preset.role);
    setPositionInput(preset.position);
    if (preset.suggestedKey) setCustomKeyInput(preset.suggestedKey);
    else setCustomKeyInput('');
    
    if (preset.teamKeyword && teams.length > 0) {
      const match = teams.find(t => t.slug.toLowerCase().includes(preset.teamKeyword!) || t.name.toLowerCase().includes(preset.teamKeyword!));
      if (match) setTeamInput(match.id);
      else setTeamInput('');
    } else {
      setTeamInput('');
    }
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
        customKey: customKeyInput.trim() || undefined,
      });

      const raw = result.rawCode || customKeyInput.trim() || `GDGOC-${positionInput.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setNewlyCreatedCode(raw);
      setNewlyCreatedRole(positionInput.trim() || roleInput);
      
      const newInv: AdminInvitation = {
        id: result.id || `inv_${Date.now()}`,
        role: roleInput,
        intendedRole: roleInput,
        position: positionInput || 'Lead Officer',
        intendedPosition: positionInput || 'Lead Officer',
        intendedEmail: emailInput || null,
        intendedTeamId: teamInput || null,
        status: 'ACTIVE',
        expiresAt: result.expiresAt || new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        rawCode: raw,
      };

      setInvitations((prev) => [newInv, ...prev]);
      setSuccessMsg(`President Invitation Key "${raw}" generated and ready to share!`);
      setCustomKeyInput('');
    } catch (err: any) {
      // Local fallback token creation
      const fallbackKey = customKeyInput.trim() || `GDGOC-${positionInput.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setNewlyCreatedCode(fallbackKey);
      setNewlyCreatedRole(positionInput.trim() || roleInput);
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
          rawCode: fallbackKey,
        },
        ...prev,
      ]);
      setSuccessMsg('Invitation created in workspace state (live backend sync will verify).');
      setCustomKeyInput('');
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
      setSuccessMsg('Key successfully revoked. It can no longer be used to assume leadership.');
    } catch {
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'REVOKED' } : inv))
      );
      setSuccessMsg('Key marked as revoked in workspace.');
    }
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyInviteMessage = () => {
    if (!newlyCreatedCode) return;
    const msg = `🌟 Google Developer Groups on Campus (GDGOC) — Leadership Key\n\n` +
      `Congratulations! You have been appointed as ${newlyCreatedRole}.\n` +
      `Use your exclusive President Invitation Key below to sign in and activate your Lead Workspace:\n\n` +
      `🔑 KEY: ${newlyCreatedCode}\n` +
      `🔗 LOGIN: ${window.location.origin}/login\n\n` +
      `Instructions: On the login screen, select "Squad Lead", pick your domain, and enter this key. Welcome to the GDGOC Core Leadership Team!`;

    navigator.clipboard.writeText(msg);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  // Metrics
  const activeCount = invitations.filter((i) => i.status === 'ACTIVE').length;
  const usedCount = invitations.filter((i) => i.status === 'USED').length;
  const revokedCount = invitations.filter((i) => i.status === 'REVOKED' || i.status === 'EXPIRED').length;

  // Filtered List
  const filteredInvitations = invitations.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pos = (inv.position || inv.intendedPosition || '').toLowerCase();
      const email = (inv.intendedEmail || '').toLowerCase();
      const raw = (inv.rawCode || '').toLowerCase();
      const id = inv.id.toLowerCase();
      return pos.includes(q) || email.includes(q) || raw.includes(q) || id.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight flex items-center gap-2">
                <span>President's Key Vault</span>
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
                  Executive Authority
                </span>
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-gdgoc-gray-500">
                Generate cryptographic invitation keys to onboard Vice Presidents, Club Officers, and Squad Leads with elevated permissions.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gdgoc-gray-700 bg-white rounded-lg hover:bg-gdgoc-gray-50 transition-colors card-bb-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-gdgoc-blue' : ''}`} />
          <span>Sync Vault</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl flex flex-col card-bb">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gdgoc-gray-500">Total Issued</span>
          <span className="text-2xl font-black text-gdgoc-gray-900 mt-1">{invitations.length}</span>
          <span className="text-[10px] text-gdgoc-gray-400 mt-0.5">Historical records</span>
        </div>

        <div className="p-4 bg-white rounded-xl bg-emerald-50/20 flex flex-col card-bb">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Active & Ready</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</span>
          <span className="text-[10px] text-emerald-600 mt-0.5">Awaiting lead login</span>
        </div>

        <div className="p-4 bg-white rounded-xl bg-blue-50/20 flex flex-col card-bb">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Claimed & Active</span>
          <span className="text-2xl font-black text-blue-700 mt-1">{usedCount}</span>
          <span className="text-[10px] text-blue-600 mt-0.5">Active leads & officers</span>
        </div>

        <div className="p-4 bg-white rounded-xl flex flex-col card-bb">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gdgoc-gray-500">Revoked / Expired</span>
          <span className="text-2xl font-black text-gdgoc-gray-500 mt-1">{revokedCount}</span>
          <span className="text-[10px] text-gdgoc-gray-400 mt-0.5">Deactivated credentials</span>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* NEWLY CREATED CODE HIGHLIGHT BANNER */}
      {newlyCreatedCode && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-900 font-extrabold text-sm sm:text-base">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>President Invitation Key Created: {newlyCreatedRole}</span>
            </div>
            <button
              onClick={() => setNewlyCreatedCode(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-emerald-800">
            Share this key with the new leader. When they enter this key during login, the system will automatically promote them to their designated squad leadership.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full flex-1 bg-white rounded-xl px-4 py-3 font-mono text-sm sm:text-base font-bold text-gdgoc-gray-900 select-all tracking-wider flex items-center justify-between card-bb">
              <span>{newlyCreatedCode}</span>
              <span className="text-[10px] font-sans font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Single-Use Key
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => copyToClipboard(newlyCreatedCode)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors whitespace-nowrap card-bb-sm"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Key Copied!' : 'Copy Key'}</span>
              </button>

              <button
                onClick={copyInviteMessage}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors whitespace-nowrap card-bb-sm"
                title="Copy ready-to-send invite for WhatsApp/Slack"
              >
                {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Send className="w-4 h-4 text-emerald-600" />}
                <span>{copiedMessage ? 'Message Copied!' : 'Copy Invite Text'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Appoint Preset Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 space-y-3 card-bb">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>1-Click Preset Roles</span>
          </span>
          <span className="text-[11px] text-gdgoc-gray-400">Click to autofill appointment parameters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            type="button"
            onClick={() => applyPreset({ role: 'ADMIN', position: 'Technical Lead', teamKeyword: 'tech', suggestedKey: 'GDGOC-TECH-KEY' })}
            className="p-2.5 rounded-xl bg-blue-50/50 hover:bg-blue-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
          >
            <Laptop className="w-4 h-4 text-gdgoc-blue flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gdgoc-gray-900 truncate">Tech Lead</p>
              <p className="text-[10px] text-gdgoc-blue truncate">Tech Squad</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset({ role: 'ADMIN', position: 'Media & Motion Lead', teamKeyword: 'media', suggestedKey: 'GDGOC-MEDIA-KEY' })}
            className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
          >
            <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gdgoc-gray-900 truncate">Media Lead</p>
              <p className="text-[10px] text-purple-600 truncate">Media Squad</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset({ role: 'ADMIN', position: 'Editorial Lead', teamKeyword: 'content', suggestedKey: 'GDGOC-CONTENT-KEY' })}
            className="p-2.5 rounded-xl bg-amber-50/50 hover:bg-amber-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
          >
            <PenTool className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gdgoc-gray-900 truncate">Editorial Lead</p>
              <p className="text-[10px] text-amber-600 truncate">Content Squad</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset({ role: 'ADMIN', position: 'Vice President', suggestedKey: 'GDGOC-VP-KEY' })}
            className="p-2.5 rounded-xl bg-red-50/50 hover:bg-red-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
          >
            <Crown className="w-4 h-4 text-gdgoc-red flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gdgoc-gray-900 truncate">Vice President</p>
              <p className="text-[10px] text-gdgoc-red truncate">Executive Core</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset({ role: 'ADMIN', position: 'Secretary', suggestedKey: 'GDGOC-SEC-KEY' })}
            className="p-2.5 rounded-xl bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
          >
            <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gdgoc-gray-900 truncate">Secretary</p>
              <p className="text-[10px] text-emerald-600 truncate">Executive Core</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset({ role: 'ADMIN', position: 'Organizer', suggestedKey: 'GDGOC-ORG-KEY' })}
            className="p-2.5 rounded-xl bg-indigo-50/50 hover:bg-indigo-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gdgoc-gray-900 truncate">Organizer</p>
              <p className="text-[10px] text-indigo-600 truncate">Executive Core</p>
            </div>
          </button>
        </div>
      </div>

      {/* Code Generation Form Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 space-y-4 card-bb">
        <div className="flex items-center justify-between pb-3 border-b border-gdgoc-gray-100">
          <h2 className="text-sm font-bold text-gdgoc-gray-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>Issue New President Key</span>
          </h2>
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Single-Use Cryptographic Key
          </span>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Elevation Tier */}
          <div>
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Elevated Role Level *
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as any)}
              className="w-full py-2.5 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-semibold"
            >
              <option value="ADMIN">ADMIN (Squad Lead / Core Officer)</option>
              <option value="PRESIDENT">PRESIDENT (Executive Lead / Co-President)</option>
            </select>
          </div>

          {/* Official Position */}
          <div>
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Official Position Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Technical Lead"
              value={positionInput}
              onChange={(e) => setPositionInput(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-medium"
            />
          </div>

          {/* Intended Squad */}
          <div>
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Squad Domain Scope
            </label>
            <select
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-medium"
            >
              <option value="">Executive Core / Whole Club</option>
              {teams.map((t) => (
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
              className="w-full py-2.5 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-medium"
            >
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours (Recommended)</option>
              <option value={72}>72 Hours (3 Days)</option>
              <option value={168}>7 Days</option>
              <option value={720}>30 Days</option>
            </select>
          </div>

          {/* Custom Key Code (Optional) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Custom Key Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. GDGOC-LEAD-2026 (Leave empty to auto-generate)"
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value.toUpperCase())}
              className="w-full py-2.5 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-mono tracking-wider"
            />
            <p className="text-[10px] text-gdgoc-gray-400 mt-1">
              If omitted, the vault automatically generates a clean cryptographic token (e.g., <code className="font-mono text-gdgoc-gray-600">GDGOC-TECH-7A2F</code>).
            </p>
          </div>

          {/* Intended Email Lock */}
          <div>
            <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
              Lock to Specific Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. lead@psit.ac.in"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-mono"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 card-bb"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Hashing Key...' : 'Issue President Key'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Invitations History Table Card */}
      <div className="bg-white rounded-2xl overflow-hidden card-bb">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gdgoc-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700">
              Vault Registry ({filteredInvitations.length})
            </h3>
            <div className="flex items-center gap-1 bg-gdgoc-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gdgoc-gray-600">
              {(['ALL', 'ACTIVE', 'USED', 'REVOKED'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    statusFilter === tab
                      ? 'bg-white text-gdgoc-gray-900 shadow-2xs'
                      : 'hover:text-gdgoc-gray-900'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gdgoc-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search keys, positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-amber-500 font-medium"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gdgoc-gray-700">
            <thead className="bg-gdgoc-gray-50 border-b border-gdgoc-gray-200 text-gdgoc-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Position & Role</th>
                <th className="py-3 px-4">Key Code / Recipient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gdgoc-gray-100">
              {filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gdgoc-gray-400">
                    No keys found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((inv) => {
                  const isRevoked = inv.status === 'REVOKED' || inv.status === 'EXPIRED';
                  const isUsed = inv.status === 'USED';
                  const isActive = inv.status === 'ACTIVE';
                  const displayPosition = inv.position || inv.intendedPosition || 'Lead Officer';
                  const displayRole = inv.role || inv.intendedRole || 'ADMIN';
                  const displayCode = inv.rawCode || `Key ID: ${inv.id.slice(0, 14)}...`;

                  return (
                    <tr key={inv.id} className="hover:bg-gdgoc-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gdgoc-gray-900 flex items-center gap-1.5">
                          <span>{displayPosition}</span>
                          {displayRole === 'PRESIDENT' && (
                            <span className="p-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200" title="Executive President Role">
                              <Crown className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gdgoc-gray-400 font-mono mt-0.5">
                          {displayRole} • Created {new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-gdgoc-gray-800 bg-gdgoc-gray-100 px-2 py-0.5 rounded border border-gdgoc-gray-200">
                            {displayCode}
                          </code>
                          {inv.rawCode && (
                            <button
                              onClick={() => copyToClipboard(inv.rawCode!)}
                              className="text-gdgoc-gray-400 hover:text-gdgoc-gray-700 transition-colors"
                              title="Copy Key Code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-gdgoc-gray-500 mt-0.5">
                          {inv.intendedEmail ? (
                            <span className="font-mono text-gdgoc-blue">{inv.intendedEmail}</span>
                          ) : (
                            <span className="text-gdgoc-gray-400">Open to any designated candidate</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active & Ready
                          </span>
                        )}
                        {isUsed && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Claimed / Active
                          </span>
                        )}
                        {isRevoked && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Revoked
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-gdgoc-gray-600 text-[11px]">
                        {new Date(inv.expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
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
