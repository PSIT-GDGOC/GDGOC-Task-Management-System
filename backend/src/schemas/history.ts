import { z } from 'zod';
import { idSchema, paginationSchema } from './directory';
const filters = {
  teamId: idSchema.optional(),
  userId: idSchema.optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  timing: z.enum(['on-time', 'late', 'no-deadline']).optional(),
};
const range = (data: { from?: string; to?: string }) =>
  !data.from || !data.to || new Date(data.from) < new Date(data.to);
export const historyListSchema = paginationSchema
  .extend(filters)
  .refine(range, 'from must be earlier than to');
export const historyStatisticsSchema = z
  .object(filters)
  .strict()
  .refine(range, 'from must be earlier than to');
export type HistoryFilters = z.infer<typeof historyStatisticsSchema>;
export type HistoryListFilters = z.infer<typeof historyListSchema>;
