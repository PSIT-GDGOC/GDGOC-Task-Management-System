import { Request, Response, NextFunction } from 'express';
import { SystemRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from './errorHandler';

/**
 * Middleware: requireAuth
 * Fails closed. If session does not contain an authenticated user, returns 401 Unauthorized.
 * In development, if a mock token or header is supplied, it must be explicitly authenticated.
 * NEVER allows unauthenticated requests to bypass.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Fails closed
  return next(new AppError('Authentication required. Please sign in.', 401));
};

/**
 * Middleware: requireRole
 * Verifies that the authenticated user has one of the allowed system roles.
 */
export const requireRole = (allowedRoles: SystemRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Requires one of [${allowedRoles.join(', ')}] permissions. Current role: ${req.user.role}`,
          403,
        ),
      );
    }

    next();
  };
};

/**
 * Middleware: requireTeamHeadOrAdmin
 * Grants access if user is SYSTEM_OWNER, PRESIDENT, or ADMIN,
 * OR if the user is a designated team head for the team matching req.params[paramName] or req.body[paramName].
 */
export const requireTeamHeadOrAdmin = (teamIdParamName = 'teamId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const role = req.user.role;
    if (role === SystemRole.SYSTEM_OWNER || role === SystemRole.PRESIDENT || role === SystemRole.ADMIN) {
      return next();
    }

    const teamId = (req.params[teamIdParamName] || req.body[teamIdParamName]) as string | undefined;
    if (!teamId) {
      return next(new AppError('Team ID context is required to verify permissions', 400));
    }

    const membership = await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: req.user.id,
          teamId,
        },
      },
    });

    if (membership && membership.isTeamHead) {
      return next();
    }

    return next(new AppError('Forbidden: You are not a team head for this team or an admin', 403));
  };
};
