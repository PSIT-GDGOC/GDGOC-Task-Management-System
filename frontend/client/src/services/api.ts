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
    const res = await fetch(`${API_BASE}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
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

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
  async loginDev(email: string, name?: string, role: Role = 'MEMBER'): Promise<User> {
    const backendRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
    const res = await apiRequest<{ success: boolean; user: any }>('/auth/dev-login', 'POST', {
      email,
      name,
      role: backendRole,
    });

    // Refresh CSRF
    await getCsrfToken();

    return {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: role,
      membershipStatus: role === 'TEAM_LEADER' || role === 'ADMIN' ? 'CORE_MEMBER' : 'REGULAR_MEMBER',
      avatarUrl: res.user.avatarUrl,
    };
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await apiRequest<{ success: boolean; user: any }>('/auth/me');
      if (res.user) {
        let role: Role = 'MEMBER';
        if (res.user.role === 'ADMIN' || res.user.role === 'PRESIDENT' || res.user.role === 'SYSTEM_OWNER') {
          role = 'ADMIN';
        }

        return {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role,
          membershipStatus: role === 'ADMIN' ? 'CORE_MEMBER' : 'REGULAR_MEMBER',
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

  async claimTask(taskId: string): Promise<Task> {
    // 1. Claim task
    let res = await apiRequest<{ success: boolean; data: any }>(`/tasks/${taskId}/claim`, 'POST');
    // 2. Start task (transitions to IN_PROGRESS)
    try {
      res = await apiRequest<{ success: boolean; data: any }>(`/tasks/${taskId}/start`, 'POST');
    } catch {
      // already in progress or transition skipped
    }
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
};
