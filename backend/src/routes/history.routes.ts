import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { HistoryService } from '../services/history.service';
import {
  HistoryFilters,
  HistoryListFilters,
  historyListSchema,
  historyStatisticsSchema,
} from '../schemas/history';
const router = Router();
router.use(requireAuth);
for (const [path, personal] of [
  ['/me', true],
  ['/', false],
] as const) {
  router.get(
    path === '/' ? '/statistics' : path + '/statistics',
    validate({ query: historyStatisticsSchema }),
    asyncHandler(async (req, res) => {
      res.json({
        success: true,
        data: await HistoryService.statistics(
          req.user!,
          req.query as unknown as HistoryFilters,
          personal,
        ),
      });
    }),
  );
  router.get(
    path,
    validate({ query: historyListSchema }),
    asyncHandler(async (req, res) => {
      res.json({
        success: true,
        ...(await HistoryService.list(
          req.user!,
          req.query as unknown as HistoryListFilters,
          personal,
        )),
      });
    }),
  );
}
export default router;
