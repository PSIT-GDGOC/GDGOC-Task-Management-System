import { SystemRole } from '@prisma/client';
import { AppError } from './errorHandler';
import { UserRepository } from '../repositories/user.repository';
import { asyncHandler } from '../utils/asyncHandler';
import { canManageTeam } from '../utils/permissions';

/** Sessions identify a user; current account and team permissions come from PostgreSQL. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const id = req.session?.user?.id;
  if (!id) throw new AppError('Authentication required. Please sign in.', 401);
  const user = await UserRepository.findById(id);
  if (!user) throw new AppError('Authentication required. Please sign in again.', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated', 403);
  req.user = user;
  next();
});

export const requireRole = (allowedRoles: SystemRole[]) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw new AppError('Authentication required', 401);
    if (!allowedRoles.includes(req.user.role))
      throw new AppError('You do not have permission for this action', 403);
    next();
  });

/** ADMIN is scoped to its memberships; a USER team head is scoped to headed teams. */
export const requireTeamHeadOrAdmin = (teamIdParamName = 'teamId') =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw new AppError('Authentication required', 401);
    const teamId = req.params[teamIdParamName] ?? req.body?.[teamIdParamName];
    if (typeof teamId !== 'string' || !teamId) throw new AppError('Team context is required', 400);
    if (!canManageTeam(req.user, teamId)) throw new AppError('You cannot manage this team', 403);
    next();
  });
