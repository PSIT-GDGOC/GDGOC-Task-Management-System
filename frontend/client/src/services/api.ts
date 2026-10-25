import { Task, TaskStatus, Priority, TeamId, AttachedFile } from '../types/task';
import { User, Role } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

let cachedCsrfToken: string | null = null;

/**
 * Fetch and cache CSRF token from backend
 */
export async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok) {
      const data = await res.json();
      if (data.csrfToken) {
        cachedCsrfToken = data.csrfToken;
        return data.csrfToken;
      }
    }
  } catch (err) {
    console.warn('[API] Could not retrieve CSRF token from server:', err);
  }
  return '';
}

/**
 * Robust fetch wrapper with automatic CSRF injection and session cookies
 */
export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject CSRF token on mutating requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await getCsrfToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${endpoint} timed out after 8s. Backend may be offline or starting up.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle CSRF rotation or session expiration
  if (response.status === 403) {
    cachedCsrfToken = null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `Request failed (${response.status})`;
    const error = new Error(errorMsg);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

// ============================================================================
// Data Adapters (Translating Backend Models <-> Frontend Types)
// ============================================================================

export function backendStatusToFrontend(status: string): TaskStatus {
  switch (status) {
    case 'FREE':
      return 'To Do';
    case 'ASSIGNED':
      return 'Assigned';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'IN_REVIEW':
      return 'Pending Review';
    case 'DONE':
      return 'Completed';
    default:
      return 'Assigned';
  }
}

export function frontendStatusToBackend(status: TaskStatus): string {
  switch (status) {
    case 'To Do':
      return 'FREE';
    case 'Assigned':
      return 'ASSIGNED';
    case 'In Progress':
      return 'IN_PROGRESS';
    case 'Pending Review':
      return 'IN_REVIEW';
    case 'Completed':
      return 'DONE';
    default:
      return 'ASSIGNED';
  }
}

export function backendPriorityToFrontend(priority?: string): Priority {
  switch (priority) {
    case 'HIGH':
    case 'URGENT':
      return 'High';
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
    default:
      return 'Medium';
  }
}

export function frontendPriorityToBackend(priority?: Priority): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  switch (priority) {
    case 'High':
      return 'HIGH';
    case 'Low':
      return 'LOW';
    case 'Medium':
    default:
      return 'MEDIUM';
  }
}

