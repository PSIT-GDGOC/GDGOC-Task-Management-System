export type TaskStatus = 'FREE' | 'ASSIGNED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskScope = 'TEAM' | 'WHOLE_CLUB';

export type SystemRole = 'USER' | 'ADMIN' | 'PRESIDENT' | 'SYSTEM_OWNER';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: SystemRole;
  position?: string | null;
  githubUsername?: string | null;
}

export interface TeamSummary {
  id: string;
  name: string;
  slug: string;
}

export interface TaskSubmissionSummary {
  id: string;
  note?: string | null;
  prUrl?: string | null;
  submittedAt: string;
  outcome?: 'APPROVED' | 'SENT_BACK' | null;
  reviewComment?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  scope: TaskScope;
  teamId?: string | null;
  team?: TeamSummary | null;
  creatorId: string;
  creator?: UserSummary;
  assigneeId?: string | null;
  assignee?: UserSummary | null;
  deadline?: string | null;
  tags: string[];
  isOnTime?: boolean | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  submissions?: TaskSubmissionSummary[];
}
