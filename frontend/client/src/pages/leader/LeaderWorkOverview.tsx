import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import { TEAMS } from '../../data/mockData';
import { Task } from '../../types/task';
import { TaskStatusBadge } from '../../components/common/TaskStatusBadge';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal';
import { HelpButton } from '../../components/tour/HelpButton';
import { 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  Paperclip,
  FolderOpen
} from 'lucide-react';

export const LeaderWorkOverview: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, approveTask } = useTasks();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected task for Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleOpenTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
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
    <div
      className="relative -m-4 sm:-m-6 lg:-m-8 min-h-full flex-1"
    >
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 text-left">
        {/* ---------------------------------------------------------------------
            NAVIGATION & BACK BUTTON
            --------------------------------------------------------------------- */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/leader/overview')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gdgoc-gray-600 hover:text-gdgoc-blue transition-colors p-1 -ml-1 rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>

          <div className="flex items-center gap-2">
            <HelpButton sectionTourId="leader-view" sectionTitle="View Work" />
            <button
              type="button"
              onClick={() => navigate('/leader/assign-work')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all card-bb"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Assign Work</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            PAGE TITLE & HEADER
            --------------------------------------------------------------------- */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#111111] text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-900 shadow-2xs">
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
          SEARCH & FILTER TOOLBAR
          --------------------------------------------------------------------- */}
      <div data-tour="view-work-filters" className="bg-white rounded-xl p-4 card-bb space-y-3">
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
              placeholder="Search by task title or description..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gdgoc-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gdgoc-blue focus:bg-white transition-all placeholder:text-gdgoc-gray-400 card-bb-sm"
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
                className="px-2.5 py-2 text-xs bg-gdgoc-gray-50 rounded-lg text-gdgoc-gray-700 focus:outline-none focus:ring-2 focus:ring-gdgoc-blue w-full sm:w-auto card-bb-sm"
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 text-xs bg-gdgoc-gray-50 rounded-lg text-gdgoc-gray-700 focus:outline-none focus:ring-2 focus:ring-gdgoc-blue w-full sm:w-auto card-bb-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Tally and Reset link */}
        <div className="flex items-center justify-between text-[11px] text-gdgoc-gray-500 pt-1">
          <span>
            Showing <strong className="text-gdgoc-gray-800">{filteredTasks.length}</strong> of {tasks.length} tasks
          </span>
          {(statusFilter !== 'ALL' || teamFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setTeamFilter('ALL');
                setSearchQuery('');
              }}
              className="text-gdgoc-blue hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          TASK TABLE (RESPONSIVE & CLICKABLE ROWS)
          --------------------------------------------------------------------- */}
      <div data-tour="view-work-list" className="bg-white rounded-xl card-bb overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gdgoc-gray-100 text-gdgoc-gray-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gdgoc-gray-800">No tasks found</p>
            <p className="text-xs text-gdgoc-gray-500 max-w-sm mx-auto">
              No tasks match your current filters. Try resetting search or assign a new task to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gdgoc-gray-50/80 border-b border-gdgoc-gray-200 text-[11px] font-bold uppercase tracking-wider text-gdgoc-gray-600 select-none">
                  <th className="py-3 px-4">1. Task Title</th>
                  <th className="py-3 px-4">2. Description</th>
                  <th className="py-3 px-4">3. Team</th>
                  <th className="py-3 px-4">4. Assigned To</th>
                  <th className="py-3 px-4">5. Status</th>
                  <th className="py-3 px-4">6. Deadline</th>
                  <th className="py-3 px-4 text-center">7. Actions</th>
                </tr>
              </thead>
              <tbody>
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

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTaskDetails(task);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white group-hover:text-gdgoc-blue text-[11px] font-semibold text-gdgoc-gray-700 transition-colors card-bb-sm"
                          title="Open Task Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
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
          TASK DETAILS MODAL
          --------------------------------------------------------------------- */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApprove={(t) => { void approveTask(t.id).then(setSelectedTask).catch(() => {}); }}
        userRole="TEAM_LEADER"
      />
      </div>
    </div>
  );
};

