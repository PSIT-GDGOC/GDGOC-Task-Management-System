import { SystemRole } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth';

export function isClubManager(
  user: Pick<AuthenticatedUser, 'role'> & { position?: string | null },
): boolean {
  if (user.role === SystemRole.SYSTEM_OWNER || user.role === SystemRole.PRESIDENT) return true;
  const pos = user.position?.toLowerCase() || '';
  return (
    user.role === SystemRole.ADMIN &&
    (pos.includes('vice') ||
      pos.includes('secretary') ||
      pos.includes('organizer') ||
      pos.includes('president') ||
      pos.includes('super admin'))
  );
}

export function managedTeamIds(user: AuthenticatedUser): string[] {
  return user.teamMemberships
    .filter((membership) => user.role === SystemRole.ADMIN || membership.isTeamHead)
    .map((membership) => membership.teamId);
}

export function canManageTeam(user: AuthenticatedUser, teamId: string): boolean {
  return isClubManager(user) || managedTeamIds(user).includes(teamId);
}

export function canViewTeam(user: AuthenticatedUser, teamId: string): boolean {
  return (
    isClubManager(user) || user.teamMemberships.some((membership) => membership.teamId === teamId)
  );
}
