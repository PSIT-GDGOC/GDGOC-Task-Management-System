import { z } from 'zod';

export const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type Pagination = z.infer<typeof paginationSchema>;
export const idSchema = z.string().trim().min(1).max(100);
export const teamParamsSchema = z.object({ teamId: idSchema });
export const membershipParamsSchema = teamParamsSchema.extend({ userId: idSchema });
