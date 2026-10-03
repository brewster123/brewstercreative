import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Commission, Message, MessageAttachment, COMMISSION_STAGES } from '../types';
import { 
  Send, 
  Paperclip, 
  X, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Smile, 
  Download, 
  ExternalLink, 
  Check, 
  CheckCheck, 
  Info, 
  Layers, 
  ShieldCheck, 
  User as UserIcon, 
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { subscribeToCommissionMessages } from '../lib/messages';

interface ChatWindowProps {
  commission: Commission;
  availableCommissions?: Commission[];
  onSelectCommission?: (commissionId: string) => void;
  isAdmin?: boolean;
}

const EMOJI_PALETTE = ['👍', '✨', '🎨', '✍️', '💡', '🔥', '🙌', '👏', '📐', '📁', '☕', '✅', '❤️', '🚀', '🎯', '👋'];

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

const getStatusBadgeStyle = (status: string | undefined): string => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'in_progress':
    case 'in progress':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    case 'for_review':
    case 'client review':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    case 'revision':
    case 'revision requested':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/50';
    case 'final_approval':
    case 'final approval':
    case 'accepted':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
    case 'completed':
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
    case 'cancelled':
    case 'rejected':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
    case 'pending':
    case 'reviewing':
    default:
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
  }
};

