import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, AttachedFile, TeamId } from '../types/task';
import { INITIAL_SAMPLE_TASKS, TEAMS } from '../data/mockData';

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
  claimTask: (taskId: string, memberId?: string, memberName?: string) => Task | null;
  submitTask: (taskId: string) => Task | null;
  approveTask: (taskId: string) => Task | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_SAMPLE_TASKS);

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

    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const claimTask = (taskId: string, memberId?: string, memberName?: string): Task | null => {
    let updatedTask: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTask = {
            ...t,
            status: 'In Progress',
            ...(memberId && { assigneeId: memberId }),
            ...(memberName && { assigneeName: memberName }),
          };
          return updatedTask;
        }
        return t;
      })
    );
    return updatedTask;
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
        claimTask,
        submitTask,
        approveTask,
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
