import { z } from 'zod';
import { idSchema, paginationSchema } from './directory';
export const createInvitationSchema = z
  .object({
    role: z.enum(['ADMIN', 'PRESIDENT']).default('ADMIN'),
    position: z.string().trim().min(1).max(100).optional(),
    teamId: idSchema.optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    expiresInHours: z.number().int().min(1).max(168).default(48),
    customKey: z.string().trim().min(12).max(64).optional(),
  })
  .strict();
export const invitationListSchema = paginationSchema.extend({
  status: z.enum(['ACTIVE', 'EXPIRED', 'USED', 'REVOKED']).optional(),
});
export const invitationParams = z.object({ id: idSchema });
export const redemptionSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2).max(100),
  })
  .strict();
export type InvitationInput = z.infer<typeof createInvitationSchema>;
export type InvitationFilters = z.infer<typeof invitationListSchema>;
