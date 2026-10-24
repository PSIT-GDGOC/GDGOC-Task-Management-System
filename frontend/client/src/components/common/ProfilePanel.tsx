import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCircle2, BriefcaseBusiness, CheckCircle2, Clock3, ListTodo, AlertCircle } from 'lucide-react';
import { User } from '../../types/auth';
import { Task } from '../../types/task';

type ProfilePanelProps = {
  user: User | null;
  tasks: Task[];
  onClose: () => void;
};

const roleName = (user: User) => {
  if (user.position) return user.position;
  if (user.role === 'TEAM_LEADER') return 'Team Leader';
  if (user.role === 'ADMIN') return 'Admin';
  return 'Member';
};

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[minmax(7rem,0.7fr)_minmax(0,1.3fr)] gap-3 border-b border-gdgoc-gray-100 py-2.5 last:border-b-0">
      <dt className="text-xs font-semibold text-gdgoc-gray-500">{label}</dt>
      <dd className="break-words text-right text-sm font-medium text-gdgoc-gray-900">{value}</dd>
    </div>
  );
};

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ user, tasks, onClose }) => {
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const beginClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => onCloseRef.current(), 160);
  };

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') beginClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      previouslyFocused?.focus();
    };
  }, []);

  if (!user) return null;

  const isMember = user.role === 'MEMBER';
  const memberTasks = isMember
    ? tasks.filter((task) =>
        task.assigneeId === user.id ||
        (!!user.email && task.assigneeEmail.toLowerCase() === user.email.toLowerCase()),
      )
    : tasks;
  const assignedTeamNames = [...new Set(memberTasks.map((task) => task.teamName).filter(Boolean))];
  const teamName = isMember
    ? assignedTeamNames.length > 0
      ? assignedTeamNames.join(', ')
      : user.team
    : user.team;
  const githubUsername = 'githubUsername' in user && typeof user.githubUsername === 'string'
    ? user.githubUsername
    : undefined;
  const statistics = [
    { label: isMember ? 'Tasks Assigned' : 'Tasks Managed', value: memberTasks.length, icon: ListTodo },
    { label: 'In Progress', value: memberTasks.filter((task) => task.status === 'In Progress').length, icon: Clock3 },
    { label: 'Pending Review', value: memberTasks.filter((task) => task.status === 'Pending Review').length, icon: AlertCircle },
    { label: 'Completed', value: memberTasks.filter((task) => task.status === 'Completed').length, icon: CheckCircle2 },
  ];

  return createPortal(
    <div
      className={`profile-panel-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 ${closing ? 'is-closing' : ''}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) beginClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-panel-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`profile-panel-card relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 outline-none sm:p-6 card-bb ${closing ? 'is-closing' : ''}`}
      >
        <button
          type="button"
          onClick={beginClose}
          aria-label="Close profile panel"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gdgoc-gray-500 transition-colors hover:bg-gdgoc-gray-100 hover:text-gdgoc-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gdgoc-blue"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-gdgoc-gray-100 pb-4 pr-10">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-full border border-gdgoc-gray-200 object-cover" />
          ) : (
            <UserCircle2 className="h-12 w-12 flex-shrink-0 text-gdgoc-blue" />
          )}
          <div className="min-w-0">
            <h2 id="profile-panel-title" className="truncate text-xl font-semibold text-gdgoc-gray-900">{user.name || 'Not provided'}</h2>
            <p className="truncate text-sm text-gdgoc-gray-600">{user.email || 'Not provided'}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded border border-[#111111] bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gdgoc-blue">
              <BriefcaseBusiness className="h-3 w-3" />{roleName(user)}
            </span>
          </div>
        </div>

        <section className="mt-4">
          <h3 className="mb-1 text-sm font-semibold text-gdgoc-gray-900">Basic Information</h3>
          <dl>
            <InfoRow label="Full Name" value={user.name || 'Not provided'} />
            <InfoRow label="Email Address" value={user.email || 'Not provided'} />
            <InfoRow label="GitHub Username" value={githubUsername} />
            <InfoRow label="Role" value={roleName(user)} />
            <InfoRow label={isMember ? 'Assigned Team' : 'Team'} value={teamName} />
            <InfoRow label="Chapter / Organization" value="GDGoC PSIT Kanpur Chapter" />
          </dl>
        </section>

        {!isMember && (
          <section className="mt-4 rounded-xl border border-gdgoc-gray-200 bg-gdgoc-gray-50 p-3">
            <h3 className="text-sm font-semibold text-gdgoc-gray-900">Role &amp; Responsibilities</h3>
            <p className="mt-1 text-xs leading-relaxed text-gdgoc-gray-700">
              Manage teams, assign work, review submissions, and monitor task progress.
            </p>
          </section>
        )}

        <section className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-gdgoc-gray-900">{isMember ? 'My Work Statistics' : 'Quick Statistics'}</h3>
          <div className="grid grid-cols-2 gap-3">
            {statistics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-gdgoc-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-gdgoc-gray-600">
                  <span>{label}</span><Icon className="h-4 w-4 flex-shrink-0 text-gdgoc-blue" />
                </div>
                <p className="mt-1 text-xl font-bold text-gdgoc-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
};
