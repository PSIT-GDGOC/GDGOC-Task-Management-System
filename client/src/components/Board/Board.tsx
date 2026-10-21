import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Task, TaskStatus } from '../../types/task';
import { Column } from './Column';
import { useClaimTask, useStartTask, useSubmitTask } from '../../hooks/useTasks';

interface BoardProps {
  tasks: Task[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; accentColor: string }[] = [
  { id: 'FREE', title: 'Free', accentColor: 'bg-emerald-500' },
  { id: 'ASSIGNED', title: 'Assigned', accentColor: 'bg-blue-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', accentColor: 'bg-amber-500' },
  { id: 'IN_REVIEW', title: 'In Review', accentColor: 'bg-purple-500' },
  { id: 'DONE', title: 'Done', accentColor: 'bg-green-600' },
];

export const Board: React.FC<BoardProps> = ({
  tasks,
  isLoading,
  isError,
  errorMessage,
  onRefresh,
}) => {
  const claimMutation = useClaimTask();
  const startMutation = useStartTask();
  const submitMutation = useSubmitTask();

  const [prModalTask, setPrModalTask] = useState<Task | null>(null);
  const [prUrl, setPrUrl] = useState('');
  const [prNote, setPrNote] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Configure sensors for smooth drag-and-drop
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 6,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === targetStatus) return;

    // Enforce business rules during drag transitions
    try {
      if (task.status === 'FREE' && targetStatus === 'ASSIGNED') {
        await claimMutation.mutateAsync(taskId);
        setFeedbackMessage('Task claimed successfully!');
      } else if (task.status === 'ASSIGNED' && targetStatus === 'IN_PROGRESS') {
        await startMutation.mutateAsync(taskId);
        setFeedbackMessage('Task started!');
      } else if (task.status === 'IN_PROGRESS' && targetStatus === 'IN_REVIEW') {
        setPrModalTask(task);
      } else if (targetStatus === 'DONE') {
        setFeedbackMessage('Only an Admin or authorized Team Head can approve tasks into Done.');
      } else {
        setFeedbackMessage(
          `Workflow transition from ${task.status} to ${targetStatus} must follow formal Kanban stages.`,
        );
      }
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Operation failed');
    }
  };

  const handleClaim = async (taskId: string) => {
    try {
      await claimMutation.mutateAsync(taskId);
      setFeedbackMessage('Task claimed successfully!');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to claim task');
    }
  };

  const handleStart = async (taskId: string) => {
    try {
      await startMutation.mutateAsync(taskId);
      setFeedbackMessage('Task moved to In Progress!');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to start task');
    }
  };

  const handleSubmitPR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prModalTask || !prUrl) return;

    try {
      await submitMutation.mutateAsync({
        taskId: prModalTask.id,
        payload: { prUrl, note: prNote },
      });
      setPrModalTask(null);
      setPrUrl('');
      setPrNote('');
      setFeedbackMessage('Task submitted for admin review!');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to submit PR');
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Synchronizing Kanban Board...</p>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 rounded-xl border border-red-200">
        <div className="text-red-500 text-3xl mb-2">⚠️</div>
        <h3 className="font-semibold text-red-900 text-lg">Unable to load tasks</h3>
        <p className="text-sm text-red-600 mb-4 text-center max-w-md">
          {errorMessage || 'There was an error communicating with the backend server.'}
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs text-blue-600 hover:text-blue-900 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dnd-kit Kanban Columns */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              accentColor={col.accentColor}
              tasks={tasks.filter((t) => t.status === col.id)}
              onClaim={handleClaim}
              onStart={handleStart}
              onSubmitReview={(t) => setPrModalTask(t)}
            />
          ))}
        </div>
      </DndContext>

      {/* PR Submission Modal Dialog */}
      {prModalTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Submit PR for Review</h3>
            <p className="text-xs text-gray-500 mb-4">
              Submitting work for: <span className="font-semibold text-gray-800">{prModalTask.title}</span>
            </p>

            <form onSubmit={handleSubmitPR} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GitHub Pull Request URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/org/repo/pull/42"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Submission Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of changes, edge cases, test steps..."
                  value={prNote}
                  onChange={(e) => setPrNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPrModalTask(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
