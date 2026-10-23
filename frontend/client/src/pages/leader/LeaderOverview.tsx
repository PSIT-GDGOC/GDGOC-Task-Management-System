import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/authContext';
import { useTasks } from '../../context/TaskContext';
import { TEAMS, getDashboardStats } from '../../data/mockData';
import { TeamCard } from '../../components/leader/TeamCard';
import { TaskStatusBadge } from '../../components/common/TaskStatusBadge';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal';
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
  const { tasks } = useTasks();
  const stats = getDashboardStats(tasks);

  // Selected task for Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Take the 5 most recent tasks
  const recentTasks = [...tasks].slice(0, 5);

  return (
    <div className="space-y-8 text-left">
      {/* ---------------------------------------------------------------------
          HEADER SECTION (Hero Reveal)
          --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 animate-hero-reveal reveal-delay-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold uppercase tracking-wider text-gdgoc-blue">
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
          <button
            onClick={() => navigate('/leader/assign-work')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer hover:shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Assign Work</span>
          </button>

          <button
            onClick={() => navigate('/leader/view-work')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gdgoc-gray-300 bg-white hover:bg-gdgoc-gray-50 active:bg-gdgoc-gray-100 text-xs sm:text-sm font-semibold text-gdgoc-gray-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Layers className="w-4 h-4 text-gdgoc-gray-500" />
            <span>View Work</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          ORGANIZATION STATISTICS METRICS (Hero Reveal Staggered)
          --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-hero-reveal reveal-delay-2">
        {/* Total Tasks */}
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
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
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
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
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
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
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
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
          CENTRAL VISUAL ELEMENT: YOUR TEAMS (Hero Reveal Staggered)
          --------------------------------------------------------------------- */}
      <div className="space-y-4 animate-hero-reveal reveal-delay-3">
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
          RECENT WORK SECTION (Hero Reveal Staggered)
          --------------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 shadow-2xs overflow-hidden animate-hero-reveal reveal-delay-4">
        <div className="p-4 sm:p-5 border-b border-gdgoc-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gdgoc-gray-900 text-sm sm:text-base">
              Recent Deliverables
            </h3>
            <p className="text-xs text-gdgoc-gray-500">
              Latest tasks assigned across all team domains
            </p>
          </div>
          <button
            onClick={() => navigate('/leader/view-work')}
            className="text-xs font-semibold text-gdgoc-blue hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gdgoc-gray-100 bg-gdgoc-gray-50/50 text-[11px] font-bold text-gdgoc-gray-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gdgoc-gray-100">
              {recentTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsModalOpen(true);
                  }}
                  className="group hover:bg-gdgoc-gray-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-xs font-semibold text-gdgoc-gray-900 group-hover:text-gdgoc-blue transition-colors max-w-xs truncate">
                    <div className="flex items-center gap-1.5">
                      <span>{task.title}</span>
                      {task.attachments && task.attachments.length > 0 && (
                        <Paperclip className="w-3.5 h-3.5 text-gdgoc-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gdgoc-gray-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gdgoc-gray-100 text-gdgoc-gray-700">
                      {task.teamName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gdgoc-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-gdgoc-blue border border-blue-200 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {task.assigneeInitials}
                      </div>
                      <span className="truncate">{task.assigneeName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="py-3 px-4 text-xs text-gdgoc-gray-500 whitespace-nowrap">
                    {task.deadline}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gdgoc-gray-200 bg-white group-hover:border-gdgoc-blue group-hover:text-gdgoc-blue text-[11px] font-semibold text-gdgoc-gray-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
};
