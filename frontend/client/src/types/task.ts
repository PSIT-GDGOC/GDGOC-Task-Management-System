export type Priority = 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Assigned' | 'To Do' | 'In Progress' | 'Pending Review' | 'Completed';

export type TeamId = string;

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  formattedSize: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
}

export interface Team {
  databaseId?: string;
  id: TeamId;
  name: string;
  slug: string;
  description: string;
  accent: 'blue' | 'red' | 'yellow' | 'green';
  leadName: string;
  members: TeamMember[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  teamId: TeamId;
  teamName: string;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  assigneeInitials: string;
  priority?: Priority;
  status: TaskStatus;
  deadline: string;
  createdAt?: string;
  attachments?: AttachedFile[];
}
