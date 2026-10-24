import { describe, it, expect, beforeEach } from 'vitest';
import { DeadlineReminderService } from '../src/services/deadline-reminder.service';
import { EmailService } from '../src/services/email.service';

describe('DeadlineReminderService', () => {
  beforeEach(() => {
    EmailService.mockOutbox = [];
  });

  it('correctly calculates days remaining and formats email reminder for approaching tasks', async () => {
    const fakeMember = {
      id: 'usr_test_1',
      name: 'Aditya Member',
      email: 'aditya.member@psit.ac.in',
    };

    const fakeTask = {
      id: 'task_test_1',
      title: 'Build Neural Network Visualizer',
      description: 'Implement canvas rendering for weights and activations.',
      deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000), // 2 days from now
      teamName: 'Tech Squad',
    };

    await EmailService.sendDeadlineReminder(fakeMember, fakeTask, 2);

    expect(EmailService.mockOutbox.length).toBe(1);
    const sent = EmailService.mockOutbox[0];
    expect(sent.to).toBe('aditya.member@psit.ac.in');
    expect(sent.subject).toContain('2 DAYS LEFT');
    expect(sent.subject).toContain('Build Neural Network Visualizer');
    expect(sent.html).toContain('Hi Aditya Member');
    expect(sent.html).toContain('Tech Squad');
    expect(sent.html).toContain('Open Workspace & Submit Deliverable');
  });

  it('formats urgent reminder when task is due today', async () => {
    const fakeMember = {
      id: 'usr_test_2',
      name: 'Priya Verma',
      email: 'priya@psit.ac.in',
    };

    const fakeTask = {
      id: 'task_test_2',
      title: 'Motion Graphics Assets for DevFest',
      deadline: new Date(Date.now() + 6 * 3600 * 1000), // 6 hours from now (today)
      teamName: 'Media Squad',
    };

    await EmailService.sendDeadlineReminder(fakeMember, fakeTask, 0);

    expect(EmailService.mockOutbox.length).toBe(1);
    const sent = EmailService.mockOutbox[0];
    expect(sent.subject).toContain('DUE TODAY');
    expect(sent.html).toContain('DUE TODAY: Immediate Action Required');
  });

  it('formats reminder when task is due tomorrow (1 day)', async () => {
    const fakeMember = {
      id: 'usr_test_3',
      name: 'Rohan Sharma',
      email: 'rohan@psit.ac.in',
    };

    const fakeTask = {
      id: 'task_test_3',
      title: 'Deploy Production Database Indexing',
      deadline: new Date(Date.now() + 24 * 3600 * 1000), // 1 day
      teamName: 'Tech Squad',
    };

    await EmailService.sendDeadlineReminder(fakeMember, fakeTask, 1);

    expect(EmailService.mockOutbox.length).toBe(1);
    const sent = EmailService.mockOutbox[0];
    expect(sent.subject).toContain('DUE TOMORROW');
    expect(sent.html).toContain('24 Hours Left');
  });

  it('simulates scanning with mock database client without errors', async () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const mockDb: any = {
      task: {
        findMany: async () => [
          {
            id: 't_mock',
            title: 'Mock Task',
            description: null,
            deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000),
            assigneeId: 'u_mock',
            assignee: { id: 'u_mock', name: 'Test User', email: 'test@example.com', isActive: true },
            team: { id: 'team_1', name: 'Tech Squad', slug: 'tech' },
          },
        ],
      },
      notification: {
        findFirst: async () => null, // Not sent today
        create: async () => ({ id: 'notif_1' }),
      },
    };

    const result = await DeadlineReminderService.scanAndSendReminders(mockDb);
    expect(result.scanned).toBe(1);
    expect(result.eligible).toBe(1);
    expect(result.emailsSent).toBe(1);
    expect(result.skippedAlreadySentToday).toBe(0);
    expect(EmailService.mockOutbox.length).toBe(1);
  });

  it('skips sending email if an email was already sent today for the same task', async () => {
    const mockDb: any = {
      task: {
        findMany: async () => [
          {
            id: 't_mock_2',
            title: 'Mock Task 2',
            description: null,
            deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000),
            assigneeId: 'u_mock_2',
            assignee: { id: 'u_mock_2', name: 'Test User 2', email: 'test2@example.com', isActive: true },
            team: { id: 'team_1', name: 'Tech Squad', slug: 'tech' },
          },
        ],
      },
      notification: {
        // Return existing reminder sent today
        findFirst: async () => ({ id: 'existing_notif_today', kind: 'DEADLINE_REMINDER' }),
        create: async () => ({ id: 'notif_2' }),
      },
    };

    const result = await DeadlineReminderService.scanAndSendReminders(mockDb);
    expect(result.scanned).toBe(1);
    expect(result.eligible).toBe(1);
    expect(result.emailsSent).toBe(0);
    expect(result.skippedAlreadySentToday).toBe(1);
    expect(EmailService.mockOutbox.length).toBe(0); // Zero emails sent
  });
});
