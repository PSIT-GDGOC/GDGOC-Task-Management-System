import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface DeadlineTaskInfo {
  id: string;
  title: string;
  description?: string | null;
  deadline: Date;
  teamName?: string;
}

export interface AssigneeInfo {
  id: string;
  name: string;
  email: string;
}

export class EmailService {
  // In-memory outbox for testing / environments without SMTP credentials
  public static mockOutbox: EmailPayload[] = [];

  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT) || 587;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      return this.transporter;
    }

    return null;
  }

  static async sendMail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || 'GDGOC PSIT <gdgoc.psit@gmail.com>';

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text || payload.subject,
          html: payload.html,
        });
        console.log(`[EmailService] Live email dispatched to ${payload.to} [ID: ${info.messageId}]`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[EmailService] SMTP send error to ${payload.to}:`, err);
        // Fallback to recording mock outbox
      }
    }

    // Fallback simulation mode (no SMTP configured or local dev)
    this.mockOutbox.push(payload);
    console.log(`[EmailService:Simulated] Email sent to: ${payload.to} | Subject: "${payload.subject}"`);
    return { success: true, simulated: true };
  }

  static async sendDeadlineReminder(
    assignee: AssigneeInfo,
    task: DeadlineTaskInfo,
    daysRemaining: number
  ) {
    const formattedDeadline = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(task.deadline);

    let urgencyHeadline = '';
    let urgencyBadgeBg = '';
    let urgencyBadgeText = '';
    let subjectPrefix = '';

    if (daysRemaining <= 0) {
      urgencyHeadline = '🔥 DUE TODAY: Immediate Action Required';
      urgencyBadgeBg = '#fce8e6';
      urgencyBadgeText = '#c5221f';
      subjectPrefix = '[URGENT: DUE TODAY]';
    } else if (daysRemaining === 1) {
      urgencyHeadline = '🚨 DUE TOMORROW: 24 Hours Left';
      urgencyBadgeBg = '#fef7e0';
      urgencyBadgeText = '#b06000';
      subjectPrefix = '[REMINDER: DUE TOMORROW]';
    } else if (daysRemaining === 2) {
      urgencyHeadline = '⏳ 2 DAYS REMAINING';
      urgencyBadgeBg = '#fef7e0';
      urgencyBadgeText = '#b06000';
      subjectPrefix = '[REMINDER: 2 DAYS LEFT]';
    } else {
      urgencyHeadline = '📅 3 DAYS REMAINING';
      urgencyBadgeBg = '#e8f0fe';
      urgencyBadgeText = '#1a73e8';
      subjectPrefix = '[REMINDER: 3 DAYS LEFT]';
    }

    const subject = `${subjectPrefix} Deadline Approaching: "${task.title}" — GDGOC PSIT`;
    const clientUrl = env.CLIENT_ORIGIN || 'http://localhost:5173';
    const workspaceUrl = `${clientUrl}/member`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 24px; color: #202124; }
    .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #dadce0; overflow: hidden; box-shadow: 0 1px 3px rgba(60,64,67,0.1); }
    .header { padding: 24px 32px 16px; border-bottom: 1px solid #f1f3f4; }
    .logo-text { font-size: 16px; font-weight: 800; color: #202124; letter-spacing: -0.2px; }
    .logo-blue { color: #4285F4; }
    .logo-red { color: #EA4335; }
    .logo-yellow { color: #FBBC04; }
    .logo-green { color: #34A853; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; background-color: ${urgencyBadgeBg}; color: ${urgencyBadgeText}; }
    .task-card { background-color: #f8f9fa; border: 1px solid #e8eaed; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .task-title { font-size: 16px; font-weight: 700; color: #202124; margin-bottom: 8px; }
    .task-meta { font-size: 13px; color: #5f6368; line-height: 1.6; }
    .cta-btn { display: inline-block; background-color: #1a73e8; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { padding: 20px 32px; background-color: #f8f9fa; border-top: 1px solid #f1f3f4; font-size: 11px; color: #70757a; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="logo-text">
        <span class="logo-blue">G</span><span class="logo-red">o</span><span class="logo-yellow">o</span><span class="logo-blue">g</span><span class="logo-green">l</span><span class="logo-red">e</span> Developer Groups on Campus
      </span>
      <div style="font-size: 11px; color: #5f6368; font-weight: 600; margin-top: 2px;">PSIT Kanpur Chapter • Task Management System</div>
    </div>

    <div class="content">
      <div class="badge">${urgencyHeadline}</div>
      <h2 style="font-size: 20px; font-weight: 800; color: #202124; margin: 0 0 12px 0;">
        Hi ${assignee.name || 'Member'},
      </h2>
      <p style="font-size: 14px; color: #3c4043; line-height: 1.5; margin: 0 0 16px 0;">
        This is an automated daily reminder that the deadline for your assigned milestone is approaching in <strong>${daysRemaining <= 0 ? 'less than 24 hours' : daysRemaining + (daysRemaining === 1 ? ' day' : ' days')}</strong>.
      </p>

      <div class="task-card">
        <div class="task-title">📌 ${task.title}</div>
        <div class="task-meta">
          <div><strong>Squad Domain:</strong> ${task.teamName || 'Chapter Project'}</div>
          <div><strong>Milestone Deadline:</strong> <span style="color: #c5221f; font-weight: 600;">${formattedDeadline}</span></div>
          ${task.description ? `<div style="margin-top: 6px; font-size: 12px; color: #5f6368;">"${task.description.slice(0, 160)}${task.description.length > 160 ? '...' : ''}"</div>` : ''}
        </div>
      </div>

      <p style="font-size: 13px; color: #5f6368; line-height: 1.5;">
        Please make sure to upload your deliverables, pull request link, or progress notes in your workspace before the cutoff. Once you submit your work for review, these daily reminder emails will stop automatically.
      </p>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${workspaceUrl}" class="cta-btn" target="_blank">
          🚀 Open Workspace & Submit Deliverable
        </a>
      </div>
    </div>

    <div class="footer">
      You are receiving this notification because you are the designated assignee for this task.<br>
      Google Developer Groups on Campus (GDGOC) • Pranveer Singh Institute of Technology, Kanpur.
    </div>
  </div>
</body>
</html>
`;

    return this.sendMail({
      to: assignee.email,
      subject,
      html,
      text: `Hi ${assignee.name},\n\nYour task "${task.title}" is due in ${daysRemaining <= 0 ? 'less than 24 hours' : daysRemaining + ' days'} (${formattedDeadline}).\n\nPlease submit your deliverables at: ${workspaceUrl}\n\nGDGOC PSIT`,
    });
  }

  static async sendTaskAssignedEmail(
    assignee: { name: string; email: string },
    task: { id: string; title: string; description?: string | null; deadline?: Date | null; priority?: string; teamName?: string },
    assigner: { name: string; position?: string | null }
  ) {
    const formattedDeadline = task.deadline
      ? new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(task.deadline)
      : 'No strict deadline set';

    const clientUrl = env.CLIENT_ORIGIN || 'http://localhost:5173';
    const workspaceUrl = `${clientUrl}/member`;
    const subject = `🎯 New Task Assigned: "${task.title}" — GDGOC PSIT`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 24px; color: #202124; }
    .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #dadce0; overflow: hidden; box-shadow: 0 1px 3px rgba(60,64,67,0.1); }
    .header { padding: 24px 32px 16px; border-bottom: 1px solid #f1f3f4; }
    .logo-text { font-size: 16px; font-weight: 800; color: #202124; letter-spacing: -0.2px; }
    .logo-blue { color: #4285F4; }
    .logo-red { color: #EA4335; }
    .logo-yellow { color: #FBBC04; }
    .logo-green { color: #34A853; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; background-color: #e8f0fe; color: #1a73e8; }
    .task-card { background-color: #f8f9fa; border: 1px solid #e8eaed; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .task-title { font-size: 16px; font-weight: 700; color: #202124; margin-bottom: 8px; }
    .task-meta { font-size: 13px; color: #5f6368; line-height: 1.6; }
    .cta-btn { display: inline-block; background-color: #1a73e8; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { padding: 20px 32px; background-color: #f8f9fa; border-top: 1px solid #f1f3f4; font-size: 11px; color: #70757a; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="logo-text">
        <span class="logo-blue">G</span><span class="logo-red">o</span><span class="logo-yellow">o</span><span class="logo-blue">g</span><span class="logo-green">l</span><span class="logo-red">e</span> Developer Groups on Campus
      </span>
      <div style="font-size: 11px; color: #5f6368; font-weight: 600; margin-top: 2px;">PSIT Kanpur Chapter • Task Management System</div>
    </div>

    <div class="content">
      <div class="badge">🎯 NEW DELIVERABLE ASSIGNED</div>
      <h2 style="font-size: 20px; font-weight: 800; color: #202124; margin: 0 0 12px 0;">
        Hi ${assignee.name || 'Member'},
      </h2>
      <p style="font-size: 14px; color: #3c4043; line-height: 1.5; margin: 0 0 16px 0;">
        A new milestone deliverable has just been assigned to you by <strong>${assigner.name || 'Leadership'}</strong> (${assigner.position || 'Lead Officer'}).
      </p>

      <div class="task-card">
        <div class="task-title">📌 ${task.title}</div>
        <div class="task-meta">
          <div><strong>Squad Domain:</strong> ${task.teamName || 'Chapter Project'}</div>
          <div><strong>Milestone Cutoff:</strong> <span style="color: #1a73e8; font-weight: 600;">${formattedDeadline}</span></div>
          ${task.priority ? `<div><strong>Priority:</strong> ${task.priority}</div>` : ''}
          ${task.description ? `<div style="margin-top: 8px; font-size: 12px; color: #5f6368; border-top: 1px dashed #dadce0; padding-top: 8px;">"${task.description}"</div>` : ''}
        </div>
      </div>

      <p style="font-size: 13px; color: #5f6368; line-height: 1.5;">
        You can view the full details, track progress, and submit your work directly on your workspace portal.
      </p>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${workspaceUrl}" class="cta-btn" target="_blank">
          🚀 Open Workspace & Start Deliverable
        </a>
      </div>
    </div>

    <div class="footer">
      Google Developer Groups on Campus (GDGOC) • Pranveer Singh Institute of Technology, Kanpur.
    </div>
  </div>
</body>
</html>
`;

    return this.sendMail({
      to: assignee.email,
      subject,
      html,
      text: `Hi ${assignee.name},\n\nA new task has been assigned to you: "${task.title}".\nDeadline: ${formattedDeadline}\n\nOpen workspace: ${workspaceUrl}\n\nGDGOC PSIT`,
    });
  }

  static async sendTaskSubmittedEmail(
    lead: { name: string; email: string },
    task: { id: string; title: string; teamName?: string },
    member: { name: string },
    submissionNote?: string | null,
    prUrl?: string | null
  ) {
    const clientUrl = env.CLIENT_ORIGIN || 'http://localhost:5173';
    const reviewUrl = `${clientUrl}/leader/overview`;
    const subject = `📥 Deliverable Ready for Review: "${task.title}" — GDGOC PSIT`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 24px; color: #202124; }
    .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #dadce0; overflow: hidden; box-shadow: 0 1px 3px rgba(60,64,67,0.1); }
    .header { padding: 24px 32px 16px; border-bottom: 1px solid #f1f3f4; }
    .logo-text { font-size: 16px; font-weight: 800; color: #202124; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background-color: #fef7e0; color: #b06000; }
    .task-card { background-color: #f8f9fa; border: 1px solid #e8eaed; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .cta-btn { display: inline-block; background-color: #1a73e8; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="logo-text">GDGOC PSIT Chapter • Milestone Verification</span>
    </div>
    <div style="padding: 32px;">
      <div class="badge">📥 WORK SUBMITTED FOR REVIEW</div>
      <h2 style="font-size: 18px; font-weight: 800; margin: 12px 0;">
        Hi ${lead.name || 'Lead Officer'},
      </h2>
      <p style="font-size: 14px; color: #3c4043; line-height: 1.5;">
        <strong>${member.name}</strong> has completed their work on <strong>"${task.title}"</strong> and submitted it for squad review.
      </p>

      <div class="task-card">
        <div style="font-weight: 700; font-size: 15px;">📌 ${task.title}</div>
        <div style="font-size: 13px; color: #5f6368; margin-top: 6px;">
          <div><strong>Squad:</strong> ${task.teamName || 'Chapter Team'}</div>
          ${submissionNote ? `<div style="margin-top: 6px;"><strong>Note:</strong> "${submissionNote}"</div>` : ''}
          ${prUrl ? `<div style="margin-top: 6px;"><strong>PR / Deliverable Link:</strong> <a href="${prUrl}" target="_blank">${prUrl}</a></div>` : ''}
        </div>
      </div>

      <div style="text-align: center; margin: 24px 0 12px;">
        <a href="${reviewUrl}" class="cta-btn" target="_blank">
          🔍 Review & Sign-Off Deliverable
        </a>
      </div>
    </div>
  </div>
</body>
</html>
`;

    return this.sendMail({
      to: lead.email,
      subject,
      html,
      text: `Hi ${lead.name},\n\n${member.name} has submitted work for review on "${task.title}".\n\nReview task: ${reviewUrl}\n\nGDGOC PSIT`,
    });
  }

  static async sendTaskReviewedEmail(
    member: { name: string; email: string },
    task: { title: string },
    reviewer: { name: string; position?: string | null },
    approved: boolean,
    comment?: string | null
  ) {
    const clientUrl = env.CLIENT_ORIGIN || 'http://localhost:5173';
    const workspaceUrl = `${clientUrl}/member`;
    const subject = approved
      ? `🎉 Milestone Approved: "${task.title}" — GDGOC PSIT`
      : `⚠️ Feedback on Submission: "${task.title}" — GDGOC PSIT`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 24px; color: #202124; }
    .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #dadce0; overflow: hidden; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background-color: ${approved ? '#e6f4ea' : '#fce8e6'}; color: ${approved ? '#137333' : '#c5221f'}; }
    .cta-btn { display: inline-block; background-color: #1a73e8; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="padding: 32px;">
      <div class="badge">${approved ? '🎉 DELIVERABLE APPROVED' : '⚠️ CHANGES REQUESTED'}</div>
      <h2 style="font-size: 18px; font-weight: 800; margin: 12px 0;">
        Hi ${member.name || 'Member'},
      </h2>
      <p style="font-size: 14px; color: #3c4043; line-height: 1.5;">
        ${approved
          ? `Congratulations! Your deliverables for <strong>"${task.title}"</strong> have been approved and marked complete by <strong>${reviewer.name}</strong>.`
          : `<strong>${reviewer.name}</strong> reviewed your submission for <strong>"${task.title}"</strong> and requested some revisions.`
        }
      </p>

      ${comment ? `
        <div style="background-color: #f8f9fa; border-left: 4px solid ${approved ? '#34a853' : '#ea4335'}; padding: 16px; margin: 16px 0; font-size: 13px;">
          <strong>Feedback from ${reviewer.name}:</strong><br>
          "${comment}"
        </div>
      ` : ''}

      <div style="text-align: center; margin: 24px 0 12px;">
        <a href="${workspaceUrl}" class="cta-btn" target="_blank">
          🚀 Open Member Workspace
        </a>
      </div>
    </div>
  </div>
</body>
</html>
`;

    return this.sendMail({
      to: member.email,
      subject,
      html,
      text: `Hi ${member.name},\n\nYour task "${task.title}" was ${approved ? 'approved' : 'sent back with feedback'}.\nFeedback: ${comment || 'None'}\n\nOpen workspace: ${workspaceUrl}\n\nGDGOC PSIT`,
    });
  }

}
