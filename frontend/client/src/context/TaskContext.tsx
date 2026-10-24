import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, AttachedFile, TeamId } from '../types/task';
import { TEAMS } from '../data/mockData';
import { taskApi } from '../services/api';

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
  assignTask: (input: NewTaskInput) => Task;
  getTaskById: (id: string) => Task | undefined;
  submitTask: (taskId: string) => Task | null;
  approveTask: (taskId: string) => Task | null;
  refreshTasks: () => Promise<void>;
  isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync tasks from live backend / database on mount
  const refreshTasks = async () => {
    setIsLoading(true);
    try {
      const liveTasks = await taskApi.fetchTasks();
      setTasks(liveTasks || []);
    } catch {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  const assignTask = (input: NewTaskInput): Task => {
    const selectedTeam = TEAMS.find((t) => t.id === input.teamId);
    const selectedMember = selectedTeam?.members.find((m) => m.id === input.assigneeId);

    // Format display deadline (e.g. "November 14, 2026")
    let formattedDeadline = input.deadline;
    if (input.deadline && !input.deadline.toLowerCase().includes('not specified')) {
      try {
        const parts = input.deadline.split('-');
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          if (!isNaN(d.getTime())) {
            formattedDeadline = d.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
          }
        }
      } catch {
        formattedDeadline = input.deadline;
      }
    }

    const newTask: Task = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: input.title.trim(),
      description: input.description.trim(),
      teamId: input.teamId,
      teamName: selectedTeam?.name || 'Tech Team',
      assigneeId: input.assigneeId,
      assigneeName: selectedMember?.name || 'Assigned Member',
      assigneeEmail: selectedMember?.email || 'member@psit.gdgoc.dev',
      assigneeInitials: selectedMember?.initials || 'GD',
      status: 'Assigned',
      deadline: formattedDeadline || 'Not specified',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      attachments: input.attachments || [],
    };

    // Optimistically update UI
    setTasks((prev) => [newTask, ...prev]);

    // Persist to live Supabase backend asynchronously
    taskApi
      .createTask({
        title: input.title,
        description: input.description,
        teamId: input.teamId,
        assigneeId: input.assigneeId,
        deadline: input.deadline,
      })
      .then((serverTask) => {
        // Swap temp id with real server generated id if available
        setTasks((prev) => prev.map((t) => (t.id === newTask.id ? serverTask : t)));
      })
      .catch((err) => {
        console.warn('[TaskSync] Saved locally (server sync skipped):', err);
      });

    return newTask;
  };


  const submitTask = (taskId: string): Task | null => {
    let updatedTask: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTask = {
            ...t,
            status: 'Pending Review',
          };
          return updatedTask;
        }
        return t;
      })
    );

    // Call live server
    taskApi.submitTask(taskId).catch((err) => {
      console.warn('[TaskSync] Submitted locally (server sync skipped):', err);
    });

    return updatedTask;
  };

  const approveTask = (taskId: string): Task | null => {
    let updatedTask: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTask = {
            ...t,
            status: 'Completed',
          };
          return updatedTask;
        }
        return t;
      })
    );

    // Call live server
    taskApi.reviewTask(taskId, 'APPROVED').catch((err) => {
      console.warn('[TaskSync] Approved locally (server sync skipped):', err);
    });

    return updatedTask;
  };

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((t) => t.id === id);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        assignTask,
        getTaskById,
        submitTask,
        approveTask,
        refreshTasks,
        isLoading,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
