import React, { useState, useMemo } from 'react';
import { useAuth } from '../../auth/authContext';
import { useTasks } from '../../context/TaskContext';
import { displayName } from '../../utils/displayName';
import { Task } from '../../types/task';
import { TaskStatusBadge } from '../../components/common/TaskStatusBadge';
import { HelpButton } from '../../components/tour/HelpButton';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FolderKanban,
  Search,
  Filter,
  Calendar,
  Eye,
  Paperclip,
  FolderOpen,
  Play,
  Sparkles,
  X
} from 'lucide-react';

export const MemberMyWork: React.FC = () => {
  const { user } = useAuth();
  const { tasks, acceptTask, submitTask } = useTasks();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Selected task for Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Strict role isolation: Filter tasks assigned to current member only
  const memberTasks = useMemo(() => {
    const targetUserId = user?.id || 'usr_member_01';
    const targetEmail = user?.email?.toLowerCase();

    const filtered = tasks.filter(
      (t) =>
        t.assigneeId === targetUserId ||
        (targetEmail && t.assigneeEmail.toLowerCase() === targetEmail)
    );

    // Personalize task assignee info for current preview session
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
      assigned: memberTasks.filter((t) => t.status === 'Assigned' || t.status === 'To Do').length,
      inProgress: memberTasks.filter((t) => t.status === 'In Progress').length,
      pendingReview: memberTasks.filter((t) => t.status === 'Pending Review').length,
      completed: memberTasks.filter((t) => t.status === 'Completed').length,
    };
  }, [memberTasks]);

  // Filtered tasks based on status and search query
  const displayedTasks = useMemo(() => {
    return memberTasks.filter((task) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        task.status === statusFilter ||
        (statusFilter === 'Assigned' && (task.status === 'Assigned' || task.status === 'To Do'));
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [memberTasks, statusFilter, searchQuery]);

  const handleAcceptTask = async (task: Task) => {
    try {
      const updated = await acceptTask(task.id);
      setActionMessage(`Task "${task.title}" accepted! Moved to In Progress.`);
      if (selectedTask?.id === task.id) setSelectedTask(updated);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Unable to start task.');
    }
  };

  const handleSubmitDone = async (task: Task) => {
    try {
      const updated = await submitTask(task.id, { note: 'Deliverables completed, ready for lead verification.' });
      setActionMessage(`Task "${task.title}" submitted for review.`);
      if (selectedTask?.id === task.id) setSelectedTask(updated);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Unable to submit task.');
    }
  };

  return (
    <div
      className="relative -m-4 sm:-m-6 lg:-m-8 min-h-full flex-1"
      style={{
        backgroundImage: 'url(/dashboard-bg.jpg)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'var(--app-background)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'var(--app-background)' }} aria-hidden="true" />
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 text-left">
        {/* ---------------------------------------------------------------------
            HEADER SECTION
            --------------------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div data-tour="mywork-heading" className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-[10px] font-bold uppercase tracking-wider text-gdgoc-green">
              Personal Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
              Welcome back{displayName(user?.name, user?.email) ? `, ${displayName(user?.name, user?.email)}` : ''}
            </h1>
            <p className="text-xs sm:text-sm text-gdgoc-gray-600">
              My Work • Track deliverables, accept assignments, and submit your work for Super Admin and Lead verification.
            </p>
          </div>
          <div className="flex-shrink-0">
            <HelpButton sectionTourId="member-mywork" sectionTitle="My Work" />
          </div>
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-gdgoc-blue shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gdgoc-blue flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="p-1 rounded hover:bg-blue-100 text-gdgoc-blue cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            MEMBER STATISTICS METRICS
            --------------------------------------------------------------------- */}
        <div data-tour="mywork-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Assigned Tasks */}
          <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: 'var(--surface-red)' }}>
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
          <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: 'var(--surface-green)' }}>
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
          <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: 'var(--surface-blue)' }}>
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                Pending Review
              </span>
              <AlertCircle className="w-4 h-4 text-gdgoc-blue" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">
              {memberStats.pendingReview}
            </div>
            <p className="text-[11px] text-blue-700/80 mt-1">Awaiting admin sign off</p>
          </div>

          {/* Completed */}
          <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: 'var(--surface-red)' }}>
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Completed
              </span>
              <CheckCircle2 className="w-4 h-4 text-gdgoc-green" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
              {memberStats.completed}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Approved milestones</p>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            FILTER & SEARCH BAR
            --------------------------------------------------------------------- */}
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 card-bb flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gdgoc-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my tasks..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gdgoc-gray-50 rounded-lg card-bb-sm focus:outline-none focus:ring-2 focus:ring-gdgoc-blue focus:bg-white transition-all placeholder:text-gdgoc-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-gdgoc-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-gdgoc-gray-50 rounded-lg card-bb-sm text-gdgoc-gray-700 focus:outline-none focus:ring-2 focus:ring-gdgoc-blue w-full sm:w-auto cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Assigned">Assigned (To Accept)</option>
              <option value="In Progress">In Progress (Active)</option>
              <option value="Pending Review">Pending Review (In Review)</option>
              <option value="Completed">Completed (Done)</option>
            </select>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            TASK LIST TABLE (CLICKABLE ROWS)
            --------------------------------------------------------------------- */}
        <div data-tour="mywork-tasklist" className="bg-white rounded-xl border border-gdgoc-gray-200 card-bb overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gdgoc-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-gdgoc-green" />
              <h2 className="text-base font-bold text-gdgoc-gray-900">
                My Assigned Tasks ({displayedTasks.length})
              </h2>
            </div>
            <span className="text-xs text-gdgoc-gray-400">
              Assigned to {displayName(user?.name, user?.email) || 'you'}
            </span>
          </div>

          {displayedTasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gdgoc-gray-100 text-gdgoc-gray-400 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gdgoc-gray-800">No assigned tasks</p>
              <p className="text-xs text-gdgoc-gray-500 max-w-sm mx-auto">
                No tasks match your current filters. Any new tasks assigned to you by team leaders will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gdgoc-gray-50/80 border-b border-gdgoc-gray-200 text-[11px] font-bold uppercase tracking-wider text-gdgoc-gray-600 select-none">
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTasks.map((task) => {
                    const isDeadlineNotSpecified =
                      !task.deadline ||
                      task.deadline.toLowerCase() === 'not specified' ||
                      task.deadline.toLowerCase().includes('not specified');

                    const isAssigned = task.status === 'Assigned' || task.status === 'To Do';
                    const isInProgress = task.status === 'In Progress';
                    const isPendingReview = task.status === 'Pending Review';
                    const isCompleted = task.status === 'Completed';

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

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            {/* Accept Button for newly assigned tasks */}
                            {isAssigned && (
                              <button
                                type="button"
                                onClick={() => handleAcceptTask(task)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gdgoc-blue hover:bg-blue-600 text-white text-[11px] font-bold shadow-2xs hover:shadow transition-all cursor-pointer"
                                title="Accept this task and begin work"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Accept</span>
                              </button>
                            )}

                            {/* Done Button for in-progress tasks */}
                            {isInProgress && (
                              <button
                                type="button"
                                onClick={() => handleSubmitDone(task)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs hover:shadow transition-all cursor-pointer animate-pulse"
                                title="Mark as Done & request admin review"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Done</span>
                              </button>
                            )}

                            {/* In Review badge */}
                            {isPendingReview && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-purple-500" />
                                <span>In Review</span>
                              </span>
                            )}

                            {/* Done badge */}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-emerald-700 border border-green-200 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Done</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-gdgoc-gray-100 text-[11px] font-semibold text-gdgoc-gray-700 transition-colors card-bb-sm cursor-pointer"
                              title="View full task details"
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

        {/* Task Details Modal */}
        <TaskDetailsModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onAccept={handleAcceptTask}
          onSubmitForReview={handleSubmitDone}
          userRole="MEMBER"
        />
      </div>
    </div>
  );
};
