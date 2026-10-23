import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskStatus, TaskPriority, TaskScope, SubmissionOutcome, SystemRole } from '@prisma/client';
import { TaskService } from '../services/task.service';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Validation Schemas
const listTasksQuerySchema = z.object({
  teamId: z.string().optional(),
  assigneeId: z.string().optional(),
  scope: z.nativeEnum(TaskScope).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  search: z.string().optional(),
});

const taskIdParamSchema = z.object({
  id: z.string().min(1, 'Task ID parameter is required'),
});

const createTaskBodySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.nativeEnum(TaskPriority).optional(),
  scope: z.nativeEnum(TaskScope).optional(),
  teamId: z.string().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
  assigneeId: z.string().nullable().optional(),
});

const submitReviewBodySchema = z.object({
  prUrl: z.string().url('Must provide a valid GitHub Pull Request URL'),
  note: z.string().max(1000).optional(),
});

const reviewTaskBodySchema = z.object({
  outcome: z.nativeEnum(SubmissionOutcome),
  reviewComment: z.string().max(2000).optional(),
});

/**
 * GET /api/v1/tasks
 * Returns tasks for board synchronization
 */
router.get(
  '/me/history',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const tasks = await TaskService.getMemberHistory(userId);
      res.json({ success: true, data: tasks });
    } catch (err) { next(err); }
  },
);

router.get(
  '/',
  validate({ query: listTasksQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await TaskService.listTasks(req.query as any);
      res.json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/tasks/:id
 * Retrieve specific task with activity timeline
 */
router.get(
  '/:id',
  validate({ params: taskIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await TaskService.getTaskById(req.params.id);
      res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/tasks
 * Create task (Admin, President, System Owner)
 */
router.post(
  '/',
  requireAuth,
  requireRole([SystemRole.SYSTEM_OWNER, SystemRole.PRESIDENT, SystemRole.ADMIN]),
  validate({ body: createTaskBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await TaskService.createTask(req.body, req.user!.id);
      res.status(201).json({ success: true, message: 'Task created successfully', data: task });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/tasks/:id/claim
 * Atomically claim a free task (Regular members or above)
 */
router.post(
  '/:id/claim',
  requireAuth,
  validate({ params: taskIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await TaskService.claimTask(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Task claimed successfully', data: task });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/tasks/:id/start
 * Move task from ASSIGNED to IN_PROGRESS
 */
router.post(
  '/:id/start',
  requireAuth,
  validate({ params: taskIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await TaskService.startTask(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Task is now in progress', data: task });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/tasks/:id/submit
 * Submit completed task for review (IN_PROGRESS -> IN_REVIEW)
 */
router.post(
  '/:id/submit',
  requireAuth,
  validate({ params: taskIdParamSchema, body: submitReviewBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await TaskService.submitForReview(req.params.id, req.user!.id, req.body);
      res.json({ success: true, message: 'Task submitted for review', data: task });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v1/tasks/:id/review
 * Approve or send back task (Admin, President, System Owner)
 */
router.post(
  '/:id/review',
  requireAuth,
  requireRole([SystemRole.SYSTEM_OWNER, SystemRole.PRESIDENT, SystemRole.ADMIN]),
  validate({ params: taskIdParamSchema, body: reviewTaskBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await TaskService.reviewTask(req.params.id, req.user!.id, req.body);
      res.json({
        success: true,
        message: req.body.outcome === SubmissionOutcome.APPROVED ? 'Task approved and marked Done' : 'Task sent back with review feedback',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/v1/tasks/:id
 * Soft delete task (Admin, President, System Owner)
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole([SystemRole.SYSTEM_OWNER, SystemRole.PRESIDENT, SystemRole.ADMIN]),
  validate({ params: taskIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await TaskService.deleteTask(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Task soft-deleted', data: deleted });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
