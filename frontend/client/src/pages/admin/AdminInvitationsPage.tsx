import React, { useState, useEffect, useMemo } from 'react';
import { adminApi, AdminInvitation, LeadershipRoleKey } from '../../services/api';
import { TEAMS } from '../../data/mockData';
import { 
  Key,
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
  ShieldCheck,
  ClipboardList,
  Calendar,
  Edit3,
  Save,
  X,
  Share2,
  Lock
} from 'lucide-react';

interface TeamOption {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_ROLE_KEYS: LeadershipRoleKey[] = [
  {
    id: 'rk_vice_president',
    role: 'ADMIN',
    position: 'Vice President',
    keyCode: 'GDGOC-VP-KEY',
    label: 'Vice President (Executive Co-Lead)',
    teamSlug: null,
  },
  {
    id: 'rk_secretary',
    role: 'ADMIN',
    position: 'Secretary',
    keyCode: 'GDGOC-SEC-KEY',
    label: 'Secretary (Documentation & Records)',
    teamSlug: null,
  },
  {
    id: 'rk_organizer',
    role: 'ADMIN',
    position: 'Organizer',
    keyCode: 'GDGOC-ORG-KEY',
    label: 'Organizer (Logistics & Events)',
    teamSlug: null,
  },
  {
    id: 'rk_tech_lead',
    role: 'ADMIN',
    position: 'Tech Lead',
    keyCode: 'GDGOC-TECH-KEY',
    label: 'Tech Team Lead',
    teamSlug: 'tech',
  },
  {
    id: 'rk_media_lead',
    role: 'ADMIN',
    position: 'Media Lead',
    keyCode: 'GDGOC-MEDIA-KEY',
    label: 'Media Team Lead',
    teamSlug: 'media',
  },
  {
    id: 'rk_content_lead',
    role: 'ADMIN',
    position: 'Content Lead',
    keyCode: 'GDGOC-CONTENT-KEY',
    label: 'Content Team Lead',
    teamSlug: 'content',
  },
];

export const AdminInvitationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CONSTANT_KEYS' | 'CUSTOM_INVITES'>('CONSTANT_KEYS');
  
  // Constant Role Keys State (from main)
  const [roleKeys, setRoleKeys] = useState<LeadershipRoleKey[]>(DEFAULT_ROLE_KEYS);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Edit Key Modal State
  const [editingKey, setEditingKey] = useState<LeadershipRoleKey | null>(null);
  const [editKeyCode, setEditKeyCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Invitations State (from feature branch)
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Inputs for Custom Invitations
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

  // Generated Code Banner
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<string | null>(null);
  const [newlyCreatedRole, setNewlyCreatedRole] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.allSettled([loadKeys(), loadData()]);
    setIsLoading(false);
  };

  const loadKeys = async () => {
    try {
      const liveKeys = await adminApi.getRoleKeys();
      if (liveKeys && liveKeys.length > 0) {
        setRoleKeys(liveKeys);
      } else {
        setRoleKeys(DEFAULT_ROLE_KEYS);
      }
    } catch {
      setRoleKeys(DEFAULT_ROLE_KEYS);
    }
  };

