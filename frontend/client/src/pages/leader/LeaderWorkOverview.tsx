import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import { TEAMS } from '../../data/mockData';
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
  ArrowLeft, 
  PlusCircle, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  Paperclip,
  FolderOpen,
  Award
} from 'lucide-react';

const LEADER_TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="leader-header"]',
    title: 'Lead Deliverables Hub',
    description: 'Monitor cross-department sprints, track completion velocity, and oversee student developers across all GDGOC tracks.',
    badge: 'Lead Overview',
  },
  {
    selector: '[data-tour="leader-filter"]',
    title: 'Multi-Team Filtering',
    description: 'Filter instantly by team (Tech, Media, Content, Core) or task status to target deliverables requiring review.',
    badge: 'Quick Filters',
  },
  {
    selector: '[data-tour="leader-task-table"]',
    title: 'Milestone Verification & Approval',
    description: 'Review submitted pull requests and click "Approve" with one tap to mark milestones completed with verification stamps.',
    badge: 'Approval Action',
  },
];

export const LeaderWorkOverview: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, approveTask } = useTasks();

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
  const handleApproveTask = (task: Task, e?: React.MouseEvent) => {
    const updated = approveTask(task.id);
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
        subtitle: 'Milestone marked as Completed and verified in sprint analytics.',
      });

      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
    }
  };

  // Filter tasks based on search, team, and status
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchesTeam = teamFilter === 'ALL' || task.teamId === teamFilter;
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesTeam && matchesSearch;
    });
  }, [tasks, statusFilter, teamFilter, searchQuery]);

  return (
    <div className="space-y-6 text-left relative">
      {/* ---------------------------------------------------------------------
          NAVIGATION & BACK BUTTON
          --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between animate-hero-reveal reveal-delay-1">
        <button
          type="button"
          onClick={() => navigate('/leader/overview')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gdgoc-gray-600 hover:text-gdgoc-blue transition-colors p-1 -ml-1 rounded cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/leader/assign-work')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer hover:shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Assign Work</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------
          PAGE TITLE & HEADER (Hero Reveal Animation)
          --------------------------------------------------------------------- */}
      <div 
        data-tour="leader-header"
        className="space-y-1 animate-hero-reveal reveal-delay-2"
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold uppercase tracking-wider text-gdgoc-blue">
          Sprint Deliverables
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gdgoc-gray-900 tracking-tight">
          View Work
        </h1>
        <p className="text-xs sm:text-sm text-gdgoc-gray-600">
          Track sprint deliverables, assigned members, and task deadlines across teams. Click any task row to inspect full details.
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          SEARCH & FILTER TOOLBAR (Hero Reveal Staggered)
          --------------------------------------------------------------------- */}
      <div 
        data-tour="leader-filter"
        className="bg-white rounded-xl border border-gdgoc-gray-200 p-4 shadow-2xs space-y-3 animate-hero-reveal reveal-delay-3"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search by Task Title or Assignee */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gdgoc-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task title or assignee..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gdgoc-blue focus:bg-white transition-all placeholder:text-gdgoc-gray-400"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Filter by Team */}
            <div className="flex items-center gap-1 text-xs text-gdgoc-gray-600 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-gdgoc-gray-400 flex-shrink-0" />
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-2.5 py-2 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg text-gdgoc-gray-700 focus:outline-none focus:ring-2 focus:ring-gdgoc-blue w-full sm:w-auto cursor-pointer"
              >
                <option value="ALL">All Teams</option>
                {TEAMS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1 text-xs text-gdgoc-gray-600 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 text-xs bg-gdgoc-gray-50 border border-gdgoc-gray-200 rounded-lg text-gdgoc-gray-700 focus:outline-none focus:ring-2 focus:ring-gdgoc-blue w-full sm:w-auto cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          TASK DELIVERABLES TABLE (Hero Reveal Staggered)
          --------------------------------------------------------------------- */}
      <div 
        data-tour="leader-task-table"
        className="bg-white rounded-xl border border-gdgoc-gray-200 shadow-2xs overflow-hidden animate-hero-reveal reveal-delay-4"
      >
        <div className="px-5 py-3.5 border-b border-gdgoc-gray-100 flex items-center justify-between bg-gdgoc-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gdgoc-blue" />
            <h2 className="text-xs sm:text-sm font-bold text-gdgoc-gray-800">
              Deliverables ({filteredTasks.length})
            </h2>
          </div>
          <span className="text-[11px] text-gdgoc-gray-500 hidden sm:inline">
            Click any row or button to view task deliverables & approve
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-2">
            <FolderOpen className="w-10 h-10 text-gdgoc-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gdgoc-gray-700">No tasks found</h3>
            <p className="text-xs text-gdgoc-gray-500 max-w-sm mx-auto">
              No tasks match your selected filter criteria. Try selecting another team or clearing your search term.
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
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gdgoc-gray-100">
                {filteredTasks.map((task) => {
                  const isDeadlineNotSpecified =
                    !task.deadline ||
                    task.deadline.toLowerCase() === 'not specified' ||
                    task.deadline.toLowerCase().includes('not specified');

                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleOpenTaskDetails(task)}
                      className="group hover:bg-blue-50/40 transition-colors border-b border-gdgoc-gray-100 last:border-b-0 cursor-pointer select-none"
                    >
                      {/* 1. Task Title */}
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

                      {/* 2. Description (Truncated preview in table) */}
                      <td className="py-3.5 px-4 text-xs text-gdgoc-gray-600 max-w-sm">
                        <p className="line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      </td>

                      {/* 3. Team */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gdgoc-gray-100 text-[11px] font-medium text-gdgoc-gray-700">
                          {task.teamName}
                        </span>
                      </td>

                      {/* 4. Assigned To */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-gdgoc-blue border border-blue-200 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {task.assigneeInitials}
                          </div>
                          <span className="text-xs font-semibold text-gdgoc-gray-800">
                            {task.assigneeName}
                          </span>
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TaskStatusBadge status={task.status} />
                      </td>

                      {/* 6. Deadline */}
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

                      {/* 7. Actions with Click Success */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {task.status === 'Pending Review' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveTask(task, e);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gdgoc-green hover:bg-emerald-600 active:scale-95 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer animate-click-pop"
                              title="Approve Work Deliverable"
                            >
                              <Award className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTaskDetails(task);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gdgoc-gray-200 bg-white group-hover:border-gdgoc-blue group-hover:text-gdgoc-blue text-[11px] font-semibold text-gdgoc-gray-700 transition-colors shadow-2xs cursor-pointer"
                            title="Open Task Details"
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
      <CursorTour steps={LEADER_TOUR_STEPS} tourKey="gdgoc_leader_tour_completed" />

      {/* ---------------------------------------------------------------------
          CELEBRATION NOTIFICATION
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
        onClose={handleCloseModal}
        onApprove={(task) => handleApproveTask(task)}
        userRole="TEAM_LEADER"
      />
    </div>
  );
};
