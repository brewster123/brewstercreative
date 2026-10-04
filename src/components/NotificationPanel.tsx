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
    const isChatMessage = n.type === 'message' || n.linkTab === 'chat' || n.link_tab === 'chat';

    if (currentUser?.role === 'admin') {
      if (isChatMessage) {
        setActiveView('chat');
      } else {
        setActiveView('admin-dashboard');
      }
    } else {
      if (isChatMessage) {
        setActiveView('chat');
      } else {
        setActiveView('client-dashboard');
      }
    }
    onClose();
  };

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl shadow-xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 w-80 sm:w-96">
      {/* Header */}
      <div className="px-4 py-3 bg-[#FAF9F6] dark:bg-[#232327] border-b border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#EA580C]" />
          <h4 className="text-xs font-bold text-[#18181B] dark:text-[#EDEDEC] uppercase tracking-wider">
            Notifications
          </h4>
          <span className="px-2 py-0.5 rounded-md bg-[#F4F2ED] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono font-semibold">
            {userNotifications.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {userNotifications.some(n => !n.readStatus && !n.is_read) && (
            <button
              id="btn-mark-all-notifications-read"
              type="button"
              onClick={() => markAllNotificationsAsRead()}
              className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#F4F2ED] dark:hover:bg-[#18181B] cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] p-1.5 rounded-md hover:bg-[#F4F2ED] dark:hover:bg-[#18181B] transition-colors cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#E4E2DC] dark:divide-[#27272A]">
        {userNotifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <Bell className="w-8 h-8 text-[#A1A1AA] dark:text-[#71717A] mx-auto mb-2 opacity-60" />
            <p className="text-xs text-[#18181B] dark:text-[#EDEDEC] font-bold">No notifications yet</p>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 font-medium">You're all caught up with studio activity.</p>
          </div>
        ) : (
          userNotifications.map((notif) => {
            const isUnread = !notif.readStatus && !notif.is_read;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[#FAF9F6] dark:hover:bg-[#232327] ${
                  isUnread ? 'bg-[#FFF7ED] dark:bg-[#78350F]/20' : ''
                }`}
              >
                <div className="mt-0.5 p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] shrink-0">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className={`text-xs ${isUnread ? 'font-bold text-[#18181B] dark:text-[#EDEDEC]' : 'font-medium text-[#71717A] dark:text-[#A1A1AA]'} truncate`}>
                      {notif.title || 'Studio Notice'}
                    </h5>
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0 mt-0.5" />
                    )}
                  </div>

                  <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${isUnread ? 'text-[#18181B] dark:text-[#EDEDEC] font-medium' : 'text-[#71717A] dark:text-[#A1A1AA] font-normal'}`}>
                    {notif.message}
                  </p>

                  <p className="text-[10px] text-[#A1A1AA] dark:text-[#71717A] mt-1 font-mono">
                    {notif.timestamp}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 bg-[#FAF9F6] dark:bg-[#232327] border-t border-[#E4E2DC] dark:border-[#27272A] text-center">
        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-medium font-mono">
          Persistent client-designer alerts and live milestones
        </p>
      </div>
    </div>
  );
};
