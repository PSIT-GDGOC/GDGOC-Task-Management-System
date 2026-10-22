import { Team, Task, TeamId } from '../types/task';

export const TEAMS: Team[] = [
  {
    id: 'core',
    name: 'Core Team',
    slug: 'core-team',
    description: 'Executive campus leadership, speaker coordination, event logistics, and overall chapter strategy.',
    accent: 'red',
    leadName: 'Dr. Neha Sharma',
    members: [
      { id: 'usr_core_01', name: 'Dr. Neha Sharma', email: 'admin@psit.gdgoc.dev', initials: 'NS', role: 'Faculty Sponsor & Chapter Lead' },
      { id: 'usr_core_02', name: 'Pooja Kashyap', email: 'pooja.core@psit.gdgoc.dev', initials: 'PK', role: 'Operations Lead' },
      { id: 'usr_core_03', name: 'Ananya Mishra', email: 'ananya.core@psit.gdgoc.dev', initials: 'AM', role: 'Speaker Liaison' },
      { id: 'usr_core_04', name: 'Kartik Singhal', email: 'kartik.core@psit.gdgoc.dev', initials: 'KS', role: 'Finance & Logistics' },
    ],
  },
  {
    id: 'tech',
    name: 'Tech Team',
    slug: 'tech-team',
    description: 'Technical development, open-source repositories, workshop portals, and hands-on coding bootcamps.',
    accent: 'blue',
    leadName: 'Aman Verma',
    members: [
      { id: 'usr_leader_01', name: 'Aman Verma', email: 'leader@psit.gdgoc.dev', initials: 'AV', role: 'Technical Lead' },
      { id: 'usr_member_01', name: 'Rohan Gupta', email: 'member@psit.gdgoc.dev', initials: 'RG', role: 'Full Stack Developer' },
      { id: 'usr_tech_03', name: 'Tanvi Agarwal', email: 'tanvi.tech@psit.gdgoc.dev', initials: 'TA', role: 'Cloud & DevOps Engineer' },
      { id: 'usr_tech_04', name: 'Varun Joshi', email: 'varun.tech@psit.gdgoc.dev', initials: 'VJ', role: 'Android Specialist' },
      { id: 'usr_tech_05', name: 'Simran Kaur', email: 'simran.tech@psit.gdgoc.dev', initials: 'SK', role: 'Backend Engineer' },
    ],
  },
  {
    id: 'media',
    name: 'Media Team',
    slug: 'media-team',
    description: 'Visual identity, motion design, event photography, recap video reels, and brand aesthetics.',
    accent: 'yellow',
    leadName: 'Sameer Siddiqui',
    members: [
      { id: 'usr_media_01', name: 'Sameer Siddiqui', email: 'sameer.media@psit.gdgoc.dev', initials: 'SS', role: 'Creative Director' },
      { id: 'usr_media_02', name: 'Ishita Roy', email: 'ishita.media@psit.gdgoc.dev', initials: 'IR', role: 'Motion Graphic Artist' },
      { id: 'usr_media_03', name: 'Devansh Pandey', email: 'devansh.media@psit.gdgoc.dev', initials: 'DP', role: 'Videography & Photography' },
      { id: 'usr_media_04', name: 'Kavya Sen', email: 'kavya.media@psit.gdgoc.dev', initials: 'KS', role: 'UI/UX Visual Designer' },
    ],
  },
  {
    id: 'content',
    name: 'Content Team',
    slug: 'content-team',
    description: 'Technical blogging, social campaign copies, workshop study guides, and campus newsletters.',
    accent: 'green',
    leadName: 'Megha Rastogi',
    members: [
      { id: 'usr_content_01', name: 'Megha Rastogi', email: 'megha.content@psit.gdgoc.dev', initials: 'MR', role: 'Editorial Lead' },
      { id: 'usr_content_02', name: 'Aditya Srivastava', email: 'aditya.content@psit.gdgoc.dev', initials: 'AS', role: 'Technical Writer' },
      { id: 'usr_content_03', name: 'Kritika Dubey', email: 'kritika.content@psit.gdgoc.dev', initials: 'KD', role: 'Social Media Strategist' },
    ],
  },
];

