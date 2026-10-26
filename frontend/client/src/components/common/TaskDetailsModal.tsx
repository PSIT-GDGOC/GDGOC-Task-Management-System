import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { 
  X, 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  Paperclip,
  FileCode,
  Image as ImageIcon,
  FileArchive,
  Play,
  CheckSquare,
  CheckCircle2,
  Sparkles,
  History,
  Check
} from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen?: boolean;
  onClose: () => void | Promise<unknown>;
  onApprove?: (task: Task) => void | Promise<unknown>;
  onAccept?: (task: Task) => void | Promise<unknown>;
  onSubmitForReview?: (task: Task) => void | Promise<unknown>;
  userRole?: string;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen = true,
  onClose,
  onApprove,
  onAccept,
  onSubmitForReview,
  userRole = 'MEMBER',
}) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setError(''); }, [task?.id]);
  const perform = async (action: (task: Task) => void | Promise<unknown>) => {
    if (!task || pending) return;
    setPending(true);
    setError('');
    try { await action(task); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update this task.'); }
    finally { setPending(false); }
  };
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const isDeadlineNotSpecified =
    !task.deadline ||
    task.deadline.toLowerCase() === 'not specified' ||
    task.deadline.toLowerCase().includes('not specified');

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      return <ImageIcon className="w-4 h-4 text-blue-500" />;
    }
    if (ext === 'zip') {
      return <FileArchive className="w-4 h-4 text-amber-500" />;
    }
    return <FileCode className="w-4 h-4 text-gdgoc-gray-500" />;
  };

  const isAssigned = task.status === 'Assigned' || task.status === 'To Do';
  const isInProgress = task.status === 'In Progress';
  const isPendingReview = task.status === 'Pending Review';
  const isCompleted = task.status === 'Completed';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border-2 border-[#111111] shadow-[8px_8px_0_#111111] overflow-hidden flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#111111] flex items-start justify-between gap-4 bg-gdgoc-gray-50/70">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#111111] text-gdgoc-gray-700">
                {task.id}
              </span>
              <TaskStatusBadge status={task.status} />
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gdgoc-gray-600 bg-white border border-[#111111] px-2 py-0.5 rounded">
                <Users className="w-3 h-3 text-gdgoc-gray-400" />
                {task.teamName}
              </span>
            </div>
            <h2 id="task-detail-title" className="text-lg sm:text-xl font-bold text-gdgoc-gray-900 leading-snug pt-1">
              {task.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gdgoc-gray-400 hover:text-gdgoc-gray-700 hover:bg-gdgoc-gray-100 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {pending && <p role="status" className="text-sm">Saving task…</p>}
          {/* Key Task Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gdgoc-gray-50/80 border border-[#111111] shadow-[2px_2px_0_#111111]">
            {/* Assigned Member */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400 block mb-1">
                Assigned To
              </span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-gdgoc-blue border border-blue-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {task.assigneeInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gdgoc-gray-900 truncate">
                    {task.assigneeName}
                  </p>
                  <p className="text-[10px] text-gdgoc-gray-500 font-mono truncate">
                    {task.assigneeEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400 block mb-1">
                Deadline
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gdgoc-gray-800">
                <Calendar className="w-4 h-4 text-gdgoc-gray-400 flex-shrink-0" />
                <span>
                  {isDeadlineNotSpecified ? (
                    <span className="text-gdgoc-gray-500 font-normal italic">
                      Deadline not specified
                    </span>
                  ) : (
                    task.deadline
                  )}
                </span>
              </div>
            </div>

            {/* Creation Date */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gdgoc-gray-400 block mb-1">
                Created On
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gdgoc-gray-700">
                <Clock className="w-4 h-4 text-gdgoc-gray-400 flex-shrink-0" />
                <span>{task.createdAt || 'Sprint 04'}</span>
              </div>
            </div>
          </div>

          {/* Complete Task Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gdgoc-blue" />
              <span>Full Task Description & Deliverables</span>
            </h3>
            <div className="p-4 rounded-xl bg-white border border-gdgoc-gray-200 text-xs sm:text-sm text-gdgoc-gray-800 leading-relaxed whitespace-pre-wrap font-normal">
              {task.description}
            </div>
          </div>

          {/* Workflow & History Timeline */}
          <div className="space-y-3 p-4 rounded-xl bg-gdgoc-gray-50 border border-gdgoc-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-gdgoc-blue" />
                <span>Milestone Lifecycle & History</span>
              </h3>
              <Link
                to="/history"
                onClick={onClose}
                className="text-[11px] font-semibold text-gdgoc-blue hover:underline inline-flex items-center gap-1"
              >
                <span>View My Work History</span>
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              {/* Step 1: Assigned */}
              <div className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                isAssigned ? 'bg-blue-50 border-blue-300 font-bold text-gdgoc-blue' : 'bg-white border-gdgoc-gray-200 text-gdgoc-gray-600'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  !isAssigned ? 'bg-green-100 text-gdgoc-green' : 'bg-blue-100 text-gdgoc-blue'
                }`}>
                  {!isAssigned ? <Check className="w-3 h-3" /> : '1'}
                </div>
                <span>Assigned</span>
              </div>

              {/* Step 2: In Progress */}
              <div className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                isInProgress ? 'bg-amber-50 border-amber-300 font-bold text-amber-800' : isPendingReview || isCompleted ? 'bg-white border-gdgoc-gray-200 text-gdgoc-gray-600' : 'bg-gdgoc-gray-100 border-gdgoc-gray-200 text-gdgoc-gray-400'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isPendingReview || isCompleted ? 'bg-green-100 text-gdgoc-green' : isInProgress ? 'bg-amber-100 text-amber-700' : 'bg-gdgoc-gray-200 text-gdgoc-gray-500'
                }`}>
                  {isPendingReview || isCompleted ? <Check className="w-3 h-3" /> : '2'}
                </div>
                <span>In Progress</span>
              </div>

              {/* Step 3: In Review */}
              <div className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                isPendingReview ? 'bg-purple-50 border-purple-300 font-bold text-purple-800' : isCompleted ? 'bg-white border-gdgoc-gray-200 text-gdgoc-gray-600' : 'bg-gdgoc-gray-100 border-gdgoc-gray-200 text-gdgoc-gray-400'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted ? 'bg-green-100 text-gdgoc-green' : isPendingReview ? 'bg-purple-100 text-purple-700' : 'bg-gdgoc-gray-200 text-gdgoc-gray-500'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : '3'}
                </div>
                <span>In Review</span>
              </div>

              {/* Step 4: Completed */}
              <div className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                isCompleted ? 'bg-green-50 border-green-300 font-bold text-gdgoc-green' : 'bg-gdgoc-gray-100 border-gdgoc-gray-200 text-gdgoc-gray-400'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted ? 'bg-green-100 text-gdgoc-green' : 'bg-gdgoc-gray-200 text-gdgoc-gray-500'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : '4'}
                </div>
                <span>Done</span>
              </div>
            </div>
          </div>

          {/* Attached Documents & Files (Only if attachments exist) */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-700 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-gdgoc-blue" />
                <span>Attached Documents & Resources ({task.attachments.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl border border-gdgoc-gray-200 bg-gdgoc-gray-50/60 flex items-center justify-between gap-3 hover:bg-white hover:border-gdgoc-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-white border border-gdgoc-gray-200 flex-shrink-0">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-gdgoc-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gdgoc-gray-500">
                          {file.formattedSize}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-gdgoc-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex-shrink-0">
                      Attached
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Status-Driven Actions */}
        <div className="px-6 py-4 border-t border-gdgoc-gray-200 bg-gdgoc-gray-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] text-gdgoc-gray-500">
            {isAssigned && 'Action required: Click Accept to start working on this milestone.'}
            {isInProgress && 'In progress: Mark as Done when your deliverable is ready for lead verification.'}
            {isPendingReview && 'Awaiting review: The Super Admin & Lead have been notified to review.'}
            {isCompleted && 'Completed: This milestone is affirmed and archived in club records.'}
          </div>

          <div className="flex items-center gap-2">
            {/* Crew Member: Accept Button */}
            {isAssigned && onAccept && (
              <button
                type="button"
                disabled={pending}
                onClick={() => void perform(onAccept)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gdgoc-blue hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Accept Task</span>
              </button>
            )}

            {/* Crew Member: Mark Done Button */}
            {isInProgress && onSubmitForReview && (
              <button
                type="button"
                disabled={pending}
                onClick={() => void perform(onSubmitForReview)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer animate-pulse"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Mark as Done (Submit for Review)</span>
              </button>
            )}

            {/* Admin / President: Approve Button */}
            {isPendingReview && onApprove && userRole !== 'MEMBER' && (
              <button
                type="button"
                disabled={pending}
                onClick={() => void perform(onApprove)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gdgoc-green hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Approve & Sign Off</span>
              </button>
            )}

            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-gdgoc-green bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gdgoc-gray-300 bg-white hover:bg-gdgoc-gray-100 text-xs font-semibold text-gdgoc-gray-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
