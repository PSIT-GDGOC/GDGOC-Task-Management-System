import { SquadActivityFeed } from '../../components/common/SquadActivityFeed';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { useTasks } from '../../context/TaskContext';
import { TEAMS, getDashboardStats } from '../../data/mockData';
import { TeamCard } from '../../components/leader/TeamCard';
import { TaskStatusBadge } from '../../components/common/TaskStatusBadge';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal';
import { HelpButton } from '../../components/tour/HelpButton';
import { Task } from '../../types/task';
import { 
  PlusCircle, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FolderKanban,
  Eye,
  Paperclip
} from 'lucide-react';

export const LeaderOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tasks, approveTask } = useTasks();
  const stats = getDashboardStats(tasks);

  // Selected task for Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Take the 5 most recent tasks
  const recentTasks = [...tasks].slice(0, 5);

  return (
    <div
      className="relative -m-4 sm:-m-6 lg:-m-8 min-h-full flex-1"
    >
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-8 text-left">
        {/* ---------------------------------------------------------------------
            HEADER SECTION
            --------------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div data-tour="overview-heading" className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#111111] text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-900 shadow-2xs">
              Team Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
              Welcome back, {user?.name || 'Team Leader'}
            </h1>
            <p className="text-xs sm:text-sm text-gdgoc-gray-600 max-w-xl">
              Manage your teams, assign work, and keep everyone moving forward.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <HelpButton sectionTourId="leader-overview" sectionTitle="Overview" />
            <button
              onClick={() => navigate('/leader/assign-work')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all card-bb"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Assign Work</span>
            </button>

            <button
              onClick={() => navigate('/leader/view-work')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gdgoc-gray-50 active:bg-gdgoc-gray-100 text-xs sm:text-sm font-semibold text-gdgoc-gray-900 transition-colors card-bb"
            >
              <Layers className="w-4 h-4 text-gdgoc-gray-500" />
              <span>View Work</span>
            </button>
          </div>
        </div>

      {/* ---------------------------------------------------------------------
          ORGANIZATION STATISTICS METRICS
          --------------------------------------------------------------------- */}
      <div data-tour="overview-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: '#FDECEC' }}>
          <div className="flex items-center justify-between text-gdgoc-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-500">
              Total Tasks
            </span>
            <FolderKanban className="w-4 h-4 text-gdgoc-gray-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900">
            {stats.totalTasks}
          </div>
          <p className="text-[11px] text-gdgoc-gray-500 mt-1">Across all squads</p>
        </div>

        {/* In Progress */}
        <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: '#E8F7EE' }}>
          <div className="flex items-center justify-between text-gdgoc-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              In Progress
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">
            {stats.inProgress}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">Active execution</p>
        </div>

        {/* Pending Review */}
        <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: '#EAF3FF' }}>
          <div className="flex items-center justify-between text-gdgoc-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
              Pending Review
            </span>
            <AlertCircle className="w-4 h-4 text-gdgoc-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">
            {stats.pendingReview}
          </div>
          <p className="text-[11px] text-blue-700/80 mt-1">Awaiting approval</p>
        </div>

        {/* Completed */}
        <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: '#FDECEC' }}>
          <div className="flex items-center justify-between text-gdgoc-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-gdgoc-green" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            {stats.completed}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Successfully shipped</p>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          CENTRAL VISUAL ELEMENT: YOUR TEAMS
          --------------------------------------------------------------------- */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gdgoc-gray-900 tracking-tight">
            Your Teams
          </h2>
          <p className="text-xs sm:text-sm text-gdgoc-gray-600">
            Choose a team to view its members and assigned work.
          </p>
        </div>

        {/* 2-Column Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {TEAMS.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          RECENT WORK SECTION
          --------------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 card-bb overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gdgoc-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gdgoc-gray-900">
              Recent Work
            </h3>
            <p className="text-xs text-gdgoc-gray-500">
              Latest task activity across managed squads. Click row to inspect details.
            </p>
          </div>

          <button
            onClick={() => navigate('/leader/view-work')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gdgoc-blue hover:text-blue-700"
          >
            <span>View All Work</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table of Tasks */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gdgoc-gray-50/70 border-b border-gdgoc-gray-200 text-[11px] font-bold uppercase tracking-wider text-gdgoc-gray-600">
                <th className="py-2.5 px-4">Task</th>
                <th className="py-2.5 px-4">Team</th>
                <th className="py-2.5 px-4">Assigned Member</th>
                <th className="py-2.5 px-4">Deadline</th>
                <th className="py-2.5 px-4 text-right sm:text-left">Status</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsModalOpen(true);
                  }}
                  className="hover:bg-blue-50/40 transition-colors border-b border-gdgoc-gray-100 last:border-b-0 cursor-pointer"
                >
                  <td className="py-3 px-4 text-xs font-semibold text-gdgoc-gray-900">
                    <div className="flex items-center gap-1.5">
                      <span>{task.title}</span>
                      {task.attachments && task.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-gdgoc-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gdgoc-gray-600 whitespace-nowrap">
                    {task.teamName}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-gdgoc-gray-800 whitespace-nowrap">
                    {task.assigneeName}
                  </td>
                  <td className="py-3 px-4 text-xs text-gdgoc-gray-600 whitespace-nowrap">
                    {task.deadline}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right sm:text-left">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1 rounded text-gdgoc-gray-400 hover:text-gdgoc-blue"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Squad Activity Feed */}
      <div className="pt-2">
        <SquadActivityFeed title="Live Squad Activity Stream" />
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onApprove={(t) => approveTask(t.id)}
        userRole="TEAM_LEADER"
      />
      </div>
    </div>
  );
};

