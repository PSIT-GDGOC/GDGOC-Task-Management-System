import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { SquadActivityFeed } from '../../components/common/SquadActivityFeed';
import { adminApi } from '../../services/api';
import { useTeams } from '../../hooks/useTeams';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Users, 
} from 'lucide-react';

const metricNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, notation: 'compact' });
const validMetric = (value: number | null): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const AdminAnalyticsPage: React.FC = () => {
  const { teams: TEAMS } = useTeams();
  const { tasks } = useTasks();
  const [error, setError] = useState('');
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
      setError('');
    } catch {
      setError('Unable to load analytics. Please retry.');
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
        <div className="flex flex-wrap items-center gap-2">
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

      {error && <p role="alert" className="text-red-700">{error} <button onClick={() => void loadStats()} className="underline">Retry analytics</button></p>}
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="min-w-0 bg-white rounded-xl border border-gdgoc-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
              On-Time Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-gdgoc-green flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="break-words text-xl sm:text-2xl font-black tabular-nums text-gdgoc-gray-900 mt-2">
            {validMetric(stats.onTimeRate) ? `${stats.onTimeRate.toFixed(1)}%` : 'No data'}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>Completed tasks with deadlines</span>
          </p>
        </div>

        <div className="min-w-0 bg-white rounded-xl border border-gdgoc-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
              Avg Lead Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-gdgoc-blue flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="break-words text-xl sm:text-2xl font-black tabular-nums text-gdgoc-gray-900 mt-2">
            {validMetric(stats.averageLeadTimeHours) ? `${metricNumber.format(stats.averageLeadTimeHours)} hrs` : 'No data'}
          </p>
          <p className="text-[11px] text-gdgoc-gray-500 font-medium mt-1">
            Task creation to approval
          </p>
        </div>

        <div className="min-w-0 bg-white rounded-xl border border-gdgoc-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
              Deliverables Shipped
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="break-words text-xl sm:text-2xl font-black tabular-nums text-gdgoc-gray-900 mt-2">
            {completedCount}
          </p>
          <p className="text-[11px] text-gdgoc-gray-500 font-medium mt-1">
            Verified across all squads
          </p>
        </div>

        <div className="min-w-0 bg-white rounded-xl border border-gdgoc-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gdgoc-gray-500 uppercase tracking-wider">
              Active Contributors
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="break-words text-xl sm:text-2xl font-black tabular-nums text-gdgoc-gray-900 mt-2">
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
        <div className="lg:col-span-2 bg-white rounded-xl border border-gdgoc-gray-200 p-5 sm:p-6 shadow-2xs space-y-5">
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
              All tasks
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
                      {sq.completed}/{sq.total} Done
                    </span>
                    <span className="font-bold text-gdgoc-gray-900">{sq.progress}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-gdgoc-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${sq.color}`}
                    style={{ width: `${sq.progress}%` }}
                    role="progressbar"
                    aria-label={`${sq.name} completion`}
                    aria-valuenow={sq.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
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

        <SquadActivityFeed title="Audit & Activity Stream" />
      </div>
    </div>
  );
};
