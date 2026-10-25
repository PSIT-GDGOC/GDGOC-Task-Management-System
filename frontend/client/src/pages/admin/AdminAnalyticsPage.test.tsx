// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { AdminAnalyticsPage } from './AdminAnalyticsPage';
import { adminApi } from '../../services/api';
vi.mock('../../services/api', () => ({ adminApi: { getStatistics: vi.fn() } }));
vi.mock('../../context/TaskContext', () => ({ useTasks: () => ({ tasks: [] }) }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
it('rounds the screenshot lead time to a readable value with its unit', async () => {
  vi.mocked(adminApi.getStatistics).mockResolvedValue({
    totalCompleted: 1,
    onTimeRate: 100,
    averageLeadTimeHours: 0.54795777777777,
  });
  const { container } = render(<AdminAnalyticsPage />);
  expect(await screen.findByText('0.55 hrs')).toBeTruthy();
  expect(screen.getByText('100.0%')).toBeTruthy();
  expect(container.textContent).not.toContain('0.54795777777777');
  expect(screen.queryByText('+4.2% from last sprint')).toBeNull();
});
it('keeps very large values compact', async () => {
  vi.mocked(adminApi.getStatistics).mockResolvedValue({
    totalCompleted: 1,
    onTimeRate: 0,
    averageLeadTimeHours: 1234567.89123,
  });
  render(<AdminAnalyticsPage />);
  expect(await screen.findByText('1.23M hrs')).toBeTruthy();
  expect(screen.getByText('0.0%')).toBeTruthy();
});
it('shows zero hours as a real value', async () => {
  vi.mocked(adminApi.getStatistics).mockResolvedValue({
    totalCompleted: 0,
    onTimeRate: null,
    averageLeadTimeHours: 0,
  });
  render(<AdminAnalyticsPage />);
  expect(await screen.findByText('0 hrs')).toBeTruthy();
});
it('shows no data for missing or invalid metrics and does not invent squad progress', async () => {
  vi.mocked(adminApi.getStatistics).mockResolvedValue({
    totalCompleted: 0,
    onTimeRate: null,
    averageLeadTimeHours: Number.NaN,
  });
  await act(async () => { render(<AdminAnalyticsPage />); });
  expect((await screen.findAllByText('No data')).length).toBe(2);
  const bars = screen.getAllByRole('progressbar');
  for (const bar of bars) {
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.style.width).toBe('0%');
  }
  expect(screen.getAllByText('0/0 Done')).toHaveLength(3);
});
