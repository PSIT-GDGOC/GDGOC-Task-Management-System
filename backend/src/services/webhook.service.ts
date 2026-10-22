import { prisma } from '../lib/prisma';

interface PullRequestPayload {
  head?: { ref?: string };
  title?: string;
  body?: string;
  html_url?: string;
  user?: { login?: string };
  number?: number;
}

export class WebhookService {
  /**
   * Helper to parse task ID from PR title, body, or head branch
   * Example patterns:
   *  - branch: fix/cuid123456789
   *  - branch: feature/task-cuid123456789
   *  - title: [TASK-cuid123456789] Fix homepage layout
   */
  static extractTaskId(branchName?: string, prTitle?: string, prBody?: string): string | null {
    // Regex matching task ID references: TASK-[a-zA-Z0-9_-]+ or cuid patterns
    const regex = /(?:task[\/_-]?|TASK-)([a-zA-Z0-9]{10,32})/i;

    if (branchName) {
      const match = branchName.match(regex);
      if (match) return match[1];
    }

    if (prTitle) {
      const match = prTitle.match(regex);
      if (match) return match[1];
    }

    if (prBody) {
      const match = prBody.match(regex);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Handle incoming validated pull_request event
   */
  static async handlePullRequestEvent(
    action: string,
    pullRequest: PullRequestPayload,
    _repository: unknown,
  ) {
    const branchName = pullRequest?.head?.ref;
    const prTitle = pullRequest?.title;
    const prBody = pullRequest?.body;
    const prUrl = pullRequest?.html_url;
    const sender = pullRequest?.user?.login;

    const taskId = this.extractTaskId(branchName, prTitle, prBody);

    if (!taskId) {
      return {
        handled: false,
        reason: 'No recognized Task ID found in branch or PR title/body',
      };
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
    });

    if (!task) {
      return {
        handled: false,
        reason: `Task with ID ${taskId} does not exist in database`,
      };
    }

    // Notice: We do NOT auto-mark task Done here. Admins must explicitly review and approve.
    // Instead, we record webhook activity and update submission PR link if appropriate.
    console.log(
      `[GITHUB_WEBHOOK] Received PR #${pullRequest.number} (${action}) by ${sender} matching task ${taskId}`,
    );

    return {
      handled: true,
      taskId,
      action,
      prUrl,
    };
  }
}
