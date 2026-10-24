import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpButton } from '../components/tour/HelpButton';
import { apiRequest } from '../services/api';

type Activity = { id: string; action: string; timestamp: string; details?: { comment?: string } | null };
type Submission = { id: string; submittedAt: string; reviewedAt: string | null; reviewComment: string | null; outcome: string | null; prUrl: string | null; reviewer?: { name: string } | null };
type WorkTask = { id: string; title: string; status: string; deadline: string | null; completedAt: string | null; isOnTime: boolean | null; team?: { id: string; name: string } | null; activities: Activity[]; submissions: Submission[] };
const pretty = (status: string) => ({ DONE: 'Completed', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', ASSIGNED: 'Assigned', FREE: 'Available' }[status] || status.replace(/_/g, ' '));
const stamp = (value: string) => new Date(value).toLocaleString();

export const MyWorkHistory: React.FC<{ user?: { id: string; name: string; email: string; role: string } | null }> = () => {
  const [tasks, setTasks] = useState<WorkTask[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [search, setSearch] = useState(''); const [team, setTeam] = useState('ALL'); const [status, setStatus] = useState('ALL'); const [period, setPeriod] = useState('ALL'); const [sort, setSort] = useState('NEWEST');
  useEffect(() => { apiRequest<{ data: WorkTask[] }>('/history/me').then((result: any) => setTasks(result.data)).catch((e: any) => setError(e instanceof Error ? e.message : 'Unable to load work history.')).finally(() => setLoading(false)); }, []);
  const completed = tasks.filter(task => task.status === 'DONE' && task.completedAt);
  const eligible = completed.filter(task => task.deadline);
  const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS').length;
  const pending = tasks.filter(task => task.status === 'IN_REVIEW').length;
  const onTime = eligible.length ? `${Math.round(eligible.filter(task => new Date(task.completedAt!) <= new Date(task.deadline!)).length / eligible.length * 100)}%` : 'â€”';
  const teams = [...new Map(tasks.filter(t => t.team).map(t => [t.team!.id, t.team!.name])).entries()];
  const activity = useMemo(() => tasks.flatMap(task => task.activities.map(event => ({ ...event, task }))).filter(event => {
    const matchesStatus = status === 'ALL' || (status === 'COMPLETED' ? event.task.status === 'DONE' : status === 'IN_PROGRESS' ? event.task.status === 'IN_PROGRESS' : status === 'IN_REVIEW' ? event.task.status === 'IN_REVIEW' : event.action === 'SENT_BACK');
    const since = period === 'ALL' ? 0 : Date.now() - Number(period) * 86400000;
    return matchesStatus && (team === 'ALL' || event.task.team?.id === team) && event.task.title.toLowerCase().includes(search.toLowerCase()) && new Date(event.timestamp).getTime() >= since;
  }).sort((a,b) => sort === 'NEWEST' ? +new Date(b.timestamp)-+new Date(a.timestamp) : +new Date(a.timestamp)-+new Date(b.timestamp)), [tasks, status, period, team, search, sort]);
  const eventName = (action: string) => ({ CLAIMED: 'Task Claimed', ASSIGNED: 'Task Assigned', MOVED_STATUS: 'Work Started', SUBMITTED_FOR_REVIEW: 'Work Submitted', APPROVED: 'Task Approved', SENT_BACK: 'Changes Requested' }[action] || action.replace(/_/g, ' '));
  const statusLabel = (task: WorkTask) => task.isOnTime ?? (task.completedAt && task.deadline ? new Date(task.completedAt) <= new Date(task.deadline) : null);

  return <div className="relative -m-4 sm:-m-6 lg:-m-8 min-h-full flex-1">
    <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6">
    <header data-tour="history-heading" className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-gdgoc-gray-900">My Work History</h1><p className="mt-1 text-sm text-gdgoc-gray-600">Track your contributions, completed tasks, and progress with GDGOC.</p></div><HelpButton sectionTourId="member-history" sectionTitle="Work History" /></header>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div data-tour="history-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Box 1: Tasks Completed — Light Red */}
      <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: '#FDECEC' }}>
        <p className="text-xs font-semibold text-gdgoc-gray-500">Tasks Completed</p>
        <p className="mt-1 text-2xl font-bold text-gdgoc-gray-900">{loading ? '–' : completed.length}</p>
      </div>
      {/* Box 2: On-Time Completion — Light Green */}
      <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: '#E8F7EE' }}>
        <p className="text-xs font-semibold text-gdgoc-gray-500">On-Time Completion</p>
        <p className="mt-1 text-2xl font-bold text-gdgoc-gray-900">{loading ? '–' : onTime}</p>
        <p className="mt-1 text-[10px] text-gdgoc-gray-500">Based on completion time and tasks with deadlines</p>
      </div>
      {/* Box 3: In Progress — Light Blue */}
      <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: '#EAF3FF' }}>
        <p className="text-xs font-semibold text-gdgoc-gray-500">In Progress</p>
        <p className="mt-1 text-2xl font-bold text-gdgoc-gray-900">{loading ? '–' : inProgress}</p>
      </div>
      {/* Box 4: Pending Review — Light Red */}
      <div className="rounded-xl border border-gdgoc-gray-200 p-4 card-bb" style={{ backgroundColor: '#FDECEC' }}>
        <p className="text-xs font-semibold text-gdgoc-gray-500">Pending Review</p>
        <p className="mt-1 text-2xl font-bold text-gdgoc-gray-900">{loading ? '–' : pending}</p>
      </div>
    </div>
    {!loading && !error && tasks.length === 0 ? <div className="rounded-xl border border-gdgoc-gray-200 bg-white p-10 text-center card-bb"><h2 className="font-bold text-gdgoc-gray-900">Your journey starts here.</h2><p className="mt-2 text-sm text-gdgoc-gray-600">You haven't completed any tasks yet. Explore the task board and start contributing to GDGOC.</p><Link to="/" className="mt-4 inline-block rounded-lg bg-gdgoc-blue px-4 py-2 text-sm font-semibold text-white card-bb-sm">Explore Tasks</Link></div> : <>
      <section data-tour="history-list" className="rounded-xl border border-gdgoc-gray-200 bg-white card-bb"><div className="border-b border-gdgoc-gray-100 p-4"><h2 className="font-bold text-gdgoc-gray-900">Recent Activity</h2><p className="text-xs text-gdgoc-gray-500">Your latest task updates and contributions.</p></div>
        <div className="flex flex-wrap gap-2 p-4"><input aria-label="Search task title" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search task title" className="rounded-lg bg-white px-3 py-2 text-xs card-bb-sm"/><select value={team} onChange={e=>setTeam(e.target.value)} className="rounded-lg bg-white px-2 py-2 text-xs card-bb-sm"><option value="ALL">All Teams</option>{teams.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-lg bg-white px-2 py-2 text-xs card-bb-sm"><option value="ALL">All Activity</option><option value="COMPLETED">Completed</option><option value="IN_PROGRESS">In Progress</option><option value="IN_REVIEW">In Review</option><option value="CHANGES">Changes Requested</option></select><select value={period} onChange={e=>setPeriod(e.target.value)} className="rounded-lg bg-white px-2 py-2 text-xs card-bb-sm"><option value="ALL">All Time</option><option value="7">Last 7 Days</option><option value="30">Last 30 Days</option><option value="90">Last 90 Days</option></select><select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-lg bg-white px-2 py-2 text-xs card-bb-sm"><option value="NEWEST">Newest First</option><option value="OLDEST">Oldest First</option></select></div>
        {loading ? <p className="p-8 text-center text-sm text-gdgoc-gray-500">Loading your historyâ€¦</p> : activity.length === 0 ? <p className="p-8 text-center text-sm text-gdgoc-gray-500">No activity matches these filters.</p> : <ol className="divide-y divide-gdgoc-gray-100">{activity.map(event=><li key={event.id} className="p-4"><div className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-gdgoc-blue"/><div className="min-w-0"><p className="text-sm font-semibold text-gdgoc-gray-900">{eventName(event.action)}</p><p className="text-sm text-gdgoc-gray-700">{event.task.title}</p><p className="mt-1 text-xs text-gdgoc-gray-500">{stamp(event.timestamp)}{event.task.team ? ` Â· ${event.task.team.name}` : ''} Â· {pretty(event.task.status)}</p>{event.details?.comment && <p className="mt-1 text-xs text-gdgoc-gray-600">{event.details.comment}</p>}{event.task.submissions[0]?.prUrl && <a href={event.task.submissions[0].prUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-blue-600 underline">GitHub pull request</a>}</div></div></li>)}</ol>}
      </section>
      <section className="rounded-xl border border-gdgoc-gray-200 bg-white card-bb overflow-hidden"><div className="border-b border-gdgoc-gray-100 p-4"><h2 className="font-bold text-gdgoc-gray-900">Completed Tasks</h2><p className="text-xs text-gdgoc-gray-500">Your approved contributions.</p></div>{completed.length === 0 ? <p className="p-6 text-sm text-gdgoc-gray-500">Approved contributions will appear here once your submitted work is approved and marked Done.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-gdgoc-gray-50 text-gdgoc-gray-600"><tr>{['Task','Team','Completed On','Deadline','Completion Status','GitHub PR','Review'].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-gdgoc-gray-100">{completed.map(task=>{const sub=task.submissions[0];const timely=statusLabel(task);return <tr key={task.id}><td className="px-4 py-3 font-semibold">{task.title}</td><td className="px-4 py-3">{task.team?.name||'â€”'}</td><td className="px-4 py-3 whitespace-nowrap">{task.completedAt?stamp(task.completedAt):'â€”'}</td><td className="px-4 py-3 whitespace-nowrap">{task.deadline?stamp(task.deadline):'â€”'}</td><td className="px-4 py-3">{timely===null?'â€”':timely?'On Time':'Late'}</td><td className="px-4 py-3">{sub?.prUrl?<a href={sub.prUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View PR</a>:'â€”'}</td><td className="px-4 py-3">{sub?.outcome==='APPROVED'?'Approved':'â€”'}{sub?.reviewComment&&<div className="text-gray-500">{sub.reviewComment}</div>}</td></tr>})}</tbody></table></div>}</section>
    </>}
    </div>
  </div>;
};
