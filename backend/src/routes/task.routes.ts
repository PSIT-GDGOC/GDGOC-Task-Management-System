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
