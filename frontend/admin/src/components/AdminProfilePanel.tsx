import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, BriefcaseBusiness, CheckCircle2, Clock3, UserCircle2, X } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';

type AdminProfilePanelProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    team?: string | null;
    githubUsername?: string | null;
    avatarUrl?: string | null;
  };
  onClose: () => void;
};

const displayRole = (role: string) => role.toLowerCase().split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');

export const AdminProfilePanel: React.FC<AdminProfilePanelProps> = ({ user, onClose }) => {
  const { data: tasks } = useTasks();
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  onCloseRef.current = onClose;

  const beginClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => onCloseRef.current(), 160);
  };

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') beginClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      previouslyFocused?.focus();
    };
  }, []);

  const managedTasks = tasks ?? [];
  const role = displayRole(user.role);

  return createPortal(
    <div className={`admin-profile-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 ${closing ? 'is-closing' : ''}`} onClick={(event) => { if (event.target === event.currentTarget) beginClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="admin-profile-title" tabIndex={-1} onClick={(event) => event.stopPropagation()} className={`admin-profile-card relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border-2 border-[#111111] bg-white p-5 shadow-[4px_4px_0_#111111] outline-none sm:p-6 ${closing ? 'is-closing' : ''}`}>
        <button type="button" onClick={beginClose} aria-label="Close profile panel" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 pr-10">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-full border border-gray-200 object-cover" /> : <UserCircle2 className="h-12 w-12 flex-shrink-0 text-indigo-500" />}
          <div className="min-w-0">
            <h2 id="admin-profile-title" className="truncate text-xl font-semibold text-gray-900">{user.name || 'Not provided'}</h2>
            <p className="truncate text-sm text-gray-600">{user.email || 'Not provided'}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded border border-[#111111] bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700"><BriefcaseBusiness className="h-3 w-3" />{role}</span>
          </div>
        </div>
        <section className="mt-4">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Basic Information</h3>
          <dl className="divide-y divide-gray-100 text-sm">
            <InfoRow label="Full Name" value={user.name || 'Not provided'} />
            <InfoRow label="Email Address" value={user.email || 'Not provided'} />
            {user.githubUsername && <InfoRow label="GitHub Username" value={user.githubUsername} />}
            <InfoRow label="Role" value={role} />
            {user.team && <InfoRow label="Team" value={user.team} />}
            <InfoRow label="Chapter / Organization" value="GDGoC PSIT Kanpur Chapter" />
          </dl>
        </section>
        <section className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <h3 className="text-sm font-semibold text-gray-900">Role &amp; Responsibilities</h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-700">Manage teams, assign work, review submissions, and monitor task progress.</p>
        </section>
        {tasks && (
          <section className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Quick Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Tasks Managed', value: managedTasks.length, icon: BriefcaseBusiness },
                { label: 'In Progress', value: managedTasks.filter((task) => task.status === 'IN_PROGRESS').length, icon: Clock3 },
                { label: 'Pending Review', value: managedTasks.filter((task) => task.status === 'IN_REVIEW').length, icon: AlertCircle },
                { label: 'Completed', value: managedTasks.filter((task) => task.status === 'DONE').length, icon: CheckCircle2 },
              ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-3"><div className="flex items-center justify-between gap-2 text-xs font-medium text-gray-600"><span>{label}</span><Icon className="h-4 w-4 flex-shrink-0 text-indigo-500" /></div><p className="mt-1 text-xl font-bold text-gray-900">{value}</p></div>)}
            </div>
          </section>
        )}
      </div>
    </div>,
    document.body,
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="grid grid-cols-[minmax(7rem,0.7fr)_minmax(0,1.3fr)] gap-3 py-2.5">
    <dt className="text-xs font-semibold text-gray-500">{label}</dt>
    <dd className="break-words text-right text-sm font-medium text-gray-900">{value}</dd>
  </div>
);
