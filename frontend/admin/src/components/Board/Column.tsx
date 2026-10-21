import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Task, TaskStatus } from '../../types/task';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  accentColor: string;
  onReview?: (task: Task, outcome: 'APPROVED' | 'SENT_BACK') => void;
  onDelete?: (taskId: string) => void;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  tasks,
  accentColor,
  onReview,
  onDelete,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-slate-100/80 rounded-xl border p-3 min-w-[280px] w-full max-w-[320px] transition-colors ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-50/40' : 'border-slate-200'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
          <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
          {tasks.length}
        </span>
      </div>

      {/* Task Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onReview={onReview}
            onDelete={onDelete}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs text-center">
            No tasks in this column
          </div>
        )}
      </div>
    </div>
  );
};
