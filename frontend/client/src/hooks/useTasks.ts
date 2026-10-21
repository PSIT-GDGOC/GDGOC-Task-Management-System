import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { Task, TaskStatus, TaskScope } from '../types/task';

export interface TaskFilters {
  teamId?: string;
  scope?: TaskScope;
  status?: TaskStatus;
  search?: string;
}

interface TasksResponse {
  success: boolean;
  count: number;
  data: Task[];
}

/**
 * useTasks Hook
 * Board synchronization powered by TanStack Query polling:
 * - refetchInterval: 12 seconds (12000ms)
 * - refetchIntervalInBackground: false (polls ONLY while board tab is active)
 * - refetchOnWindowFocus: true (immediate sync when user switches back to browser tab)
 * - refetchOnReconnect: true (immediate sync on network reconnection)
 */
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters.teamId) searchParams.set('teamId', filters.teamId);
      if (filters.scope) searchParams.set('scope', filters.scope);
      if (filters.status) searchParams.set('status', filters.status);
      if (filters.search) searchParams.set('search', filters.search);

      const qs = searchParams.toString();
      const endpoint = `/tasks${qs ? `?${qs}` : ''}`;
      const response = await apiClient<TasksResponse>(endpoint);
      return response.data;
    },
    refetchInterval: 12000, // 12 seconds sync interval
    refetchIntervalInBackground: false, // Do not waste background resources
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Mutation: Claim a Free Task
 */
export function useClaimTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      return apiClient<{ success: boolean; data: Task }>(`/tasks/${taskId}/claim`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Mutation: Start Task (ASSIGNED -> IN_PROGRESS)
 */
export function useStartTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      return apiClient<{ success: boolean; data: Task }>(`/tasks/${taskId}/start`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Mutation: Submit Task for Review (IN_PROGRESS -> IN_REVIEW)
 */
export function useSubmitTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: { prUrl: string; note?: string };
    }) => {
      return apiClient<{ success: boolean; data: Task }>(`/tasks/${taskId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
