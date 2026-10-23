import React, { useState, useMemo } from 'react';
import { useAuth } from '../../auth/authContext';
import { useTasks } from '../../context/TaskContext';
import { Task } from '../../types/task';
import { TaskStatusBadge } from '../../components/common/TaskStatusBadge';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal';
import { CursorTour, TourStep } from '../../components/tour/CursorTour';
import { 
  CelebrationNotification, 
  CelebrationState 
} from '../../components/common/CelebrationNotification';
import { triggerCelebrationBurst } from '../../utils/confetti';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FolderKanban,
  Search, 
  Calendar, 
  Eye, 
  Paperclip,
  FolderOpen,
  Sparkles,
  SendHorizontal
} from 'lucide-react';

const MEMBER_TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="workspace-header"]',
    title: 'Personal Workspace',
    description: 'Welcome to your GDGOC Member Portal! All assignments, project deadlines, and status updates are centralized here.',
    badge: 'Overview',
  },
  {
    selector: '[data-tour="stats-overview"]',
    title: 'Sprint Metrics',
    description: 'Track your live deliverable velocity: assigned milestones, work currently in progress, items pending review, and completed achievements.',
    badge: 'Metrics',
  },
  {
    selector: '[data-tour="task-table"]',
    title: 'My Deliverables & Actions',
    description: 'Inspect your tasks, claim new assignments with one click, and submit your pull requests for team lead review.',
    badge: 'Tasks & Sprints',
  },
];

