import React from 'react';
import { Task } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Calendar } from 'lucide-react';

interface TaskRowProps {
  task: Task;
  showTeam?: boolean;
  onSelect?: (task: Task) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, showTeam = true, onSelect }) => {
  return (
    <tr 
      onClick={() => onSelect && onSelect(task)}
      className={`transition-colors border-b border-gdgoc-gray-100 last:border-b-0 text-left ${
        onSelect ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-gdgoc-gray-50/80'
      }`}
    >
      {/* Title & Description preview */}
      <td className="py-3.5 px-4">
        <div className="font-semibold text-xs sm:text-sm text-gdgoc-gray-900 leading-snug">
          {task.title}
        </div>
        <div className="text-[11px] text-gdgoc-gray-500 line-clamp-1 mt-0.5 max-w-md">
          {task.description}
        </div>
      </td>

      {/* Team */}
      {showTeam && (
        <td className="py-3.5 px-4 text-xs font-medium text-gdgoc-gray-700 whitespace-nowrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gdgoc-gray-100 text-[11px] text-gdgoc-gray-700">
            {task.teamName}
          </span>
        </td>
      )}

      {/* Assigned Member */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-50 text-gdgoc-blue border border-blue-200 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {task.assigneeInitials}
          </div>
          <span className="text-xs font-medium text-gdgoc-gray-800">
            {task.assigneeName}
          </span>
        </div>
      </td>

      {/* Priority */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <PriorityBadge priority={task.priority} />
      </td>

      {/* Deadline */}
      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gdgoc-gray-600">
        <div className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gdgoc-gray-400" />
          <span>{task.deadline}</span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3.5 px-4 whitespace-nowrap text-right sm:text-left">
        <TaskStatusBadge status={task.status} />
      </td>
    </tr>
  );
};
