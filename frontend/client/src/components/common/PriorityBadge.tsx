import React from 'react';
import { Priority } from '../../types/task';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority?: Priority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority = 'Medium', size = 'sm' }) => {
  const getConfig = () => {
    switch (priority) {
      case 'High':
        return {
          icon: <ArrowUp className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-red-50 text-gdgoc-red border-red-200',
        };
      case 'Medium':
        return {
          icon: <ArrowRight className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'Low':
        return {
          icon: <ArrowDown className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-gdgoc-gray-100 text-gdgoc-gray-600 border-gdgoc-gray-200',
        };
    }
  };

  const config = getConfig();

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium border rounded-md select-none ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${config.classes}`}
    >
      {config.icon}
      <span>{priority}</span>
    </span>
  );
};