export const MemberMyWork: React.FC = () => {
  const { user } = useAuth();
  const { tasks, claimTask, submitTask } = useTasks();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected task for Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Click celebration state
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  // Strict role isolation: Filter tasks assigned to current member only
  const memberTasks = useMemo(() => {
    const targetUserId = user?.id || 'usr_member_01';
    const targetEmail = user?.email?.toLowerCase();

    const filtered = tasks.filter(
      (t) =>
        t.assigneeId === targetUserId ||
        (targetEmail && t.assigneeEmail.toLowerCase() === targetEmail)
    );

    return filtered.map((t) => ({
      ...t,
      assigneeName: user?.name || t.assigneeName,
      assigneeEmail: user?.email || t.assigneeEmail,
      assigneeInitials: user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : t.assigneeInitials,
    }));
  }, [user, tasks]);

  // Member-specific task statistics
  const memberStats = useMemo(() => {
    return {
      total: memberTasks.length,
      assigned: memberTasks.filter((t) => t.status === 'Assigned').length,
      inProgress: memberTasks.filter((t) => t.status === 'In Progress').length,
      pendingReview: memberTasks.filter((t) => t.status === 'Pending Review').length,
      completed: memberTasks.filter((t) => t.status === 'Completed').length,
    };
  }, [memberTasks]);

  // Filtered tasks based on status and search query
  const displayedTasks = useMemo(() => {
    return memberTasks.filter((task) => {
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [memberTasks, statusFilter, searchQuery]);

  // Handle Claim Task with Click Success & Confetti Burst
  const handleClaimTask = (task: Task, e?: React.MouseEvent) => {
    const updated = claimTask(task.id, user?.id, user?.name);
    if (updated) {
      if (e) {
        triggerCelebrationBurst({ x: e.clientX, y: e.clientY, count: 85 });
      } else {
        triggerCelebrationBurst({ count: 85 });
      }

      setCelebration({
        isOpen: true,
        type: 'claim',
        taskTitle: task.title,
        subtitle: 'Task claimed and moved to "In Progress". Have fun building!',
      });

      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
    }
  };

  // Handle Submit for Review
  const handleSubmitTask = (task: Task, e?: React.MouseEvent) => {
    const updated = submitTask(task.id);
    if (updated) {
      if (e) {
        triggerCelebrationBurst({ x: e.clientX, y: e.clientY, count: 50 });
      } else {
        triggerCelebrationBurst({ count: 50 });
      }

      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
    }
  };

  return (
    <div className="space-y-6 text-left relative">
      {/* ---------------------------------------------------------------------
          HEADER SECTION (Hero Reveal Animation)
          --------------------------------------------------------------------- */}
      <div 
        data-tour="workspace-header"
        className="space-y-1 animate-hero-reveal reveal-delay-1"
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-[10px] font-bold uppercase tracking-wider text-gdgoc-green">
          Personal Workspace
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
          Welcome back, {user?.name || 'Rohan Gupta'}
        </h1>
        <p className="text-xs sm:text-sm text-gdgoc-gray-600">
          My Work • Track your assigned sprint deliverables, deadlines, and submissions. Click any task row to inspect full details.
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          MEMBER STATISTICS METRICS (Hero Reveal Staggered)
          --------------------------------------------------------------------- */}
      <div 
        data-tour="stats-overview"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-hero-reveal reveal-delay-2"
      >
        {/* Assigned Tasks */}
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-gdgoc-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gdgoc-gray-500">
              Assigned Tasks
            </span>
            <FolderKanban className="w-4 h-4 text-gdgoc-gray-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900">
            {memberStats.total}
          </div>
          <p className="text-[11px] text-gdgoc-gray-500 mt-1">Total assignments</p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              In Progress
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">
            {memberStats.inProgress}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">Currently building</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
              Pending Review
            </span>
            <AlertCircle className="w-4 h-4 text-gdgoc-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">
            {memberStats.pendingReview}
          </div>
          <p className="text-[11px] text-blue-700/80 mt-1">Submitted for lead review</p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            {memberStats.completed}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Approved milestones</p>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          FILTER & SEARCH TOOLBAR (Hero Reveal Staggered)
          --------------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs space-y-3 animate-hero-reveal reveal-delay-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gdgoc-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my tasks..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gdgoc-gray-200 text-xs sm:text-sm focus:border-gdgoc-blue focus:ring-1 focus:ring-gdgoc-blue outline-none transition-all placeholder:text-gdgoc-gray-400"
            />
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-gdgoc-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
            {['ALL', 'Assigned', 'In Progress', 'Pending Review', 'Completed'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-gdgoc-gray-900 shadow-2xs'
                    : 'text-gdgoc-gray-600 hover:text-gdgoc-gray-900'
                }`}
              >
                {status === 'ALL' ? 'All Deliverables' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          DELIVERABLES TABLE (Hero Reveal Staggered)
          --------------------------------------------------------------------- */}
      <div 
        data-tour="task-table"
        className="bg-white rounded-xl border border-gdgoc-gray-200 shadow-2xs overflow-hidden animate-hero-reveal reveal-delay-4"
      >
        <div className="px-5 py-3.5 border-b border-gdgoc-gray-100 flex items-center justify-between bg-gdgoc-gray-50/50">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-gdgoc-blue" />
            <h2 className="text-xs sm:text-sm font-bold text-gdgoc-gray-800">
              Sprint Tasks ({displayedTasks.length})
            </h2>
          </div>
          <span className="text-[11px] text-gdgoc-gray-500 hidden sm:inline">
            Click any task row or button to view details & actions
          </span>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-2">
            <FolderOpen className="w-10 h-10 text-gdgoc-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gdgoc-gray-700">No deliverables found</h3>
            <p className="text-xs text-gdgoc-gray-500 max-w-sm mx-auto">
              No tasks match your current filter selection. Check back when your team leader assigns sprint work.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gdgoc-gray-200 bg-gdgoc-gray-50/80 text-[11px] font-bold text-gdgoc-gray-500 uppercase tracking-wider select-none">
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gdgoc-gray-100">
                {displayedTasks.map((task) => {
                  const isDeadlineNotSpecified =
                    !task.deadline ||
                    task.deadline.toLowerCase() === 'not specified' ||
                    task.deadline.toLowerCase().includes('not specified');

                  return (
                    <tr
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setIsModalOpen(true);
                      }}
                      className="group hover:bg-blue-50/40 transition-colors border-b border-gdgoc-gray-100 last:border-b-0 cursor-pointer select-none"
                    >
                      {/* Title */}
                      <td className="py-3.5 px-4 font-semibold text-xs sm:text-sm text-gdgoc-gray-900 leading-snug group-hover:text-gdgoc-blue transition-colors max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{task.title}</span>
                          {task.attachments && task.attachments.length > 0 && (
                            <span 
                              className="text-gdgoc-gray-400" 
                              title={`${task.attachments.length} attachment(s)`}
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Description Preview */}
                      <td className="py-3.5 px-4 text-xs text-gdgoc-gray-600 max-w-sm">
                        <p className="line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      </td>

                      {/* Team */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gdgoc-gray-100 text-[11px] font-medium text-gdgoc-gray-700">
                          {task.teamName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TaskStatusBadge status={task.status} />
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gdgoc-gray-600">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gdgoc-gray-400 flex-shrink-0" />
                          <span>
                            {isDeadlineNotSpecified ? (
                              <span className="text-gdgoc-gray-400 italic">
                                Deadline not specified
                              </span>
                            ) : (
                              task.deadline
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Actions with Click Celebration */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {task.status === 'Assigned' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClaimTask(task, e);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gdgoc-blue hover:bg-blue-600 active:scale-95 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer animate-click-pop"
                              title="Claim and Start Task"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Claim</span>
                            </button>
                          )}

                          {task.status === 'In Progress' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitTask(task, e);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer"
                              title="Submit for Lead Review"
                            >
                              <SendHorizontal className="w-3 h-3" />
                              <span>Submit</span>
                            </button>
                          )}

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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------
          BEGINNER CURSOR TOUR
          --------------------------------------------------------------------- */}
      <CursorTour steps={MEMBER_TOUR_STEPS} tourKey="gdgoc_member_tour_completed" />

      {/* ---------------------------------------------------------------------
          CLICK CELEBRATION NOTIFICATION
          --------------------------------------------------------------------- */}
      <CelebrationNotification
        state={celebration}
        onClose={() => setCelebration(null)}
      />

      {/* ---------------------------------------------------------------------
          TASK DETAILS MODAL
          --------------------------------------------------------------------- */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onClaim={(task) => handleClaimTask(task)}
        onSubmitForReview={(task) => handleSubmitTask(task)}
        userRole="MEMBER"
      />
    </div>
  );
};
