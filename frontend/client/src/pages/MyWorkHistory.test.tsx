// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyWorkHistory } from './MyWorkHistory';
import { apiRequest } from '../services/api';
vi.mock('../services/api', () => ({ apiRequest: vi.fn() }));
vi.mock('../auth/authContext', () => ({ useAuth: () => ({ user: { id: 'member' } }) }));
vi.mock('../components/tour/HelpButton', () => ({ HelpButton: () => null }));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());
const mount = () =>
  render(
    <MemoryRouter>
      <MyWorkHistory />
    </MemoryRouter>,
  );
const task = (id: string, isOnTime: boolean) => ({
  id,
  title: id,
  status: 'DONE',
  completedAt: '2026-10-25T12:00:00Z',
  deadline: '2026-10-26T12:00:00Z',
  isOnTime,
  activities: [],
  submissions: [],
});
it('shows a readable empty metric instead of mojibake', async () => {
  vi.mocked(apiRequest).mockResolvedValue({ data: [] });
  const { container } = mount();
  expect(await screen.findByText('No rated tasks')).toBeTruthy();
  expect(container.textContent).not.toMatch(/â|Â/);
});
it('loads all history pages and respects the server on-time outcome', async () => {
  vi.mocked(apiRequest)
    .mockResolvedValueOnce({ data: [task('first', false)], pagination: { totalPages: 2 } })
    .mockResolvedValueOnce({ data: [task('second', true)], pagination: { totalPages: 2 } });
  mount();
  expect(await screen.findByText('50%')).toBeTruthy();
  expect(apiRequest).toHaveBeenLastCalledWith('/history/me?limit=100&page=2');
});
it('does not display invented zero statistics when history fails and allows retry', async () => {
  vi.mocked(apiRequest)
    .mockRejectedValueOnce(new Error('History unavailable'))
    .mockResolvedValueOnce({ data: [] });
  mount();
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByText('No rated tasks')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading history' }));
  expect(await screen.findByText('No rated tasks')).toBeTruthy();
});

it('renders completed summaries from the history API without an activities relation', async () => {
  const { activities, ...summary } = task('Completed milestone', true);
  vi.mocked(apiRequest).mockResolvedValue({data: [{...summary, submissions: [{id:'submission', outcome:'APPROVED', prUrl:'https://github.com/example/repo/pull/1'}]}]});
  mount();
  expect(await screen.findByText('Completed milestone')).toBeTruthy();
  expect(screen.getByText('100%')).toBeTruthy();
  expect(screen.getByText('Approved')).toBeTruthy();
  expect(screen.getByRole('link', {name:'View PR'}).getAttribute('href')).toBe('https://github.com/example/repo/pull/1');
  expect(screen.getByText('No activity matches these filters.')).toBeTruthy();
});
it('renders historical tasks with null relations without losing the page', async () => {
  vi.mocked(apiRequest).mockResolvedValue({data: [{...task('Legacy milestone', true), activities:null, submissions:null}]});
  mount();
  expect(await screen.findByText('Legacy milestone')).toBeTruthy();
  expect(screen.getByRole('heading', {name:'My Work History'})).toBeTruthy();
});
