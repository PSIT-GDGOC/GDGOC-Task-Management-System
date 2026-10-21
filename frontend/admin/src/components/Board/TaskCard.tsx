import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Task } from '../../types/task';
import { Clock, Tag, ExternalLink, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onReview?: (task: Task, outcome: 'APPROVED' | 'SENT_BACK') => void;
  onDelete?: (taskId: string) => void;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200 font-semibold',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onReview, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  const latestSubmission = task.submissions?.[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 ring-2 ring-blue-500 shadow-xl' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${
            priorityColors[task.priority] || priorityColors.MEDIUM
          }`}
        >
          {task.priority}
        </span>
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-medium text-gray-500">
            {task.scope === 'WHOLE_CLUB' ? (
              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Whole Club
              </span>
            ) : (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {task.team?.name || 'Team'}
              </span>
            )}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Soft delete this task?')) onDelete(task.id);
              }}
              title="Delete Task"
              className="text-gray-400 hover:text-red-500 p-0.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 text-sm mb-1 leading-snug">{task.title}</h4>
      <p className="text-gray-600 text-xs line-clamp-2 mb-3">{task.description}</p>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
            >
              <Tag className="w-2.5 h-2.5 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Pull Request Link info if In Review or Done */}
      {latestSubmission?.prUrl && (
        <div className="mb-2 p-2 bg-purple-50/70 border border-purple-200 rounded text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-900 text-[11px]">Submitted PR:</span>
            <a
              href={latestSubmission.prUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:underline inline-flex items-center text-[11px]"
            >
              View PR <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
          {latestSubmission.note && (
            <p className="text-gray-600 text-[11px] mt-1 line-clamp-1 italic">
              "{latestSubmission.note}"
            </p>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          {task.deadline ? (
            <span className="flex items-center text-[11px] text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(task.deadline).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">No deadline</span>
          )}
        </div>

        {task.assignee ? (
          <span className="text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
            👤 {task.assignee.name.split(' ')[0]}
          </span>
        ) : (
          <span className="text-[11px] text-gray-400 italic">Unassigned</span>
        )}
      </div>

      {/* Admin Action Review Buttons */}
      {task.status === 'IN_REVIEW' && onReview && (
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReview(task, 'SENT_BACK');
            }}
            className="inline-flex items-center text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Send Back
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReview(task, 'APPROVED');
            }}
            className="inline-flex items-center text-[11px] font-medium text-white bg-green-600 hover:bg-green-700 px-2.5 py-1 rounded transition-colors"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approve
          </button>
        </div>
      )}
    </div>
  );
};
