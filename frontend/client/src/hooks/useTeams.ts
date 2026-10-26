import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/authContext';
import { adminApi } from '../services/api';
import type { Team } from '../types/task';

/** Server directory is shared by dashboards and navigation; no fixed squad list. */
export function useTeams() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['team-directory', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<Team[]> => {
      const all = await adminApi.getTeams();
      const visible = all.filter(
        (team) =>
          user?.canManageClub ||
          user?.role === 'ADMIN' ||
          user?.teamMemberships?.some((m) => m.teamId === team.id),
      );
      return Promise.all(
        visible.map(async (team) => {
          const members = await adminApi.getTeamMembers(team.id);
          return {
            id: team.slug,
            databaseId: team.id,
            slug: team.slug,
            name: team.name,
            description: team.description || '',
            accent:
              team.slug === 'tech'
                ? 'blue'
                : team.slug === 'media'
                  ? 'yellow'
                  : team.slug === 'content'
                    ? 'green'
                    : 'red',
            leadName: members.find((m) => m.isTeamHead)?.user.name || 'Unassigned',
            members: members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              role: m.isTeamHead ? 'Team Lead' : m.user.position || 'Team Member',
              initials: m.user.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
            })),
          } satisfies Team;
        }),
      );
    },
  });
  return {
    teams: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    retry: query.refetch,
  };
}
