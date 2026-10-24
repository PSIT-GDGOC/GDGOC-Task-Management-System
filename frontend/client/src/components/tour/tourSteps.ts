/**
 * tourSteps.ts
 * Centralised definitions for all tours.
 * Every target maps to a data-tour="..." attribute added to the real DOM element.
 *
 * Routes match App.tsx exactly:
 *   /leader/overview   /leader/assign-work   /leader/view-work
 *   /member            /history
 */
import { TourStep, TourId } from '../../context/TourContext';

// ─── Admin / Team Leader Full Tour (7 steps) ─────────────────────────────────
export const leaderFullTour: TourStep[] = [
  {
    target: "overview-heading",
    route: "/leader/overview",
    title: "Welcome to Your Dashboard",
    description:
      "This is your main workspace. Here you can get a quick overview of your team's tasks, see what needs attention, and understand how work is progressing. Visit this page whenever you want to check the overall status of your team's work.",
    position: "bottom",
  },
  {
    target: "leader-sidebar",
    route: "/leader/overview",
    title: "Find Your Way Around",
    description:
      "Use this sidebar to move between the main sections of TaskHub. Overview gives you a summary, Assign Work lets you create and assign tasks, and View Work helps you monitor existing assignments. Other items may provide access to teams or account settings. Select a section whenever you need it.",
    position: "right",
  },
  {
    target: "overview-stats",
    route: "/leader/overview",
    title: "Understand Your Task Statistics",
    description:
      "These cards help you understand the current state of your team's work at a glance. Total Tasks shows the overall number of tasks. In Progress represents work currently being done. Pending Review indicates work awaiting review. Completed shows finished tasks. These numbers help you decide what needs attention.",
    position: "bottom",
  },
  {
    target: "overview-teams",
    route: "/leader/overview",
    title: "Explore Your Teams",
    description:
      "This section helps you see the teams available in your workspace. Use the available team cards or controls to explore team information and members. When you need to understand who is working on something, start by checking the relevant team.",
    position: "top",
  },
  {
    target: "assign-work-form",
    route: "/leader/assign-work",
    title: "Assign Work to Your Team",
    description:
      "Use Assign Work to give someone a task. Choose the relevant team or member, enter the task title and description, complete the required fields, and review the information before submitting. Clear task details help everyone understand what needs to be done.",
    position: "right",
  },
  {
    target: "view-work-list",
    route: "/leader/view-work",
    title: "Monitor Your Team's Work",
    description:
      "Open View Work to review assigned tasks and check their current status. Use the available information and filters to understand what is pending, what is in progress, and what has been completed. Check this section regularly to monitor progress and identify work that may need attention.",
    position: "bottom",
  },
  {
    target: "leader-profile-card",
    route: "/leader/overview",
    title: "Manage Your Account",
    description:
      "Use your profile or account menu to access the account options available to you. When you finish working on a shared or public computer, use Logout to end your session securely.",
    position: "right",
  },
];

// ─── Member Full Tour (6 steps) ───────────────────────────────────────────────
export const memberFullTour: TourStep[] = [
  {
    target: "mywork-heading",
    route: "/member",
    title: "Welcome to Your Workspace",
    description:
      "This is your personal work area. Here you can find tasks assigned to you, understand what needs to be done, and check your progress. Start here whenever you want to plan your work.",
    position: "bottom",
  },
  {
    target: "member-sidebar",
    route: "/member",
    title: "Navigate Your Workspace",
    description:
      "Use the sidebar to move between your main sections. My Work helps you review current assignments, while My Work History lets you look back at previous work. Use your account menu to access profile options or log out.",
    position: "right",
  },
  {
    target: "mywork-tasklist",
    route: "/member",
    title: "Your Assigned Tasks",
    description:
      "This section shows the work assigned to you. Open a task or review its available details to understand what needs to be done, any instructions provided, and its current status. Check this page regularly so you know what to work on next. If no tasks are present yet, they will appear here once assigned.",
    position: "bottom",
  },
  {
    target: "mywork-stats",
    route: "/member",
    title: "Understand and Update Your Work",
    description:
      "Task details explain what you need to do and help you understand the expected outcome. Check the task's current status and statistics here to see where it stands. Use these metrics to track your progress at a glance.",
    position: "bottom",
  },
  {
    target: "history-heading",
    route: "/history",
    title: "Look Back at Your Work",
    description:
      "My Work History helps you review previous assignments and see the records available for your past work. Use this section when you want to check earlier tasks or understand what has already been completed.",
    position: "bottom",
  },
  {
    target: "member-profile-card",
    route: "/member",
    title: "Manage Your Account",
    description:
      "Use your account menu to access the profile options available to you. When you finish working on a shared or public computer, log out securely to end your session.",
    position: "right",
  },
];

