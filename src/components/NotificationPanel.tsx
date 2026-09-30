import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  MessageSquare, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { AppNotification, NotificationType } from '../types';

interface NotificationPanelProps {
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { 
    notifications, 
    currentUser, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    setActiveView,
    setSelectedCommissionId,
    setActiveDashboardTab 
  } = useApp();

  // Scope notifications to authenticated user (or allow admin oversight)
  const userNotifications = notifications.filter(n => 
    currentUser?.role === 'admin' 
      ? true 
      : (n.userId === currentUser?.id || n.recipient_id === currentUser?.id)
  );

  const getIcon = (type: NotificationType | string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'proof_review':
      case 'review':
        return <Sparkles className="w-4 h-4 text-orange-500" />;
      case 'proof_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'proof_revision':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'commission_completed':
      case 'delivery':
        return <Check className="w-4 h-4 text-emerald-600" />;
      case 'commission_update':
      case 'status':
        return <Clock className="w-4 h-4 text-indigo-500" />;
      case 'system':
      default:
        return <AlertCircle className="w-4 h-4 text-zinc-500" />;
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    markNotificationAsRead(n.id);
    if (n.commissionId || n.commission_id) {
      setSelectedCommissionId(n.commissionId || n.commission_id!);
    }
    if (n.linkTab || n.link_tab) {
      setActiveDashboardTab?.(n.linkTab || n.link_tab!);
    }
    if (currentUser?.role === 'admin') {
      setActiveView('admin-dashboard');
    } else {
      setActiveView('client-dashboard');
    }
    onClose();
  };

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[24px] shadow-xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 w-80 sm:w-96">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-50 border-b border-[#E5E5E5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Notifications
          </h4>
          <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-[10px] text-zinc-700 font-mono-code font-bold">
            {userNotifications.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {userNotifications.some(n => !n.readStatus && !n.is_read) && (
            <button
              id="btn-mark-all-notifications-read"
              type="button"
              onClick={() => markAllNotificationsAsRead()}
              className="text-[11px] font-bold text-zinc-500 hover:text-orange-600 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
        {userNotifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-2 opacity-60" />
            <p className="text-xs text-zinc-600 font-bold">No notifications yet</p>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">You're all caught up with studio activity.</p>
          </div>
        ) : (
          userNotifications.map((notif) => {
            const isUnread = !notif.readStatus && !notif.is_read;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-zinc-50 ${
                  isUnread ? 'bg-orange-50/50' : ''
                }`}
              >
                <div className="mt-0.5 p-2 rounded-xl bg-zinc-100 border border-zinc-200 shrink-0">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className={`text-xs ${isUnread ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-700'} truncate`}>
                      {notif.title || 'Studio Notice'}
                    </h5>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${isUnread ? 'text-zinc-800' : 'text-zinc-500 font-normal'}`}>
                    {notif.message}
                  </p>

                  <p className="text-[10px] text-zinc-400 mt-1 font-mono-code font-bold">
                    {notif.timestamp}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 bg-zinc-50 border-t border-[#E5E5E5] text-center">
        <p className="text-[10px] text-zinc-400 font-medium font-mono-code">
          Persistent client-designer alerts and live milestones
        </p>
      </div>
    </div>
  );
};
