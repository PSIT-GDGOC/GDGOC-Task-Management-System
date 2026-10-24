import React, { useEffect } from 'react';
import { Task } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { PriorityBadge } from './PriorityBadge';
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
  Award,
  SendHorizontal,
  Sparkles
} from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen?: boolean;
  onClose: () => void;
  onClaim?: (task: Task) => void;
  onApprove?: (task: Task) => void;
  onSubmitForReview?: (task: Task) => void;
  userRole?: 'ADMIN' | 'TEAM_LEADER' | 'MEMBER';
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen = true,
  onClose,
  onClaim,
  onApprove,
  onSubmitForReview,
}) => {
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
              {task.priority && <PriorityBadge priority={task.priority} />}
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

          {/* Attached Documents & Files */}
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

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-gdgoc-gray-100 bg-gdgoc-gray-50 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-gdgoc-gray-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-gdgoc-gray-200 text-[10px] font-mono">ESC</kbd> or click outside to close
          </span>

          <div className="flex items-center gap-2">
            {/* 1. Member Claim Action */}
            {onClaim && task.status === 'Assigned' && (
              <button
                type="button"
                onClick={() => onClaim(task)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gdgoc-blue hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer animate-click-pop hover:shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claim Task</span>
              </button>
            )}

            {/* 2. Member Submit Action */}
            {onSubmitForReview && task.status === 'In Progress' && (
              <button
                type="button"
                onClick={() => onSubmitForReview(task)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer animate-click-pop"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Submit For Review</span>
              </button>
            )}

            {/* 3. Lead Approve Action */}
            {onApprove && task.status === 'Pending Review' && (
              <button
                type="button"
                onClick={() => onApprove(task)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gdgoc-green hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer animate-click-pop"
              >
                <Award className="w-4 h-4" />
                <span>Approve Deliverable</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gdgoc-gray-300 bg-white hover:bg-gdgoc-gray-100 text-xs font-semibold text-gdgoc-gray-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