// ─── Contextual tour: Leader Overview (3 steps) ───────────────────────────────
export const leaderOverviewTour: TourStep[] = [
  {
    target: "overview-heading",
    route: "/leader/overview",
    title: "Your Overview Dashboard",
    description:
      "This page gives you an instant summary of your team's current status — tasks, progress, and team workspaces — all in one place.",
    position: "bottom",
  },
  {
    target: "overview-stats",
    route: "/leader/overview",
    title: "Task Statistics Cards",
    description:
      "Total Tasks, In Progress, Pending Review, and Completed. These four numbers tell you the health of your team's workload at a glance.",
    position: "bottom",
  },
  {
    target: "overview-teams",
    route: "/leader/overview",
    title: "Your Team Cards",
    description:
      "Each card represents one of your teams. Click a team card to view that team's members, individual task counts, and details.",
    position: "top",
  },
];

// ─── Contextual tour: Assign Work (4 steps) ───────────────────────────────────
export const leaderAssignTour: TourStep[] = [
  {
    target: "assign-work-heading",
    route: "/leader/assign-work",
    title: "Assign Work to Your Team",
    description:
      "Use Assign Work to give someone a task. Choose the relevant team or member, enter the task title and description, complete the required fields, and review the information before submitting.",
    position: "bottom",
  },
  {
    target: "assign-team-select",
    route: "/leader/assign-work",
    title: "Select a Team",
    description:
      "Choose the team the task belongs to. This determines which members you can assign the task to.",
    position: "bottom",
  },
  {
    target: "assign-title-field",
    route: "/leader/assign-work",
    title: "Enter Task Details",
    description:
      "Give the task a clear, descriptive title and a detailed description so the assignee understands exactly what is expected. Set a realistic deadline.",
    position: "bottom",
  },
  {
    target: "assign-submit-btn",
    route: "/leader/assign-work",
    title: "Assign the Task",
    description:
      "Review all the entered information, then click this button to assign the task. The member will be able to see it in their My Work interface.",
    position: "top",
  },
];

// ─── Contextual tour: View Work (3 steps) ────────────────────────────────────
export const leaderViewTour: TourStep[] = [
  {
    target: "view-work-heading",
    route: "/leader/view-work",
    title: "View Work Page",
    description:
      "This page shows all tasks assigned across your teams. Use it to monitor progress, check statuses, and review individual task details.",
    position: "bottom",
  },
  {
    target: "view-work-filters",
    route: "/leader/view-work",
    title: "Search and Filter",
    description:
      "Use the search bar to find a specific task by name, member, or description. Use the status and team filters to narrow down the list.",
    position: "bottom",
  },
  {
    target: "view-work-list",
    route: "/leader/view-work",
    title: "Monitor Your Team's Work",
    description:
      "Open View Work to review assigned tasks and check their current status. Each row shows title, squad, member, deadline, and status. Click any row to inspect details.",
    position: "bottom",
  },
];

// ─── Contextual tour: My Work (3 steps) ───────────────────────────────────────
export const memberMyWorkTour: TourStep[] = [
  {
    target: "mywork-heading",
    route: "/member",
    title: "My Work Page",
    description:
      "This is your personal task list. All tasks assigned to you by your team leader appear here.",
    position: "bottom",
  },
  {
    target: "mywork-stats",
    route: "/member",
    title: "Your Task Statistics",
    description:
      "A quick summary of your assigned, in-progress, pending review, and completed tasks.",
    position: "bottom",
  },
  {
    target: "mywork-tasklist",
    route: "/member",
    title: "Your Task List",
    description:
      "Your assignments appear here. Review task instructions and current status. If no tasks are present yet, they will appear here once assigned.",
    position: "bottom",
  },
];

// ─── Contextual tour: My Work History (3 steps) ───────────────────────────────
export const memberHistoryTour: TourStep[] = [
  {
    target: "history-heading",
    route: "/history",
    title: "My Work History",
    description:
      "This page shows your previous assignments and completed work records. Review past tasks, timelines, and milestones.",
    position: "bottom",
  },
  {
    target: "history-stats",
    route: "/history",
    title: "Your History Summary",
    description:
      "These cards summarise your completed tasks, on-time completion, in-progress work, and pending reviews.",
    position: "bottom",
  },
  {
    target: "history-list",
    route: "/history",
    title: "Past Assignments",
    description:
      "Browse your historical task records here. Each entry shows the task title, status, team, and deadline.",
    position: "bottom",
  },
];

// ─── Tour registry ────────────────────────────────────────────────────────────
export const TOURS: Record<TourId, TourStep[]> = {
  "leader-full": leaderFullTour,
  "member-full": memberFullTour,
  "leader-overview": leaderOverviewTour,
  "leader-assign": leaderAssignTour,
  "leader-view": leaderViewTour,
  "member-mywork": memberMyWorkTour,
  "member-history": memberHistoryTour,
};
