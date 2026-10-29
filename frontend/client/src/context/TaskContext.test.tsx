// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { TaskProvider, useTasks } from './TaskContext';
import { taskApi } from '../services/api';
import type { Task } from '../types/task';
vi.mock('../services/api', () => ({
  taskApi: {
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    startTask: vi.fn(),
    submitTask: vi.fn(),
    reviewTask: vi.fn(),
  },
}));
const identity = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock('../auth/authContext', () => ({ useAuth: () => identity }));
let context: ReturnType<typeof useTasks>;
const task = { id: 'task-1', title: 'Real task', status: 'Assigned' } as Task;
function Probe() {
  context = useTasks();
  return <span>{context.tasks.length}</span>;
}
const tree = () => (
  <TaskProvider>
    <Probe />
  </TaskProvider>
);
beforeEach(() => {
  vi.resetAllMocks();
  identity.user = { id: 'member-a' };
  vi.mocked(taskApi.fetchTasks).mockResolvedValue([task]);
});
afterEach(cleanup);
describe('Persisted task state', () => {
  it('loads tasks after login and clears them on logout', async () => {
    identity.user = null;
    const view = render(tree());
    expect(taskApi.fetchTasks).not.toHaveBeenCalled();
    identity.user = { id: 'member-a' };
    view.rerender(tree());
    await waitFor(() => expect(context.tasks).toEqual([task]));
    identity.user = null;
    view.rerender(tree());
    expect(context.tasks).toEqual([]);
  });
  it('leaves task state unchanged after rejected start, submit, approval, or creation', async () => {
    render(tree());
    await waitFor(() => expect(context.tasks).toEqual([task]));
    for (const [api, action] of [
      [taskApi.startTask, () => context.acceptTask(task.id)],
      [taskApi.submitTask, () => context.submitTask(task.id)],
      [taskApi.reviewTask, () => context.approveTask(task.id)],
      [
        taskApi.createTask,
        () =>
          context.assignTask({
            title: 'Create',
            description: 'Failed creation',
            teamId: 'tech',
            assigneeId: 'member-a',
            deadline: '',
          }),
      ],
    ] as const) {
      vi.mocked(api).mockRejectedValue(new Error('Server rejected operation'));
      await act(async () => {
        await expect(action()).rejects.toThrow('Server rejected');
      });
      expect(context.tasks).toEqual([task]);
    }
  });
  it('waits for server confirmation and coalesces repeated clicks', async () => {
    render(tree());
    await waitFor(() => expect(context.tasks).toEqual([task]));
    let resolve!: (task: Task) => void;
    vi.mocked(taskApi.startTask).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const first = context.acceptTask(task.id);
    const second = context.acceptTask(task.id);
    expect(first).toBe(second);
    expect(taskApi.startTask).toHaveBeenCalledTimes(1);
    expect(context.tasks[0].status).toBe('Assigned');
    const saved = { ...task, status: 'In Progress' as const };
    await act(async () => {
      resolve(saved);
      await first;
    });
    expect(context.tasks).toEqual([saved]);
  });
  it('ignores a late response belonging to the previous user', async () => {
    let resolve!: (tasks: Task[]) => void;
    vi.mocked(taskApi.fetchTasks)
      .mockReturnValueOnce(
        new Promise((done) => {
          resolve = done;
        }),
      )
      .mockResolvedValueOnce([]);
    const view = render(tree());
    identity.user = { id: 'member-b' };
    view.rerender(tree());
    await act(async () => {
      resolve([task]);
    });
    expect(context.tasks).toEqual([]);
  });
});
