import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  CheckCheck,
  MoreVertical,
  Trash2
} from 'lucide-react';

interface CommissionManagementProps {
  initialFilter?: 'active' | 'completed' | 'cancelled' | 'all';
  initialCommissionId?: string | null;
  initialWorkspaceTab?: 'proofs' | 'deliverables' | 'payments' | 'specifications';
  selectedCommissionId?: string;
  onSelectCommission?: (commissionId: string) => void;
  onSelectCommissionForChat?: (commissionId: string) => void;
  onOpenChat?: (commissionId: string) => void;
  onNavigateToPayments?: (commissionId: string) => void;
}

export const CommissionManagement: React.FC<CommissionManagementProps> = ({
  initialFilter = 'active',
  initialCommissionId = null,
  initialWorkspaceTab = 'proofs',
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
    updatePaymentStatus,
    acceptCommission,
    declineCommission,
    deleteCommission,
    setActiveCommissionId,
    setActiveView,
  } = useApp();

  const safeCommissions = commissions || [];

  // Navigation & Workspace state
  const [adminWorkspaceCommissionId, setAdminWorkspaceCommissionId] = useState<string | null>(
    selectedCommissionId || initialCommissionId
  );
  const [adminWorkspaceTab, setAdminWorkspaceTab] = useState<'proofs' | 'deliverables' | 'payments' | 'specifications'>(initialWorkspaceTab);

  // Keep adminWorkspaceCommissionId in sync if selectedCommissionId prop changes
  React.useEffect(() => {
    if (selectedCommissionId) {
      setAdminWorkspaceCommissionId(selectedCommissionId);
    }
  }, [selectedCommissionId]);

  React.useEffect(() => {
    if (initialWorkspaceTab) {
      setAdminWorkspaceTab(initialWorkspaceTab);
    }
  }, [initialWorkspaceTab]);
  
  // Filtering & search
  const [commissionSection, setCommissionSection] = useState<'active' | 'completed' | 'cancelled' | 'all'>(initialFilter);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Status & Priority update feedback
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusSuccessId, setStatusSuccessId] = useState<string | null>(null);
  const [priorityUpdatingId, setPriorityUpdatingId] = useState<string | null>(null);

  // Decline & Remove confirmation dialog state
  const [declineTargetCommission, setDeclineTargetCommission] = useState<Commission | null>(null);
  const [deleteTargetCommission, setDeleteTargetCommission] = useState<Commission | null>(null);
  const [isDeletingCommission, setIsDeletingCommission] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [openMenuCommissionId, setOpenMenuCommissionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!openMenuCommissionId) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(`[data-commission-menu="${openMenuCommissionId}"]`)) {
        setOpenMenuCommissionId(null);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openMenuCommissionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openMenuCommissionId) {
          setOpenMenuCommissionId(null);
        }
        if (declineTargetCommission) {
          setDeclineTargetCommission(null);
        }
        if (deleteTargetCommission && !isDeletingCommission) {
          setDeleteTargetCommission(null);
          setDeleteError(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [declineTargetCommission, deleteTargetCommission, isDeletingCommission, openMenuCommissionId]);

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
    setActionError(null);
    try {
      const res = await updateCommissionStatus(commissionId, newStatus);
      if (res && !res.success) {
        setActionError(res.error || 'Failed to update commission status.');
        return;
      }
      setStatusSuccessId(commissionId);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setStatusSuccessId(null), 3000);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handlePriorityChange = async (commissionId: string, newPriority: CommissionPriority) => {
    setPriorityUpdatingId(commissionId);
    setActionError(null);
    try {
      const res = await updateCommissionPriority(commissionId, newPriority);
      if (res && !res.success) {
        setActionError(res.error || 'Failed to update commission priority.');
      }
    } finally {
      setPriorityUpdatingId(null);
    }
  };

  const handleCopyEmail = async (id: string, email: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmailId(id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedEmailId(null), 2000);
    } catch {
      // Clipboard API may be blocked in restricted iframe contexts
    }
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
  }, [safeCommissions, commissionSection, activeStageFilter, searchQuery]);

  const workspaceCommission = useMemo(() => {
    if (!adminWorkspaceCommissionId) return null;
    return safeCommissions.find(c => c.id === adminWorkspaceCommissionId) || null;
  }, [safeCommissions, adminWorkspaceCommissionId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {actionError && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
            className="text-red-500 hover:text-red-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* LEVEL 2: DEDICATED ADMIN COMMISSION WORKSPACE            */}
      {/* ======================================================== */}
      {adminWorkspaceCommissionId && workspaceCommission ? (
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
            <button
              type="button"
              onClick={() => {
                setAdminWorkspaceCommissionId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-hairline bg-surface hover:bg-surface-secondary text-xs font-mono font-medium text-graphite hover:text-carbon transition-colors cursor-pointer self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-accent" />
              <span>Back to Commission Pipeline</span>
            </button>

            <div className="flex items-center gap-2 font-mono text-xs text-graphite">
              <span>Active Workspace:</span>
              <strong className="text-carbon">
                {workspaceCommission.projectName}
              </strong>
              <span>(#{workspaceCommission.id.slice(0, 8)})</span>
            </div>
          </div>

          {/* Commission Header Card */}
          <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-hairline">
              <div className="flex items-start gap-4">
                <img
                  src={workspaceCommission.clientAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                  alt={workspaceCommission.clientName || 'Client Avatar'}
                  className="w-12 h-12 rounded-full object-cover ring-1 ring-hairline shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-2xl font-bold text-carbon">
                      {workspaceCommission.projectName}
                    </h2>
                    <span className="font-mono text-xs text-graphite">
                      #{workspaceCommission.id.slice(0, 8)}
                    </span>
                    <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-surface-secondary border border-hairline text-accent font-semibold uppercase">
                      {workspaceCommission.serviceType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-graphite flex-wrap">
                    <span>Client: <strong className="text-carbon font-semibold">{workspaceCommission.clientName}</strong></span>
                    <span>·</span>
                    <span>{workspaceCommission.clientEmail}</span>
                    <span>·</span>
                    <span>Budget: <strong className="text-carbon">{workspaceCommission.budget}</strong></span>
                    <span>·</span>
                    <span>Deadline: {formatCommissionDate(workspaceCommission.deadline)}</span>
                  </div>
                </div>
              </div>

              {/* Status, Priority & Chat Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <label htmlFor={`workspace-status-${workspaceCommission.id}`} className="text-[10px] uppercase text-graphite">
                    Status:
                  </label>
                  <select
                    id={`workspace-status-${workspaceCommission.id}`}
                    value={workspaceCommission.status}
                    disabled={statusUpdatingId === workspaceCommission.id}
                    onChange={(e) => handleStatusChange(workspaceCommission.id, e.target.value as CommissionStatus)}
                    className="bg-surface-secondary border border-hairline rounded-xl px-2.5 py-1.5 text-xs text-carbon focus:outline-none focus:border-accent cursor-pointer"
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
                  <label htmlFor={`workspace-priority-${workspaceCommission.id}`} className="text-[10px] uppercase text-graphite">
                    Priority:
                  </label>
                  <select
                    id={`workspace-priority-${workspaceCommission.id}`}
                    value={(workspaceCommission.priority || 'normal').toLowerCase()}
                    disabled={priorityUpdatingId === workspaceCommission.id}
                    onChange={(e) => handlePriorityChange(workspaceCommission.id, e.target.value as CommissionPriority)}
                    className="bg-surface-secondary border border-hairline rounded-xl px-2.5 py-1.5 text-xs text-carbon focus:outline-none focus:border-accent cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-hairline text-xs font-mono text-graphite hover:text-carbon hover:bg-surface-secondary transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-accent" />
                  <span>Client Chat</span>
                </button>

                {/* 3-Dots Commission Actions Menu */}
                <div className="relative" data-commission-menu={`workspace-${workspaceCommission.id}`}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuCommissionId((prev) =>
                        prev === `workspace-${workspaceCommission.id}` ? null : `workspace-${workspaceCommission.id}`
                      )
                    }
                    aria-label={`More actions for ${workspaceCommission.projectName}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuCommissionId === `workspace-${workspaceCommission.id}`}
                    title="More actions"
                    className="p-1.5 rounded-full border border-hairline bg-surface-secondary text-graphite hover:text-carbon hover:border-accent transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuCommissionId === `workspace-${workspaceCommission.id}` && (
                    <div
                      role="menu"
                      aria-label={`Actions for ${workspaceCommission.projectName}`}
                      className="absolute right-0 top-full mt-1.5 z-30 min-w-[185px] bg-surface border border-hairline rounded-2xl shadow-lg py-1.5 animate-in fade-in duration-100"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuCommissionId(null);
                          setDeleteError(null);
                          setDeleteTargetCommission(workspaceCommission);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Commission</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 8-Stage Interactive Milestone Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-graphite">
                  Stage 0{workspaceCommission.currentStage || 1} of 08 · {COMMISSION_STAGES.find(s => s.number === (workspaceCommission.currentStage || 1))?.name}
                </span>
                <span className="font-bold text-accent">
                  Click any milestone below to update production stage ({workspaceCommission.progress}%)
                </span>
              </div>
              <ProgressBar commission={workspaceCommission} interactiveAdmin={true} />
            </div>

            {/* Settlement Status Row (Read-Only Display + Review Navigation) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-hairline text-xs font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-graphite">GCash Settlement Status:</span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono ${
                  workspaceCommission.paymentStatus === 'Paid'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : workspaceCommission.paymentStatus === 'Partial'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                }`}>
                  {workspaceCommission.paymentStatus || 'Unpaid'}
                </span>
                {workspaceCommission.totalPaid && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Total Paid
                  </span>
                )}
                {workspaceCommission.depositPaid && !workspaceCommission.totalPaid && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-secondary hover:bg-surface border border-hairline text-xs font-mono text-accent hover:opacity-85 transition-colors cursor-pointer self-start sm:self-auto focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
                title="Review GCash receipts in Payments & Verification Hub"
              >
                <span>Review Receipt in Payments Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dedicated Commission Sub-Tabs */}
          <nav className="flex items-center gap-2 border-b border-hairline pb-3 overflow-x-auto no-scrollbar" aria-label="Commission workspace sections">
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
                  className={`relative px-4 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 rounded-full ${
                    isSelected
                      ? 'bg-accent text-white font-bold shadow-xs'
                      : 'bg-surface-secondary text-graphite hover:text-carbon border border-hairline'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{label}</span>
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
              commissions={safeCommissions}
              currentUser={currentUser}
              selectedCommissionId={workspaceCommission.id}
              onPaymentConfirmed={async (commissionId, targetStatus) => {
                await updatePaymentStatus(commissionId, targetStatus);
              }}
            />
          )}

          {/* Sub-Tab 4: Specifications & Brief */}
          {adminWorkspaceTab === 'specifications' && (
            <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="space-y-1 pb-4 border-b border-hairline">
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold block">
                  Original Client Request
                </span>
                <h3 className="font-display text-xl font-bold text-carbon">
                  Creative Brief & Scope Directives
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block mb-1">
                    Project Scope & Requirements
                  </span>
                  <p className="text-carbon leading-relaxed bg-surface-secondary p-4 rounded-2xl border border-hairline whitespace-pre-line">
                    {workspaceCommission.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {workspaceCommission.purpose && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block mb-1">
                        Purpose & Context
                      </span>
                      <p className="text-carbon">{workspaceCommission.purpose}</p>
                    </div>
                  )}

                  {workspaceCommission.targetAudience && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block mb-1">
                        Target Audience
                      </span>
                      <p className="text-carbon">{workspaceCommission.targetAudience}</p>
                    </div>
                  )}

                  {workspaceCommission.preferredStyle && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block mb-1">
                        Aesthetic Direction
                      </span>
                      <p className="text-carbon">{workspaceCommission.preferredStyle}</p>
                    </div>
                  )}

                  {workspaceCommission.requiredDimensions && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block mb-1">
                        Formats & Dimensions
                      </span>
                      <p className="font-mono text-carbon">{workspaceCommission.requiredDimensions}</p>
                    </div>
                  )}
                </div>

                {workspaceCommission.preferredColors && workspaceCommission.preferredColors.length > 0 && (
                  <div className="pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block mb-1.5">
                      Brand Palette
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {workspaceCommission.preferredColors.map((color, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary border border-hairline text-xs font-mono text-carbon">
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
                    <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block mb-1.5">
                      Reference & Inspiration Links
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {workspaceCommission.referenceLinks.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary border border-hairline text-xs font-mono text-accent hover:underline"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-hairline rounded-3xl p-4 shadow-2xs">
            {/* Section Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['active', 'completed', 'cancelled', 'all'] as const).map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setCommissionSection(sec)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                    commissionSection === sec
                      ? 'bg-accent text-white font-bold'
                      : 'bg-surface-secondary text-graphite hover:text-carbon'
                  }`}
                >
                  {sec === 'all' ? 'All Records' : sec}
                </button>
              ))}
            </div>

            {/* Search Input & Stage Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-graphite absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search project, client, ref..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-secondary border border-hairline text-xs font-mono text-carbon focus:outline-none focus:border-accent"
                />
              </div>

              <select
                value={activeStageFilter}
                onChange={(e) => setActiveStageFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-hairline text-xs font-mono text-graphite focus:outline-none focus:border-accent cursor-pointer"
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
            <div className="p-12 text-center text-xs font-mono text-graphite bg-surface border border-hairline rounded-3xl space-y-2">
              <FolderArchive className="w-8 h-8 text-accent mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-carbon">No commissions found</p>
              <p>Try adjusting your search criteria or filter pills.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCommissions.map(comm => {
                const stageInfo = COMMISSION_STAGES.find(s => s.number === (comm.currentStage || 1));

                return (
                  <article
                    key={comm.id}
                    className="bg-surface border border-hairline rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs hover:border-accent/40 transition-all"
                  >
                    {/* Top Row: Client Info, Project Title & Status Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-hairline">
                      <div className="flex items-start gap-3.5">
                        <img
                          src={comm.clientAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                          alt={comm.clientName || 'Client'}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-hairline shrink-0"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-bold text-lg text-carbon">
                              {comm.projectName}
                            </h3>
                            <span className="font-mono text-xs text-graphite">
                              #{comm.id.slice(0, 8)}
                            </span>
                            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-surface-secondary border border-hairline text-accent font-semibold uppercase">
                              {comm.serviceType}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-graphite flex-wrap">
                            <span>Client: <strong className="text-carbon font-semibold">{comm.clientName}</strong></span>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(comm.id, comm.clientEmail || '')}
                              className="hover:underline cursor-pointer flex items-center gap-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded"
                              title="Copy email"
                              aria-label={`Copy client email ${comm.clientEmail || ''}`}
                            >
                              <span>{comm.clientEmail}</span>
                              {copiedEmailId === comm.id ? (
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-50" />
                              )}
                            </button>
                            <span>·</span>
                            <span>Budget: <strong className="text-carbon">{comm.budget}</strong></span>
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
                          className="bg-surface-secondary border border-hairline rounded-xl px-2.5 py-1.5 text-xs font-mono text-carbon focus:outline-none focus:border-accent cursor-pointer"
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
                          className="bg-surface-secondary border border-hairline rounded-xl px-2.5 py-1.5 text-xs font-mono text-carbon focus:outline-none focus:border-accent cursor-pointer"
                        >
                          {PRIORITY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {/* 3-Dots Commission Actions Menu */}
                        <div className="relative" data-commission-menu={comm.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuCommissionId((prev) => (prev === comm.id ? null : comm.id))
                            }
                            aria-label={`More actions for ${comm.projectName}`}
                            aria-haspopup="menu"
                            aria-expanded={openMenuCommissionId === comm.id}
                            title="More actions"
                            className="p-1.5 rounded-xl bg-surface-secondary border border-hairline text-graphite hover:text-carbon hover:border-accent transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuCommissionId === comm.id && (
                            <div
                              role="menu"
                              aria-label={`Actions for ${comm.projectName}`}
                              className="absolute right-0 top-full mt-1.5 z-30 min-w-[185px] bg-surface border border-hairline rounded-2xl shadow-lg py-1.5 animate-in fade-in duration-100"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuCommissionId(null);
                                  setAdminWorkspaceCommissionId(comm.id);
                                  setAdminWorkspaceTab('proofs');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-medium text-carbon hover:bg-surface-secondary flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-graphite" />
                                <span>Open Workspace</span>
                              </button>
                              <div className="my-1 border-t border-hairline" />
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuCommissionId(null);
                                  setDeleteError(null);
                                  setDeleteTargetCommission(comm);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Commission</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pending Acceptance Notification */}
                    {(comm.status === 'pending' || (comm.status as string) === 'Request Submitted') && (
                      <div className="p-4 bg-sky-500/10 border border-accent/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <span className="text-carbon font-mono">
                          New intake proposal submitted. Approve to commence project lifecycle.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              setActionError(null);
                              const res = await acceptCommission(comm.id);
                              if (res && !res.success) {
                                setActionError(res.error || 'Failed to accept commission.');
                              }
                            }}
                            className="px-4 py-1.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Accept Commission
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeclineTargetCommission(comm)}
                            className="px-4 py-1.5 rounded-full border border-hairline text-graphite hover:text-red-600 text-xs transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 8-Stage Interactive Milestone Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-accent font-semibold">
                          Stage 0{comm.currentStage || 1} of 08 · {stageInfo?.name || 'Production'}
                        </span>
                        <span className="text-graphite">
                          Progress {comm.progress}%
                        </span>
                      </div>
                      <ProgressBar commission={comm} interactiveAdmin={true} />
                    </div>

                    {/* Footer: Dedicated Workspace Action & Settlement Toggles */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-hairline text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminWorkspaceCommissionId(comm.id);
                          setAdminWorkspaceTab('proofs');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-accent hover:underline cursor-pointer"
                      >
                        <span>Open Dedicated Workspace (Proofs & Deliverables)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-[10px] uppercase text-graphite">
                            Payment:
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
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
                            } else {
                              setAdminWorkspaceCommissionId(comm.id);
                              setAdminWorkspaceTab('payments');
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono font-medium text-accent hover:opacity-85 bg-surface-secondary hover:bg-surface border border-hairline transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
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
          onClick={() => setDeclineTargetCommission(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-hairline rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-base text-carbon">
                  Decline Commission Proposal?
                </h4>
                <p className="text-xs text-graphite leading-relaxed">
                  Are you sure you want to decline "{declineTargetCommission.projectName}" from {declineTargetCommission.clientName}? The commission status will transition to Cancelled.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeclineTargetCommission(null)}
                className="px-4 py-2 rounded-full border border-hairline text-xs font-mono text-graphite hover:text-carbon cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = declineTargetCommission.id;
                  setDeclineTargetCommission(null);
                  const res = await declineCommission(targetId);
                  if (res && !res.success) {
                    setActionError(res.error || 'Failed to decline commission.');
                  }
                }}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-semibold cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Commission Confirmation Modal */}
      {deleteTargetCommission && (
        <div
          onClick={() => {
            if (!isDeletingCommission) {
              setDeleteTargetCommission(null);
              setDeleteError(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-commission-modal-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-hairline rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4
                  id="remove-commission-modal-title"
                  className="font-display font-bold text-base text-carbon"
                >
                  Remove Commission?
                </h4>
                <p className="text-xs text-graphite leading-relaxed">
                  Are you sure you want to permanently remove{' '}
                  <strong className="text-carbon">"{deleteTargetCommission.projectName}"</strong>{' '}
                  <span className="font-mono">(#{deleteTargetCommission.id.slice(0, 8)})</span>? This
                  action cannot be undone and removes its associated milestones, messages, proofs, and
                  payment records.
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingCommission}
                onClick={() => {
                  setDeleteTargetCommission(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-full border border-hairline text-xs font-mono text-graphite hover:text-carbon cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCommission}
                onClick={async () => {
                  const targetId = deleteTargetCommission.id;
                  setIsDeletingCommission(true);
                  setDeleteError(null);
                  setActionError(null);
                  try {
                    const res = await deleteCommission(targetId);
                    if (res && !res.success) {
                      setDeleteError(res.error || 'Failed to remove commission.');
                      return;
                    }
                    setDeleteTargetCommission(null);
                    setDeleteError(null);
                    if (adminWorkspaceCommissionId === targetId) {
                      setAdminWorkspaceCommissionId(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  } finally {
                    setIsDeletingCommission(false);
                  }
                }}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-semibold cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingCommission ? 'Removing...' : 'Remove Commission'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