function getDateSeparator(dateString?: string, timestamp?: string): string {
  let date: Date | null = null;
  if (dateString) {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) date = d;
  }
  if (!date && timestamp) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) date = d;
  }
  if (!date) return 'Today';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  commission,
  availableCommissions = [],
  onSelectCommission,
  isAdmin = false
}) => {
  const { 
    messages, 
    sendMessage, 
    fetchMessagesForCommission, 
    currentUser, 
    markMessagesAsRead, 
    studioProfile,
    setActiveView
  } = useApp();
  
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProjectContext, setShowProjectContext] = useState(false); // Mobile context drawer
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const commissionMessages = messages.filter(m => m.commissionId === commission.id);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Fetch history & subscribe to realtime
  useEffect(() => {
    let isCancelled = false;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      setSendError(null);
      await fetchMessagesForCommission(commission.id);
      if (!isCancelled) {
        setIsLoadingHistory(false);
        markMessagesAsRead(commission.id);
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        });
      }
    };

    loadHistory();

    const unsubscribe = subscribeToCommissionMessages(
      commission.id,
      () => {
        fetchMessagesForCommission(commission.id);
      },
      currentUser
    );

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [commission.id, currentUser?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom(true);
    markMessagesAsRead(commission.id);
  }, [commissionMessages.length, commission.id, scrollToBottom]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend && !attachment) return;

    setIsSending(true);
    setSendError(null);

    const result = await sendMessage(commission.id, textToSend, attachment || undefined);

    setIsSending(false);

    if (result.success) {
      setInputText('');
      setAttachment(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      scrollToBottom(true);
    } else {
      setSendError(result.error || 'Failed to deliver message. Click Retry to try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-resize textarea height (up to max-h-32)
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const fakeUrl = URL.createObjectURL(file);

    setAttachment({
      name: file.name,
      url: fakeUrl,
      type: isImg ? 'image' : 'file',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Find current stage description
  const currentStageInfo = COMMISSION_STAGES.find(s => s.number === (commission.currentStage || 1)) || COMMISSION_STAGES[0];

  return (
    <div className="bg-white dark:bg-[#121215] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl overflow-hidden flex flex-col h-[700px] lg:h-[750px] shadow-sm relative">
      
      {/* 1. Atelier Conversation Header */}
      <header className="px-5 py-3.5 bg-[#FAF9F6] dark:bg-[#18181B] border-b border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* Studio Lead Photo */}
          <div className="relative shrink-0">
            <img 
              src={studioProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
              alt="Brewster Creative Lead"
              className="w-10 h-10 rounded-full object-cover border border-[#E4E2DC] dark:border-[#27272A]"
            />
            <span 
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#18181B]"
              title="Available for messages"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold text-[#18181B] dark:text-[#EDEDEC] truncate">
                Brewster Creative
              </h2>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                · Available
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] truncate">
              <span className="font-medium text-[#18181B] dark:text-[#EDEDEC] truncate">
                {commission.projectName}
              </span>
              <span>·</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${getStatusBadgeStyle(commission.status)}`}>
                {formatCommissionStatus(commission.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Multi-project Selector (if user or admin has multiple projects) */}
          {availableCommissions.length > 1 && onSelectCommission && (
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
              <span className="text-[#71717A] dark:text-[#A1A1AA] text-[11px]">Project:</span>
              <select
                value={commission.id}
                onChange={(e) => onSelectCommission(e.target.value)}
                className="bg-white dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-2.5 py-1 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer max-w-[180px] truncate"
              >
                {availableCommissions.map(c => (
                  <option key={c.id} value={c.id}>
                    {isAdmin ? `${c.clientName} — ` : ''}{c.projectName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Project Dossier Context (Mobile & Tablet) */}
          <button
            type="button"
            onClick={() => setShowProjectContext(!showProjectContext)}
            className={`p-2 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
              showProjectContext 
                ? 'bg-[#EA580C] text-white border-[#EA580C]' 
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] bg-white dark:bg-[#121215] border-[#E4E2DC] dark:border-[#27272A]'
            } lg:hidden`}
            title="Toggle project details"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="text-[11px]">Dossier</span>
          </button>
        </div>
      </header>

      {/* 2. Main Two-Part Body: [Chat Timeline & Composer] + [Project Context Panel] */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* LEFT / MAIN: Timeline + Composer */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#121215]">
          
          {/* Scrollable Message Timeline */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
          >
            
            {/* Loading Skeletons */}
            {isLoadingHistory ? (
              <div className="space-y-4 py-8 max-w-lg mx-auto animate-pulse">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-10 w-48 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
                <div className="flex items-end justify-end">
                  <div className="h-12 w-56 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-14 w-64 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              </div>
            ) : commissionMessages.length === 0 ? (
              /* Natural Empty State */
              <div className="py-20 text-center max-w-sm mx-auto space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#EA580C]">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                    Start the conversation
                  </h3>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                    Send a message about your project, share a visual reference, or ask a question. Brewster will respond directly here.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("Hello Brewster, I'd like to check on our project progress.");
                      textareaRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#EA580C] cursor-pointer"
                  >
                    "Check project status"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("I have a few reference images to share for this stage.");
                      textareaRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#EA580C] cursor-pointer"
                  >
                    "Share references"
                  </button>
                </div>
              </div>
            ) : (
              /* Message Stream with Date Separators */
              commissionMessages.map((msg, index) => {
                const isMe = msg.senderId === currentUser?.id;
                const prevMsg = index > 0 ? commissionMessages[index - 1] : null;
                const currentDateGroup = getDateSeparator(msg.createdAt, msg.timestamp);
                const prevDateGroup = prevMsg ? getDateSeparator(prevMsg.createdAt, prevMsg.timestamp) : null;
                const showDateSeparator = currentDateGroup !== prevDateGroup;
                const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId && !showDateSeparator;

                return (
                  <React.Fragment key={msg.id}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-5">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] bg-[#FAF9F6] dark:bg-[#18181B] px-3 py-0.5 rounded-full border border-[#E4E2DC] dark:border-[#27272A]">
                          {currentDateGroup}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble Row */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-3.5'}`}>
                      
                      {/* Sender Info (Only if not consecutive and not me) */}
                      {!isMe && !isConsecutive && (
                        <div className="flex items-center gap-1.5 mb-1 px-1 font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                          <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{msg.senderName}</span>
                          <span>·</span>
                          <span>{msg.timestamp}</span>
                        </div>
                      )}

                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                        {/* Avatar for other participant */}
                        {!isMe && (
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#E4E2DC] dark:border-[#27272A] mb-0.5">
                            <img 
                              src={msg.senderAvatar || (msg.senderRole === 'admin' ? studioProfile.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80')}
                              alt={msg.senderName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          {/* Bubble Container */}
                          <div
                            className={`p-3 sm:p-3.5 text-xs sm:text-[13px] leading-relaxed break-words ${
                              isMe
                                ? 'bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] rounded-2xl rounded-br-xs shadow-2xs'
                                : 'bg-[#FAF9F6] dark:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] rounded-2xl rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message || msg.body}</p>

                            {/* Attachment Presentation */}
                            {msg.attachment && (
                              <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10">
                                {msg.attachment.type === 'image' ? (
                                  <div className="space-y-1.5">
                                    <div 
                                      onClick={() => setPreviewImage({ url: msg.attachment!.url, name: msg.attachment!.name })}
                                      className="relative group rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-h-56 max-w-sm cursor-pointer"
                                    >
                                      <img 
                                        src={msg.attachment.url} 
                                        alt={msg.attachment.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-mono">
                                        <Maximize2 className="w-3.5 h-3.5" />
                                        <span>View Large</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
                                      <span className="truncate max-w-[160px]">{msg.attachment.name}</span>
                                      {msg.attachment.size && <span>{msg.attachment.size}</span>}
                                    </div>
                                  </div>
                                ) : (
                                  <a 
                                    href={msg.attachment.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    download={msg.attachment.name}
                                    className={`inline-flex items-center gap-2 p-2 rounded-lg border text-xs font-mono transition-colors ${
                                      isMe 
                                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                                        : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC] hover:border-[#EA580C]'
                                    }`}
                                  >
                                    <FileText className="w-4 h-4 text-[#EA580C] shrink-0" />
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold max-w-[180px]">{msg.attachment.name}</p>
                                      {msg.attachment.size && (
                                        <p className="text-[10px] opacity-70">{msg.attachment.size}</p>
                                      )}
                                    </div>
                                    <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Message Status & Timestamp for User Messages */}
                          {isMe && (
                            <div className="flex items-center justify-end gap-1 px-1 font-mono text-[9px] text-[#71717A] dark:text-[#A1A1AA]">
                              <span>{msg.timestamp}</span>
                              <CheckCheck className="w-3 h-3 text-[#EA580C]" />
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Attachment Preview Banner Before Sending */}
          {attachment && (
            <div className="px-5 py-2 bg-[#FAF9F6] dark:bg-[#18181B] border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                <span className="truncate max-w-xs text-[#18181B] dark:text-[#EDEDEC] font-semibold">
                  {attachment.name}
                </span>
                {attachment.size && (
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">({attachment.size})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer p-1"
                title="Discard attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Delivery Error Notice */}
          {sendError && (
            <div className="px-5 py-2.5 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{sendError}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSend()}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Polished Bottom Composer */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#121215] border-t border-[#E4E2DC] dark:border-[#27272A] shrink-0 relative">
            
            {/* Quick Emoji Popover */}
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-full mb-2 left-4 bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-2.5 shadow-lg grid grid-cols-8 gap-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
              >
                {EMOJI_PALETTE.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-[#232327] flex items-center justify-center text-base transition-colors cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-2">
              
              {/* File Attachment Input (Hidden) */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.ai,.eps,.zip,.psd"
              />

              {/* Action Buttons: [Attachment] + [Emoji] */}
              <div className="flex items-center gap-1 shrink-0 pb-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach design asset, reference, or brief"
                  className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#18181B] transition-colors cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Insert emoji reaction"
                  className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#18181B] transition-colors cursor-pointer"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              {/* Message Textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={isAdmin ? "Reply to client as Brewster Creative..." : "Write a message to Brewster Creative (Enter to send, Shift+Enter for new line)..."}
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] transition-colors resize-none leading-relaxed max-h-32"
                />
              </div>

              {/* Send Button */}
              <div className="shrink-0 pb-1">
                <button
                  type="submit"
                  disabled={isSending || (!inputText.trim() && !attachment)}
                  className="px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-40 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>

            </form>

            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] font-mono text-[#A1A1AA]">
              <span>Press Enter to send · Shift + Enter for new line</span>
              <span>Direct studio channel</span>
            </div>
          </div>

        </div>

        {/* RIGHT / SECONDARY: Project Context Dossier (Side-by-side on Desktop) */}
        <aside 
          className={`w-72 xl:w-80 shrink-0 border-l border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#18181B] flex flex-col h-full overflow-y-auto ${
            showProjectContext ? 'fixed inset-y-0 right-0 z-50 shadow-2xl max-w-[320px]' : 'hidden lg:flex'
          }`}
        >
          {/* Dossier Header */}
          <div className="p-4 border-b border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#EA580C]" />
              <h3 className="font-display text-xs uppercase tracking-wider font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Project Dossier
              </h3>
            </div>
            {/* Close button on mobile drawer */}
            {showProjectContext && (
              <button
                type="button"
                onClick={() => setShowProjectContext(false)}
                className="p-1 rounded-md text-[#71717A] hover:text-[#18181B] lg:hidden cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-4 space-y-5 text-xs flex-1">
            
            {/* Project Identification */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] tracking-wider block font-semibold">
                Project Name
              </span>
              <h4 className="font-display text-sm font-bold text-[#18181B] dark:text-[#EDEDEC] leading-snug">
                {commission.projectName}
              </h4>
              <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                {commission.serviceType || commission.packageType || 'Custom Design Commission'}
              </p>
            </div>

            {/* Current Status Pill */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] tracking-wider block font-semibold">
                Status
              </span>
              <div className="inline-flex items-center gap-1.5">
                <span className={`px-2.5 py-1 rounded-md border font-mono text-[11px] font-semibold ${getStatusBadgeStyle(commission.status)}`}>
                  {formatCommissionStatus(commission.status)}
                </span>
              </div>
            </div>

            {/* Current Production Stage */}
            <div className="space-y-1.5 p-3 rounded-lg bg-white dark:bg-[#121215] border border-[#E4E2DC] dark:border-[#27272A]">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Production Stage</span>
                <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  Stage {commission.currentStage || 1} of 8
                </span>
              </div>
              <p className="font-display font-bold text-xs text-[#18181B] dark:text-[#EDEDEC]">
                {currentStageInfo.name}
              </p>
              <div className="w-full bg-[#FAF9F6] dark:bg-[#232327] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#EA580C] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(((commission.currentStage || 1) / 8) * 100)}%` }}
                />
              </div>
            </div>

            {/* Project Overview / Brief */}
            {commission.description && (
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] tracking-wider block font-semibold">
                  Creative Scope
                </span>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed line-clamp-4">
                  {commission.description}
                </p>
              </div>
            )}

            {/* Direct Participants */}
            <div className="space-y-2 pt-2 border-t border-[#E4E2DC] dark:border-[#27272A]">
              <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] tracking-wider block font-semibold">
                Direct Contact
              </span>

              {isAdmin ? (
                /* For Admin: Show Client info */
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{commission.clientName}</p>
                  <p className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[11px]">{commission.clientEmail}</p>
                </div>
              ) : (
                /* For Client: Show Brewster Studio info */
                <div className="flex items-center gap-2.5">
                  <img 
                    src={studioProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                    alt={studioProfile.designerName}
                    className="w-8 h-8 rounded-full object-cover border border-[#E4E2DC] dark:border-[#27272A]"
                  />
                  <div>
                    <p className="font-semibold text-[#18181B] dark:text-[#EDEDEC] text-xs">
                      {studioProfile.designerName}
                    </p>
                    <p className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px]">
                      Studio Lead & Director
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Link to Workspace */}
            <div className="pt-3 border-t border-[#E4E2DC] dark:border-[#27272A]">
              <button
                type="button"
                onClick={() => {
                  if (isAdmin) {
                    setActiveView('admin-dashboard');
                  } else {
                    setActiveView('client-dashboard');
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-white dark:bg-[#121215] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{isAdmin ? 'View in Admin Dashboard' : 'Open in Client Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#EA580C]" />
              </button>
            </div>

          </div>
        </aside>

      </div>

      {/* 3. Image Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
              title="Close image preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage.url} 
              alt={previewImage.name} 
              className="max-h-[80vh] w-auto rounded-lg object-contain shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between w-full text-white font-mono text-xs px-1">
              <span className="truncate max-w-md">{previewImage.name}</span>
              <a 
                href={previewImage.url} 
                download={previewImage.name}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