export function formatBackendTask(backendTask: any): Task {
  const deadlineStr = backendTask.deadline
    ? new Date(backendTask.deadline).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not specified';

  const createdAtStr = backendTask.createdAt
    ? new Date(backendTask.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Sprint 04';

  const assignee = backendTask.assignee;
  const initials = assignee?.name
    ? assignee.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'GD';

  // Parse simulated attachments if in tags or mock
  const attachments: AttachedFile[] = [];
  if (backendTask.tags && Array.isArray(backendTask.tags)) {
    backendTask.tags.forEach((tag: string, index: number) => {
      if (tag.includes('.')) {
        attachments.push({
          id: `att-${index}`,
          name: tag,
          size: 1024 * 128,
          type: tag.split('.').pop() || 'doc',
          formattedSize: '128 KB',
        });
      }
    });
  }

  return {
    id: backendTask.id || `TSK-${Math.floor(100 + Math.random() * 900)}`,
    title: backendTask.title,
    description: backendTask.description,
    teamId: (backendTask.team?.slug || backendTask.teamId || 'tech') as TeamId,
    teamName: backendTask.team?.name || 'Tech Team',
    assigneeId: assignee?.id || backendTask.assigneeId || '',
    assigneeName: assignee?.name || 'Unassigned',
    assigneeEmail: assignee?.email || 'member@psit.gdgoc.dev',
    assigneeInitials: initials,
    priority: backendPriorityToFrontend(backendTask.priority),
    status: backendStatusToFrontend(backendTask.status),
    deadline: deadlineStr,
    createdAt: createdAtStr,
    attachments,
  };
}

// ============================================================================
// Authentication & User Services
// ============================================================================

export const authApi = {
  async loginDev(
    email: string,
    name?: string,
    role: Role = 'MEMBER',
    position?: string,
    teamSlug?: string,
    isTeamHead?: boolean,
    invitationKey?: string,
  ): Promise<User> {
    const backendRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
    const res = await apiRequest<{ success: boolean; user: any }>('/auth/dev-login', 'POST', {
      email,
      name,
      role: backendRole,
      position,
      teamSlug,
      isTeamHead,
      invitationKey,
    });

    // Refresh CSRF
    await getCsrfToken();

    let resolvedRole: Role = 'MEMBER';
    const isHead = Boolean(isTeamHead) || res.user.teamMemberships?.some((m: any) => m.isTeamHead);
    if (res.user.role === 'ADMIN' || res.user.role === 'PRESIDENT' || res.user.role === 'SYSTEM_OWNER') {
      resolvedRole = 'ADMIN';
    } else if (isHead || res.user.position?.toLowerCase().includes('lead')) {
      resolvedRole = 'TEAM_LEADER';
    }

    const teamName = res.user.teamMemberships?.[0]?.team?.name || (teamSlug ? teamSlug.toUpperCase() + ' Team' : 'Tech Team');

    return {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: resolvedRole,
      position: res.user.position || position,
      team: teamName,
      isTeamHead: isHead,
      membershipStatus: resolvedRole === 'TEAM_LEADER' || resolvedRole === 'ADMIN' ? 'CORE_MEMBER' : 'REGULAR_MEMBER',
      avatarUrl: res.user.avatarUrl,
    };
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await apiRequest<{ success: boolean; user: any }>('/auth/me');
      if (res.user) {
        let role: Role = 'MEMBER';
        const isHead = res.user.teamMemberships?.some((m: any) => m.isTeamHead);
        if (res.user.role === 'ADMIN' || res.user.role === 'PRESIDENT' || res.user.role === 'SYSTEM_OWNER') {
          role = 'ADMIN';
        } else if (isHead || res.user.position?.toLowerCase().includes('lead')) {
          role = 'TEAM_LEADER';
        }

        const teamName = res.user.teamMemberships?.[0]?.team?.name || 'Tech Team';

        return {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role,
          position: res.user.position,
          team: teamName,
          isTeamHead: isHead,
          membershipStatus: role === 'ADMIN' || role === 'TEAM_LEADER' ? 'CORE_MEMBER' : 'REGULAR_MEMBER',
          avatarUrl: res.user.avatarUrl,
        };
      }
    } catch {
      // User is not authenticated
    }
    return null;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', 'POST');
    } finally {
      cachedCsrfToken = null;
    }
  },

  async updateName(name: string): Promise<{ success: boolean; user: any }> {
    return await apiRequest<{ success: boolean; user: any }>('/auth/name', 'PATCH', { name });
  },
};

// ============================================================================
// Tasks Services
// ============================================================================

