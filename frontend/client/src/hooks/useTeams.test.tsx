// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeams } from './useTeams';
import { adminApi } from '../services/api';
const identity = vi.hoisted(() => ({
  user: {
    id: 'lead',
    role: 'TEAM_LEADER',
    canManageClub: false,
    teamMemberships: [
      {
        teamId: 'custom-team',
        isTeamHead: true,
        team: { id: 'custom-team', name: 'Events', slug: 'events' },
      },
    ],
  },
}));
vi.mock('../auth/authContext', () => ({ useAuth: () => identity }));
vi.mock('../services/api', () => ({ adminApi: { getTeams: vi.fn(), getTeamMembers: vi.fn() } }));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(adminApi.getTeams).mockResolvedValue([
    { id: 'custom-team', slug: 'events', name: 'Events' },
    { id: 'other-team', slug: 'media', name: 'Media' },
  ]);
  vi.mocked(adminApi.getTeamMembers).mockResolvedValue([
    {
      id: 'membership',
      isTeamHead: true,
      user: { id: 'lead', name: 'Actual Lead', email: 'lead@example.com', role: 'USER' },
    },
  ]);
});
function Probe() {
  const { teams, error } = useTeams();
  return (
    <div>
      {error
        ? 'Directory unavailable'
        : teams.map((team) => (
            <span key={team.id}>
              {team.name}: {team.leadName} ({team.members.length})
            </span>
          ))}
    </div>
  );
}
it('loads custom squads, real leads and members while respecting membership scope', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  expect(await screen.findByText('Events: Actual Lead (1)')).toBeTruthy();
  expect(screen.queryByText('Media')).toBeNull();
  expect(adminApi.getTeamMembers).toHaveBeenCalledTimes(1);
  expect(adminApi.getTeamMembers).toHaveBeenCalledWith('custom-team');
});
it('reports a directory outage rather than substituting fixed teams', async () => {
  vi.mocked(adminApi.getTeams).mockRejectedValue(new Error('Unavailable'));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  expect(await screen.findByText('Directory unavailable')).toBeTruthy();
});
