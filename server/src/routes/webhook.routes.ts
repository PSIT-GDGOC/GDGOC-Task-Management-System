import { Router, Request, Response, NextFunction } from 'express';
import { verifyGitHubWebhookSignature } from '../middleware/verifyWebhook';
import { WebhookService } from '../services/webhook.service';

const router = Router();

/**
 * POST /api/v1/webhooks/github
 * GitHub Webhook Receiver
 * - Protected by raw body HMAC SHA-256 signature verification
 * - Processes pull_request events
 * - Safely acknowledges and ignores unrelated events
 */
router.post(
  '/github',
  verifyGitHubWebhookSignature,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventName = req.headers['x-github-event'] as string;
      const deliveryId = req.headers['x-github-delivery'] as string;
      const payload = req.body;

      console.log(`[GITHUB_WEBHOOK] Received event: ${eventName} (Delivery ID: ${deliveryId})`);

      // We focus on pull_request events
      if (eventName === 'pull_request') {
        const { action, pull_request: pr, repository } = payload;
        const result = await WebhookService.handlePullRequestEvent(action, pr, repository);

        res.status(200).json({
          received: true,
          event: eventName,
          result,
        });
        return;
      }

      // Ping event when webhook is initially created in GitHub repo settings
      if (eventName === 'ping') {
        res.status(200).json({
          received: true,
          message: 'Pong! Webhook successfully configured and verified.',
          zen: payload.zen,
        });
        return;
      }

      // Safe acknowledgment of any other irrelevant events
      res.status(200).json({
        received: true,
        ignored: true,
        reason: `Event type "${eventName}" is not subscribed by task workflow`,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
