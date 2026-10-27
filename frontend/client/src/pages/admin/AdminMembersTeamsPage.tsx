import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../services/api';
import { 
  Users, 
  Layers, 
  ShieldCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Crown,
  X
} from 'lucide-react';

interface MemberRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string;
  team: string;
  isTeamHead: boolean;
  isActive: boolean;
  initials: string;
}

export const AdminMembersTeamsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TEAMS' | 'MEMBERS'>('TEAMS');

  // Teams state
  const [teams, setTeams] = useState<any[]>([]);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlug, setNewTeamSlug] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Members state
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [liveTeams, liveUsers] = await Promise.all([adminApi.getTeams(), adminApi.getUsers()]);
      setTeams(liveTeams);
      setMembers(liveUsers.map((u: any) => {
        const memberships = u.teamMemberships || [];
        const isSuperAdmin =
          u.role === 'SYSTEM_OWNER' ||
          u.role === 'ADMIN' ||
          ['president', 'vice president', 'secretary', 'organizer', 'system owner', 'super admin', 'admin'].includes(
            (u.position || '').trim().toLowerCase(),
          );

        return {
          id: u.id, name: u.name, email: u.email, role: u.role,
          position: u.position || undefined,
          team: isSuperAdmin
            ? 'Executive Chapter Board (No Squad)'
            : memberships.map((m: any) => m.team.name).join(', ') || 'No team',
          isTeamHead: isSuperAdmin ? false : memberships.some((m: any) => m.isTeamHead),
          isActive: u.isActive,
          initials: u.name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase(),
        };
      }));
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Unable to load the directory.' });
    }
  };

  const handleToggleStatus = async (member: MemberRecord) => {
    try {
      const nextState = !member.isActive;
      await adminApi.toggleUserStatus(member.id, nextState);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, isActive: nextState } : m))
      );
      setFeedbackMsg({
        type: 'success',
        text: `Updated ${member.name}'s account status to ${nextState ? 'Active' : 'Deactivated'}.`,
      });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Unable to update account status.' });
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamSlug) return;
    setIsCreatingTeam(true);

    try {
      const created = await adminApi.createTeam({
        name: newTeamName.trim(),
        slug: newTeamSlug.trim().toLowerCase(),
        description: newTeamDesc.trim() || undefined,
      });

      setTeams((prev) => [...prev, created]);
      setFeedbackMsg({
        type: 'success',
        text: `Successfully created squad: ${newTeamName}`,
      });
      setIsNewTeamModalOpen(false);
      setNewTeamName('');
      setNewTeamSlug('');
      setNewTeamDesc('');
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Unable to create team.' });
    } finally {
      setIsCreatingTeam(false);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'ADMIN' && (m.role === 'ADMIN' || ['SYSTEM_OWNER', 'PRESIDENT'].includes(m.role))) ||
        (roleFilter === 'MEMBER' && ['USER', 'MEMBER'].includes(m.role));

      const matchesSearch =
        !searchQuery.trim() ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.position && m.position.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesRole && matchesSearch;
    });
  }, [members, roleFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-sm ${
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

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
              Squads & Members Directory
            </h1>
            <span className="bg-red-50 text-gdgoc-red border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Governance
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gdgoc-gray-500">
            Manage track structures, assign leadership scopes, toggle access privileges, and monitor member participation.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gdgoc-gray-200/80 p-1 rounded-xl self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setActiveTab('TEAMS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'TEAMS'
                ? 'bg-white text-gdgoc-gray-900 shadow-2xs'
                : 'text-gdgoc-gray-600 hover:text-gdgoc-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Squads ({teams.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'MEMBERS'
                ? 'bg-white text-gdgoc-gray-900 shadow-2xs'
                : 'text-gdgoc-gray-600 hover:text-gdgoc-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directory ({members.length})</span>
          </button>
        </div>
      </div>

      {/* SQUADS TAB */}
      {activeTab === 'TEAMS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gdgoc-gray-500 font-medium">
              Registered chapter functional tracks and technical squads.
            </p>
            <button
              onClick={() => setIsNewTeamModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gdgoc-blue hover:bg-blue-600 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Squad</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const squadMembers = members.filter(
                (m) =>
                  m.team.toLowerCase().includes(team.name.toLowerCase()) ||
                  m.team.toLowerCase().includes(team.slug.toLowerCase())
              );
              const count = team.members
                ? team.members.length
                : (team._count?.memberships ?? (squadMembers.length > 0 ? squadMembers.length : (team._count?.memberships ?? 0)));
              const foundHead = squadMembers.find(
                (m) => m.isTeamHead || m.position?.toLowerCase().includes('lead')
              );
              const lead = team.leadName || (foundHead ? foundHead.name : (count > 0 ? 'Active Squad' : 'Unassigned'));

              return (
                <div
                  key={team.id}
                  className="bg-white rounded-xl border border-gdgoc-gray-200 p-5 card-bb flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-gdgoc-blue bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md font-mono">
                        {team.slug || team.id}
                      </span>
                      <span className="text-xs text-gdgoc-gray-500 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3 text-gdgoc-gray-400" />
                        {count} members
                      </span>
                    </div>

                    <h3 className="font-extrabold text-gdgoc-gray-900 text-base">
                      {team.name}
                    </h3>
                    <p className="text-xs text-gdgoc-gray-600 mt-1.5 line-clamp-2">
                      {team.description || 'Active functional squad driving campus technology initiatives.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gdgoc-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gdgoc-gray-600">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-semibold text-gdgoc-gray-800">{lead}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Active Scope
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MEMBERS DIRECTORY TAB */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          {/* Search & Role Filter */}
          <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-3 sm:p-4 card-bb flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-gdgoc-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member name, email, or track..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg font-medium text-gdgoc-gray-700 focus:outline-hidden focus:border-gdgoc-blue"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins & Leads</option>
                <option value="MEMBER">Standard Members</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-xl border border-gdgoc-gray-200 overflow-hidden card-bb">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gdgoc-gray-700">
                <thead className="bg-gdgoc-gray-50 border-b border-gdgoc-gray-200 text-gdgoc-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Track / Squad</th>
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gdgoc-gray-100">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gdgoc-gray-400">
                        No club members match the current search.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gdgoc-gray-50/70 transition-colors">
                        {/* Member */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-gdgoc-blue font-bold flex items-center justify-center text-xs">
                              {member.initials}
                            </div>
                            <div>
                              <p className="font-bold text-gdgoc-gray-900 leading-tight">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-gdgoc-gray-400 font-mono leading-tight">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {member.role === 'SYSTEM_OWNER' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3 text-red-600" />
                              System Owner
                            </span>
                          ) : member.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              <Crown className="w-3 h-3 text-blue-600" />
                              Lead / Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gdgoc-gray-700 bg-gdgoc-gray-100 px-2 py-0.5 rounded">
                              Member
                            </span>
                          )}
                        </td>

                        {/* Track */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-gdgoc-gray-800">
                            {member.team}
                          </span>
                        </td>

                        {/* Position */}
                        <td className="py-3 px-4 whitespace-nowrap text-gdgoc-gray-600 text-[11px]">
                          {member.position || (member.isTeamHead ? 'Track Lead' : 'Contributor')}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {member.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3 text-red-600" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Access Control Action */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors shadow-2xs ${
                              member.isActive
                                ? 'bg-white border-red-200 text-red-700 hover:bg-red-50'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {member.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Squad Modal */}
      {isNewTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gdgoc-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gdgoc-gray-100">
              <h3 className="text-base font-bold text-gdgoc-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-gdgoc-blue" />
                <span>Create New Track / Squad</span>
              </h3>
              <button
                onClick={() => setIsNewTeamModalOpen(false)}
                className="p-1 text-gdgoc-gray-400 hover:text-gdgoc-gray-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
                  Squad Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Machine Learning Track"
                  value={newTeamName}
                  onChange={(e) => {
                    setNewTeamName(e.target.value);
                    if (!newTeamSlug) {
                      setNewTeamSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
                  Slug (URL identifier) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ai-ml"
                  value={newTeamSlug}
                  onChange={(e) => setNewTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3 py-2 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gdgoc-gray-700 mb-1">
                  Mission / Scope Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the track's focus and student developer deliverables..."
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:border-gdgoc-blue"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTeamModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gdgoc-gray-700 bg-white border border-gdgoc-gray-200 rounded-lg hover:bg-gdgoc-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTeam}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-gdgoc-blue hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isCreatingTeam ? 'Registering...' : 'Create Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
