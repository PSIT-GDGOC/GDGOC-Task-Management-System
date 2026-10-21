import React, { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Task, TaskStatus } from '../../types/task';
import { Column } from './Column';
import { useReviewTask, useDeleteTask } from '../../hooks/useTasks';

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
  const reviewMutation = useReviewTask();
  const deleteMutation = useDeleteTask();

  const [reviewModalTask, setReviewModalTask] = useState<Task | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState<'APPROVED' | 'SENT_BACK'>('APPROVED');
  const [reviewComment, setReviewComment] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleReviewClick = (task: Task, outcome: 'APPROVED' | 'SENT_BACK') => {
    setReviewModalTask(task);
    setReviewOutcome(outcome);
    setReviewComment('');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalTask) return;

    try {
      await reviewMutation.mutateAsync({
        taskId: reviewModalTask.id,
        payload: { outcome: reviewOutcome, reviewComment },
      });
      setFeedbackMessage(
        reviewOutcome === 'APPROVED'
          ? 'Task approved and moved to Done!'
          : 'Task sent back to In Progress with review feedback.',
      );
      setReviewModalTask(null);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to submit review');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteMutation.mutateAsync(taskId);
      setFeedbackMessage('Task soft-deleted successfully.');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to delete task');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Synchronizing Admin Board...</p>
      </div>
    );
  }

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

      <DndContext>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              accentColor={col.accentColor}
              tasks={tasks.filter((t) => t.status === col.id)}
              onReview={handleReviewClick}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>

      {/* Review Dialog Modal */}
      {reviewModalTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {reviewOutcome === 'APPROVED' ? 'Approve Task & Mark Done' : 'Send Task Back for Revisions'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Task: <span className="font-semibold text-gray-800">{reviewModalTask.title}</span>
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reviewer Feedback / Comments
                </label>
                <textarea
                  rows={4}
                  required={reviewOutcome === 'SENT_BACK'}
                  placeholder={
                    reviewOutcome === 'APPROVED'
                      ? 'Optional approval note or accolades...'
                      : 'Detail the revisions required by the member...'
                  }
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalTask(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${
                    reviewOutcome === 'APPROVED'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {reviewMutation.isPending
                    ? 'Recording...'
                    : reviewOutcome === 'APPROVED'
                    ? 'Confirm Approval'
                    : 'Send Back to In Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
