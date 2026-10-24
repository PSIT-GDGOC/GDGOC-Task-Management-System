import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  CheckCircle2, 
  Clock, 
    AlertCircle, 
  ArrowRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import { notificationApi, AppNotification } from '../../services/api';
import { useAuth } from '../../auth/authContext';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [_isLoading, setIsLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Poll for notifications every 20 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // offline or silent skip
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.readAt) {
      notificationApi.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setIsOpen(false);

    // Route based on user role and notification
    if (user?.role === 'ADMIN' && (user.position === 'President' || user.position === 'Vice President' || user.position === 'Secretary' || user.position === 'Organizer')) {
      navigate('/admin/tasks');
    } else if (user?.role === 'TEAM_LEADER' || user?.isTeamHead) {
      navigate('/leader/overview');
    } else {
      navigate('/member');
    }
  };

  const getNotificationIcon = (kind: string) => {
    switch (kind) {
      case 'TASK_ASSIGNED':
        return <ArrowRight className="w-4 h-4 text-gdgoc-blue" />;
      case 'TASK_SUBMITTED':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'TASK_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'CHANGES_REQUESTED':
        return <AlertCircle className="w-4 h-4 text-gdgoc-red" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  const formatKindTitle = (kind: string) => {
    switch (kind) {
      case 'TASK_ASSIGNED':
        return 'New Task Assigned';
      case 'TASK_SUBMITTED':
        return 'Deliverable In Review';
      case 'TASK_APPROVED':
        return 'Work Approved! 🎉';
      case 'CHANGES_REQUESTED':
        return 'Changes Requested';
      default:
        return 'Club Notification';
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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-gdgoc-gray-200 bg-white hover:bg-gdgoc-gray-50 active:bg-gdgoc-gray-100 text-gdgoc-gray-600 hover:text-gdgoc-gray-900 transition-colors shadow-2xs"
        aria-label="View notifications"
        title="Squad Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gdgoc-red text-[10px] font-black text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gdgoc-gray-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 px-4 bg-gdgoc-gray-50 border-b border-gdgoc-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gdgoc-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-gdgoc-blue text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-gdgoc-blue hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gdgoc-gray-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gdgoc-gray-400 space-y-1.5">
                <Inbox className="w-8 h-8 mx-auto text-gdgoc-gray-300" />
                <p className="text-xs font-medium">All caught up!</p>
                <p className="text-[10px] text-gdgoc-gray-400">No new squad notifications</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 px-4 cursor-pointer transition-colors flex items-start gap-3 hover:bg-gdgoc-gray-50/80 ${
                      isUnread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white border border-gdgoc-gray-200 shadow-2xs flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.kind)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gdgoc-gray-900 truncate">
                          {formatKindTitle(notif.kind)}
                        </span>
                        <span className="text-[10px] text-gdgoc-gray-400 whitespace-nowrap">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      {notif.task?.title && (
                        <p className="text-xs text-gdgoc-gray-600 line-clamp-2 mt-0.5 font-medium">
                          {notif.task.title}
                        </p>
                      )}

                      <div className="mt-1 flex items-center gap-1.5">
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gdgoc-blue"></span>
                        )}
                        <span className="text-[10px] text-gdgoc-blue font-semibold hover:underline flex items-center gap-0.5">
                          View details <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
