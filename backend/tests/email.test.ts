import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { env } from '../src/config/env';
import { EmailService } from '../src/services/email.service';
import { DeadlineReminderService } from '../src/services/deadline-reminder.service';
const originalMode = env.NODE_ENV;
beforeEach(() => {
  EmailService.mockOutbox = [];
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'BREVO_API_KEY']) vi.stubEnv(key, '');
});
afterEach(() => {
  env.NODE_ENV = originalMode;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it('does not acknowledge simulated email delivery in production', async () => {
  env.NODE_ENV = 'production';
  await expect(
    EmailService.sendMail({ to: 'fixture@example.com', subject: 'Fixture', html: 'Fixture' }),
  ).rejects.toThrow('Email delivery failed');
  expect(EmailService.mockOutbox).toHaveLength(0);
});
it('surfaces a provider outage instead of marking the production message sent', async () => {
  env.NODE_ENV = 'production';
  vi.stubEnv('BREVO_API_KEY', 'fixture-only-not-a-secret');
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 })),
  );
  await expect(
    EmailService.sendMail({ to: 'fixture@example.com', subject: 'Fixture', html: 'Fixture' }),
  ).rejects.toThrow('Email delivery failed');
  expect(EmailService.mockOutbox).toHaveLength(0);
});
it('escapes user content in all lifecycle emails and drops non-HTTP deliverable links', async () => {
  const payload = '<img src=x onerror=alert(1)>';
  const member = { id: 'member', name: payload, email: 'fixture@example.com' };
  const task = {
    id: 'task',
    title: payload,
    description: payload,
    teamName: payload,
    deadline: new Date(),
  };
  await EmailService.sendDeadlineReminder(member, task, 1);
  await EmailService.sendTaskAssignedEmail(member, task, { name: payload, position: payload });
  await EmailService.sendTaskSubmittedEmail(member, task, member, payload, 'javascript:alert(1)');
  await EmailService.sendTaskReviewedEmail(member, task, member, false, payload);
  expect(EmailService.mockOutbox).toHaveLength(4);
  for (const message of EmailService.mockOutbox) {
    expect(message.html).not.toContain(payload);
    expect(message.html).toContain('&lt;img');
    expect(message.html).not.toContain('javascript:');
  }
});
it('leaves failed deadline deliveries eligible for retry instead of recording a successful reminder', async () => {
  vi.spyOn(EmailService, 'sendDeadlineReminder').mockRejectedValue(
    new Error('Provider unavailable'),
  );
  const upsert = vi.fn(),
    create = vi.fn();
  const database = {
    task: {
      findMany: async () => [
        {
          id: 'task',
          title: 'Milestone',
          deadline: new Date(),
          assignee: { id: 'member', name: 'Member', email: 'fixture@example.com', isActive: true },
        },
      ],
    },
    notification: { findFirst: async () => null, upsert, create },
  } as unknown as PrismaClient;
  const result = await DeadlineReminderService.scanAndSendReminders(database);
  expect(result.emailsSent).toBe(0);
  expect(result.details[0].status).toBe('FAILED');
  expect(upsert).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});
