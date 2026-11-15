import React, { useEffect, useRef } from 'react';
import { Commission } from '../types';
import { useApp } from '../context/AppContext';
import { ChatWindow } from './ChatWindow';
import { X, MessageSquare, Shield } from 'lucide-react';

interface ProjectChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  commission: Commission;
}

export const ProjectChatDrawer: React.FC<ProjectChatDrawerProps> = ({
  isOpen,
  onClose,
  commission,
}) => {
  const { currentUser, studioProfile } = useApp();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="project-chat-drawer-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div 
          ref={drawerRef}
          className="w-screen max-w-2xl bg-canvas border-l border-hairline shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        >
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-hairline bg-surface flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                    Project Conversation
                  </span>
                  <span className="font-mono text-[10px] text-graphite">
                    · #{commission.id.slice(0, 8)}
                  </span>
                </div>
                <h3 
                  id="project-chat-drawer-title" 
                  className="font-display font-bold text-base text-carbon truncate"
                >
                  {commission.projectName}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary transition-colors cursor-pointer"
              aria-label="Close project chat drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scoped Chat Window Container */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatWindow
              commission={commission}
              isAdmin={currentUser?.role === 'admin'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
