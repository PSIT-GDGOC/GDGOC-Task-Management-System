import React, { useState, useEffect } from 'react';
import { adminApi, LeadershipRoleKey } from '../../services/api';
import { 
  Key, 
  Copy, 
  Check, 
  ShieldCheck, 
  Crown, 
  Laptop, 
  Video, 
  PenTool, 
  ClipboardList, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  RefreshCw,
  Share2,
  Lock
} from 'lucide-react';

export const AdminInvitationsPage: React.FC = () => {
  const [roleKeys, setRoleKeys] = useState<LeadershipRoleKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Edit Key Modal
  const [editingKey, setEditingKey] = useState<LeadershipRoleKey | null>(null);
  const [editKeyCode, setEditKeyCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const liveKeys = await adminApi.getRoleKeys();
      if (liveKeys && liveKeys.length > 0) {
        setRoleKeys(liveKeys);
      } else {
        setRoleKeys([]);
      }
    } catch (err) {
      setRoleKeys([]);
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Unable to load leadership keys.' });
    } finally {
      setIsLoading(false);
    }
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
      `🔗 Sign Up Portal: ${window.location.origin}/login?mode=signup\n\n` +
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
      setFeedbackMsg({ type: 'error', text: 'Key must be at least 2 characters long' });
      return;
    }

    setIsSaving(true);
    try {
      await adminApi.updateRoleKey(editingKey.id, trimmed);
      setRoleKeys((prev) =>
        prev.map((k) => (k.id === editingKey.id ? { ...k, keyCode: trimmed } : k))
      );

      setFeedbackMsg({
        type: 'success',
        text: `Successfully updated constant key for ${editingKey.position} to "${trimmed}" in database.`,
      });
      setEditingKey(null);
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Unable to save leadership key.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
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

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
              President Leadership Key Vault
            </h1>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              President Only
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gdgoc-gray-500">
            Constant leadership authorization keys stored in the database. Each key is permanently bound to its designated role.
          </p>
        </div>

        <button
          onClick={loadKeys}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gdgoc-gray-700 bg-white border border-gdgoc-gray-200 hover:bg-gdgoc-gray-50 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-gdgoc-blue' : ''}`} />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Security Guidance Notice */}
      <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white rounded-2xl border border-blue-200/80 shadow-2xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-gdgoc-blue flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gdgoc-gray-700 space-y-1">
          <p className="font-bold text-gdgoc-gray-900">
            How Constant Leadership Keys Work:
          </p>
          <p className="leading-relaxed text-gdgoc-gray-600">
            Candidates for these 6 positions use their role's assigned key during <strong>Sign Up</strong>. 
            The system verifies that the key matches the exact position in the database. 
            Once registered, officers log in directly with their email & password without ever re-entering the key.
          </p>
        </div>
      </div>

      {/* 6 Constant Role Keys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roleKeys.map((item) => (
          <div
            key={item.id || item.position}
            className="bg-white rounded-2xl border border-gdgoc-gray-200 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Top row: Position badge and icon */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gdgoc-gray-50 border border-gdgoc-gray-100 group-hover:scale-105 transition-transform">
                    {getRoleIcon(item.position)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gdgoc-gray-900 text-sm">
                      {item.position}
                    </h3>
                    <span className="text-[10px] font-bold text-gdgoc-blue bg-blue-50 border border-blue-200/60 px-2 py-0.2 rounded-md font-mono">
                      {item.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(item)}
                  title="Customize or rotate key"
                  className="p-1.5 text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-gdgoc-gray-600 line-clamp-2 mb-4 leading-relaxed">
                {getRoleDescription(item.position)}
              </p>

              {/* Constant Key Box */}
              <div className="p-3 bg-gdgoc-gray-50/80 rounded-xl border border-gdgoc-gray-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-gdgoc-gray-500 font-semibold uppercase tracking-wider">
                  <span>Constant Key</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-sans font-bold">
                    Active & Bound
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gdgoc-gray-200">
                  <code className="text-xs font-bold text-gdgoc-gray-900 font-mono tracking-wide">
                    {item.keyCode}
                  </code>
                  <button
                    onClick={() => handleCopyKey(item)}
                    className="p-1 text-gdgoc-gray-500 hover:text-gdgoc-blue transition-colors rounded"
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
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-gdgoc-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopyKey(item)}
                className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-gdgoc-gray-700 bg-white border border-gdgoc-gray-200 hover:bg-gdgoc-gray-50 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
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
                className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-white bg-gdgoc-blue hover:bg-blue-600 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
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

      {/* Edit Key Modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gdgoc-gray-200 animate-in fade-in zoom-in-95 duration-150">
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
