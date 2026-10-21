import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressTimeline } from '../components/ProgressTimeline';
import { ClientReviewSection } from '../components/ClientReviewSection';
import { FinalDeliverySection } from '../components/FinalDeliverySection';
import { ClientPaymentVerificationCard } from '../components/ClientPaymentVerificationCard';
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader';
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
  Search
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
    if (s.includes('progress') || s.includes('accepted')) {
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
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
  } = useApp();

  const commission = activeCommission || (currentUserCommissions && currentUserCommissions.length > 0 ? currentUserCommissions[0] : undefined);
  const [proofs, setProofs] = useState<CommissionProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState<boolean>(false);

  // Two-level dashboard navigation state
  const [viewMode, setViewMode] = useState<'overview' | 'workspace'>('overview');
  const [overviewFilter, setOverviewFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'payment' | 'deposit' | 'review' | 'timeline' | 'delivery' | 'profile'>('overview');

  // Sync activeTab and viewMode when deep-linking from notifications
  useEffect(() => {
    if (activeDashboardTab) {
      if (activeDashboardTab === 'chat') {
        setActiveView('chat');
        return;
      }
      if (
        activeDashboardTab === 'payment' ||
        activeDashboardTab === 'deposit' ||
        activeDashboardTab === 'review' || 
        activeDashboardTab === 'timeline' || 
        activeDashboardTab === 'delivery' || 
        activeDashboardTab === 'profile'
      ) {
        setActiveTab(activeDashboardTab);
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
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#71717A] dark:text-[#A1A1AA]">
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
            className="px-6 py-2.5 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC] font-semibold text-xs hover:bg-[#FAF9F6] dark:hover:bg-[#232327] transition-all cursor-pointer"
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
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#EA580C]">
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

  const currentStageInfo = COMMISSION_STAGES.find(s => s.number === (currentCommission.currentStage || 1));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 animate-in fade-in duration-300">
      
      {/* ============================================================= */}
      {/* LEVEL 1: COMMISSION OVERVIEW                                  */}
      {/* ============================================================= */}
      {viewMode === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-8">
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
            <div className="flex items-center gap-2 p-1 bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg">
              <button
                type="button"
                onClick={() => setOverviewFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                  overviewFilter === 'all'
                    ? 'bg-white dark:bg-[#18181B] text-[#EA580C] shadow-2xs font-bold'
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
                    ? 'bg-white dark:bg-[#18181B] text-[#EA580C] shadow-2xs font-bold'
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
                    ? 'bg-white dark:bg-[#18181B] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
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
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            )}
          </div>

          {/* Commission Cards Grid */}
          {filteredCommissions.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-[#E4E2DC] dark:border-[#27272A] bg-white dark:bg-[#18181B] space-y-3">
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
                    onClick={() => {
                      setActiveCommissionId(proj.id);
                      setViewMode('workspace');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative p-6 sm:p-7 rounded-xl border border-[#E4E2DC] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-[#EA580C] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col gap-4"
                  >
                    {/* Top Meta Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E2DC]/60 dark:border-[#27272A]/60">
                      <div className="flex items-center gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
                        <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Ref: #{proj.id.slice(0, 8)}</span>
                        <span>·</span>
                        <span className="text-[#EA580C] font-semibold">{proj.serviceType || proj.service}</span>
                        <span>·</span>
                        <span>Designer: {proj.assignedDesigner || studioProfile.designerName}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${getStatusBadgeClasses(proj.status)}`}>
                          Status: {formatCommissionStatus(proj.status)}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${getPaymentBadgeClasses(proj.paymentStatus)}`}>
                          {proj.paymentStatus === 'Paid' ? 'Paid in Full' : proj.paymentStatus === 'Partial' ? 'Deposit Paid' : 'Awaiting Deposit Verification'}
                        </span>
                      </div>
                    </div>

                    {/* Project Title and Stage Banner */}
                    <div className="space-y-2">
                      <h3 className="font-display text-xl sm:text-2xl font-black text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] transition-colors truncate">
                        {proj.projectName}
                      </h3>

                      <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
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
                    <div className="h-1.5 w-full bg-[#E4E2DC] dark:bg-[#27272A] rounded-full overflow-hidden">
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
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <button
              type="button"
              onClick={() => {
                setViewMode('overview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:bg-[#FAF9F6] dark:hover:bg-[#232327] text-xs font-mono font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>← Back to My Commissions</span>
            </button>

            <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] hidden sm:inline">
              My Commissions / #{currentCommission.id.slice(0, 8)}
            </span>
          </div>

          {/* Active Project Sheet Header */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-6 border-b border-[#E4E2DC] dark:border-[#27272A]">
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

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Status:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{formatCommissionStatus(currentCommission.status)}</span>
              </div>
            </div>

            {/* Stage Info Callout */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#EA580C] uppercase tracking-wider">
                  Stage 0{currentCommission.currentStage} of 08 · {currentStageInfo?.name || 'Production'}
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

          {/* Quiet Tab Navigation Bar */}
          <nav className="flex items-center gap-2 border-b border-[#E4E2DC] dark:border-[#27272A] pb-1 overflow-x-auto no-scrollbar" aria-label="Project details navigation">
            {[
              { id: 'overview' as const, label: 'Specifications', icon: FileText },
              { 
                id: 'payment' as const, 
                label: 'Payment Verification', 
                icon: CreditCard, 
                count: currentCommission.paymentStatus !== 'Paid' 
                  ? (currentCommission.paymentStatus === 'Partial' ? 'Balance' : 'Deposit') 
                  : undefined 
              },
              { id: 'deposit' as const, label: 'Deposit', icon: CreditCard },
              { id: 'review' as const, label: 'Creative Proofs', icon: Eye, count: isProofPendingReview ? 'Action' : undefined },
              { id: 'timeline' as const, label: 'Milestone Log', icon: Clock },
              { id: 'delivery' as const, label: 'Final Delivery', icon: FolderArchive, count: isFinalDelivery ? 'Ready' : undefined },
              { id: 'profile' as const, label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: TabIcon, count }) => {
              const isSelected = activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`relative px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
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

          {/* TAB 1: SPECIFICATIONS & BRIEF */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* If Stage 8, Show Final Delivery Prompt */}
              {isFinalDelivery && (
                <FinalDeliverySection 
                  commission={currentCommission} 
                  onNavigateToPayment={() => setActiveTab('payment')} 
                />
              )}

              {/* Proof Review Alert if pending */}
              {isProofPendingReview && (
                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#EA580C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                      Action Required
                    </span>
                    <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                      Creative Proof v{latestProof?.version || 1} is awaiting your review
                    </h4>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      Inspect the latest high-resolution drafts and submit your approval or adjustment directives.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('review')}
                    className="px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Proof</span>
                  </button>
                </div>
              )}

              {/* Editorial Ledger of Project Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                    Delivery Window
                  </span>
                  <p className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                    {formatCommissionDate(currentCommission.deadline)}
                  </p>
                  <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    Target completion
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
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
                          onClick={() => setActiveTab('payment')}
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
                          onClick={() => setActiveTab('payment')}
                          className="text-[11px] font-mono text-[#EA580C] hover:underline text-left block font-semibold cursor-pointer"
                        >
                          Submit GCash Deposit Receipt →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                    Revision Cycles
                  </span>
                  <p className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                    {currentCommission.revisionsUsed || 0} used / {currentCommission.revisionsAllowed || 2} included
                  </p>
                  <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    Refinement rounds
                  </p>
                </div>
              </div>

              {/* Creative Brief Specifications Breakdown */}
              <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="space-y-1 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
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
                    <p className="text-[#18181B] dark:text-[#EDEDEC] leading-relaxed bg-[#FAF9F6] dark:bg-[#0F0F11] p-4 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] whitespace-pre-line">
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
                          <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] text-xs font-mono text-[#18181B] dark:text-[#EDEDEC]">
                            {color.startsWith('#') && (
                              <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: color }} />
                            )}
                            <span>{color}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: GCASH PAYMENT VERIFICATION */}
          {activeTab === 'payment' && (
            <div className="animate-in fade-in duration-200">
              {currentUser && currentCommission ? (
                <ClientPaymentVerificationCard
                  commission={currentCommission}
                  currentUser={currentUser}
                  onPaymentProofSubmitted={() => {
                    // Stay in payment tab to inspect pending status
                  }}
                />
              ) : (
                <div className="p-12 text-center text-xs font-mono text-[#71717A] bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl">
                  Please sign in with your client account to submit payment proofs.
                </div>
              )}
            </div>
          )}

          {/* TAB: DEPOSIT TERMS & GCASH INSTRUCTIONS */}
          {activeTab === 'deposit' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
                      Settlement Policy
                    </span>
                    <h3 className="font-display text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                      Initial Production Deposit
                    </h3>
                  </div>
                  <div>
                    {currentCommission.paymentStatus === 'Paid' || currentCommission.paymentStatus === 'Partial' || currentCommission.depositPaid ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Deposit Received & Confirmed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-mono font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Deposit Verification</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                      Total Investment
                    </span>
                    <p className="font-mono font-bold text-xl text-[#18181B] dark:text-[#EDEDEC]">
                      {currentCommission.budget}
                    </p>
                    <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      Fixed commission scope
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                      Required Initial Deposit
                    </span>
                    <p className="font-mono font-bold text-xl text-[#EA580C]">
                      50% of budget
                    </p>
                    <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      Commences concept crafting and vector development
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-[#E4E2DC] dark:border-[#27272A] bg-white dark:bg-[#18181B] space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                      Official Studio GCash Settlement Instructions
                    </h4>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                      Transfer the initial 50% deposit to the verified studio GCash account below. After transferring, submit a screenshot or PDF of the GCash transaction receipt for manual admin audit.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] block mb-1">
                        GCash Account Name
                      </span>
                      <span className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                        {studioProfile?.gcashDetails?.accountName || 'Brewster Cabando'}
                      </span>
                    </div>

                    <div className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] block mb-1">
                        GCash Mobile Number
                      </span>
                      <span className="font-mono font-bold text-sm text-[#EA580C]">
                        {studioProfile?.gcashDetails?.accountNumber || '0965-706-4331'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      Important: Please include Ref #{currentCommission.id.slice(0, 8)} in your transfer message.
                    </p>

                    <button
                      type="button"
                      onClick={() => setActiveTab('payment')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Submit GCash Deposit Receipt →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROOF REVIEW */}
          {activeTab === 'review' && (
            <div className="animate-in fade-in duration-200">
              <ClientReviewSection commission={currentCommission} />
            </div>
          )}

          {/* TAB 4: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="animate-in fade-in duration-200">
              <ProgressTimeline updates={currentCommission.timelineUpdates || timelineUpdates.filter(t => t.commissionId === currentCommission.id)} />
            </div>
          )}

          {/* TAB 5: FINAL DELIVERY */}
          {activeTab === 'delivery' && (
            <div className="animate-in fade-in duration-200">
              <FinalDeliverySection 
                commission={currentCommission} 
                onNavigateToPayment={() => setActiveTab('payment')} 
              />
            </div>
          )}

          {/* TAB 6: SETTINGS & PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#232327] transition-colors cursor-pointer self-start sm:self-auto"
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] font-mono cursor-not-allowed opacity-75"
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
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
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] resize-none"
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

    </div>
  );
};
