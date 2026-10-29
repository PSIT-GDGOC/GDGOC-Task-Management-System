import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import { useTeams } from '../../hooks/useTeams';
import { Task } from '../../types/task';
import { TaskStatusBadge } from '../../components/common/TaskStatusBadge';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal';
import { 
  CelebrationNotification, 
  CelebrationState 
} from '../../components/common/CelebrationNotification';
import { triggerCelebrationBurst } from '../../utils/confetti';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  Eye, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';

export const AdminTasksPage: React.FC = () => {
  const { teams: TEAMS } = useTeams();
  const navigate = useNavigate();
  const { tasks, approveTask, refreshTasks } = useTasks();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected task for Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Click celebration state
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  const handleOpenTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // Handle Approve Deliverable with Celebratory Burst
  const handleApproveTask = async (task: Task, e?: React.MouseEvent) => {
    const updated = await approveTask(task.id);
    if (updated) {
      if (e) {
        triggerCelebrationBurst({
          x: e.clientX,
          y: e.clientY,
          count: 90,
          colors: ['#34A853', '#4285F4', '#FBBC04', '#EA4335', '#10B981'],
        });
      } else {
        triggerCelebrationBurst({
          count: 90,
          colors: ['#34A853', '#4285F4', '#FBBC04', '#EA4335', '#10B981'],
        });
      }

      setCelebration({
        isOpen: true,
        type: 'approve',
        taskTitle: task.title,
        subtitle: 'Milestone verified and signed off in Chapter records.',
      });

      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
    }
  };

  // Filtered tasks calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        task.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesTeam =
        teamFilter === 'ALL' ||
        task.teamId.toLowerCase() === teamFilter.toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesTeam && matchesSearch;
    });
  }, [tasks, statusFilter, teamFilter, searchQuery]);

  // Global KPIs
  const metrics = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress' || t.status === 'Assigned').length;
    const underReview = tasks.filter((t) => t.status === 'Pending Review').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    return { total, inProgress, underReview, completed };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Celebration Notification */}
      <CelebrationNotification
        state={celebration}
        onClose={() => setCelebration(null)}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
              Club-Wide Deliverables
            </h1>
            <span className="bg-red-50 text-gdgoc-red border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Admin Backlog
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gdgoc-gray-500">
            Global task oversight across all tracks. Review pull requests, verify milestones, and govern deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshTasks()}
            className="px-3 py-2 text-xs font-medium text-gdgoc-gray-700 bg-white border border-gdgoc-gray-200 rounded-lg hover:bg-gdgoc-gray-50 transition-colors shadow-2xs"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/assign-work')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gdgoc-blue hover:bg-blue-600 rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Deliverable</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-gdgoc-blue flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gdgoc-gray-500 uppercase tracking-wider">Total Tasks</p>
            <p className="text-xl font-bold text-gdgoc-gray-900 mt-0.5">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gdgoc-gray-500 uppercase tracking-wider">Active / Progress</p>
            <p className="text-xl font-bold text-gdgoc-gray-900 mt-0.5">{metrics.inProgress}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gdgoc-gray-500 uppercase tracking-wider">Under Review</p>
            <p className="text-xl font-bold text-gdgoc-gray-900 mt-0.5">{metrics.underReview}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-gdgoc-green flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gdgoc-gray-500 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-gdgoc-gray-900 mt-0.5">{metrics.completed}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gdgoc-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by task title, assignee, or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-gdgoc-blue/20 focus:border-gdgoc-blue text-gdgoc-gray-900 placeholder-gdgoc-gray-400"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Squad / Track */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gdgoc-gray-400" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg font-medium text-gdgoc-gray-700 focus:outline-hidden focus:border-gdgoc-blue"
            >
              <option value="ALL">All Squads</option>
              {TEAMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gdgoc-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg font-medium text-gdgoc-gray-700 focus:outline-hidden focus:border-gdgoc-blue"
            >
              <option value="ALL">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deliverables Table */}
      <div className="bg-white rounded-xl border border-gdgoc-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gdgoc-gray-700">
            <thead className="bg-gdgoc-gray-50 border-b border-gdgoc-gray-200 text-gdgoc-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Deliverable & ID</th>
                <th className="py-3 px-4">Squad</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gdgoc-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gdgoc-gray-400">
                    <p className="text-sm font-medium">No deliverables found</p>
                    <p className="text-xs mt-1 text-gdgoc-gray-400">
                      Try adjusting filters or search query.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isUnderReview = task.status === 'Pending Review';
                  const isCompleted = task.status === 'Completed';

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-gdgoc-gray-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenTaskDetails(task)}
                    >
                      {/* Title & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gdgoc-gray-900 group-hover:text-gdgoc-blue transition-colors line-clamp-1 max-w-xs">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-gdgoc-gray-400 font-mono mt-0.5">
                          {task.id}
                        </div>
                      </td>

                      {/* Squad */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gdgoc-gray-100 text-gdgoc-gray-700">
                          {task.teamName}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-gdgoc-blue flex items-center justify-center font-bold text-[10px]">
                            {task.assigneeInitials}
                          </div>
                          <div>
                            <p className="font-medium text-gdgoc-gray-900 leading-tight">
                              {task.assigneeName}
                            </p>
                            <p className="text-[10px] text-gdgoc-gray-400 leading-tight">
                              {task.assigneeEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TaskStatusBadge status={task.status} />
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gdgoc-gray-600 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-gdgoc-gray-400" />
                          <span>{task.deadline || 'No deadline'}</span>
                        </div>
                      </td>

                      {/* Governance Actions */}
                      <td
                        className="py-3.5 px-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve Milestone Button */}
                          {!isCompleted && (
                            <button
                              onClick={(e) => { void handleApproveTask(task, e).catch(() => {}); }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shadow-2xs ${
                                isUnderReview
                                  ? 'bg-gdgoc-green text-white hover:bg-emerald-600 animate-pulse'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Sign off & mark completed"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Sign Off</span>
                            </button>
                          )}

                          {/* View Details */}
                          <button
                            onClick={() => handleOpenTaskDetails(task)}
                            className="p-1.5 text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 rounded-md transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={isModalOpen}
        task={selectedTask}
        onClose={handleCloseModal}
        onApprove={(t) => handleApproveTask(t)}
        userRole="ADMIN"
      />
    </div>
  );
};