export const taskApi = {
  async fetchTasks(params: { teamId?: string; status?: string; assigneeId?: string } = {}): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params.teamId && params.teamId !== 'ALL') query.append('teamId', params.teamId);
    if (params.status && params.status !== 'ALL') query.append('status', frontendStatusToBackend(params.status as TaskStatus));
    if (params.assigneeId) query.append('assigneeId', params.assigneeId);
    query.append('limit', '100');

    const res = await apiRequest<{ success: boolean; data: any[] }>(`/tasks?${query.toString()}`);
    return (res.data || []).map(formatBackendTask);
  },

  async createTask(input: {
    title: string;
    description: string;
    teamId: string;
    assigneeId?: string;
    deadline?: string;
    priority?: Priority;
  }): Promise<Task> {
    const res = await apiRequest<{ success: boolean; data: any }>('/tasks', 'POST', {
      title: input.title,
      description: input.description,
      scope: 'TEAM',
      teamId: input.teamId,
      assigneeId: input.assigneeId || undefined,
      priority: frontendPriorityToBackend(input.priority),
      deadline: input.deadline ? new Date(input.deadline).toISOString() : undefined,
    });
    return formatBackendTask(res.data);
  },


  async startTask(taskId: string): Promise<Task> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/tasks/${taskId}/start`, 'POST');
    return formatBackendTask(res.data);
  },

  async submitTask(taskId: string, payload: { note?: string; prUrl?: string } = {}): Promise<Task> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/tasks/${taskId}/submit`, 'POST', {
      note: payload.note || 'Milestone deliverables ready for lead verification.',
      prUrl: payload.prUrl,
    });
    return formatBackendTask(res.data);
  },

  async reviewTask(taskId: string, outcome: 'APPROVED' | 'SENT_BACK', comment?: string): Promise<Task> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/tasks/${taskId}/review`, 'POST', {
      outcome,
      reviewComment: comment,
    });
    return formatBackendTask(res.data);
  },

  async getActivityFeed(): Promise<TaskActivityItem[]> {
    try {
      const res = await apiRequest<{ success: boolean; data: TaskActivityItem[] }>('/tasks/activity/feed');
      return res.data || [];
    } catch {
      return [];
    }
  },
};


// ============================================================================
// Admin Services
// ============================================================================

export interface AdminInvitation {
  id: string;
  rawCode?: string;
  role?: 'ADMIN' | 'PRESIDENT';
  intendedRole?: 'ADMIN' | 'PRESIDENT';
  position?: string | null;
  intendedPosition?: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'USED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  intendedEmail?: string | null;
  intendedTeamId?: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string | null;
  githubUsername?: string | null;
  isActive: boolean;
  createdAt: string;
  memberships?: { team: { id: string; name: string; slug: string }; isTeamHead: boolean }[];
}

export const adminApi = {
  async getInvitations(): Promise<AdminInvitation[]> {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/invitations');
    return res.data || [];
  },

  async createInvitation(input: {
    role: 'ADMIN' | 'PRESIDENT';
    position?: string;
    teamId?: string;
    email?: string;
    expiresInHours?: number;
    customKey?: string;
  }): Promise<AdminInvitation> {
    const res = await apiRequest<{ success: boolean; data: any }>('/invitations', 'POST', {
      role: input.role,
      position: input.position || undefined,
      teamId: input.teamId || undefined,
      email: input.email || undefined,
      expiresInHours: input.expiresInHours ?? 48,
      customKey: input.customKey || undefined,
    });
    return res.data;
  },

  async revokeInvitation(id: string): Promise<void> {
    await apiRequest(`/invitations/${id}`, 'DELETE');
  },

  async getUsers(params: { search?: string; role?: string; isActive?: boolean } = {}): Promise<AdminUser[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.isActive !== undefined) query.append('isActive', String(params.isActive));
    query.append('limit', '100');

    const res = await apiRequest<{ success: boolean; data: any[] }>(`/users?${query.toString()}`);
    return res.data || [];
  },

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    await apiRequest(`/users/${userId}/status`, 'PATCH', { isActive });
  },

  async getTeams(): Promise<{ id: string; name: string; slug: string; description?: string; _count?: { members: number; tasks: number } }[]> {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/teams');
    return res.data || [];
  },

  async createTeam(input: { name: string; slug: string; description?: string }): Promise<any> {
    const res = await apiRequest<{ success: boolean; data: any }>('/teams', 'POST', input);
    return res.data;
  },

  async getStatistics(): Promise<{ totalCompleted: number; onTimeRate: number | null; averageLeadTimeHours: number | null }> {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>('/history/statistics');
      return res.data || { totalCompleted: 0, onTimeRate: null, averageLeadTimeHours: null };
    } catch {
      return { totalCompleted: 0, onTimeRate: null, averageLeadTimeHours: null };
    }
  },
};

export interface TaskActivityItem {
  id: string;
  taskId: string;
  actorId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  timestamp: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    position?: string | null;
    role: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
    team?: { id: string; name: string; slug: string };
    assignee?: { id: string; name: string };
  };
}

export interface AppNotification {
  id: string;
  userId: string;
  taskId: string;
  kind: 'TASK_ASSIGNED' | 'TASK_SUBMITTED' | 'TASK_APPROVED' | 'CHANGES_REQUESTED' | 'TASK_OVERDUE' | string;
  readAt: string | null;
  createdAt: string;
  task?: {
    id: string;
    title: string;
    status: string;
    deadline?: string | null;
  };
}

export const notificationApi = {
  async getNotifications(unreadOnly = false): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    try {
      const res = await apiRequest<{ success: boolean; data: AppNotification[]; unreadCount: number }>(
        `/notifications?limit=25&unreadOnly=${unreadOnly}`
      );
      return { notifications: res.data || [], unreadCount: res.unreadCount || 0 };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiRequest(`/notifications/${notificationId}/read`, 'POST');
    } catch {
      // fallback
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await apiRequest('/notifications/read-all', 'POST');
    } catch {
      // fallback
    }
  },
};
