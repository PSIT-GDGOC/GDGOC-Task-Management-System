// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { notificationApi } from '../../services/api';
vi.mock('../../auth/authContext', () => ({
  useAuth: () => ({ user: { id: 'member', role: 'MEMBER' } }),
}));
vi.mock('../../services/api', () => ({
  notificationApi: { getNotifications: vi.fn(), markAllAsRead: vi.fn(), markAsRead: vi.fn() },
}));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(notificationApi.getNotifications).mockResolvedValue({
    notifications: [
      {
        id: 'notification',
        taskId: 'task',
        userId: 'member',
        kind: 'TASK_ASSIGNED',
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ],
    unreadCount: 1,
  });
});
afterEach(cleanup);
it('preserves unread notifications if the server rejects marking them read', async () => {
  vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(new Error('Offline'));
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'View notifications' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Mark all read' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('Unable to mark'),
  );
  expect(screen.getByText('1 new')).toBeTruthy();
});
it('does not report all caught up when notification loading fails', async () => {
  vi.mocked(notificationApi.getNotifications).mockRejectedValue(new Error('Offline'));
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'View notifications' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByText('All caught up!')).toBeNull();
});
