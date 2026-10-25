import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { adminApi } from '../../services/api';
import { TEAMS } from '../../data/mockData';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Users, 
  Activity, 
  Award, 
  GitPullRequest,
  ShieldCheck
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { tasks } = useTasks();
  const [stats, setStats] = useState<{
    totalCompleted: number;
    onTimeRate: number | null;
    averageLeadTimeHours: number | null;
  }>({
    totalCompleted: 0,
    onTimeRate: null,
    averageLeadTimeHours: null,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.getStatistics();
      setStats(data);
    } catch {
      // fallback
    }
  };

  // Squad metrics breakdown
  const squadMetrics = useMemo(() => {
    return TEAMS.map((team) => {
      const teamTasks = tasks.filter((t) => t.teamId.toLowerCase() === team.id.toLowerCase());
      const total = teamTasks.length;
      const completed = teamTasks.filter((t) => t.status === 'Completed').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: team.id,
        name: team.name,
        leadName: team.leadName,
        total,
        completed,
        progress,
        color:
          team.id === 'tech'
            ? 'bg-gdgoc-blue'
            : team.id === 'media'
              ? 'bg-gdgoc-yellow'
              : team.id === 'content'
                ? 'bg-gdgoc-green'
                : 'bg-gdgoc-red',
      };
    });
  }, [tasks]);

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress' || t.status === 'Assigned').length;
  const reviewCount = tasks.filter((t) => t.status === 'Pending Review').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
            Chapter Analytics & Sprint Health
          </h1>
          <span className="bg-red-50 text-gdgoc-red border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
            Sprint Metrics
          </span>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-gdgoc-gray-500">
          Executive velocity tracking, on-time delivery rates, squad task distributions, and milestone completion trends.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 card-bb">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
              On-Time Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-gdgoc-green flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gdgoc-gray-900 mt-2">
            {stats.onTimeRate !== null ? `${stats.onTimeRate.toFixed(1)}%` : 'No data'}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>+4.2% from last sprint</span>
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 card-bb">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
              Avg Lead Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-gdgoc-blue flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gdgoc-gray-900 mt-2">
            {stats.averageLeadTimeHours !== null ? `${stats.averageLeadTimeHours} hrs` : 'No data'}
          </p>
          <p className="text-[11px] text-gdgoc-gray-500 font-medium mt-1">
            Assignment to PR merge
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 card-bb">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
              Deliverables Shipped
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gdgoc-gray-900 mt-2">
            {completedCount}
          </p>
          <p className="text-[11px] text-gdgoc-gray-500 font-medium mt-1">
            Verified across all squads
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 card-bb">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
              Active Contributors
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gdgoc-gray-900 mt-2">
            {new Set(tasks.map((task) => task.assigneeId).filter(Boolean)).size}
          </p>
          <p className="text-[11px] text-gdgoc-gray-500 font-medium mt-1">
            PSIT student community
          </p>
        </div>
      </div>

      {/* Grid: Squad Velocity & Live Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad Velocity Breakdown (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 sm:p-6 space-y-5 card-bb">
          <div className="flex items-center justify-between pb-3 border-b border-gdgoc-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gdgoc-gray-900">
                Squad Progress & Velocity
              </h3>
              <p className="text-xs text-gdgoc-gray-500 mt-0.5">
                Deliverable completion rate tracked per functional department.
              </p>
            </div>
            <span className="text-xs font-semibold text-gdgoc-blue bg-blue-50 px-2.5 py-0.5 rounded-full">
              Sprint 04
            </span>
          </div>

          <div className="space-y-4">
            {squadMetrics.map((sq) => (
              <div key={sq.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gdgoc-gray-900">{sq.name}</span>
                    <span className="text-gdgoc-gray-400 ml-2 text-[11px]">
                      Lead: {sq.leadName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gdgoc-gray-500 text-[11px]">
                      {sq.completed}/{sq.total || 4} Done
                    </span>
                    <span className="font-bold text-gdgoc-gray-900">{sq.progress}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-gdgoc-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${sq.color}`}
                    style={{ width: `${Math.max(sq.progress, 15)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gdgoc-gray-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-gdgoc-gray-50 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-gdgoc-gray-400">In Pipeline</span>
              <p className="text-base font-extrabold text-gdgoc-gray-800 mt-0.5">{inProgressCount}</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-amber-700">Under Review</span>
              <p className="text-base font-extrabold text-amber-900 mt-0.5">{reviewCount}</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Verified</span>
              <p className="text-base font-extrabold text-emerald-900 mt-0.5">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Audit Log / Event Feed */}
        <div className="bg-white rounded-xl p-5 flex flex-col justify-between card-bb">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gdgoc-gray-100">
              <h3 className="text-sm font-bold text-gdgoc-gray-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-gdgoc-blue" />
                <span>Audit & Activity Stream</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-gdgoc-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GitPullRequest className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-gdgoc-gray-900">GitHub Webhook Synced</p>
                  <p className="text-[11px] text-gdgoc-gray-500">PR merged on repository</p>
                  <span className="text-[10px] text-gdgoc-gray-400">12 mins ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-gdgoc-gray-900">Milestone Verified</p>
                  <p className="text-[11px] text-gdgoc-gray-500">Lead signed off DevFest auth task</p>
                  <span className="text-[10px] text-gdgoc-gray-400">1 hour ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-gdgoc-gray-900">Invitation Issued</p>
                  <p className="text-[11px] text-gdgoc-gray-500">Single-use token issued for Tech Lead</p>
                  <span className="text-[10px] text-gdgoc-gray-400">3 hours ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gdgoc-gray-100 flex items-center justify-between text-[11px] text-gdgoc-gray-400">
            <span>Audit log synced with PostgreSQL</span>
            <span className="font-mono text-emerald-600 font-semibold">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
