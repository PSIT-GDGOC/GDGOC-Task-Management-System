import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TEAMS, getTeamMetrics } from '../../data/mockData';
import { useTasks } from '../../context/TaskContext';
import { TeamId, Task } from '../../types/task';
import { TaskRow } from '../../components/common/TaskRow';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal';
import { 
  ArrowLeft, 
  PlusCircle, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FolderKanban
} from 'lucide-react';

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Find team by id or fallback to first team
  const currentTeam = TEAMS.find((t) => t.id === teamId) || TEAMS[0];
  const metrics = getTeamMetrics(currentTeam.id as TeamId, tasks);

  const getAccentColorBadge = () => {
    switch (currentTeam.accent) {
      case 'red':
        return 'bg-red-50 text-gdgoc-red border-red-200';
      case 'blue':
        return 'bg-blue-50 text-gdgoc-blue border-blue-200';
      case 'yellow':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'green':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Back to Overview Breadcrumb */}
      <div>
        <Link
          to="/leader/overview"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gdgoc-gray-600 hover:text-gdgoc-blue transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Team Header Card */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getAccentColorBadge()}`}>
                {currentTeam.members.length} Members
              </span>
              <span className="text-xs text-gdgoc-gray-400">•</span>
              <span className="text-xs text-gdgoc-gray-500 font-medium">
                Lead: {currentTeam.leadName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
              {currentTeam.name}
            </h1>

            <p className="text-xs sm:text-sm text-gdgoc-gray-600 max-w-2xl leading-relaxed">
              {currentTeam.description}
            </p>
          </div>

          {/* Prominent Assign Work Action */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate('/leader/assign-work')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Work to {currentTeam.name}</span>
            </button>
          </div>
        </div>

        {/* Team Task Metrics Grid */}
        <div className="mt-6 pt-5 border-t border-gdgoc-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3 rounded-lg bg-gdgoc-gray-50 border border-gdgoc-gray-100">
            <div className="flex items-center justify-between text-gdgoc-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Assigned</span>
              <FolderKanban className="w-3.5 h-3.5 text-gdgoc-gray-400" />
            </div>
            <div className="text-xl font-bold text-gdgoc-gray-900">{metrics.totalTasks}</div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-900">{metrics.inProgressTasks}</div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Review</span>
              <AlertCircle className="w-3.5 h-3.5 text-gdgoc-blue" />
            </div>
            <div className="text-xl font-bold text-blue-900">{metrics.pendingReviewTasks}</div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-gdgoc-green" />
            </div>
            <div className="text-xl font-bold text-emerald-900">{metrics.completedTasks}</div>
          </div>
        </div>
      </div>

      {/* Team Roster Section */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gdgoc-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gdgoc-gray-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gdgoc-gray-800">
              Team Roster ({currentTeam.members.length})
            </h2>
          </div>
          <span className="text-xs text-gdgoc-gray-400">GDGoC PSIT Core & Members</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentTeam.members.map((member) => (
            <div
              key={member.id}
              className="p-3 rounded-xl border border-gdgoc-gray-200 bg-gdgoc-gray-50/50 flex items-center gap-3 hover:bg-white hover:border-gdgoc-gray-300 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 text-gdgoc-blue border border-blue-200 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gdgoc-gray-900 truncate">
                  {member.name}
                </p>
                <p className="text-[11px] text-gdgoc-gray-500 truncate">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Assigned Work Tasks Section */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gdgoc-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gdgoc-gray-900">
              Assigned Work ({metrics.tasks.length})
            </h3>
            <p className="text-xs text-gdgoc-gray-500">
              Tasks assigned to {currentTeam.name} members
            </p>
          </div>
        </div>

        {metrics.tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-gdgoc-gray-500">
            No tasks currently assigned to this team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gdgoc-gray-50/70 border-b border-gdgoc-gray-200 text-[11px] font-bold uppercase tracking-wider text-gdgoc-gray-600">
                  <th className="py-2.5 px-4">Task</th>
                  <th className="py-2.5 px-4">Assigned Member</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Deadline</th>
                  <th className="py-2.5 px-4 text-right sm:text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.tasks.map((task) => (
                  <TaskRow 
                    key={task.id} 
                    task={task} 
                    showTeam={false} 
                    onSelect={(t) => setSelectedTask(t)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
