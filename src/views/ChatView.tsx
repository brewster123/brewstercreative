import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChatWindow } from '../components/ChatWindow';
import { ArrowLeft, MessageSquare, ShieldCheck, Layers, FolderArchive } from 'lucide-react';

export const ChatView: React.FC = () => {
  const {
    currentUser,
    commissions,
    currentUserCommissions,
    activeCommission,
    selectedCommissionId,
    setSelectedCommissionId,
    setActiveCommissionId,
    setActiveView,
    studioProfile
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // For Admin: commission to chat with
  const currentCommission = commissions.find(c => c.id === selectedCommissionId) || commissions[0];

  // For Client: commission to chat with
  const clientCommission = activeCommission || (currentUserCommissions && currentUserCommissions.length > 0 ? currentUserCommissions[0] : undefined);

  const activeComm = isAdmin ? currentCommission : clientCommission;

  React.useEffect(() => {
    if (!selectedCommissionId && activeComm?.id) {
      setSelectedCommissionId(activeComm.id);
    }
  }, [selectedCommissionId, activeComm?.id, setSelectedCommissionId]);

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

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#71717A] dark:text-[#A1A1AA]">
          <MessageSquare className="w-5 h-5 text-[#EA580C]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Studio Conversation
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            Please sign in to access your direct conversations with Brewster.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('auth')}
          className="px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-all cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 animate-in fade-in duration-300">
      
      {/* Editorial Navigation Backlink & Header */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>
            {isAdmin ? 'Return to Studio Dashboard' : 'Return to Creative Projects'}
          </span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4E2DC] dark:border-[#27272A]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <span>Brewster Creative</span>
              <span>·</span>
              <span className={isAdmin ? 'text-[#059669] dark:text-[#34D399] font-semibold' : 'text-[#EA580C] font-semibold'}>
                {isAdmin ? 'Client Conversations' : 'Project Conversation'}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
              {isAdmin ? 'Client Conversations' : 'Project Conversation'}
            </h1>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
              {isAdmin 
                ? 'Direct communication channel with studio clients on active commissions.'
                : 'Direct dialogue with Brewster on your commissioned creative work.'}
            </p>
          </div>

          {/* Project Selector */}
          {isAdmin && commissions.length > 0 && (
            <div className="flex items-center gap-2 font-mono text-xs shrink-0">
              <label htmlFor="select-admin-chat-comm" className="text-[#71717A] dark:text-[#A1A1AA]">
                Client Project:
              </label>
              <select
                id="select-admin-chat-comm"
                value={activeComm?.id || selectedCommissionId}
                onChange={(e) => {
                  setSelectedCommissionId(e.target.value);
                  setActiveCommissionId(e.target.value);
                }}
                className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
              >
                {commissions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.clientName} — {c.projectName} ({formatCommissionStatus(c.status)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isAdmin && currentUserCommissions.length > 1 && (
            <div className="flex items-center gap-2 font-mono text-xs shrink-0">
              <label htmlFor="select-client-chat-comm" className="text-[#71717A] dark:text-[#A1A1AA]">
                Select Project:
              </label>
              <select
                id="select-client-chat-comm"
                value={activeComm?.id}
                onChange={(e) => setActiveCommissionId(e.target.value)}
                className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
              >
                {currentUserCommissions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.projectName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Messaging Interface */}
      {activeComm ? (
        <div className="animate-in fade-in duration-200">
          <ChatWindow commission={activeComm} />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-12 text-center space-y-4">
          <FolderArchive className="w-8 h-8 text-[#A1A1AA] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC]">
              {isAdmin ? 'No Client Commissions Found' : 'No Active Projects Found'}
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-sm mx-auto">
              {isAdmin 
                ? 'Client conversations will appear here as soon as commissions are requested.'
                : 'Initiate a creative commission or inquiry to begin communicating with Brewster.'}
            </p>
          </div>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold cursor-pointer"
            >
              Start a Commission
            </button>
          )}
        </div>
      )}

    </div>
  );
};
