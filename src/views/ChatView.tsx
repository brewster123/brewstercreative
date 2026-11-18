import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ChatWindow } from '../components/ChatWindow';
import { 
  ArrowLeft, 
  MessageSquare, 
  Search, 
  X, 
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

  const fetchedCommissionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchedCommissionIdsRef.current.clear();
  }, [currentUser?.id]);

  // Pre-fetch messages for available commissions once per user session so last messages & unread badges are accurate
  useEffect(() => {
    if (availableCommissions.length > 0) {
      availableCommissions.forEach(c => {
        if (!fetchedCommissionIdsRef.current.has(c.id)) {
          fetchedCommissionIdsRef.current.add(c.id);
          fetchMessagesForCommission(c.id);
        }
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
        const msgText = (lastMsg.message || lastMsg.body || '').trim();
        if (msgText) {
          const isMe = lastMsg.senderId === currentUser?.id;
          lastMessageSnippet = isMe ? `You: ${msgText}` : msgText;
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
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-canvas text-carbon">
        <div className="w-14 h-14 rounded-full bg-surface-secondary border border-hairline flex items-center justify-center mx-auto text-accent shadow-sm">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="font-display text-2xl font-bold text-carbon tracking-tight">
            Studio Chats
          </h2>
          <p className="text-sm text-graphite-strong leading-relaxed">
            Please sign in to access your direct, encrypted conversations with DESTALION.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('auth')}
          className="px-6 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all cursor-pointer shadow-sm"
        >
          Sign In to Chats
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 min-h-0 flex overflow-hidden bg-canvas text-carbon font-sans antialiased">
      
      {/* 1. LEFT SIDEBAR: Admin-Only Client Conversation List (320px–380px) */}
      {isAdmin && (
        <aside 
          className={`${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-[360px] xl:w-[380px] shrink-0 h-full flex-col bg-surface border-r border-hairline z-10 overflow-hidden`}
        >
          {/* Sidebar Header: "Chats" + Action Icons */}
          <div className="p-3 sm:p-4 pb-2 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl font-bold text-carbon tracking-tight">
                Chats
              </h1>

              <div className="flex items-center gap-2">
                {/* Back to Workspace button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-surface-secondary hover:bg-hairline/70 text-graphite-strong hover:text-carbon flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  title="Return to Studio Dashboard"
                  aria-label="Return to Studio Dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* Search Input Bar (Atelier Surface) */}
          <div className="relative">
            <div className="bg-surface-secondary hover:bg-hairline/40 focus-within:bg-surface border border-hairline focus-within:border-accent rounded-full px-3.5 py-2 flex items-center gap-2.5 transition-colors">
              <Search className="w-4 h-4 text-graphite shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="bg-transparent dark:bg-transparent text-sm text-carbon placeholder:text-graphite focus:outline-hidden w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-graphite hover:text-carbon p-1 rounded-full cursor-pointer shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
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
              className={`px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                filter === 'all'
                  ? 'bg-accent/15 text-accent border border-accent/40 font-bold'
                  : 'text-graphite-strong hover:bg-surface-secondary hover:text-carbon border border-transparent'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                filter === 'unread'
                  ? 'bg-accent/15 text-accent border border-accent/40 font-bold'
                  : 'text-graphite-strong hover:bg-surface-secondary hover:text-carbon border border-transparent'
              }`}
            >
              <span>Unread</span>
              {totalUnreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent text-white text-[10px] font-mono font-bold">
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
              <p className="text-sm font-medium text-graphite">
                {filter === 'unread' ? 'No unread conversations' : 'No conversations found'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-accent hover:underline cursor-pointer"
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
                  className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? 'bg-surface-secondary text-carbon border border-accent/40 shadow-2xs'
                      : 'hover:bg-surface-secondary/70 text-carbon border border-transparent'
                  }`}
                >
                  {/* Circular Avatar with Active Indicator */}
                  <div className="relative shrink-0">
                    <img
                      src={item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={item.displayName || 'Conversation Partner'}
                      className="w-12 h-12 rounded-full object-cover border border-hairline"
                    />
                    <span 
                      className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-surface absolute bottom-0 right-0" 
                      title="Active"
                    />
                  </div>

                  {/* Conversation Summary Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-sm truncate font-semibold text-carbon">
                        {item.displayName}
                      </span>
                      <span className="text-[11px] font-mono text-graphite shrink-0">
                        {item.timeSnippet}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${item.hasUnread ? 'text-carbon font-semibold' : 'text-graphite'}`}>
                        {item.lastMessageSnippet}
                      </p>
                      {item.hasUnread && (
                        <span 
                          className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" 
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
        <div className="p-3 border-t border-hairline text-center text-[11px] font-mono text-graphite shrink-0">
          <span>{studioProfile.studioName || 'DESTALION'} Studio Portal</span>
        </div>
        </aside>
      )}

      {/* 2. MAIN CHAT PANEL: Atelier Full Width / Height */}
      <main 
        className={`${
          isAdmin && mobileView === 'list' ? 'hidden md:flex' : 'flex'
        } flex-1 min-w-0 h-full flex-col bg-canvas overflow-hidden`}
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
            onBackToList={isAdmin ? () => setMobileView('list') : undefined}
            showBackOnMobile={isAdmin}
          />
        ) : (
          /* Empty Workspace / No Commission Selected State */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary border border-hairline flex items-center justify-center text-accent">
              <FolderArchive className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-display font-bold text-lg text-carbon">
                {isAdmin ? 'No Client Conversations' : 'No Active Conversations'}
              </h3>
              <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed">
                {isAdmin
                  ? 'Client conversations will appear here as soon as commission requests are submitted.'
                  : 'Start a design inquiry or project commission to open a direct dialogue with DESTALION.'}
              </p>
            </div>
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="px-6 py-2.5 min-h-[44px] rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold cursor-pointer shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
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
