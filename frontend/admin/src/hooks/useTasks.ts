import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { Task, TaskStatus, TaskScope, TaskPriority } from '../types/task';

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
  pagination?:{totalPages:number};
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters.teamId) searchParams.set('teamId', filters.teamId);
      if (filters.scope) searchParams.set('scope', filters.scope);
      if (filters.status) searchParams.set('status', filters.status);
      if (filters.search) searchParams.set('search', filters.search);

      const data:Task[]=[];
      let page=1,totalPages=1;
      searchParams.set('limit','100');
      do {
        searchParams.set('page',String(page));
        const response=await apiClient<TasksResponse>(`/tasks?${searchParams}`);
        data.push(...response.data); totalPages=response.pagination?.totalPages??1;page++;
      } while(page<=totalPages);
      return data;
    },
    refetchInterval: 12000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      priority?: TaskPriority;
      scope?: TaskScope;
      teamId?: string | null;
      deadline?: string | null;
      tags?: string[];
    }) => {
      return apiClient<{ success: boolean; data: Task }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useReviewTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: { outcome: 'APPROVED' | 'SENT_BACK'; reviewComment?: string };
    }) => {
      return apiClient<{ success: boolean; data: Task }>(`/tasks/${taskId}/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      return apiClient<{ success: boolean }>(`/tasks/${taskId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
