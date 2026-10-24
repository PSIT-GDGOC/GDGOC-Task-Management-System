import { Team, Task, TeamId } from '../types/task';

export const TEAMS: Team[] = [
  {
    id: 'tech',
    name: 'Tech',
    slug: 'tech',
    description: 'Engineering, software development, cloud, and open source.',
    accent: 'blue',
    leadName: 'Unassigned',
    members: [],
  },
  {
    id: 'media',
    name: 'Media',
    slug: 'media',
    description: 'Design, video production, photography, and brand assets.',
    accent: 'yellow',
    leadName: 'Unassigned',
    members: [],
  },
  {
    id: 'content',
    name: 'Content',
    slug: 'content',
    description: 'Technical writing, blogs, social media content, and documentation.',
    accent: 'green',
    leadName: 'Unassigned',
    members: [],
  },
];

/**
 * Baseline clean state: zero dummy tasks.
 */
export const INITIAL_SAMPLE_TASKS: Task[] = [];
export const MOCK_TASKS: Task[] = [];

export interface DashboardStats {
  totalTasks: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
  assigned: number;
  toDo: number;
}

export const getDashboardStats = (tasks: Task[] = []): DashboardStats => {
  return {
    totalTasks: tasks.length,
    assigned: tasks.filter((t) => t.status === 'Assigned').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    pendingReview: tasks.filter((t) => t.status === 'Pending Review').length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
    toDo: tasks.filter((t) => t.status === 'To Do').length,
  };
};

export const getTeamMetrics = (teamId: TeamId, tasks: Task[] = []) => {
  const teamTasks = tasks.filter((t) => t.teamId === teamId);
  const completedTasks = teamTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = teamTasks.filter((t) => t.status === 'In Progress').length;
  const pendingReviewTasks = teamTasks.filter((t) => t.status === 'Pending Review').length;
  const assignedTasks = teamTasks.filter((t) => t.status === 'Assigned').length;
  const totalTasks = teamTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingReviewTasks,
    assignedTasks,
    completionPercentage,
    tasks: teamTasks,
  };
};
