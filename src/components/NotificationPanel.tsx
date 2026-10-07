import React, { useState } from 'react';
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
  CheckCircle2,
  ArrowRight
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

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Scope notifications to authenticated user (or allow admin oversight)
  const userNotifications = notifications.filter(n => 
    currentUser?.role === 'admin' 
      ? true 
      : (n.userId === currentUser?.id || n.recipient_id === currentUser?.id || n.recipientId === currentUser?.id || n.user_id === currentUser?.id)
  );

  const isNotificationUnread = (n: AppNotification): boolean => {
    return !n.readStatus && !n.is_read;
  };

  const unreadCount = userNotifications.filter(isNotificationUnread).length;

  const displayedNotifications = activeTab === 'unread'
    ? userNotifications.filter(isNotificationUnread)
    : userNotifications;

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
    if (isNotificationUnread(n)) {
      markNotificationAsRead(n.id);
    }
    if (n.commissionId || n.commission_id) {
      setSelectedCommissionId(n.commissionId || n.commission_id!);
    }
    if (n.linkTab || n.link_tab) {
      setActiveDashboardTab?.(n.linkTab || n.link_tab!);
    }
  };

  const handleNavigate = (e: React.MouseEvent, n: AppNotification) => {
    e.stopPropagation();
    if (isNotificationUnread(n)) {
      markNotificationAsRead(n.id);
    }
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
          {unreadCount > 0 ? (
            <span 
              id="notifications-unread-counter"
              className="px-1.5 py-0.5 rounded-full bg-[#EA580C]/10 border border-[#EA580C]/20 text-[10px] text-[#EA580C] font-mono font-bold"
            >
              {unreadCount} unread
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-[#F4F2ED] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono font-medium">
              All caught up
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              id="btn-mark-all-notifications-read"
              type="button"
              onClick={() => markAllNotificationsAsRead()}
              className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#F4F2ED] dark:hover:bg-[#18181B] cursor-pointer"
              title="Mark all notifications as read"
              aria-label="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
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

      {/* Tabs Toolbar: All vs Unread */}
      <div className="px-4 py-2 bg-[#FAF9F6]/80 dark:bg-[#202024] border-b border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#F4F2ED] dark:bg-[#18181B] p-1 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] w-full">
          <button
            id="tab-notifications-all"
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] shadow-2xs font-semibold'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#E4E2DC]/60 dark:bg-[#3F3F46]/60 text-[#71717A] dark:text-[#A1A1AA]">
              {userNotifications.length}
            </span>
          </button>

          <button
            id="tab-notifications-unread"
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`flex-1 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] shadow-2xs font-semibold'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
            }`}
          >
            <span>Unread</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              unreadCount > 0
                ? 'bg-[#EA580C] text-white font-bold'
                : 'bg-[#E4E2DC]/60 dark:bg-[#3F3F46]/60 text-[#71717A] dark:text-[#A1A1AA]'
            }`}>
              {unreadCount}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#E4E2DC] dark:divide-[#27272A]">
        {displayedNotifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            {activeTab === 'unread' ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-[#059669] dark:text-[#34D399] mx-auto mb-2 opacity-80" />
                <p className="text-xs text-[#18181B] dark:text-[#EDEDEC] font-bold">No unread notifications</p>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 font-medium">You're all caught up with studio activity.</p>
                {userNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="mt-2.5 text-xs text-[#EA580C] hover:underline font-semibold cursor-pointer"
                  >
                    View all notifications ({userNotifications.length})
                  </button>
                )}
              </>
            ) : (
              <>
                <Bell className="w-8 h-8 text-[#A1A1AA] dark:text-[#71717A] mx-auto mb-2 opacity-60" />
                <p className="text-xs text-[#18181B] dark:text-[#EDEDEC] font-bold">No notifications yet</p>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 font-medium">You're all caught up with studio activity.</p>
              </>
            )}
          </div>
        ) : (
          displayedNotifications.map((notif) => {
            const isUnread = isNotificationUnread(notif);
            const hasLink = Boolean(notif.commissionId || notif.commission_id || notif.linkTab || notif.link_tab || notif.type === 'message');

            return (
              <div
                key={notif.id}
                data-notification-id={notif.id}
                data-read-status={isUnread ? 'unread' : 'read'}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 group relative ${
                  isUnread 
                    ? 'bg-[#FFF7ED] dark:bg-[#78350F]/20 hover:bg-[#FFEDD5]/60 dark:hover:bg-[#78350F]/30 border-l-[3px] border-l-[#EA580C]' 
                    : 'bg-white dark:bg-[#18181B] hover:bg-[#FAF9F6] dark:hover:bg-[#232327] border-l-[3px] border-l-transparent'
                }`}
              >
                <div className={`mt-0.5 p-2 rounded-lg shrink-0 border ${
                  isUnread
                    ? 'bg-white dark:bg-[#18181B] border-[#FDBA74] dark:border-[#9A3412]/50'
                    : 'bg-[#FAF9F6] dark:bg-[#232327] border-[#E4E2DC] dark:border-[#27272A]'
                }`}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className={`text-xs ${
                      isUnread 
                        ? 'font-bold text-[#18181B] dark:text-[#EDEDEC]' 
                        : 'font-medium text-[#71717A] dark:text-[#A1A1AA]'
                    } truncate`}>
                      {notif.title || 'Studio Notice'}
                    </h5>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUnread && (
                        <span 
                          className="w-2 h-2 rounded-full bg-[#EA580C] shrink-0" 
                          title="Unread notification"
                          aria-label="Unread notification"
                        />
                      )}
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead(notif.id);
                          }}
                          className="p-1 rounded text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] hover:bg-white/80 dark:hover:bg-[#27272A] opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Mark as read"
                          aria-label="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${
                    isUnread 
                      ? 'text-[#18181B] dark:text-[#EDEDEC] font-medium' 
                      : 'text-[#71717A] dark:text-[#A1A1AA] font-normal'
                  }`}>
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between mt-1 pt-0.5">
                    <p className="text-[10px] text-[#A1A1AA] dark:text-[#71717A] font-mono">
                      {notif.timestamp}
                    </p>

                    {hasLink && (
                      <button
                        type="button"
                        onClick={(e) => handleNavigate(e, notif)}
                        className="text-[10px] font-semibold text-[#EA580C] hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                        title={notif.type === 'message' ? 'Open conversation' : 'View commission'}
                      >
                        <span>{notif.type === 'message' ? 'Open chat' : 'View'}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
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

