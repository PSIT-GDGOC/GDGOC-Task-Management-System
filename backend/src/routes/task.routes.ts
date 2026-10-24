import { TaskScope } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { DeadlineReminderService } from '../services/deadline-reminder.service';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { TaskService } from '../services/task.service';
import { asyncHandler } from '../utils/asyncHandler';
import {
  assignTaskSchema,
  createTaskSchema,
  reviewTaskSchema,
  submitTaskSchema,
  taskListSchema,
  taskParamsSchema,
  TaskFilters,
  updateTaskSchema,
} from '../schemas/task';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  validate({ query: taskListSchema }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      ...(await TaskService.listTasks(req.query as unknown as TaskFilters, req.user!)),
    });
  }),
);
router.post(
  '/reminders/trigger',
  asyncHandler(async (_req, res) => {
    const result = await DeadlineReminderService.scanAndSendReminders();
    res.json({ success: true, data: result });
  }),
);

router.get(
  '/activity/feed',
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const isManager = ['SYSTEM_OWNER', 'PRESIDENT', 'ADMIN'].includes(user.role);
    const userTeamIds = user.teamMemberships.map((m) => m.teamId);

    const where = isManager
      ? {}
      : {
          task: {
            is: {
              OR: [
                { scope: TaskScope.WHOLE_CLUB },
                { teamId: { in: userTeamIds } },
                { assigneeId: user.id },
              ],
            },
          },
        };

    const activities = await prisma.taskActivity.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 40,
      include: {
        actor: { select: { id: true, name: true, email: true, position: true, role: true } },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            team: { select: { id: true, name: true, slug: true } },
            assignee: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({ success: true, data: activities });
  }),
);

router.get(
  '/:id',
  validate({ params: taskParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await TaskService.getTaskById(req.params.id, req.user!) });
  }),
);
router.post(
  '/',
  validate({ body: createTaskSchema }),
  asyncHandler(async (req, res) => {
    res
      .status(201)
      .json({ success: true, data: await TaskService.createTask(req.body, req.user!) });
  }),
);
router.patch(
  '/:id',
  validate({ params: taskParamsSchema, body: updateTaskSchema }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await TaskService.updateTask(req.params.id, req.body, req.user!),
    });
  }),
);
router.post(
  '/:id/assign',
  validate({ params: taskParamsSchema, body: assignTaskSchema }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await TaskService.assignTask(req.params.id, req.body.assigneeId, req.user!),
    });
  }),
);
router.post(
  '/:id/claim',
  validate({ params: taskParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await TaskService.claimTask(req.params.id, req.user!) });
  }),
);
router.post(
  '/:id/start',
  validate({ params: taskParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await TaskService.startTask(req.params.id, req.user!) });
  }),
);
router.post(
  '/:id/submit',
  validate({ params: taskParamsSchema, body: submitTaskSchema }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await TaskService.submitForReview(req.params.id, req.user!, req.body),
    });
  }),
);
router.post(
  '/:id/review',
  validate({ params: taskParamsSchema, body: reviewTaskSchema }),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await TaskService.reviewTask(req.params.id, req.user!, req.body),
    });
  }),
);
router.delete(
  '/:id',
  validate({ params: taskParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await TaskService.deleteTask(req.params.id, req.user!) });
  }),
);
export default router;
