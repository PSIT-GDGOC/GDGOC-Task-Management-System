import React, { useState } from 'react';
import { Users, Layers, ShieldCheck } from 'lucide-react';

interface TeamItem {
  id: string;
  name: string;
  slug: string;
  headName: string;
  memberCount: number;
}

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  isTeamHead: boolean;
}

export const MembersTeams: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'TEAMS'>('TEAMS');

  const [teams] = useState<TeamItem[]>([
    { id: '1', name: 'Tech Team', slug: 'tech', headName: 'Shikhar / Aditya', memberCount: 14 },
    { id: '2', name: 'Media Team', slug: 'media', headName: 'Muskan', memberCount: 8 },
    { id: '3', name: 'Content Team', slug: 'content', headName: 'Sajid', memberCount: 6 },
  ]);

  const [members] = useState<MemberItem[]>([
    { id: 'u1', name: 'Aditya Rajput', email: 'aditya.lead@example.com', role: 'SYSTEM_OWNER', team: 'Tech', isTeamHead: true },
    { id: 'u2', name: 'Shikhar Gupta', email: 'shikhar@example.com', role: 'ADMIN', team: 'Tech', isTeamHead: true },
    { id: 'u3', name: 'Muskan Verma', email: 'muskan@example.com', role: 'ADMIN', team: 'Media', isTeamHead: true },
    { id: 'u4', name: 'Sajid Ali', email: 'sajid@example.com', role: 'ADMIN', team: 'Content', isTeamHead: true },
    { id: 'u5', name: 'Regular Member', email: 'member@gdgoc-club.org', role: 'USER', team: 'Tech', isTeamHead: false },
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members & Teams Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Maintain team structures, assign team heads, review membership scopes, and manage club roles.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-200 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('TEAMS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'TEAMS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Teams (3)
          </button>
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'MEMBERS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1" />
            Members ({members.length})
          </button>
        </div>
      </div>

      {activeTab === 'TEAMS' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  {team.slug}
                </span>
                <span className="text-xs text-gray-400">{team.memberCount} members</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base">{team.name}</h3>
              <p className="text-xs text-gray-500">
                Team Head: <span className="font-medium text-gray-800">{team.headName}</span>
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active Scope</span>
                <span className="text-gray-400 text-[11px]">Strict Scope Active</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Member</th>
                <th className="px-4 py-3 text-left font-semibold">System Role</th>
                <th className="px-4 py-3 text-left font-semibold">Team</th>
                <th className="px-4 py-3 text-left font-semibold">Leadership</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    <p className="text-gray-500 text-[11px] font-mono">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded font-mono font-semibold bg-gray-100 text-gray-700">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.team}</td>
                  <td className="px-4 py-3">
                    {m.isTeamHead ? (
                      <span className="inline-flex items-center text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Team Head
                      </span>
                    ) : (
                      <span className="text-gray-400">Member</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