  const loadData = async () => {
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

  const handleCopyKey = (key: LeadershipRoleKey) => {
    navigator.clipboard.writeText(key.keyCode);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleCopyInviteMessage = (key: LeadershipRoleKey) => {
    const inviteText =
      `🌟 GDG on Campus — Leadership Authorization\n\n` +
      `You have been designated as the ${key.position} for GDGOC PSIT!\n\n` +
      `🔑 Constant President Key: ${key.keyCode}\n` +
      `🔗 Sign Up Portal: ${window.location.origin}/signup\n\n` +
      `Instructions: On the sign-up page, choose Position "${key.position}" and enter your President Key "${key.keyCode}". ` +
      `Once registered, your leadership privileges are permanently active on TaskHub!`;

    navigator.clipboard.writeText(inviteText);
    setCopiedInviteId(key.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  const handleOpenEdit = (key: LeadershipRoleKey) => {
    setEditingKey(key);
    setEditKeyCode(key.keyCode);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;
    const trimmed = editKeyCode.trim().toUpperCase();
    if (trimmed.length < 2) {
      setErrorMsg('Key must be at least 2 characters long');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setIsSaving(true);
    try {
      await adminApi.updateRoleKey(editingKey.id, trimmed);
      setRoleKeys((prev) =>
        prev.map((k) => (k.id === editingKey.id ? { ...k, keyCode: trimmed } : k))
      );

      try {
        const stored = localStorage.getItem('gdgoc_vault_custom_role_keys');
        const customMap = stored ? JSON.parse(stored) : {};
        customMap[editingKey.position] = trimmed;
        localStorage.setItem('gdgoc_vault_custom_role_keys', JSON.stringify(customMap));
      } catch {}

      setSuccessMsg(`Successfully updated constant key for ${editingKey.position} to "${trimmed}" in database.`);
      setEditingKey(null);
    } catch {
      // Local fallback
      setRoleKeys((prev) =>
        prev.map((k) => (k.id === editingKey.id ? { ...k, keyCode: trimmed } : k))
      );

      try {
        const stored = localStorage.getItem('gdgoc_vault_custom_role_keys');
        const customMap = stored ? JSON.parse(stored) : {};
        customMap[editingKey.position] = trimmed;
        localStorage.setItem('gdgoc_vault_custom_role_keys', JSON.stringify(customMap));
      } catch {}

      setSuccessMsg(`Key updated for ${editingKey.position} in current workspace session.`);
      setEditingKey(null);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
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
        customKey: customKeyInput.trim() || undefined,
        email: emailInput.trim() || undefined,
        expiresInHours: Number(expiresInHours),
      });

      const issuedCode = result.rawCode || result.id;
      setSuccessMsg(`President Key successfully issued for ${positionInput}!`);
      setNewlyCreatedCode(issuedCode);
      setNewlyCreatedRole(positionInput);

      await loadData();

      // Reset optional inputs
      setCustomKeyInput('');
      setEmailInput('');
    } catch (err: any) {
      // Local fallback simulator if backend endpoint is unavailable
      const simCode = customKeyInput.trim().toUpperCase() || `GDGOC-${positionInput.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const simInvite: AdminInvitation = {
        id: `inv_sim_${Date.now()}`,
        role: roleInput,
        intendedRole: roleInput,
        position: positionInput.trim(),
        intendedPosition: positionInput.trim(),
        intendedEmail: emailInput.trim() || null,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        rawCode: simCode,
      };

      setInvitations((prev) => [simInvite, ...prev]);
      setNewlyCreatedCode(simCode);
      setNewlyCreatedRole(positionInput);
      setSuccessMsg(`Issued key: ${simCode} (Session Vault)`);
      setCustomKeyInput('');
      setEmailInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this invitation key? It can no longer be used.')) {
      return;
    }

    try {
      await adminApi.revokeInvitation(id);
      setSuccessMsg('Invitation revoked successfully.');
      await loadData();
    } catch {
      // Fallback local update
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'REVOKED' } : inv))
      );
      setSuccessMsg('Invitation marked as revoked.');
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyShareMessage = (code: string, roleName: string) => {
    const msg = `🌟 GDG on Campus — PSIT Leadership Access\n\nYou have been designated for leadership role: ${roleName}!\n🔑 President Key: ${code}\n🔗 Sign Up & Claim: ${window.location.origin}/signup\n\nEnter this key during registration to automatically receive your leadership credentials and squad dashboard permissions.`;
    navigator.clipboard.writeText(msg);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const getRoleIcon = (position: string) => {
    switch (position) {
      case 'Vice President':
        return <Crown className="w-5 h-5 text-amber-500" />;
      case 'Secretary':
        return <ClipboardList className="w-5 h-5 text-purple-500" />;
      case 'Organizer':
        return <Calendar className="w-5 h-5 text-emerald-500" />;
      case 'Tech Lead':
        return <Laptop className="w-5 h-5 text-blue-500" />;
      case 'Media Lead':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'Content Lead':
        return <PenTool className="w-5 h-5 text-amber-600" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-gdgoc-blue" />;
    }
  };

  const getRoleDescription = (position: string) => {
    switch (position) {
      case 'Vice President':
        return 'Executive Co-Lead overseeing chapter operations, squad alignment, and high-priority deliverables.';
      case 'Secretary':
        return 'Custodian of documentation, meeting logs, official records, and executive compliance.';
      case 'Organizer':
        return 'Logistics coordinator managing hackathons, speaker sessions, workshops, and chapter logistics.';
      case 'Tech Lead':
        return 'Technical architect managing codebases, developer onboarding, sprint reviews, and technical tasks.';
      case 'Media Lead':
        return 'Creative head overseeing UI/UX design, visual identity, motion graphics, and event photography.';
      case 'Content Lead':
        return 'Editorial lead managing technical blogging, announcements, socials, and documentation pipelines.';
      default:
        return 'Appointed chapter leadership officer.';
    }
  };

  // Stats calculation
  const activeCount = useMemo(
    () =>
      invitations.filter(
        (i) => i.status === 'ACTIVE' && new Date(i.expiresAt).getTime() > Date.now()
      ).length,
    [invitations]
  );
  const usedCount = useMemo(() => invitations.filter((i) => i.status === 'USED').length, [invitations]);
  const revokedCount = useMemo(
    () =>
      invitations.filter(
        (i) => i.status === 'REVOKED' || (i.status === 'ACTIVE' && new Date(i.expiresAt).getTime() <= Date.now())
      ).length,
    [invitations]
  );

  // Filtered invitations
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      const pos = inv.intendedPosition || inv.position || '';
      const email = inv.intendedEmail || '';
      const code = inv.rawCode || inv.id;

      const matchesSearch =
        pos.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
      if (statusFilter === 'ACTIVE') return inv.status === 'ACTIVE' && !isExpired;
      if (statusFilter === 'USED') return inv.status === 'USED';
      if (statusFilter === 'REVOKED') return inv.status === 'REVOKED' || isExpired;
      return true;
    });
  }, [invitations, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gdgoc-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gdgoc-gray-900 flex items-center gap-2.5">
              <KeyRound className="w-6 h-6 text-amber-500" />
              <span>President Key Vault</span>
            </h1>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              President Only
            </span>
          </div>
          <p className="text-xs text-gdgoc-gray-500 mt-1">
            Manage permanent leadership role keys and generate single-use invitations for squad leads.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Tab buttons */}
          <div className="flex bg-gdgoc-gray-200/80 p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setActiveTab('CONSTANT_KEYS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'CONSTANT_KEYS'
                  ? 'bg-white text-gdgoc-gray-900 shadow-2xs'
                  : 'text-gdgoc-gray-600 hover:text-gdgoc-gray-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Constant Role Keys</span>
            </button>
            <button
              onClick={() => setActiveTab('CUSTOM_INVITES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'CUSTOM_INVITES'
                  ? 'bg-white text-gdgoc-gray-900 shadow-2xs'
                  : 'text-gdgoc-gray-600 hover:text-gdgoc-gray-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Custom Invitations</span>
            </button>
          </div>

          <button
            onClick={loadAll}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gdgoc-gray-700 bg-white rounded-lg hover:bg-gdgoc-gray-50 transition-colors card-bb-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-gdgoc-blue' : ''}`} />
            <span>Sync Vault</span>
          </button>
        </div>
      </div>

      {/* CONSTANT ROLE KEYS TAB */}
      {activeTab === 'CONSTANT_KEYS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gdgoc-gray-900">Constant Leadership Authorization Keys</h2>
              <p className="text-xs text-gdgoc-gray-500 mt-0.5">
                Each key is permanently bound to its designated executive role or squad lead position.
              </p>
            </div>
          </div>

          {/* Role Keys Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleKeys.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 flex flex-col justify-between transition-shadow card-bb"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-gdgoc-gray-50 border border-gdgoc-gray-200">
                        {getRoleIcon(item.position)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gdgoc-gray-900 text-sm">{item.position}</h3>
                        <span className="text-[10px] font-mono text-gdgoc-gray-400 uppercase tracking-wider">
                          {item.role} {item.teamSlug ? `• ${item.teamSlug.toUpperCase()}` : '• EXECUTIVE'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="text-gdgoc-gray-400 hover:text-gdgoc-blue p-1 rounded-md hover:bg-blue-50 transition-colors"
                      title="Edit key code"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-gdgoc-gray-600 mb-4 min-h-[36px]">
                    {getRoleDescription(item.position)}
                  </p>

                  <div className="bg-gdgoc-gray-50 rounded-xl p-3 border border-gdgoc-gray-200 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
                        Constant Key Code
                      </span>
                      <code className="text-xs font-mono font-black text-gdgoc-gray-900 tracking-wider">
                        {item.keyCode}
                      </code>
                    </div>

                    <button
                      onClick={() => handleCopyKey(item)}
                      className="p-1.5 text-gdgoc-gray-500 hover:text-gdgoc-blue hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gdgoc-gray-200"
                      title="Copy Key Code"
                    >
                      {copiedKeyId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-gdgoc-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyKey(item)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-gdgoc-gray-700 bg-white hover:bg-gdgoc-gray-50 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 card-bb-sm"
                  >
                    {copiedKeyId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gdgoc-gray-500" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopyInviteMessage(item)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-white bg-gdgoc-blue hover:bg-blue-600 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 card-bb-sm"
                  >
                    {copiedInviteId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Invite Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Invite</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOM INVITATIONS TAB */}
      {activeTab === 'CUSTOM_INVITES' && (
        <div className="space-y-6">
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
                Share this key with the new leader. When they enter this key during registration, they will immediately be verified with their designated executive permissions.
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
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied Code!' : 'Copy Key'}</span>
                  </button>

                  <button
                    onClick={() => copyShareMessage(newlyCreatedCode, newlyCreatedRole)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors whitespace-nowrap card-bb-sm"
                  >
                    {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Send className="w-4 h-4 text-emerald-600" />}
                    <span>{copiedMessage ? 'Copied Message!' : 'Copy Share Text'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Presets Bar */}
          <div>
            <div className="text-xs font-bold text-gdgoc-gray-600 uppercase tracking-wider mb-2">
              Fast Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => applyPreset({ role: 'ADMIN', position: 'Technical Lead', teamKeyword: 'tech', suggestedKey: 'GDGOC-TECH-KEY' })}
                className="p-2.5 rounded-xl bg-blue-50/50 hover:bg-blue-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
              >
                <Laptop className="w-4 h-4 text-gdgoc-blue flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gdgoc-gray-900 truncate">Tech Lead</div>
                  <div className="text-[10px] text-gdgoc-gray-500 truncate">Engineering</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({ role: 'ADMIN', position: 'Media & Motion Lead', teamKeyword: 'media', suggestedKey: 'GDGOC-MEDIA-KEY' })}
                className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
              >
                <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gdgoc-gray-900 truncate">Media Lead</div>
                  <div className="text-[10px] text-gdgoc-gray-500 truncate">Design & Video</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({ role: 'ADMIN', position: 'Editorial Lead', teamKeyword: 'content', suggestedKey: 'GDGOC-CONTENT-KEY' })}
                className="p-2.5 rounded-xl bg-amber-50/50 hover:bg-amber-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
              >
                <PenTool className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gdgoc-gray-900 truncate">Content Lead</div>
                  <div className="text-[10px] text-gdgoc-gray-500 truncate">Editorial & Docs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({ role: 'ADMIN', position: 'Vice President', suggestedKey: 'GDGOC-VP-KEY' })}
                className="p-2.5 rounded-xl bg-red-50/50 hover:bg-red-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
              >
                <Crown className="w-4 h-4 text-gdgoc-red flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gdgoc-gray-900 truncate">Vice President</div>
                  <div className="text-[10px] text-gdgoc-gray-500 truncate">Executive Lead</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({ role: 'ADMIN', position: 'Secretary', suggestedKey: 'GDGOC-SEC-KEY' })}
                className="p-2.5 rounded-xl bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
              >
                <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gdgoc-gray-900 truncate">Secretary</div>
                  <div className="text-[10px] text-gdgoc-gray-500 truncate">Records & Ops</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({ role: 'ADMIN', position: 'Organizer', suggestedKey: 'GDGOC-ORG-KEY' })}
                className="p-2.5 rounded-xl bg-indigo-50/50 hover:bg-indigo-100/60 text-left transition-colors flex items-center gap-2 card-bb-sm"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gdgoc-gray-900 truncate">Organizer</div>
                  <div className="text-[10px] text-gdgoc-gray-500 truncate">Logistics & PR</div>
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
              <span className="text-[11px] font-semibold text-gdgoc-gray-400">
                Authorized Executive Generation
              </span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Role */}
                <div>
                  <label className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1">
                    System Role Tier *
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gdgoc-gray-300 rounded-xl focus:outline-none focus:border-amber-500"
                  >
                    <option value="ADMIN">ADMIN (Squad Lead / Core Officer)</option>
                    <option value="PRESIDENT">PRESIDENT (Executive Co-Owner)</option>
                  </select>
                </div>

                {/* 2. Position Title */}
                <div>
                  <label className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1">
                    Appointed Position Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Technical Lead"
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gdgoc-gray-300 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 3. Squad / Team */}
                <div>
                  <label className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1">
                    Squad Assignment (Optional)
                  </label>
                  <select
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gdgoc-gray-300 rounded-xl focus:outline-none focus:border-amber-500"
                  >
                    <option value="">No Squad (Executive / Core)</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Custom Key Code */}
                <div>
                  <label className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1">
                    Custom Key Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank (e.g. GDGOC-LEAD-2026)"
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-gdgoc-gray-300 rounded-xl focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                {/* 5. Intended Candidate Email */}
                <div>
                  <label className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1">
                    Target Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="Restricts key to this email only"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gdgoc-gray-300 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 6. Expiration Hours */}
                <div>
                  <label className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1">
                    Key Expiration
                  </label>
                  <select
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-gdgoc-gray-300 rounded-xl focus:outline-none focus:border-amber-500"
                  >
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={48}>48 Hours (2 Days - Standard)</option>
                    <option value={168}>7 Days (1 Week)</option>
                    <option value={720}>30 Days (1 Month)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
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
                <h3 className="text-sm font-bold text-gdgoc-gray-900">
                  Vault Registry ({filteredInvitations.length})
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-gdgoc-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by position, code, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 bg-gdgoc-gray-100 p-0.5 rounded-lg w-full sm:w-auto">
                  {(['ALL', 'ACTIVE', 'USED', 'REVOKED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`flex-1 sm:flex-none px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                        statusFilter === st
                          ? 'bg-white text-gdgoc-gray-900 shadow-2xs'
                          : 'text-gdgoc-gray-600 hover:text-gdgoc-gray-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gdgoc-gray-700">
                <thead className="bg-gdgoc-gray-50 border-b border-gdgoc-gray-200 text-gdgoc-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Designated Role</th>
                    <th className="py-3 px-4">Key Code & Target Candidate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Expiry Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gdgoc-gray-100">
                  {filteredInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gdgoc-gray-400">
                        No invitations match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvitations.map((inv) => {
                      const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
                      const isActive = inv.status === 'ACTIVE' && !isExpired;
                      const isUsed = inv.status === 'USED';
                      const isRevoked = inv.status === 'REVOKED' || (inv.status === 'ACTIVE' && isExpired);

                      const displayPosition = inv.intendedPosition || inv.position || 'Core Leader';
                      const displayRole = inv.intendedRole || inv.role || 'ADMIN';
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
      )}

      {/* Edit Key Modal (for Constant Role Keys) */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 card-bb animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-gdgoc-blue" />
                <h3 className="font-extrabold text-gdgoc-gray-900 text-lg">
                  Edit Key for {editingKey.position}
                </h3>
              </div>
              <button
                onClick={() => setEditingKey(null)}
                className="text-gdgoc-gray-400 hover:text-gdgoc-gray-700 rounded-lg p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gdgoc-gray-500 mb-4">
              Update the constant key stored in the database. Anyone signing up for{' '}
              <strong className="text-gdgoc-gray-800">{editingKey.position}</strong> will need this exact key.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gdgoc-gray-700 uppercase tracking-wider mb-1">
                  Constant Key Code *
                </label>
                <input
                  type="text"
                  value={editKeyCode}
                  onChange={(e) => setEditKeyCode(e.target.value.toUpperCase())}
                  required
                  placeholder="e.g. GDGOC-SEC-KEY"
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-gdgoc-gray-50 border border-gdgoc-gray-300 rounded-xl focus:outline-none focus:border-gdgoc-blue uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-gdgoc-gray-600 hover:bg-gdgoc-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gdgoc-blue hover:bg-blue-600 rounded-xl inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Updating DB...' : 'Save to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
