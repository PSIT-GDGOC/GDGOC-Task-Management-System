import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Task, AttachedFile, TeamId } from '../types/task';
import { taskApi } from '../services/api';
import { useAuth } from '../auth/authContext';

export interface NewTaskInput {
  title: string;
  description: string;
  teamId: TeamId;
  assigneeId: string;
  deadline: string;
  attachments?: AttachedFile[];
}
interface TaskContextType {
  tasks: Task[];
  assignTask: (input: NewTaskInput) => Promise<Task>;
  getTaskById: (id: string) => Task | undefined;
  acceptTask: (taskId: string) => Promise<Task>;
  submitTask: (taskId: string, payload?: { note?: string; prUrl?: string }) => Promise<Task>;
  approveTask: (taskId: string, comment?: string) => Promise<Task>;
  refreshTasks: () => Promise<void>;
  isLoading: boolean;
}
const TaskContext = createContext<TaskContextType | undefined>(undefined);
export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const pending = useRef(new Map<string, Promise<Task>>());

  const refreshTasks = useCallback(async () => {
    if (!userId) return;
    const current = generation.current;
    setIsLoading(true);
    try {
      const data = await taskApi.fetchTasks();
      if (current === generation.current) {
        setTasks(data);
        setError(null);
      }
    } catch (err) {
      if (current === generation.current)
        setError(err instanceof Error ? err.message : 'Unable to load tasks.');
    } finally {
      if (current === generation.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    generation.current += 1;
    setTasks([]);
    setError(null);
    setIsLoading(false);
    pending.current.clear();
    void refreshTasks();
    return () => {
      generation.current += 1;
    };
  }, [refreshTasks]);

  const save = (key: string, operation: () => Promise<Task>): Promise<Task> => {
    const active = pending.current.get(key);
    if (active) return active;
    const current = generation.current;
    const request = operation()
      .then((saved) => {
        if (current === generation.current) {
          setTasks((previous) =>
            previous.some((task) => task.id === saved.id)
              ? previous.map((task) => (task.id === saved.id ? saved : task))
              : [saved, ...previous],
          );
          setError(null);
        }
        return saved;
      })
      .catch((err: unknown) => {
        if (current === generation.current)
          setError(err instanceof Error ? err.message : 'Unable to save task.');
        throw err;
      })
      .finally(() => {
        if (pending.current.get(key) === request) pending.current.delete(key);
      });
    pending.current.set(key, request);
    return request;
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        refreshTasks,
        assignTask: (input) => save('create', () => taskApi.createTask(input)),
        getTaskById: (id) => tasks.find((task) => task.id === id),
        acceptTask: (id) => save(id, () => taskApi.startTask(id)),
        submitTask: (id, payload) => save(id, () => taskApi.submitTask(id, payload)),
        approveTask: (id, comment) => save(id, () => taskApi.reviewTask(id, 'APPROVED', comment)),
      }}
    >
      {error && (
        <div role="alert" className="relative z-[100] bg-red-50 p-3 text-sm text-red-800">
          {error}{' '}
          <button type="button" className="ml-3 underline" onClick={() => void refreshTasks()}>
            Retry loading tasks
          </button>
        </div>
      )}
      {children}
    </TaskContext.Provider>
  );
};
export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};
