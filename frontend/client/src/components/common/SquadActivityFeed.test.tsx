// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SquadActivityFeed } from './SquadActivityFeed';
import { taskApi } from '../../services/api';
vi.mock('../../services/api', () => ({ taskApi: { getActivityFeed: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it('shows an honest empty feed instead of fabricated approvals', async () => {
  vi.mocked(taskApi.getActivityFeed).mockResolvedValue([]);
  render(<SquadActivityFeed />);
  expect(await screen.findByText('No recent activity.')).toBeTruthy();
  expect(screen.queryByText('Aditya Rajput')).toBeNull();
});
it('shows a retryable error instead of falling back to fake activity', async () => {
  vi.mocked(taskApi.getActivityFeed)
    .mockRejectedValueOnce(new Error('Activity unavailable'))
    .mockResolvedValueOnce([]);
  render(<SquadActivityFeed />);
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Activity unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh activity' }));
  expect(await screen.findByText('No recent activity.')).toBeTruthy();
});
