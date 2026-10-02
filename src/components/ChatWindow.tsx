import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Commission, MessageAttachment } from '../types';
import { 
  Send, 
  Paperclip, 
  X,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { subscribeToCommissionMessages } from '../lib/messages';

interface ChatWindowProps {
  commission: Commission;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ commission }) => {
  const { 
    messages, 
    sendMessage, 
    fetchMessagesForCommission, 
    currentUser, 
    markMessagesAsRead, 
    studioProfile 
  } = useApp();
  
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commissionMessages = messages.filter(m => m.commissionId === commission.id);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      setSendError(null);
      await fetchMessagesForCommission(commission.id);
      if (!isCancelled) {
        setIsLoadingHistory(false);
        markMessagesAsRead(commission.id);
        setTimeout(() => scrollToBottom(false), 50);
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

  useEffect(() => {
    scrollToBottom(true);
    markMessagesAsRead(commission.id);
  }, [commissionMessages.length, commission.id, scrollToBottom]);

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
      scrollToBottom(true);
    } else {
      setSendError(result.error || 'Failed to deliver message. Please try again.');
    }
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
  };

  const otherPersonName = currentUser?.role === 'admin' 
    ? commission.clientName 
    : (commission.assignedDesigner || studioProfile.designerName);

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl flex flex-col h-[600px] overflow-hidden">
      
      {/* Editorial Chat Header */}
      <div className="px-6 py-4 bg-[#FAF9F6] dark:bg-[#232327] border-b border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
            Project Conversation
          </span>
          <h3 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC] truncate max-w-sm sm:max-w-md">
            {commission.projectName}
          </h3>
        </div>

        <div className="text-right font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
          <span>Direct channel with {otherPersonName}</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
        {isLoadingHistory ? (
          <div className="py-12 text-center text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
            Loading conversation history...
          </div>
        ) : commissionMessages.length === 0 ? (
          <div className="py-16 text-center space-y-2 max-w-sm mx-auto">
            <p className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
              Start the dialogue
            </p>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Share inspirations, ask questions about timelines, or leave feedback for {otherPersonName}.
            </p>
          </div>
        ) : (
          commissionMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-2 font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                  <span className="font-semibold">{msg.senderName}</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div 
                  className={`max-w-[85%] sm:max-w-md rounded-lg p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B]'
                      : 'bg-[#FAF9F6] dark:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A]'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Attachment if present */}
                  {msg.attachment && (
                    <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10">
                      {msg.attachment.type === 'image' ? (
                        <a 
                          href={msg.attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block rounded overflow-hidden max-h-48"
                        >
                          <img 
                            src={msg.attachment.url} 
                            alt={msg.attachment.name} 
                            className="w-full h-full object-cover" 
                          />
                        </a>
                      ) : (
                        <a 
                          href={msg.attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 text-xs underline font-mono"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{msg.attachment.name}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Strip */}
      {attachment && (
        <div className="px-5 py-2 bg-[#FAF9F6] dark:bg-[#232327] border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-3.5 h-3.5 text-[#EA580C]" />
            <span className="truncate max-w-xs text-[#18181B] dark:text-[#EDEDEC]">{attachment.name}</span>
            <span className="text-[#71717A] dark:text-[#A1A1AA]">({attachment.size})</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {sendError && (
        <div className="px-5 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#18181B] border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.ai,.eps,.zip"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach asset or reference"
          className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#232327] transition-colors cursor-pointer shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] transition-colors"
        />

        <button
          type="submit"
          disabled={isSending || (!inputText.trim() && !attachment)}
          className="px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-40 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
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
      </form>

    </div>
  );
};
