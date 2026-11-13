import React, { useState, useMemo } from 'react';
import { 
  Commission, 
  CommissionStatus, 
  CommissionPriority, 
  COMMISSION_STAGES 
} from '../../types';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../ProgressBar';
import { formatCommissionDate } from '../../utils/dateUtils';
import { AdminCreativeProofsSection } from '../AdminCreativeProofsSection';
import { AdminDeliverablesSection } from '../AdminDeliverablesSection';
import { AdminPaymentVerificationSection } from '../AdminPaymentVerificationSection';
import { 
  FolderArchive, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  MessageSquare, 
  Check, 
  X, 
  Eye, 
  UploadCloud, 
  CreditCard, 
  FileText, 
  ExternalLink,
  AlertCircle,
  Filter,
  Copy,
  CheckCheck
} from 'lucide-react';

interface CommissionManagementProps {
  initialFilter?: 'active' | 'completed' | 'cancelled' | 'all';
  initialCommissionId?: string | null;
  selectedCommissionId?: string;
  onSelectCommission?: (commissionId: string) => void;
  onSelectCommissionForChat?: (commissionId: string) => void;
  onOpenChat?: (commissionId: string) => void;
  onNavigateToPayments?: (commissionId: string) => void;
}

export const CommissionManagement: React.FC<CommissionManagementProps> = ({
  initialFilter = 'active',
  initialCommissionId = null,
  selectedCommissionId,
  onSelectCommission,
  onSelectCommissionForChat,
  onOpenChat,
  onNavigateToPayments,
}) => {
  const {
    commissions = [],
    currentUser,
    updateCommissionStage,
    updateCommissionStatus,
    updateCommissionPriority,
    acceptCommission,
    declineCommission,
    setActiveCommissionId,
    setActiveView,
  } = useApp();

  const safeCommissions = commissions || [];

  // Navigation & Workspace state
  const [adminWorkspaceCommissionId, setAdminWorkspaceCommissionId] = useState<string | null>(
    selectedCommissionId || initialCommissionId
  );
  const [adminWorkspaceTab, setAdminWorkspaceTab] = useState<'proofs' | 'deliverables' | 'payments' | 'specifications'>('proofs');

  // Keep adminWorkspaceCommissionId in sync if selectedCommissionId prop changes
  React.useEffect(() => {
    if (selectedCommissionId) {
      setAdminWorkspaceCommissionId(selectedCommissionId);
    }
  }, [selectedCommissionId]);
  
  // Filtering & search
  const [commissionSection, setCommissionSection] = useState<'active' | 'completed' | 'cancelled' | 'all'>(initialFilter);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Status & Priority update feedback
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusSuccessId, setStatusSuccessId] = useState<string | null>(null);
  const [priorityUpdatingId, setPriorityUpdatingId] = useState<string | null>(null);

  // Decline confirmation dialog state
  const [declineTargetCommission, setDeclineTargetCommission] = useState<Commission | null>(null);

  const STATUS_OPTIONS: { value: CommissionStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'for_review', label: 'For Review' },
    { value: 'revision', label: 'Revision' },
    { value: 'final_approval', label: 'Final Approval' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const PRIORITY_OPTIONS: { value: CommissionPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const handleStatusChange = async (commissionId: string, newStatus: CommissionStatus) => {
    setStatusUpdatingId(commissionId);
    try {
      await updateCommissionStatus(commissionId, newStatus);
      setStatusSuccessId(commissionId);
      setTimeout(() => setStatusSuccessId(null), 3000);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handlePriorityChange = async (commissionId: string, newPriority: CommissionPriority) => {
    setPriorityUpdatingId(commissionId);
    try {
      await updateCommissionPriority(commissionId, newPriority);
    } finally {
      setPriorityUpdatingId(null);
    }
  };

  const handleCopyEmail = (id: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  // Filter commissions
  const filteredCommissions = useMemo(() => {
    return safeCommissions.filter(c => {
      const s = (c.status || '').toLowerCase();
      
      // Section filter
      if (commissionSection === 'active') {
        if (s.includes('completed') || s.includes('cancelled') || s.includes('rejected') || c.currentStage === 8) {
          return false;
        }
      } else if (commissionSection === 'completed') {
        if (!s.includes('completed') && c.currentStage !== 8) {
          return false;
        }
      } else if (commissionSection === 'cancelled') {
        if (!s.includes('cancelled') && !s.includes('rejected')) {
          return false;
        }
      }

      // Stage filter
      if (activeStageFilter !== 'all') {
        const targetStage = parseInt(activeStageFilter, 10);
        if (c.currentStage !== targetStage) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (c.projectName || '').toLowerCase().includes(q);
        const matchesClient = (c.clientName || '').toLowerCase().includes(q) || (c.clientEmail || '').toLowerCase().includes(q);
        const matchesService = (c.serviceType || '').toLowerCase().includes(q);
        const matchesId = (c.id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesClient && !matchesService && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [commissions, commissionSection, activeStageFilter, searchQuery]);

  const workspaceCommission = useMemo(() => {
    if (!adminWorkspaceCommissionId) return null;
    return commissions.find(c => c.id === adminWorkspaceCommissionId) || null;
  }, [commissions, adminWorkspaceCommissionId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* LEVEL 2: DEDICATED ADMIN COMMISSION WORKSPACE            */}
      {/* ======================================================== */}
      {adminWorkspaceCommissionId && workspaceCommission ? (
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E2DC] dark:border-[#222225]">
            <button
              type="button"
              onClick={() => {
                setAdminWorkspaceCommissionId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#222225] bg-white dark:bg-[#18181B] hover:bg-[#FAF9F6] dark:hover:bg-[#121214] text-xs font-mono font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>← Back to Commission Pipeline</span>
            </button>

            <div className="flex items-center gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <span>Active Workspace:</span>
              <strong className="text-[#18181B] dark:text-[#EDEDEC]">
                {workspaceCommission.projectName}
              </strong>
              <span>(#{workspaceCommission.id.slice(0, 8)})</span>
            </div>
          </div>

          {/* Commission Header Card */}
          <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E4E2DC] dark:border-[#222225]">
              <div className="flex items-start gap-4">
                <img
                  src={workspaceCommission.clientAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                  alt={workspaceCommission.clientName || 'Client Avatar'}
                  className="w-12 h-12 rounded-full object-cover ring-1 ring-[#E4E2DC] dark:ring-[#222225] shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                      {workspaceCommission.projectName}
                    </h2>
                    <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      #{workspaceCommission.id.slice(0, 8)}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-[#EA580C] font-semibold uppercase">
                      {workspaceCommission.serviceType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
                    <span>Client: <strong className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{workspaceCommission.clientName}</strong></span>
                    <span>·</span>
                    <span>{workspaceCommission.clientEmail}</span>
                    <span>·</span>
                    <span>Budget: <strong className="text-[#18181B] dark:text-[#EDEDEC]">{workspaceCommission.budget}</strong></span>
                    <span>·</span>
                    <span>Deadline: {formatCommissionDate(workspaceCommission.deadline)}</span>
                  </div>
                </div>
              </div>

              {/* Status, Priority & Chat Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <label htmlFor={`workspace-status-${workspaceCommission.id}`} className="text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA]">
                    Status:
                  </label>
                  <select
                    id={`workspace-status-${workspaceCommission.id}`}
                    value={workspaceCommission.status}
                    disabled={statusUpdatingId === workspaceCommission.id}
                    onChange={(e) => handleStatusChange(workspaceCommission.id, e.target.value as CommissionStatus)}
                    className="bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-md px-2.5 py-1 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {statusSuccessId === workspaceCommission.id && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ Saved</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <label htmlFor={`workspace-priority-${workspaceCommission.id}`} className="text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA]">
                    Priority:
                  </label>
                  <select
                    id={`workspace-priority-${workspaceCommission.id}`}
                    value={(workspaceCommission.priority || 'normal').toLowerCase()}
                    disabled={priorityUpdatingId === workspaceCommission.id}
                    onChange={(e) => handlePriorityChange(workspaceCommission.id, e.target.value as CommissionPriority)}
                    className="bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-md px-2.5 py-1 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCommissionId(workspaceCommission.id);
                    setActiveView('chat');
                  }}
                  title="Open Direct Client Conversation"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#18181B] transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Client Chat</span>
                </button>
              </div>
            </div>

            {/* 8-Stage Interactive Milestone Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">
                  Stage 0{workspaceCommission.currentStage || 1} of 08 · {COMMISSION_STAGES.find(s => s.number === (workspaceCommission.currentStage || 1))?.name}
                </span>
                <span className="font-bold text-[#EA580C]">
                  Click any milestone below to update production stage ({workspaceCommission.progress}%)
                </span>
              </div>
              <ProgressBar commission={workspaceCommission} interactiveAdmin={true} />
            </div>

            {/* Settlement Status Row (Read-Only Display + Review Navigation) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#E4E2DC] dark:border-[#222225] text-xs font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">GCash Settlement Status:</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                  workspaceCommission.paymentStatus === 'Paid'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : workspaceCommission.paymentStatus === 'Partial'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                }`}>
                  {workspaceCommission.paymentStatus || 'Unpaid'}
                </span>
                {workspaceCommission.totalPaid && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Total Paid
                  </span>
                )}
                {workspaceCommission.depositPaid && !workspaceCommission.totalPaid && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Deposit Verified
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToPayments) {
                    onNavigateToPayments(workspaceCommission.id);
                  } else {
                    setAdminWorkspaceTab('payments');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#222225] border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono text-[#EA580C] hover:text-[#D94814] transition-colors cursor-pointer self-start sm:self-auto focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] btn-tactile"
                title="Review GCash receipts in Payments & Verification Hub"
              >
                <span>Review Receipt in Payments Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dedicated Commission Sub-Tabs */}
          <nav className="flex items-center gap-2 border-b border-[#E4E2DC] dark:border-[#222225] pb-1 overflow-x-auto no-scrollbar" aria-label="Commission workspace sections">
            {[
              { id: 'proofs' as const, label: 'Creative Proofs', icon: UploadCloud },
              { id: 'deliverables' as const, label: 'Final Deliverables', icon: FolderArchive },
              { id: 'payments' as const, label: 'Payment Verification', icon: CreditCard },
              { id: 'specifications' as const, label: 'Specifications & Brief', icon: FileText },
            ].map(({ id, label, icon: TabIcon }) => {
              const isSelected = adminWorkspaceTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAdminWorkspaceTab(id)}
                  className={`relative px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 rounded-lg ${
                    isSelected
                      ? 'text-[#18181B] dark:text-[#EDEDEC] font-bold'
                      : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {isSelected && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#EA580C] rounded-full animate-in fade-in duration-200" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sub-Tab 1: Creative Proofs */}
          {adminWorkspaceTab === 'proofs' && (
            <AdminCreativeProofsSection
              commission={workspaceCommission}
              currentUser={currentUser}
            />
          )}

          {/* Sub-Tab 2: Final Deliverables */}
          {adminWorkspaceTab === 'deliverables' && (
            <AdminDeliverablesSection
              commission={workspaceCommission}
              currentUser={currentUser}
            />
          )}

          {/* Sub-Tab 3: Payment Verification */}
          {adminWorkspaceTab === 'payments' && (
            <AdminPaymentVerificationSection
              commissions={commissions}
              currentUser={currentUser}
              selectedCommissionId={workspaceCommission.id}
            />
          )}

          {/* Sub-Tab 4: Specifications & Brief */}
          {adminWorkspaceTab === 'specifications' && (
            <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6">
              <div className="space-y-1 pb-4 border-b border-[#E4E2DC] dark:border-[#222225]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                  Original Client Request
                </span>
                <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  Creative Brief & Scope Directives
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                    Project Scope & Requirements
                  </span>
                  <p className="text-[#18181B] dark:text-[#EDEDEC] leading-relaxed bg-[#FAF9F6] dark:bg-[#18181B] p-4 rounded-lg border border-[#E4E2DC] dark:border-[#222225] whitespace-pre-line">
                    {workspaceCommission.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {workspaceCommission.purpose && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                        Purpose & Context
                      </span>
                      <p className="text-[#18181B] dark:text-[#EDEDEC]">{workspaceCommission.purpose}</p>
                    </div>
                  )}

                  {workspaceCommission.targetAudience && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                        Target Audience
                      </span>
                      <p className="text-[#18181B] dark:text-[#EDEDEC]">{workspaceCommission.targetAudience}</p>
                    </div>
                  )}

                  {workspaceCommission.preferredStyle && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                        Aesthetic Direction
                      </span>
                      <p className="text-[#18181B] dark:text-[#EDEDEC]">{workspaceCommission.preferredStyle}</p>
                    </div>
                  )}

                  {workspaceCommission.requiredDimensions && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                        Formats & Dimensions
                      </span>
                      <p className="font-mono text-[#18181B] dark:text-[#EDEDEC]">{workspaceCommission.requiredDimensions}</p>
                    </div>
                  )}
                </div>

                {workspaceCommission.preferredColors && workspaceCommission.preferredColors.length > 0 && (
                  <div className="pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1.5">
                      Brand Palette
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {workspaceCommission.preferredColors.map((color, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono text-[#18181B] dark:text-[#EDEDEC]">
                          {color.startsWith('#') && (
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: color }} />
                          )}
                          <span>{color}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {workspaceCommission.referenceLinks && workspaceCommission.referenceLinks.length > 0 && (
                  <div className="pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1.5">
                      Reference & Inspiration Links
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {workspaceCommission.referenceLinks.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono text-[#EA580C] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-xs">{link}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ======================================================== */
        /* LEVEL 1: FULL COMMISSION PIPELINE LEDGER                 */
        /* ======================================================== */
        <div className="space-y-6">
          
          {/* Top Filter and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-4 shadow-2xs">
            {/* Section Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['active', 'completed', 'cancelled', 'all'] as const).map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setCommissionSection(sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                    commissionSection === sec
                      ? 'bg-[#EA580C] text-white font-bold'
                      : 'bg-[#FAF9F6] dark:bg-[#18181B] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                  }`}
                >
                  {sec === 'all' ? 'All Records' : sec}
                </button>
              ))}
            </div>

            {/* Search Input & Stage Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search project, client, ref..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <select
                value={activeStageFilter}
                onChange={(e) => setActiveStageFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] focus:outline-none focus:border-[#EA580C] cursor-pointer"
              >
                <option value="all">All Stages</option>
                {COMMISSION_STAGES.map(s => (
                  <option key={s.number} value={s.number}>
                    Stage 0{s.number}: {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Commission List */}
          {filteredCommissions.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl space-y-2">
              <FolderArchive className="w-8 h-8 text-[#EA580C] mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">No commissions found</p>
              <p>Try adjusting your search criteria or filter pills.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCommissions.map(comm => {
                const stageInfo = COMMISSION_STAGES.find(s => s.number === (comm.currentStage || 1));

                return (
                  <article
                    key={comm.id}
                    className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs hover:border-[#D4D2CA] dark:hover:border-[#333338] transition-all"
                  >
                    {/* Top Row: Client Info, Project Title & Status Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#222225]">
                      <div className="flex items-start gap-3.5">
                        <img
                          src={comm.clientAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                          alt={comm.clientName || 'Client'}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-[#E4E2DC] dark:ring-[#222225] shrink-0"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC]">
                              {comm.projectName}
                            </h3>
                            <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                              #{comm.id.slice(0, 8)}
                            </span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-[#EA580C] font-semibold uppercase">
                              {comm.serviceType}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
                            <span>Client: <strong className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{comm.clientName}</strong></span>
                            <span>·</span>
                            <span 
                              onClick={() => handleCopyEmail(comm.id, comm.clientEmail || '')}
                              className="hover:underline cursor-pointer flex items-center gap-1"
                              title="Copy email"
                            >
                              <span>{comm.clientEmail}</span>
                              {copiedEmailId === comm.id ? (
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-50" />
                              )}
                            </span>
                            <span>·</span>
                            <span>Budget: <strong className="text-[#18181B] dark:text-[#EDEDEC]">{comm.budget}</strong></span>
                            <span>·</span>
                            <span>Due: {formatCommissionDate(comm.deadline)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown controls */}
                      <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                        <select
                          value={comm.status}
                          disabled={statusUpdatingId === comm.id}
                          onChange={(e) => handleStatusChange(comm.id, e.target.value as CommissionStatus)}
                          className="bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-md px-2.5 py-1 text-xs font-mono text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={(comm.priority || 'normal').toLowerCase()}
                          disabled={priorityUpdatingId === comm.id}
                          onChange={(e) => handlePriorityChange(comm.id, e.target.value as CommissionPriority)}
                          className="bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-md px-2.5 py-1 text-xs font-mono text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
                        >
                          {PRIORITY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Pending Acceptance Notification */}
                    {(comm.status === 'pending' || (comm.status as string) === 'Request Submitted') && (
                      <div className="p-3.5 bg-orange-500/10 border border-[#EA580C]/40 rounded-lg flex items-center justify-between gap-3 text-xs">
                        <span className="text-[#18181B] dark:text-[#EDEDEC] font-mono">
                          New intake proposal submitted. Approve to commence project lifecycle.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => acceptCommission(comm.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Accept Commission
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeclineTargetCommission(comm)}
                            className="px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-[#71717A] hover:text-red-600 text-xs transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 8-Stage Interactive Milestone Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#EA580C] font-semibold">
                          Stage 0{comm.currentStage || 1} of 08 · {stageInfo?.name || 'Production'}
                        </span>
                        <span className="text-[#71717A] dark:text-[#A1A1AA]">
                          Progress {comm.progress}%
                        </span>
                      </div>
                      <ProgressBar commission={comm} interactiveAdmin={true} />
                    </div>

                    {/* Footer: Dedicated Workspace Action & Settlement Toggles */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E4E2DC] dark:border-[#222225] text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminWorkspaceCommissionId(comm.id);
                          setAdminWorkspaceTab('proofs');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#EA580C] hover:underline cursor-pointer"
                      >
                        <span>Open Dedicated Workspace (Proofs & Deliverables)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA]">
                            Payment:
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            comm.paymentStatus === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : comm.paymentStatus === 'Partial'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                          }`}>
                            {comm.paymentStatus || 'Unpaid'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToPayments) {
                              onNavigateToPayments(comm.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium text-[#EA580C] hover:text-[#D94814] bg-[#FAF9F6] dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#222225] border border-[#E4E2DC] dark:border-[#222225] transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] btn-tactile"
                          title={`Review payment records for ${comm.projectName}`}
                        >
                          <span>Review Receipt in Payments Hub</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Decline Confirmation Modal */}
      {declineTargetCommission && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                  Decline Commission Proposal?
                </h4>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  Are you sure you want to decline "{declineTargetCommission.projectName}" from {declineTargetCommission.clientName}? The commission status will transition to Cancelled.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeclineTargetCommission(null)}
                className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  declineCommission(declineTargetCommission.id);
                  setDeclineTargetCommission(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-semibold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