/**
 * 4 Baseline Sample Tasks specified for View Work & My Work
 */
export const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: 'TSK-101',
    title: 'DevFest 2026 Registration Portal Auth & Sessions',
    description: 'Implement JWT session handling, rate limits, and secure cookies for attendee registrations.',
    teamId: 'tech',
    teamName: 'Tech Team',
    assigneeId: 'usr_member_01',
    assigneeName: 'Rohan Gupta',
    assigneeEmail: 'member@psit.gdgoc.dev',
    assigneeInitials: 'RG',
    status: 'Assigned',
    deadline: 'November 4, 2026',
    createdAt: 'October 20, 2026',
    attachments: [
      {
        id: 'att-101',
        name: 'Auth_Security_Specs.pdf',
        size: 1450000,
        type: 'application/pdf',
        formattedSize: '1.4 MB',
      },
    ],
  },
  {
    id: 'TSK-102',
    title: 'Cloud Run CI/CD Automated Deployment Script',
    description: 'Configure GitHub Actions workflow for staging deployments to Google Cloud Run with smoke tests.',
    teamId: 'tech',
    teamName: 'Tech Team',
    assigneeId: 'usr_member_01',
    assigneeName: 'Rohan Gupta',
    assigneeEmail: 'member@psit.gdgoc.dev',
    assigneeInitials: 'RG',
    status: 'Assigned',
    deadline: 'November 8, 2026',
    createdAt: 'October 21, 2026',
    attachments: [
      {
        id: 'att-102',
        name: 'Deployment_Pipeline_Diagram.png',
        size: 780000,
        type: 'image/png',
        formattedSize: '780 KB',
      },
    ],
  },
  {
    id: 'TSK-103',
    title: 'Android Jetpack Compose Hands-on Starter Repo',
    description: 'Clean starter codebase with Material 3 theming and navigation for the upcoming student workshop.',
    teamId: 'tech',
    teamName: 'Tech Team',
    assigneeId: 'usr_member_01',
    assigneeName: 'Rohan Gupta',
    assigneeEmail: 'member@psit.gdgoc.dev',
    assigneeInitials: 'RG',
    status: 'Assigned',
    deadline: 'October 28, 2026',
    createdAt: 'October 18, 2026',
  },
  {
    id: 'TSK-104',
    title: 'PostgreSQL Database Schema & Migration Setup',
    description: 'Draft relational schema for attendance verification, badges, and QR codes.',
    teamId: 'tech',
    teamName: 'Tech Team',
    assigneeId: 'usr_member_01',
    assigneeName: 'Rohan Gupta',
    assigneeEmail: 'member@psit.gdgoc.dev',
    assigneeInitials: 'RG',
    status: 'Assigned',
    deadline: 'Not specified',
    createdAt: 'October 22, 2026',
    attachments: [
      {
        id: 'att-104',
        name: 'Schema_Draft_v1.docx',
        size: 320000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        formattedSize: '320 KB',
      },
    ],
  },
];

export const MOCK_TASKS: Task[] = INITIAL_SAMPLE_TASKS;

export interface DashboardStats {
  totalTasks: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
  assigned: number;
  toDo: number;
}

export const getDashboardStats = (tasks: Task[] = MOCK_TASKS): DashboardStats => {
  return {
    totalTasks: tasks.length,
    assigned: tasks.filter((t) => t.status === 'Assigned').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    pendingReview: tasks.filter((t) => t.status === 'Pending Review').length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
    toDo: tasks.filter((t) => t.status === 'To Do').length,
  };
};

export const getTeamMetrics = (teamId: TeamId, tasks: Task[] = MOCK_TASKS) => {
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
