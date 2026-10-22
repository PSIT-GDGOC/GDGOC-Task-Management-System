import React from 'react';
import { TaskStatus } from '../../types/task';
import { Clock, CheckCircle2, AlertCircle, CircleDashed, UserCheck } from 'lucide-react';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Assigned':
        return {
          icon: <UserCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-blue-50 text-gdgoc-blue border-blue-200',
        };
      case 'To Do':
        return {
          icon: <CircleDashed className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-gdgoc-gray-100 text-gdgoc-gray-700 border-gdgoc-gray-200',
        };
      case 'In Progress':
        return {
          icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'Pending Review':
        return {
          icon: <AlertCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-blue-50 text-gdgoc-blue border-blue-200',
        };
      case 'Completed':
        return {
          icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-md select-none ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${config.classes}`}
    >
      {config.icon}
      <span>{status}</span>
    </span>
  );
};
