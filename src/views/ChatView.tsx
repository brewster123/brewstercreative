import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ChatWindow } from '../components/ChatWindow';
import { 
  ArrowLeft, 
  MessageSquare, 
  Search, 
  X, 
  SquarePen, 
  FolderArchive,
  Layers
} from 'lucide-react';
import { Commission } from '../types';

export const ChatView: React.FC = () => {
  const {
    currentUser,
    commissions,
    currentUserCommissions,
    selectedCommissionId,
    setSelectedCommissionId,
    setActiveCommissionId,
    setActiveView,
    studioProfile,
    messages,
    fetchMessagesForCommission,
    markMessagesAsRead
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('chat');

  const isCommissionActive = (c: Commission) => {
    const s = (c?.status || '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled' && s !== 'rejected' && c?.currentStage !== 8;
  };

  // Available conversation commissions strictly adhering to permissions:
  // Admin sees all commissions; Client sees strictly authorized client commissions
  const availableCommissions: Commission[] = useMemo(() => {
    return isAdmin ? commissions : (currentUserCommissions || []);
  }, [isAdmin, commissions, currentUserCommissions]);

  // Determine currently selected commission
  const activeComm: Commission | undefined = useMemo(() => {
    if (!availableCommissions.length) return undefined;
    return (
      availableCommissions.find(c => c.id === selectedCommissionId) ||
      availableCommissions.find(isCommissionActive) ||
      availableCommissions[0]
    );
  }, [availableCommissions, selectedCommissionId]);

  // Pre-fetch messages for all available commissions on mount so last messages & unread badges are accurate
  useEffect(() => {
    if (availableCommissions.length > 0) {
      availableCommissions.forEach(c => {
        fetchMessagesForCommission(c.id);
      });
    }
  }, [availableCommissions, fetchMessagesForCommission]);

  // Ensure selectedCommissionId is synchronized
  useEffect(() => {
    if (!selectedCommissionId && activeComm?.id) {
      setSelectedCommissionId(activeComm.id);
      setActiveCommissionId(activeComm.id);
    }
  }, [selectedCommissionId, activeComm?.id, setSelectedCommissionId, setActiveCommissionId]);

  const handleBack = () => {
    if (isAdmin) {
      setActiveView('admin-dashboard');
    } else {
      setActiveView('client-dashboard');
    }
  };

  const formatCommissionStatus = (status: string | undefined): string => {
    if (!status) return 'Pending';
    switch (status.toLowerCase()) {
      case 'in_progress':
      case 'in progress':
        return 'In Progress';
      case 'for_review':
      case 'client review':
        return 'For Review';
      case 'pending':
        return 'Pending';
      case 'reviewing':
        return 'Reviewing';
      case 'accepted':
        return 'Accepted';
      case 'revision':
      case 'revision requested':
        return 'Revision';
      case 'final_approval':
      case 'final approval':
        return 'Final Approval';
      case 'completed':
        return 'Completed';
      case 'cancelled':
      case 'rejected':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Compute conversation list items with last message, unread status, and timestamps
  const conversationItems = useMemo(() => {
    return availableCommissions.map(c => {
      const commMsgs = messages.filter(m => m.commissionId === c.id);
      
      // Sort messages chronologically to find the latest
      const sorted = [...commMsgs].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      const lastMsg = sorted.length > 0 ? sorted[sorted.length - 1] : null;

      // Count unread messages received from the other party
      const unreadCount = commMsgs.filter(
        m => !m.readStatus && m.senderId !== currentUser?.id
      ).length;

      // Format last message preview
      let lastMessageSnippet = c.service || c.serviceType || 'Creative Project';
      if (lastMsg) {
        if (lastMsg.message && lastMsg.message.trim()) {
          const isMe = lastMsg.senderId === currentUser?.id;
          lastMessageSnippet = isMe ? `You: ${lastMsg.message.trim()}` : lastMsg.message.trim();
        } else if (lastMsg.attachment) {
          const isMe = lastMsg.senderId === currentUser?.id;
          const prefix = isMe ? 'You: ' : '';
          lastMessageSnippet = lastMsg.attachment.type === 'image' 
            ? `${prefix}📷 Sent a photo` 
            : `${prefix}📎 Sent a file`;
        }
      }

      // Format timestamp for conversation item
      let timeSnippet = '';
      const dateSource = lastMsg?.createdAt || c.updatedAt || c.createdAt;
      if (dateSource) {
        const d = new Date(dateSource);
        if (!isNaN(d.getTime())) {
          const now = new Date();
          const isToday = d.toDateString() === now.toDateString();
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const isYesterday = d.toDateString() === yesterday.toDateString();

          if (isToday) {
            timeSnippet = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          } else if (isYesterday) {
            timeSnippet = 'Yesterday';
          } else if (d.getFullYear() === now.getFullYear()) {
            timeSnippet = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            timeSnippet = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
          }
        }
      }

      // Display name and avatar
      const displayName = isAdmin ? c.clientName : (c.projectName || studioProfile.studioName || 'DESTALION');
      const avatarUrl = isAdmin 
        ? (c.clientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80')
        : (studioProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');

      return {
        commission: c,
        displayName,
        avatarUrl,
        lastMessageSnippet,
        timeSnippet,
        unreadCount,
        hasUnread: unreadCount > 0,
        statusLabel: formatCommissionStatus(c.status)
      };
    });
  }, [availableCommissions, messages, currentUser?.id, isAdmin, studioProfile.avatar]);

  // Filter conversations by search and unread tab
  const filteredConversations = useMemo(() => {
    let result = conversationItems;

    if (filter === 'unread') {
      result = result.filter(item => item.hasUnread);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.displayName.toLowerCase().includes(q) ||
        item.commission.projectName.toLowerCase().includes(q) ||
        (item.commission.service || '').toLowerCase().includes(q) ||
        item.lastMessageSnippet.toLowerCase().includes(q)
      );
    }

    return result;
  }, [conversationItems, filter, searchQuery]);

  const totalUnreadCount = useMemo(() => {
    return conversationItems.reduce((acc, curr) => acc + curr.unreadCount, 0);
  }, [conversationItems]);

  if (!currentUser) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-[#18191A] text-[#EDEDEC]">
        <div className="w-14 h-14 rounded-full bg-[#242526] border border-[#2E2F32] flex items-center justify-center mx-auto text-[#0084FF] shadow-sm">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">
            Studio Chats
          </h2>
          <p className="text-sm text-[#B0B3B8] leading-relaxed">
            Please sign in to access your direct, encrypted conversations with DESTALION.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('auth')}
          className="px-6 py-2.5 rounded-full bg-[#0084FF] hover:bg-[#0A7CFF] text-white font-semibold text-sm transition-all cursor-pointer shadow-sm"
        >
          Sign In to Chats
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 min-h-0 flex overflow-hidden bg-[#09090B] text-[#EDEDEC] font-sans antialiased">
      
      {/* 1. LEFT SIDEBAR: Atelier Conversation List (320px–380px) */}
      <aside 
        className={`${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-[360px] xl:w-[380px] shrink-0 h-full flex-col bg-[#121214] border-r border-[#222225] z-10 overflow-hidden`}
      >
        {/* Sidebar Header: "Chats" + Action Icons */}
        <div className="p-3 sm:p-4 pb-2 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-[#EDEDEC] tracking-tight">
              Chats
            </h1>

            <div className="flex items-center gap-2">
              {/* Back to Workspace button */}
              <button
                type="button"
                onClick={handleBack}
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-[#18181B] hover:bg-[#222225] text-[#A1A1AA] hover:text-[#EDEDEC] flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                title={isAdmin ? "Return to Studio Dashboard" : "Return to Creative Projects"}
                aria-label={isAdmin ? "Return to Studio Dashboard" : "Return to Creative Projects"}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Client Action: New Commission Chat */}
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-[#18181B] hover:bg-[#222225] text-[#EA580C] hover:text-[#D94814] flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                  title="New Commission"
                  aria-label="New Commission"
                >
                  <SquarePen className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Input Bar (Atelier Surface) */}
          <div className="relative">
            <div className="bg-[#18181B] hover:bg-[#1C1C20] focus-within:bg-[#1C1C20] border border-[#222225] focus-within:border-[#EA580C] rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 transition-colors">
              <Search className="w-4 h-4 text-[#A1A1AA] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="bg-transparent text-sm text-[#EDEDEC] placeholder-[#71717A] focus:outline-hidden w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#A1A1AA] hover:text-white p-1 rounded-full cursor-pointer shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* All / Unread Filter Tabs */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] ${
                filter === 'all'
                  ? 'bg-[#EA580C]/15 text-[#EA580C] border border-[#EA580C]/40 font-bold'
                  : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#EDEDEC]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] ${
                filter === 'unread'
                  ? 'bg-[#EA580C]/15 text-[#EA580C] border border-[#EA580C]/40 font-bold'
                  : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#EDEDEC]'
              }`}
            >
              <span>Unread</span>
              {totalUnreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#EA580C] text-white text-[10px] font-mono font-bold">
                  {totalUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center px-4 space-y-2">
              <p className="text-sm font-medium text-[#71717A]">
                {filter === 'unread' ? 'No unread conversations' : 'No conversations found'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#EA580C] hover:underline cursor-pointer"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map(item => {
              const isSelected = item.commission.id === activeComm?.id;

              return (
                <button
                  key={item.commission.id}
                  type="button"
                  onClick={() => {
                    setSelectedCommissionId(item.commission.id);
                    setActiveCommissionId(item.commission.id);
                    markMessagesAsRead(item.commission.id);
                    setMobileView('chat');
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] ${
                    isSelected
                      ? 'bg-[#18181B] text-white border border-[#EA580C]/40 shadow-2xs'
                      : 'hover:bg-[#18181B]/60 text-[#EDEDEC] border border-transparent'
                  }`}
                >
                  {/* Circular Avatar with Active Indicator */}
                  <div className="relative shrink-0">
                    <img
                      src={item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={item.displayName || 'Conversation Partner'}
                      className="w-12 h-12 rounded-full object-cover border border-[#222225]"
                    />
                    <span 
                      className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#121214] absolute bottom-0 right-0" 
                      title="Active"
                    />
                  </div>

                  {/* Conversation Summary Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-sm truncate font-semibold ${isSelected ? 'text-[#EDEDEC]' : 'text-[#EDEDEC]'}`}>
                        {item.displayName}
                      </span>
                      <span className="text-[11px] font-mono text-[#71717A] shrink-0">
                        {item.timeSnippet}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${item.hasUnread ? 'text-[#EDEDEC] font-semibold' : 'text-[#71717A]'}`}>
                        {item.lastMessageSnippet}
                      </p>
                      {item.hasUnread && (
                        <span 
                          className="w-2.5 h-2.5 rounded-full bg-[#EA580C] shrink-0" 
                          title="Unread message"
                        />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Channel Note */}
        <div className="p-3 border-t border-[#222225] text-center text-[11px] font-mono text-[#71717A] shrink-0">
          <span>{studioProfile.studioName || 'DESTALION'} Studio Portal</span>
        </div>
      </aside>

      {/* 2. MAIN CHAT PANEL: Atelier Full Width / Height */}
      <main 
        className={`${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        } flex-1 min-w-0 h-full flex-col bg-[#09090B] overflow-hidden`}
      >
        {activeComm ? (
          <ChatWindow
            commission={activeComm}
            availableCommissions={availableCommissions}
            onSelectCommission={(id) => {
              setSelectedCommissionId(id);
              setActiveCommissionId(id);
            }}
            isAdmin={isAdmin}
            onBackToList={() => setMobileView('list')}
            showBackOnMobile={true}
          />
        ) : (
          /* Empty Workspace / No Commission Selected State */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-xl bg-[#18181B] border border-[#222225] flex items-center justify-center text-[#EA580C]">
              <FolderArchive className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-display font-bold text-lg text-[#EDEDEC]">
                {isAdmin ? 'No Client Conversations' : 'No Active Conversations'}
              </h3>
              <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
                {isAdmin
                  ? 'Client conversations will appear here as soon as commission requests are submitted.'
                  : 'Start a design inquiry or project commission to open a direct dialogue with DESTALION.'}
              </p>
            </div>
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="px-6 py-2.5 min-h-[44px] rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold cursor-pointer shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
              >
                Start a Commission
              </button>
            )}
          </div>
        )}
      </main>

    </div>
  );
};
