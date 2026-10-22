import { SystemRole } from '@prisma/client';
import { AuthenticatedUser } from '../types/auth';

export function isClubManager(user: Pick<AuthenticatedUser, 'role'>): boolean {
  return user.role === SystemRole.SYSTEM_OWNER || user.role === SystemRole.PRESIDENT;
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
