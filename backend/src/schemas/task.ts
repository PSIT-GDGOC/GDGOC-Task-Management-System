import { z } from 'zod';
import { TaskPriority, TaskScope, TaskStatus, SubmissionOutcome } from '@prisma/client';
import { idSchema, paginationSchema } from './directory';

const tagsSchema = z
  .array(z.string().trim().min(1).max(32))
  .max(10)
  .transform((tags) => [...new Set(tags.map((tag) => tag.toLowerCase()))]);
const metadataFields = {
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(10000),
  priority: z.nativeEnum(TaskPriority).optional(),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
  tags: tagsSchema.optional(),
};
export const createTaskSchema = z
  .object({
    ...metadataFields,
    scope: z.nativeEnum(TaskScope).optional(),
    teamId: idSchema.nullable().optional(),
    assigneeId: idSchema.nullable().optional(),
  })
  .strict();
export const updateTaskSchema = z
  .object(metadataFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one task field');
export const taskParamsSchema = z.object({ id: idSchema });
export const taskListSchema = paginationSchema.extend({
  teamId: idSchema.optional(),
  assigneeId: idSchema.optional(),
  scope: z.nativeEnum(TaskScope).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  tag: z.string().trim().toLowerCase().min(1).max(32).optional(),
  search: z.string().trim().min(1).max(150).optional(),
});
export const assignTaskSchema = z.object({ assigneeId: idSchema.nullable() }).strict();
const pullRequestUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return false;
    }
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      !url.port &&
      !url.username &&
      !url.password &&
      /^\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/pull\/[1-9]\d*\/?$/.test(url.pathname)
    );
  }, 'Provide an HTTPS GitHub pull request URL')
  .transform((value) => `https://github.com${new URL(value).pathname.replace(/\/$/, '')}`);
export const submitTaskSchema = z
  .object({
    prUrl: pullRequestUrl.optional(),
    note: z.string().trim().min(1).max(2000).optional(),
  })
  .strict()
  .refine((data) => Boolean(data.prUrl || data.note), 'Provide a PR URL or a submission note');
export const reviewTaskSchema = z
  .object({
    outcome: z.nativeEnum(SubmissionOutcome),
    reviewComment: z.string().trim().min(1).max(2000).optional(),
  })
  .strict()
  .refine(
    (data) => data.outcome !== SubmissionOutcome.SENT_BACK || Boolean(data.reviewComment),
    'Feedback is required when sending work back',
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskListSchema>;
export type SubmissionInput = z.infer<typeof submitTaskSchema>;
export type ReviewInput = z.infer<typeof reviewTaskSchema>;
