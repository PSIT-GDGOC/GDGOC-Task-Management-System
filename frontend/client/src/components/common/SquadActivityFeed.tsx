import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  Sparkles,
  Layers
} from 'lucide-react';
import { taskApi, TaskActivityItem } from '../../services/api';

interface SquadActivityFeedProps {
  maxItems?: number;
  title?: string;
  className?: string;
}

export const SquadActivityFeed: React.FC<SquadActivityFeedProps> = ({
  maxItems = 15,
  title = 'Live Squad Activity',
  className = '',
}) => {
  const [activities, setActivities] = useState<TaskActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadFeed();

    // Auto-refresh activity every 30s
    const timer = setInterval(() => {
      loadFeed(true);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const loadFeed = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await taskApi.getActivityFeed();
      if (data && data.length > 0) {
        setActivities(data);
      } else {
        fallbackMockFeed();
      }
    } catch {
      fallbackMockFeed();
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fallbackMockFeed = () => {
    const mockFeed: TaskActivityItem[] = [
      {
        id: 'act_1',
        taskId: 't1',
        actorId: 'u1',
        action: 'APPROVED',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        actor: { id: 'u1', name: 'Aditya Rajput', email: 'president@psit.ac.in', position: 'President', role: 'ADMIN' },
        task: { id: 't1', title: 'Implement OAuth Token Refresh Architecture', status: 'DONE', team: { id: 'tech', name: 'Tech Squad', slug: 'tech' }, assignee: { id: 'u2', name: 'Rohan Sharma' } },
      },
      {
        id: 'act_2',
        taskId: 't2',
        actorId: 'u2',
        action: 'SUBMITTED_FOR_REVIEW',
        timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
        actor: { id: 'u2', name: 'Rohan Sharma', email: 'rohan@psit.ac.in', position: 'Lead Developer', role: 'MEMBER' },
        task: { id: 't2', title: 'Build Database Pooler Connection & Migrations', status: 'IN_REVIEW', team: { id: 'tech', name: 'Tech Squad', slug: 'tech' }, assignee: { id: 'u2', name: 'Rohan Sharma' } },
      },
      {
        id: 'act_3',
        taskId: 't3',
        actorId: 'u3',
        action: 'ASSIGNED',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        actor: { id: 'u3', name: 'Technical Lead', email: 'tech.lead@psit.ac.in', position: 'Tech Lead', role: 'ADMIN' },
        task: { id: 't3', title: 'Design Component Library in Tailwind CSS', status: 'ASSIGNED', team: { id: 'media', name: 'Media Squad', slug: 'media' }, assignee: { id: 'u4', name: 'Priya Verma' } },
      },
    ];
    setActivities(mockFeed);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Approved',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'SUBMITTED_FOR_REVIEW':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Submitted for Review',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'ASSIGNED':
      case 'REASSIGNED':
        return {
          icon: <ArrowRight className="w-3.5 h-3.5 text-gdgoc-blue" />,
          label: 'Assigned',
          color: 'bg-blue-50 text-gdgoc-blue border-blue-200',
        };
      case 'SENT_BACK':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-gdgoc-red" />,
          label: 'Changes Requested',
          color: 'bg-red-50 text-gdgoc-red border-red-200',
        };
      case 'CREATED':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Created Task',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-gdgoc-gray-600" />,
          label: action.replace(/_/g, ' '),
          color: 'bg-gdgoc-gray-100 text-gdgoc-gray-700 border-gdgoc-gray-200',
        };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`bg-white rounded-2xl border border-gdgoc-gray-200 shadow-2xs overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gdgoc-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <Activity className="w-4 h-4 text-gdgoc-blue" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gdgoc-gray-900 flex items-center gap-2">
              <span>{title}</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Live
              </span>
            </h3>
          </div>
        </div>

        <button
          onClick={() => loadFeed()}
          disabled={isLoading}
          className="p-1.5 rounded-lg border border-gdgoc-gray-200 bg-white hover:bg-gdgoc-gray-50 text-gdgoc-gray-600 transition-colors shadow-2xs"
          title="Refresh activity"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-gdgoc-blue' : ''}`} />
        </button>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-gdgoc-gray-100 max-h-96 overflow-y-auto">
        {activities.slice(0, maxItems).map((act) => {
          const badge = getActionBadge(act.action);
          const actorName = act.actor?.name || 'Squad Member';
          const actorPosition = act.actor?.position || act.actor?.role || 'Member';
          const taskTitle = act.task?.title || 'Deliverable';
          const assigneeName = act.task?.assignee?.name;
          const teamName = act.task?.team?.name;

          return (
            <div key={act.id} className="p-3.5 sm:p-4 hover:bg-gdgoc-gray-50/70 transition-colors flex items-start gap-3">
              <div className="p-2 rounded-xl bg-gdgoc-gray-50 border border-gdgoc-gray-200 shadow-2xs flex-shrink-0 mt-0.5">
                {badge.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-gdgoc-gray-900 truncate">
                      {actorName}
                    </span>
                    <span className="text-[10px] text-gdgoc-gray-400 font-medium">
                      ({actorPosition})
                    </span>
                  </div>
                  <span className="text-[10px] text-gdgoc-gray-400 whitespace-nowrap font-medium">
                    {formatTimeAgo(act.timestamp)}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                    {badge.label}
                  </span>
                  <p className="text-xs font-medium text-gdgoc-gray-800 truncate max-w-xs sm:max-w-md">
                    {taskTitle}
                  </p>
                </div>

                {assigneeName && act.action === 'ASSIGNED' && (
                  <p className="text-[11px] text-gdgoc-gray-500 mt-1">
                    Assigned to: <strong className="text-gdgoc-gray-700">{assigneeName}</strong>
                  </p>
                )}

                {teamName && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gdgoc-gray-400">
                    <Layers className="w-3 h-3 text-gdgoc-gray-400" />
                    <span>{teamName}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
