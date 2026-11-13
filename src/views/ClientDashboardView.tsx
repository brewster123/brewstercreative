import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressTimeline } from '../components/ProgressTimeline';
import { ClientReviewSection } from '../components/ClientReviewSection';
import { FinalDeliverySection } from '../components/FinalDeliverySection';
import { ClientPaymentVerificationCard } from '../components/ClientPaymentVerificationCard';
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader';
import { ProjectChatDrawer } from '../components/ProjectChatDrawer';
import { ChatWindow } from '../components/ChatWindow';
import { formatCommissionDate } from '../utils/dateUtils';
import { fetchCommissionProofs } from '../lib/proofs';
import { CommissionProof, COMMISSION_STAGES } from '../types';
import { 
  Clock, 
  Calendar, 
  RotateCcw, 
  FileText, 
  PlusCircle,
  Eye,
  Check,
  FolderArchive,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Settings,
  CreditCard,
  Search,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const ClientDashboardView: React.FC = () => {
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

  const getStatusBadgeClasses = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    }
    if (s.includes('revision')) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
    if (s.includes('progress')) {
      return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    }
    if (s.includes('accepted')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    }
    if (s.includes('review')) {
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    }
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  };

  const getPaymentBadgeClasses = (paymentStatus: string | undefined) => {
    if (paymentStatus === 'Paid') {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
    }
    if (paymentStatus === 'Partial') {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
    }
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700';
  };

  const { 
    currentUserCommissions = [], 
    activeCommission, 
    setActiveCommissionId, 
    setActiveView,
    currentUser,
    authLoading,
    updateUserProfile,
    studioProfile,
    timelineUpdates = [],
    activeDashboardTab,
    messages = [],
  } = useApp();

  const commission = activeCommission || (currentUserCommissions && currentUserCommissions.length > 0 ? currentUserCommissions[0] : undefined);
  const [proofs, setProofs] = useState<CommissionProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState<boolean>(false);

  // Two-level dashboard navigation state
  type WorkspaceTab = 'overview' | 'messages' | 'payments' | 'proofs' | 'milestones' | 'delivery' | 'profile';
  const [viewMode, setViewMode] = useState<'overview' | 'workspace'>('overview');
  const [overviewFilter, setOverviewFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);

  // Sync activeTab and viewMode when deep-linking from notifications
  useEffect(() => {
    if (activeDashboardTab) {
      if (activeDashboardTab === 'chat' || activeDashboardTab === 'messages') {
        setActiveTab('messages');
        setViewMode('workspace');
        return;
      }
      if (
        activeDashboardTab === 'payment' ||
        activeDashboardTab === 'deposit' ||
        activeDashboardTab === 'payments'
      ) {
        setActiveTab('payments');
        setViewMode('workspace');
      } else if (activeDashboardTab === 'review' || activeDashboardTab === 'proofs') {
        setActiveTab('proofs');
        setViewMode('workspace');
      } else if (activeDashboardTab === 'timeline' || activeDashboardTab === 'milestones') {
        setActiveTab('milestones');
        setViewMode('workspace');
      } else if (activeDashboardTab === 'delivery') {
        setActiveTab('delivery');
        setViewMode('workspace');
      } else if (activeDashboardTab === 'profile') {
        setActiveTab('profile');
        setViewMode('workspace');
      } else {
        setActiveTab('overview');
      }
    }
  }, [activeDashboardTab, setActiveView]);

  // Fetch creative proofs for active commission
  const loadDashboardProofs = useCallback(async () => {
    if (!commission?.id) {
      setProofs([]);
      return;
    }
    setLoadingProofs(true);
    try {
      const { data, error } = await fetchCommissionProofs(commission.id);
      if (!error && data) {
        setProofs(data);
      } else if (error) {
        console.warn('[ClientDashboardView] Notice fetching proofs:', error);
      }
    } catch (err) {
      console.error('[ClientDashboardView] Exception fetching proofs:', err);
    } finally {
      setLoadingProofs(false);
    }
  }, [commission?.id]);

  useEffect(() => {
    if (commission?.id && !authLoading) {
      loadDashboardProofs();
    }
  }, [
    loadDashboardProofs,
    commission?.id,
    commission?.updatedAt,
    commission?.status,
    commission?.currentStage,
    currentUser?.id,
    authLoading,
    activeTab,
  ]);

  // Client profile editing state
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileHandle, setProfileHandle] = useState(currentUser?.handle || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileContact, setProfileContact] = useState(currentUser?.contactMethod || 'Platform Chat & Email');
  const [profileBio, setProfileBio] = useState(currentUser?.bio || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  React.useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfileHandle(currentUser.handle || '');
      setProfilePhone(currentUser.phone || '');
      setProfileContact(currentUser.contactMethod || 'Platform Chat & Email');
      setProfileBio(currentUser.bio || '');
      setProfileAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateUserProfile(currentUser.id, {
      name: profileName,
      handle: profileHandle,
      phone: profilePhone,
      contactMethod: profileContact,
      bio: profileBio,
      avatar: profileAvatar || currentUser.avatar,
    });

    setProfileSavedMsg('Your personal client profile has been updated.');
    setTimeout(() => setProfileSavedMsg(''), 4000);
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3 animate-in fade-in duration-300">
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-center justify-center mx-auto text-[#71717A] dark:text-[#A1A1AA]">
          <UserIcon className="w-5 h-5" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Private Studio Workspace
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            Sign in with your client account to inspect project sheets, review design proofs, and converse directly with DESTALION.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('auth')}
            className="px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-all cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveView('commission-form')}
            className="px-6 py-2.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-[#18181B] dark:text-[#EDEDEC] font-semibold text-xs hover:bg-[#FAF9F6] dark:hover:bg-[#18181B] transition-all cursor-pointer"
          >
            Start a Commission
          </button>
        </div>
      </div>
    );
  }

  if (currentUserCommissions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-center justify-center mx-auto text-[#EA580C]">
          <FolderArchive className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            No commissions yet
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            Your commissioned projects will appear here once initiated. Start your first bespoke design commission with DESTALION.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('commission-form')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Request a Commission</span>
        </button>
      </div>
    );
  }

  // Filter commissions for Overview list
  const filteredCommissions = currentUserCommissions.filter(c => {
    if (overviewFilter === 'active') {
      const s = (c.status || '').toLowerCase();
      return !s.includes('completed') && !s.includes('cancelled') && !s.includes('rejected');
    }
    if (overviewFilter === 'completed') {
      const s = (c.status || '').toLowerCase();
      return s.includes('completed');
    }
    return true;
  }).filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.projectName || '').toLowerCase().includes(q) ||
      (c.serviceType || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q)
    );
  });

  const activeCount = currentUserCommissions.filter(c => {
    const s = (c.status || '').toLowerCase();
    return !s.includes('completed') && !s.includes('cancelled') && !s.includes('rejected');
  }).length;
  const completedCount = currentUserCommissions.filter(c => (c.status || '').toLowerCase().includes('completed')).length;

  // Selected commission details (fallback to first project)
  const currentCommission = commission || currentUserCommissions[0];
  const isFinalDelivery = currentCommission.currentStage === 8 || currentCommission.status === 'Completed' || currentCommission.status === 'completed';
  const effectiveProofs = proofs && proofs.length > 0 ? proofs : (currentCommission.proofs || []);
  const latestProof = effectiveProofs.length > 0 ? effectiveProofs[0] : null;

  const stageNum = currentCommission.currentStage;
  const latestProofStatus = (latestProof?.status || '').toLowerCase().trim();

  const isProofPendingReview =
    !isFinalDelivery &&
    Boolean(latestProof) &&
    (latestProofStatus === 'pending_review' ||
      latestProofStatus === 'pending review' ||
      latestProofStatus === 'pending' ||
      (stageNum === 5 &&
        !latestProofStatus.includes('revision') &&
        latestProofStatus !== 'approved'));

  const currentStageInfo = COMMISSION_STAGES.find(s => s.number === (currentCommission?.currentStage || 1));
  const nextStageInfo = COMMISSION_STAGES.find(s => s.number === ((currentCommission?.currentStage || 1) + 1));

  // Payment conjunction security invariant
  const isPaymentSettled = currentUser?.role === 'admin' || (
    currentCommission?.paymentStatus === 'Paid' && currentCommission?.totalPaid === true
  );

  // Unread messages for active commission
  const unreadMessagesCount = useMemo(() => {
    if (!currentCommission?.id || !currentUser?.id) return 0;
    return messages.filter(
      m => m.commissionId === currentCommission.id && m.senderId !== currentUser.id && !m.read
    ).length;
  }, [messages, currentCommission?.id, currentUser?.id]);

  // Derived Action Required states
  const isDepositRequired = Boolean(
    currentCommission &&
    !currentCommission.depositPaid && 
    currentCommission.paymentStatus !== 'Paid' && 
    currentCommission.paymentStatus !== 'Partial' &&
    ((currentCommission.currentStage || 1) <= 2 || currentCommission.status === 'pending' || currentCommission.status === 'reviewing' || currentCommission.status === 'accepted')
  );

  const isBalancePending = Boolean(
    currentCommission &&
    (currentCommission.depositPaid || currentCommission.paymentStatus === 'Partial') && 
    currentCommission.paymentStatus !== 'Paid' && 
    !currentCommission.totalPaid && 
    ((currentCommission.currentStage || 1) >= 7 || currentCommission.status === 'final_approval' || isFinalDelivery)
  );

  const isDeliverablesLocked = Boolean(
    currentCommission &&
    isFinalDelivery && 
    !isPaymentSettled
  );

  // Derive highest-priority pending client action
  const pendingAction = useMemo(() => {
    if (!currentCommission) return null;
    if (isProofPendingReview) {
      return {
        type: 'proof' as const,
        title: `Creative Proof v${latestProof?.version || 1} Awaiting Review`,
        description: 'Your designer has published a high-resolution milestone proof. Please inspect the visual draft and submit your approval or revision directives.',
        actionLabel: 'Review Creative Proof',
        targetTab: 'proofs' as const,
      };
    }
    if (isDepositRequired) {
      return {
        type: 'deposit' as const,
        title: 'Initial Production Deposit Required',
        description: 'Submit your 50% GCash deposit receipt to commence conceptual art direction and vector drafting.',
        actionLabel: 'Submit Deposit Receipt',
        targetTab: 'payments' as const,
      };
    }
    if (isBalancePending || isDeliverablesLocked) {
      return {
        type: 'balance' as const,
        title: isDeliverablesLocked ? 'Final Deliverables Locked Pending Balance' : 'Final Balance Outstanding',
        description: isDeliverablesLocked 
          ? 'Final vector packages and commercial licenses are ready for release once remaining balance verification is complete.'
          : 'Creative work is complete. Settle the remaining balance via GCash to unlock final vector deliverables.',
        actionLabel: 'Settle Remaining Balance',
        targetTab: 'payments' as const,
      };
    }
    return null;
  }, [currentCommission, isProofPendingReview, isDepositRequired, isBalancePending, isDeliverablesLocked, latestProof?.version]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 animate-in fade-in duration-300">
      
      {/* ============================================================= */}
      {/* LEVEL 1: COMMISSION OVERVIEW                                  */}
      {/* ============================================================= */}
      {viewMode === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="border-b border-[#E4E2DC] dark:border-[#222225] pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {getGreeting()}, {currentUser.name}.
                </span>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  My Commissions
                </h1>
                <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] font-normal">
                  Select a commission to open its dedicated project workspace, review proofs, verify payments, and download deliverables.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Project Consultation</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 p-1 bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg">
              <button
                type="button"
                onClick={() => setOverviewFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  overviewFilter === 'all'
                    ? 'bg-white dark:bg-[#121214] text-[#EA580C] shadow-2xs font-bold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
              >
                All Projects ({currentUserCommissions.length})
              </button>
              <button
                type="button"
                onClick={() => setOverviewFilter('active')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  overviewFilter === 'active'
                    ? 'bg-white dark:bg-[#121214] text-[#EA580C] shadow-2xs font-bold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setOverviewFilter('completed')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  overviewFilter === 'completed'
                    ? 'bg-white dark:bg-[#121214] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            {currentUserCommissions.length > 2 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter commissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-[#18181B] dark:text-[#EDEDEC] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C]"
                />
              </div>
            )}
          </div>

          {/* Commission Cards Grid */}
          {filteredCommissions.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-[#E4E2DC] dark:border-[#222225] bg-white dark:bg-[#121214] space-y-3">
              <FolderArchive className="w-8 h-8 text-[#A1A1AA] mx-auto opacity-70" />
              <h4 className="font-display font-semibold text-base text-[#18181B] dark:text-[#EDEDEC]">
                {searchQuery ? 'No matching commissions' : 'No commissions in this view'}
              </h4>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Start a new project consultation with DESTALION.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCommissions.map((proj) => {
                const stageInfo = COMMISSION_STAGES.find(s => s.number === (proj.currentStage || 1));
                const updatedDate = proj.updatedAt
                  ? new Date(proj.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recently';
                const deadlineDate = proj.deadline ? formatCommissionDate(proj.deadline) : 'Scheduled with Studio';

                return (
                  <article
                    key={proj.id}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveCommissionId(proj.id);
                        setViewMode('workspace');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    onClick={() => {
                      setActiveCommissionId(proj.id);
                      setViewMode('workspace');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative p-6 sm:p-7 rounded-xl border border-[#E4E2DC] dark:border-[#222225] bg-white dark:bg-[#121214] hover:border-[#EA580C] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col gap-4 focus-visible:outline-2 focus-visible:outline-[#EA580C]"
                  >
                    {/* Top Meta Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E2DC]/60 dark:border-[#222225]/60">
                      <div className="flex items-center gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
                        <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Ref: #{proj.id.slice(0, 8)}</span>
                        <span>·</span>
                        <span className="text-[#EA580C] font-semibold">{proj.serviceType || proj.service}</span>
                        <span>·</span>
                        <span>Designer: {proj.assignedDesigner || studioProfile.designerName}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${getStatusBadgeClasses(proj.status)}`}>
                          Status: {formatCommissionStatus(proj.status)}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold ${getPaymentBadgeClasses(proj.paymentStatus)}`}>
                          {proj.paymentStatus === 'Paid' ? 'Paid in Full' : proj.paymentStatus === 'Partial' ? 'Deposit Paid' : 'Awaiting Deposit Verification'}
                        </span>
                      </div>
                    </div>

                    {/* Project Title and Stage Banner */}
                    <div className="space-y-2">
                      <h3 className="font-display text-xl sm:text-2xl font-black text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] transition-colors truncate">
                        {proj.projectName}
                      </h3>

                      <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-[#EA580C] uppercase tracking-wider">
                            Stage 0{proj.currentStage || 1} of 08 · {stageInfo?.name || 'Production'}
                          </span>
                          <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                            Progress {proj.progress}%
                          </span>
                        </div>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] line-clamp-1">
                          {stageInfo?.description || 'Applying client feedback and refining design assets'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-[#E4E2DC] dark:bg-[#222225] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#EA580C] transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(5, proj.progress))}%` }}
                      />
                    </div>

                    {/* Footer Meta Row & Action Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>Delivery: <strong className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{deadlineDate}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Activity: {updatedDate}</span>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EA580C] group-hover:bg-[#D94814] text-white font-semibold text-xs transition-colors self-start sm:self-auto shadow-2xs">
                        <span>View Commission</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* LEVEL 2: DEDICATED COMMISSION WORKSPACE                      */}
      {/* ============================================================= */}
      {viewMode === 'workspace' && currentCommission && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#222225]">
            <button
              type="button"
              onClick={() => {
                setViewMode('overview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#222225] bg-white dark:bg-[#18181B] hover:bg-[#FAF9F6] dark:hover:bg-[#121214] text-xs font-mono font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>← Back to My Commissions</span>
            </button>

            <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] hidden sm:inline">
              My Commissions / #{currentCommission.id.slice(0, 8)}
            </span>
          </div>

          {/* Active Project Sheet Header */}
          <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-6 border-b border-[#E4E2DC] dark:border-[#222225]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider flex-wrap">
                  <span>Ref: #{currentCommission.id.slice(0, 8)}</span>
                  <span>·</span>
                  <span className="text-[#EA580C] font-semibold">{currentCommission.serviceType}</span>
                  <span>·</span>
                  <span>Designer: {currentCommission.assignedDesigner || studioProfile.designerName}</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  {currentCommission.projectName}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Status:</span>
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{formatCommissionStatus(currentCommission.status)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChatDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#EA580C]/40 bg-orange-500/10 hover:bg-orange-500/20 text-[#EA580C] text-xs font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
                  title="Open Project Chat Drawer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Project Chat</span>
                  {unreadMessagesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#EA580C] text-white text-[10px] font-mono">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Stage Info Callout */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#EA580C] uppercase tracking-wider">
                  Stage 0{currentCommission.currentStage || 1} of 08 · {currentStageInfo?.name || 'Production'}
                </span>
                <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  Progress {currentCommission.progress}%
                </span>
              </div>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                {currentStageInfo?.description || 'Applying client feedback and refining design assets'}
              </p>
            </div>

            {/* 8-Stage Production Timeline Component */}
            <ProgressBar commission={currentCommission} interactiveAdmin={false} />
          </div>

          {/* Pinned Action-Required Contextual Bar */}
          {pendingAction && (
            <div className="p-5 rounded-xl border-2 border-[#EA580C] bg-gradient-to-r from-orange-500/10 via-[#FAF9F6] to-white dark:via-[#18181B] dark:to-[#121214] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-bold block">
                    Action Required
                  </span>
                  <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                    {pendingAction.title}
                  </h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xl leading-relaxed">
                    {pendingAction.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(pendingAction.targetTab)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold font-mono uppercase tracking-wider shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>{pendingAction.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Consolidated Workspace Navigation Bar */}
          <nav className="flex items-center gap-2 border-b border-[#E4E2DC] dark:border-[#222225] pb-1 overflow-x-auto no-scrollbar" aria-label="Project details navigation">
            {[
              { id: 'overview' as const, label: 'Overview', icon: FileText },
              { 
                id: 'messages' as const, 
                label: 'Messages', 
                icon: MessageSquare, 
                count: unreadMessagesCount > 0 ? unreadMessagesCount : undefined 
              },
              { 
                id: 'payments' as const, 
                label: 'Payments & Receipts', 
                icon: CreditCard, 
                count: currentCommission.paymentStatus !== 'Paid' 
                  ? (currentCommission.paymentStatus === 'Partial' ? 'Balance' : 'Deposit') 
                  : undefined 
              },
              { 
                id: 'proofs' as const, 
                label: 'Files & Creative Proofs', 
                icon: Eye, 
                count: isProofPendingReview ? 'Action' : (effectiveProofs.length > 0 ? effectiveProofs.length : undefined) 
              },
              { id: 'milestones' as const, label: 'Milestones', icon: Clock },
              { 
                id: 'delivery' as const, 
                label: 'Final Deliverables', 
                icon: FolderArchive, 
                count: isFinalDelivery ? 'Ready' : undefined 
              },
              { id: 'profile' as const, label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: TabIcon, count }) => {
              const isSelected = activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`relative px-3.5 py-2 min-h-[44px] text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded-lg ${
                    isSelected
                      ? 'text-[#18181B] dark:text-[#EDEDEC] font-bold'
                      : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {count && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EA580C] text-white">
                      {count}
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#EA580C] rounded-full animate-in fade-in duration-200" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* Three Core Questions Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. What is happening with my project? */}
                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                      Current Production Status
                    </span>
                    <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                      Stage 0{currentCommission.currentStage || 1} · {currentStageInfo?.name || 'In Production'}
                    </h4>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                      {currentStageInfo?.description || 'Active vector drafting and aesthetic development underway.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#222225] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Deadline:</span>
                    <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{formatCommissionDate(currentCommission.deadline)}</span>
                  </div>
                </div>

                {/* 2. What does the designer need from me? */}
                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                      Required Client Action
                    </span>
                    {pendingAction ? (
                      <>
                        <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                          {pendingAction.title}
                        </h4>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed line-clamp-2">
                          {pendingAction.description}
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-display font-bold text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>No Actions Pending</span>
                        </h4>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                          All client approvals and receipts are in order. The studio is working on your creative assets.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#222225]">
                    {pendingAction ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab(pendingAction.targetTab)}
                        className="text-xs font-mono font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{pendingAction.actionLabel} →</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                        ✓ All requirements satisfied
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. What happens next? */}
                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                      Next Milestone Roadmap
                    </span>
                    {nextStageInfo ? (
                      <>
                        <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                          Stage 0{nextStageInfo.number} · {nextStageInfo.name}
                        </h4>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed line-clamp-2">
                          {nextStageInfo.description}
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                          Final Delivery & Archive
                        </h4>
                        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                          All milestone stages completed. Vector master files and production packages released.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#222225]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('milestones')}
                      className="text-xs font-mono font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Full Milestones Log →</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Editorial Ledger of Project Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                    Delivery Window
                  </span>
                  <p className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                    {formatCommissionDate(currentCommission.deadline)}
                  </p>
                  <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    Target completion schedule
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                    Investment & Settlement
                  </span>
                  <p className="font-mono font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                    {currentCommission.budget}
                  </p>
                  <div className="pt-0.5">
                    {currentCommission.paymentStatus === 'Paid' ? (
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">✓ Settled in Full</span>
                    ) : currentCommission.paymentStatus === 'Partial' ? (
                      <div className="space-y-1">
                        <span className="block text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] font-medium">
                          50% Deposit Received · Balance Pending
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('payments')}
                          className="text-[11px] font-mono text-[#EA580C] hover:underline text-left block font-semibold cursor-pointer"
                        >
                          Submit Final Balance GCash Receipt →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="block text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] font-medium">
                          Awaiting Deposit Verification
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('payments')}
                          className="text-[11px] font-mono text-[#EA580C] hover:underline text-left block font-semibold cursor-pointer"
                        >
                          Submit GCash Deposit Receipt →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                    Revision Allowance
                  </span>
                  <p className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                    {currentCommission.revisionsUsed || 0} used / {currentCommission.revisionsAllowed || 2} included
                  </p>
                  <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    Bespoke refinement rounds
                  </p>
                </div>
              </div>

              {/* Creative Brief Specifications Breakdown */}
              <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="space-y-1 pb-4 border-b border-[#E4E2DC] dark:border-[#222225]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                    Project Record
                  </span>
                  <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                    Creative Brief & Directives
                  </h3>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                      Scope Description
                    </span>
                    <p className="text-[#18181B] dark:text-[#EDEDEC] leading-relaxed bg-[#FAF9F6] dark:bg-[#18181B] p-4 rounded-lg border border-[#E4E2DC] dark:border-[#222225] whitespace-pre-line">
                      {currentCommission.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentCommission.purpose && (
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                          Purpose & Context
                        </span>
                        <p className="text-[#18181B] dark:text-[#EDEDEC]">{currentCommission.purpose}</p>
                      </div>
                    )}

                    {currentCommission.targetAudience && (
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                          Target Audience
                        </span>
                        <p className="text-[#18181B] dark:text-[#EDEDEC]">{currentCommission.targetAudience}</p>
                      </div>
                    )}

                    {currentCommission.preferredStyle && (
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                          Aesthetic Direction
                        </span>
                        <p className="text-[#18181B] dark:text-[#EDEDEC]">{currentCommission.preferredStyle}</p>
                      </div>
                    )}

                    {currentCommission.requiredDimensions && (
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                          Required Formats & Dimensions
                        </span>
                        <p className="font-mono text-[#18181B] dark:text-[#EDEDEC]">{currentCommission.requiredDimensions}</p>
                      </div>
                    )}
                  </div>

                  {currentCommission.preferredColors && currentCommission.preferredColors.length > 0 && (
                    <div className="pt-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1.5">
                        Brand Palette
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentCommission.preferredColors.map((color, idx) => (
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

                  {currentCommission.referenceLinks && currentCommission.referenceLinks.length > 0 && (
                    <div className="pt-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1.5">
                        Inspiration & Reference Links
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentCommission.referenceLinks.map((link, idx) => (
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

              {/* Recent Activity Feed Preview */}
              {((currentCommission.timelineUpdates && currentCommission.timelineUpdates.length > 0) || 
                timelineUpdates.filter(t => t.commissionId === currentCommission.id).length > 0) && (
                <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#222225]">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                        Recent Log
                      </span>
                      <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                        Project Activity
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('milestones')}
                      className="text-xs font-mono font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Milestones →</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(currentCommission.timelineUpdates || timelineUpdates.filter(t => t.commissionId === currentCommission.id))
                      .slice(0, 3)
                      .map((update, idx) => (
                        <div key={idx} className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-display font-bold text-[#18181B] dark:text-[#EDEDEC] block">
                              {update.title || `Stage Update: ${update.stage || 'Production'}`}
                            </span>
                            <p className="text-[#71717A] dark:text-[#A1A1AA]">{update.description || update.notes}</p>
                          </div>
                          <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] shrink-0">
                            {formatCommissionDate(update.timestamp)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: IN-WORKSPACE MESSAGES */}
          {activeTab === 'messages' && (
            <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl overflow-hidden shadow-2xs h-[680px] flex flex-col animate-in fade-in duration-200">
              <ChatWindow
                commission={currentCommission}
                isAdmin={currentUser?.role === 'admin'}
              />
            </div>
          )}

          {/* TAB 3: PAYMENTS & RECEIPTS (CONSOLIDATED) */}
          {activeTab === 'payments' && (
            <div className="animate-in fade-in duration-200">
              {currentUser && currentCommission ? (
                <ClientPaymentVerificationCard
                  commission={currentCommission}
                  currentUser={currentUser}
                  onPaymentProofSubmitted={() => {
                    // Stay in payments tab to inspect pending status
                  }}
                />
              ) : (
                <div className="p-12 text-center text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-xl">
                  Please sign in with your client account to submit payment proofs.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FILES & CREATIVE PROOFS */}
          {activeTab === 'proofs' && (
            <div className="animate-in fade-in duration-200">
              <ClientReviewSection commission={currentCommission} />
            </div>
          )}

          {/* TAB 5: MILESTONES */}
          {activeTab === 'milestones' && (
            <div className="animate-in fade-in duration-200">
              <ProgressTimeline updates={currentCommission.timelineUpdates || timelineUpdates.filter(t => t.commissionId === currentCommission.id)} />
            </div>
          )}

          {/* TAB 6: FINAL DELIVERABLES */}
          {activeTab === 'delivery' && (
            <div className="animate-in fade-in duration-200">
              <FinalDeliverySection 
                commission={currentCommission} 
                onNavigateToPayment={() => setActiveTab('payments')} 
              />
            </div>
          )}

          {/* TAB 6: SETTINGS & PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#222225]">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                    Client Settings
                  </span>
                  <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                    Profile & Preferences
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveView('settings')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#18181B] transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Theme & Appearance →</span>
                </button>
              </div>

              {profileSavedMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                  {profileSavedMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <ProfilePhotoUploader
                  userId={currentUser.id}
                  currentAvatar={profileAvatar || currentUser.avatar}
                  onAvatarUpdated={(newUrl) => setProfileAvatar(newUrl)}
                  label="Profile Photo"
                  description="Upload an avatar representing your brand or client account."
                  avatarSizeClass="w-16 h-16"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Account Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profileEmail}
                      className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] font-mono cursor-not-allowed opacity-75"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Company / Social Handle
                    </label>
                    <input
                      type="text"
                      value={profileHandle}
                      onChange={(e) => setProfileHandle(e.target.value)}
                      placeholder="@company"
                      className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                    Client Bio / Brand Context
                  </label>
                  <textarea
                    rows={3}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="e.g. Founder at Solis Labs"
                    className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Contextual Project Chat Drawer */}
      {currentCommission && (
        <ProjectChatDrawer
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          commission={currentCommission}
        />
      )}

    </div>
  );
};
