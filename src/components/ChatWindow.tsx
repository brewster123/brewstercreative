import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Commission, Message, MessageAttachment } from '../types';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Check, 
  CheckCheck, 
  Sparkles, 
  Download, 
  X,
  Smile,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface ChatWindowProps {
  commission: Commission;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ commission }) => {
  const { messages, sendMessage, currentUser, markMessagesAsRead, studioProfile } = useApp();
  
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for this commission
  const commissionMessages = messages.filter(m => m.commissionId === commission.id);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead(commission.id);
  }, [commissionMessages.length, commission.id]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    sendMessage(commission.id, inputText, attachment || undefined);
    setInputText('');
    setAttachment(null);

    // If client sent a message, simulate designer acknowledgement after brief delay for realistic interaction
    if (currentUser?.role === 'client') {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }, 1000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate attachment creation
    const isImg = file.type.startsWith('image/');
    const fakeUrl = isImg 
      ? URL.createObjectURL(file)
      : 'https://example.com/files/attachment.pdf';

    setAttachment({
      name: file.name,
      url: fakeUrl,
      type: isImg ? 'image' : 'file',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    });
  };

  const quickPrompts = [
    'Could we try an alternative color combination?',
    'Can we increase the typography size slightly?',
    'The overall aesthetic looks really strong!',
    'When will the next preview be ready?',
  ];

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[28px] flex flex-col h-[640px] shadow-sm overflow-hidden">
      
      {/* Chat Header */}
      <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-200/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser?.role === 'admin' ? commission.clientAvatar : studioProfile.avatar}
              alt="Participant"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/40"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-sm text-zinc-900">
                {currentUser?.role === 'admin' ? commission.clientName : studioProfile.designerName}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code bg-orange-50 text-orange-600 font-bold border border-orange-200">
                {currentUser?.role === 'admin' ? 'Client' : 'Assigned Designer'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Project: <span className="text-zinc-800 font-semibold">{commission.projectName}</span>
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-mono-code text-zinc-400 font-medium block">Channel Status</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online Studio Line
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-zinc-50/50">
        
        {/* Project Intro Notice */}
        <div className="text-center my-2">
          <span className="px-3.5 py-1 rounded-full bg-white text-[11px] font-mono-code text-zinc-500 border border-zinc-200 shadow-xs inline-block">
            Direct Project Channel Started on {commission.createdAt}
          </span>
        </div>

        {commissionMessages.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-orange-400/60" />
            <p className="text-xs">No messages yet. Send a message to start communicating!</p>
          </div>
        ) : (
          commissionMessages.map((msg) => {
            const isMe = msg.senderRole === currentUser?.role || (currentUser?.role === 'client' && msg.senderRole === 'client');
            const isDesigner = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <img
                  src={msg.senderAvatar || (isDesigner ? studioProfile.avatar : commission.clientAvatar)}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 ring-1 ring-zinc-300 shadow-xs"
                />

                {/* Message Bubble */}
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-semibold text-zinc-700">
                      {msg.senderName}
                    </span>
                    <span className="text-zinc-400 font-mono-code text-[10px]">
                      {msg.timestamp}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-zinc-900 text-white rounded-tr-none'
                        : 'bg-white border border-zinc-200/90 text-zinc-900 rounded-tl-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>

                    {/* Attachment preview if any */}
                    {msg.attachment && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-200/60">
                        {msg.attachment.type === 'image' ? (
                          <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 mt-1">
                            <img
                              src={msg.attachment.url}
                              alt={msg.attachment.name}
                              className="max-h-56 w-full object-cover"
                            />
                            <div className="p-2 flex items-center justify-between text-[11px] bg-white text-zinc-800 border-t border-zinc-100">
                              <span className="truncate font-mono-code font-medium">{msg.attachment.name}</span>
                              <span className="text-[10px] text-zinc-500">{msg.attachment.size}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-800">
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip className="w-3.5 h-3.5 shrink-0 text-orange-500" />
                              <span className="truncate font-mono-code text-[11px] font-medium">{msg.attachment.name}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 shrink-0 ml-2">{msg.attachment.size}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delivery Status Receipt */}
                  {isMe && (
                    <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 font-mono-code">
                      <span>Delivered</span>
                      <CheckCheck className="w-3 h-3 text-orange-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 italic py-1">
            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
            </div>
            <span>{studioProfile.designerName} is typing a response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Prompts */}
      <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-zinc-500 font-mono-code font-bold shrink-0">Quick Ask:</span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInputText(prompt)}
            className="px-3 py-1 rounded-full bg-white hover:bg-zinc-100 text-zinc-700 text-[11px] whitespace-nowrap border border-zinc-200 transition-colors shadow-2xs font-medium shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Attachment Selected Tag */}
      {attachment && (
        <div className="px-4 py-2 bg-orange-50/80 border-t border-orange-200 flex items-center justify-between text-xs text-zinc-800">
          <div className="flex items-center gap-2">
            <Paperclip className="w-3.5 h-3.5 text-orange-600" />
            <span className="font-mono-code truncate max-w-xs font-semibold">{attachment.name}</span>
            <span className="text-zinc-500 text-[10px]">({attachment.size})</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-zinc-500 hover:text-zinc-800 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-zinc-200 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.ai,.psd"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors"
          title="Attach image or design file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          id="input-chat-message"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${currentUser?.role === 'admin' ? commission.clientName : studioProfile.designerName}...`}
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
        />

        <button
          id="btn-send-message"
          type="submit"
          disabled={!inputText.trim() && !attachment}
          className="p-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Send</span>
        </button>
      </form>

    </div>
  );
};
