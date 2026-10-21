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
  CheckCheck, 
  Info, 
  Layers, 
  ArrowRight,
  Maximize2,
  ArrowLeft
} from 'lucide-react';
import { subscribeToCommissionMessages } from '../lib/messages';
import { CHAT_FILE_INPUT_ACCEPT, isAllowedAttachmentFile } from '../lib/chatAttachments';

interface ChatWindowProps {
  commission: Commission;
  availableCommissions?: Commission[];
  onSelectCommission?: (commissionId: string) => void;
  isAdmin?: boolean;
  onBackToList?: () => void;
  showBackOnMobile?: boolean;
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
      return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
    case 'for_review':
    case 'client review':
      return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
    case 'revision':
    case 'revision requested':
      return 'bg-purple-950/60 text-purple-400 border-purple-800/60';
    case 'final_approval':
    case 'final approval':
    case 'accepted':
      return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
    case 'completed':
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    case 'cancelled':
    case 'rejected':
      return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
    case 'pending':
    case 'reviewing':
    default:
      return 'bg-orange-950/60 text-orange-400 border-orange-800/60';
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
  isAdmin = false,
  onBackToList,
  showBackOnMobile = false
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProjectContext, setShowProjectContext] = useState(false); // Toggle Dossier side panel
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const clearAttachment = useCallback(() => {
    if (attachment?.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    setAttachment(null);
    setAttachmentFile(null);
  }, [attachment]);

  // Clean up any remaining blob URL on unmount
  useEffect(() => {
    return () => {
      if (attachment?.url && attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
    };
  }, [attachment]);

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
    if (!textToSend && !attachment && !attachmentFile) return;

    setIsSending(true);
    setSendError(null);

    const result = await sendMessage(commission.id, textToSend, attachment || undefined, attachmentFile || undefined);

    setIsSending(false);

    if (result.success) {
      setInputText('');
      clearAttachment();
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
    // Auto-resize textarea height
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

    // Check 25MB limit immediately on client
    if (file.size > 25 * 1024 * 1024) {
      setSendError(`File "${file.name}" exceeds 25 MB limit.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate supported file format (rejects SVGs and unmapped binaries)
    const fileValidation = isAllowedAttachmentFile(file);
    if (!fileValidation.allowed) {
      setSendError(fileValidation.reason || 'Unsupported file format.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Clean up previous blob URL if any
    if (attachment?.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }

    const isImg = file.type.startsWith('image/');
    const fakeUrl = URL.createObjectURL(file);

    setAttachmentFile(file);
    setAttachment({
      name: file.name,
      url: fakeUrl,
      type: isImg ? 'image' : 'file',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      mime: file.type,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Partner presentation details
  const partnerName = isAdmin ? commission.clientName : (studioProfile.studioName || 'DESTALION');
  const partnerAvatar = isAdmin 
    ? (commission.clientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80')
    : (studioProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');

  // Find current stage description
  const currentStageInfo = COMMISSION_STAGES.find(s => s.number === (commission.currentStage || 1)) || COMMISSION_STAGES[0];

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0 bg-[#18191A] text-[#EDEDEC] relative overflow-hidden">
      
      {/* 1. Messenger Desktop Main Header */}
      <header className="h-16 px-4 sm:px-6 bg-[#18191A] border-b border-[#27272A] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button (Returns to Conversation List on Mobile) */}
          {showBackOnMobile && onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="md:hidden p-1.5 -ml-1 rounded-full text-[#0084FF] hover:bg-[#242526] transition-colors cursor-pointer shrink-0"
              title="Back to conversation list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Partner Avatar with Green Online Status */}
          <div className="relative shrink-0">
            <img 
              src={partnerAvatar}
              alt={partnerName}
              className="w-10 h-10 rounded-full object-cover border border-[#27272A]"
            />
            <span 
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#18191A]"
              title="Active now"
            />
          </div>

          {/* Name & Project Subtitle */}
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[#EDEDEC] truncate flex items-center gap-2">
              <span>{partnerName}</span>
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-[#B0B3B8] truncate">
              <span className="text-emerald-400 font-medium text-[11px] shrink-0">
                Active now
              </span>
              <span>·</span>
              <span className="truncate text-[#E4E6EB]">
                {commission.projectName}
              </span>
              <span>·</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${getStatusBadgeStyle(commission.status)} shrink-0`}>
                {formatCommissionStatus(commission.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Action Icons: Messenger Info Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Project Switcher if available and callback provided */}
          {availableCommissions.length > 1 && onSelectCommission && (
            <div className="hidden xl:flex items-center gap-1.5 font-mono text-xs mr-2">
              <span className="text-[#8E9297] text-[11px]">Thread:</span>
              <select
                value={commission.id}
                onChange={(e) => onSelectCommission(e.target.value)}
                className="bg-[#242526] border border-[#3A3B3C] rounded-lg px-2.5 py-1 text-xs text-[#E4E6EB] focus:outline-none focus:border-[#0084FF] cursor-pointer max-w-[170px] truncate"
              >
                {availableCommissions.map(c => (
                  <option key={c.id} value={c.id}>
                    {isAdmin ? `${c.clientName} — ` : ''}{c.projectName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Messenger Information Button (i) */}
          <button
            type="button"
            onClick={() => setShowProjectContext(!showProjectContext)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              showProjectContext 
                ? 'bg-[#0084FF] text-white shadow-sm' 
                : 'bg-[#242526] hover:bg-[#3A3B3C] text-[#0084FF]'
            }`}
            title="Conversation information & project dossier"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Chat Timeline & Right Dossier Panel */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* CENTER / MAIN: Message Stream & Fixed Composer */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-[#18191A]">
          
          {/* Independently Scrollable Message Stream */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-2.5"
          >
            
            {/* Loading Skeletons */}
            {isLoadingHistory ? (
              <div className="space-y-4 py-8 max-w-lg mx-auto animate-pulse">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#242526]" />
                  <div className="h-10 w-48 rounded-2xl bg-[#242526]" />
                </div>
                <div className="flex items-end justify-end">
                  <div className="h-12 w-56 rounded-2xl bg-[#0084FF]/20" />
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#242526]" />
                  <div className="h-14 w-64 rounded-2xl bg-[#242526]" />
                </div>
              </div>
            ) : commissionMessages.length === 0 ? (
              /* Messenger-Style Conversation Greeting */
              <div className="py-12 sm:py-16 text-center max-w-sm mx-auto space-y-3.5">
                <div className="relative inline-block mx-auto">
                  <img 
                    src={partnerAvatar}
                    alt={partnerName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#27272A] shadow-md mx-auto"
                  />
                  <span className="w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#18191A] absolute bottom-1 right-1" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-white">
                    {partnerName}
                  </h3>
                  <p className="text-xs text-[#8E9297] leading-relaxed">
                    {isAdmin
                      ? `Direct studio message thread for ${commission.projectName}.`
                      : 'You are directly connected with Brewster Cabando on this project.'}
                  </p>
                </div>

                {/* Quick Icebreaker Prompts */}
                <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-xs text-[#B0B3B8]">
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("Hello, could you share an update on the current project stage?");
                      textareaRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#242526] hover:bg-[#2E2F32] text-[#E4E6EB] border border-[#27272A] hover:border-[#0084FF] transition-colors cursor-pointer text-xs"
                  >
                    "Ask for an update"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("I have feedback and reference files ready for review.");
                      textareaRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#242526] hover:bg-[#2E2F32] text-[#E4E6EB] border border-[#27272A] hover:border-[#0084FF] transition-colors cursor-pointer text-xs"
                  >
                    "Share feedback"
                  </button>
                </div>
              </div>
            ) : (
              /* Message Stream with Messenger Dark Mode Bubbles */
              commissionMessages.map((msg, index) => {
                const isMe = msg.senderId === currentUser?.id;
                const prevMsg = index > 0 ? commissionMessages[index - 1] : null;
                const currentDateGroup = getDateSeparator(msg.createdAt, msg.timestamp);
                const prevDateGroup = prevMsg ? getDateSeparator(prevMsg.createdAt, prevMsg.timestamp) : null;
                const showDateSeparator = currentDateGroup !== prevDateGroup;
                const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId && !showDateSeparator;

                const hasText = Boolean((msg.message || msg.body)?.trim());
                const hasAttachment = Boolean(msg.attachment);

                return (
                  <React.Fragment key={msg.id}>
                    {/* Centered Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <span className="text-[11px] font-mono text-[#8E9297] bg-[#242526] px-3 py-0.5 rounded-full border border-[#27272A]">
                          {currentDateGroup}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble Alignment */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-2.5'}`}>
                      
                      {/* Sender Info (Only if not consecutive and not me) */}
                      {!isMe && !isConsecutive && (
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#8E9297]">
                          <span className="font-semibold text-[#EDEDEC]">{msg.senderName}</span>
                          <span>·</span>
                          <span>{msg.timestamp}</span>
                        </div>
                      )}

                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                        {/* Avatar for other participant (Only at end of cluster) */}
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#27272A] mb-0.5">
                            <img 
                              src={msg.senderAvatar || (msg.senderRole === 'admin' ? studioProfile.avatar : partnerAvatar) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                              alt={msg.senderName || 'Sender Avatar'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          {/* Bubble Container: Messenger Blue (Me) vs Neutral Dark (Them) */}
                          <div
                            className={`text-sm leading-relaxed break-words ${
                              isMe
                                ? 'bg-[#0084FF] text-white rounded-2xl rounded-br-xs p-3 sm:px-4 sm:py-2.5 shadow-xs'
                                : 'bg-[#3A3B3C] text-[#E4E6EB] rounded-2xl rounded-bl-xs p-3 sm:px-4 sm:py-2.5'
                            }`}
                          >
                            {hasText && (
                              <p className="whitespace-pre-wrap">{msg.message || msg.body}</p>
                            )}

                            {/* Attachment Presentation (Clean, even if attachment-only) */}
                            {hasAttachment && msg.attachment && (
                              <div className={hasText ? 'mt-2.5 pt-2 border-t border-white/15' : ''}>
                                {msg.attachment.type === 'image' && msg.attachment.url ? (
                                  <div className="space-y-1.5">
                                    <div 
                                      onClick={() => setPreviewImage({ url: msg.attachment!.url, name: msg.attachment!.name })}
                                      className="relative group rounded-xl overflow-hidden border border-black/20 dark:border-white/10 max-h-64 max-w-sm cursor-pointer bg-black/20"
                                    >
                                      <img 
                                        src={msg.attachment.url} 
                                        alt={msg.attachment.name || 'Attachment image'} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-mono">
                                        <Maximize2 className="w-4 h-4" />
                                        <span>View Photo</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-mono opacity-80 px-0.5">
                                      <span className="truncate max-w-[180px]">{msg.attachment.name}</span>
                                      {msg.attachment.size && <span>{msg.attachment.size}</span>}
                                    </div>
                                  </div>
                                ) : (
                                  <a 
                                    href={msg.attachment.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    download={msg.attachment.name}
                                    className={`inline-flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-mono transition-colors ${
                                      isMe 
                                        ? 'bg-white/15 border-white/20 text-white hover:bg-white/25' 
                                        : 'bg-[#242526] border-[#3A3B3C] text-[#E4E6EB] hover:border-[#0084FF]'
                                    }`}
                                  >
                                    <FileText className="w-5 h-5 text-white shrink-0" />
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold max-w-[190px]">{msg.attachment.name}</p>
                                      {msg.attachment.size && (
                                        <p className="text-[10px] opacity-70">{msg.attachment.size}</p>
                                      )}
                                    </div>
                                    <Download className="w-4 h-4 shrink-0 opacity-80 ml-1" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Message Delivery Checkmark for Outgoing Messages */}
                          {isMe && (
                            <div className="flex items-center justify-end gap-1 px-1 font-mono text-[10px] text-[#8E9297]">
                              <span>{msg.timestamp}</span>
                              <CheckCheck className="w-3.5 h-3.5 text-[#0084FF]" />
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

          {/* Staged Attachment Preview Banner (Before Sending) */}
          {attachment && (
            <div className="px-4 py-2 bg-[#242526] border-t border-[#27272A] flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2.5 truncate">
                <Paperclip className="w-4 h-4 text-[#0084FF] shrink-0" />
                <span className="truncate max-w-xs text-[#E4E6EB] font-semibold">
                  {attachment.name}
                </span>
                {attachment.size && (
                  <span className="text-[#8E9297]">({attachment.size})</span>
                )}
              </div>
              <button
                type="button"
                onClick={clearAttachment}
                className="text-[#8E9297] hover:text-white cursor-pointer p-1 rounded-full hover:bg-[#3A3B3C]"
                title="Discard attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Delivery Error Notice */}
          {sendError && (
            <div className="px-4 py-2 bg-red-950/60 border-t border-red-800/80 text-red-200 text-xs flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{sendError}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSend()}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Fixed Messenger Bottom Composer */}
          <div className="p-3 sm:p-3.5 bg-[#18191A] border-t border-[#27272A] shrink-0 relative">
            
            {/* Quick Emoji Popover */}
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-full mb-2 left-4 bg-[#242526] border border-[#3A3B3C] rounded-2xl p-2.5 shadow-2xl grid grid-cols-8 gap-1.5 z-30"
              >
                {EMOJI_PALETTE.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-[#3A3B3C] flex items-center justify-center text-lg transition-colors cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-1.5 sm:gap-2">
              
              {/* File Attachment Input (Hidden) */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={CHAT_FILE_INPUT_ACCEPT}
              />

              {/* Action Buttons: Paperclip + Emoji */}
              <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach photo, brief, or file"
                  className="w-9 h-9 rounded-full text-[#0084FF] hover:bg-[#242526] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Insert emoji"
                  className="w-9 h-9 rounded-full text-[#0084FF] hover:bg-[#242526] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              {/* Messenger Pill Text Input Surface */}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={isAdmin ? "Reply to client as DESTALION..." : "Aa"}
                  className="w-full bg-[#242526] hover:bg-[#2A2B2D] focus:bg-[#2A2B2D] border border-transparent focus:border-[#3A3B3C] rounded-2xl px-4 py-2.5 text-sm text-[#E4E6EB] placeholder-[#8E9297] focus:outline-none transition-colors resize-none leading-relaxed max-h-32"
                />
              </div>

              {/* Circular Send Button */}
              <div className="shrink-0 pb-0.5">
                <button
                  type="submit"
                  disabled={isSending || (!inputText.trim() && !attachment && !attachmentFile)}
                  className="w-9 h-9 rounded-full bg-[#0084FF] hover:bg-[#0A7CFF] disabled:opacity-30 disabled:hover:bg-[#0084FF] text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title="Send message"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>

            </form>

            <div className="flex items-center justify-between mt-1 px-2 text-[10px] font-mono text-[#71717A]">
              <span>Press Enter to send · Shift + Enter for new line</span>
              <span>Encrypted Studio Channel</span>
            </div>
          </div>

        </div>

        {/* RIGHT / SECONDARY: Project Context Dossier (Toggled by Info Button) */}
        {showProjectContext && (
          <aside 
            className="w-72 xl:w-80 shrink-0 border-l border-[#27272A] bg-[#18191A] flex flex-col h-full overflow-y-auto fixed inset-y-0 right-0 z-50 lg:static lg:z-auto shadow-2xl lg:shadow-none"
          >
            {/* Dossier Header */}
            <div className="h-16 px-4 border-b border-[#27272A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0084FF]" />
                <h3 className="font-display text-xs uppercase tracking-wider font-bold text-white">
                  Project Dossier
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectContext(false)}
                className="w-8 h-8 rounded-full bg-[#242526] hover:bg-[#3A3B3C] text-[#B0B3B8] hover:text-white flex items-center justify-center cursor-pointer"
                title="Close dossier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5 text-xs flex-1">
              {/* Partner Profile Card */}
              <div className="text-center py-2 space-y-2 border-b border-[#27272A] pb-4">
                <img 
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#27272A] mx-auto shadow-sm"
                />
                <div>
                  <h4 className="font-display text-sm font-bold text-white">{partnerName}</h4>
                  <p className="text-[11px] text-[#8E9297]">
                    {isAdmin ? commission.clientEmail : 'Studio Lead & Art Director'}
                  </p>
                </div>
              </div>

              {/* Project Identification */}
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase text-[#8E9297] tracking-wider block font-semibold">
                  Project Name
                </span>
                <h4 className="font-display text-sm font-bold text-[#EDEDEC] leading-snug">
                  {commission.projectName}
                </h4>
                <p className="text-[11px] font-mono text-[#B0B3B8]">
                  {commission.serviceType || commission.service || 'Custom Design Commission'}
                </p>
              </div>

              {/* Current Status Badge */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase text-[#8E9297] tracking-wider block font-semibold">
                  Commission Status
                </span>
                <div className="inline-flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-md border font-mono text-[11px] font-semibold ${getStatusBadgeStyle(commission.status)}`}>
                    {formatCommissionStatus(commission.status)}
                  </span>
                </div>
              </div>

              {/* Production Stage */}
              <div className="space-y-2 p-3 rounded-xl bg-[#242526] border border-[#27272A]">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#8E9297]">Production Stage</span>
                  <span className="font-bold text-white">
                    Stage {commission.currentStage || 1} of 8
                  </span>
                </div>
                <p className="font-display font-semibold text-xs text-[#E4E6EB]">
                  {currentStageInfo.name}
                </p>
                <div className="w-full bg-[#18191A] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-[#0084FF] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round(((commission.currentStage || 1) / 8) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Project Brief / Creative Scope */}
              {commission.description && (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-[#8E9297] tracking-wider block font-semibold">
                    Creative Scope
                  </span>
                  <p className="text-xs text-[#B0B3B8] leading-relaxed line-clamp-4">
                    {commission.description}
                  </p>
                </div>
              )}

              {/* Open in Workspace Action */}
              <div className="pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => {
                    if (isAdmin) {
                      setActiveView('admin-dashboard');
                    } else {
                      setActiveView('client-dashboard');
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#242526] hover:bg-[#2E2F32] border border-[#27272A] hover:border-[#0084FF] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{isAdmin ? 'Open in Admin Dashboard' : 'Open in Client Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0084FF]" />
                </button>
              </div>

            </div>
          </aside>
        )}

      </div>

      {/* 3. High-Fidelity Image Lightbox Modal */}
      {previewImage && Boolean(previewImage.url) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
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
              className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center justify-between w-full text-white font-mono text-xs px-1">
              <span className="truncate max-w-md">{previewImage.name}</span>
              <a 
                href={previewImage.url} 
                download={previewImage.name}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#0084FF] hover:text-[#0A84FF] font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
