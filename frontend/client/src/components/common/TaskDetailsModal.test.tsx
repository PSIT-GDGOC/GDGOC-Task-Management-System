// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TaskDetailsModal } from './TaskDetailsModal';
import type { Task } from '../../types/task';
afterEach(cleanup);
const task: Task = {
  id: 'task',
  title: 'Review milestone',
  description: 'Complete milestone',
  status: 'Pending Review',
  teamId: 'tech',
  teamName: 'Tech',
  assigneeId: 'member',
  assigneeName: 'Member',
  assigneeEmail: 'member@example.com',
  assigneeInitials: 'M',
  deadline: 'Not specified',
};
it('keeps the task dialog and error visible when approval is rejected', async () => {
  const close = vi.fn(),
    approve = vi.fn().mockRejectedValue(new Error('Cannot approve your own submission'));
  render(
    <MemoryRouter>
      <TaskDetailsModal
        task={task}
        isOpen
        userRole="TEAM_LEADER"
        onClose={close}
        onApprove={approve}
      />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Approve & Sign Off' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Cannot approve your own submission',
  );
  expect(close).not.toHaveBeenCalled();
});
it('waits for approval and prevents duplicate requests while it is pending', async () => {
  let resolve!: () => void;
  const close = vi.fn(),
    approve = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
  render(
    <MemoryRouter>
      <TaskDetailsModal
        task={task}
        isOpen
        userRole="TEAM_LEADER"
        onClose={close}
        onApprove={approve}
      />
    </MemoryRouter>,
  );
  const button = screen.getByRole('button', { name: 'Approve & Sign Off' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(approve).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
  await act(async () => resolve());
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});
