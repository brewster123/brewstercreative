import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressTimeline } from '../components/ProgressTimeline';
import { ClientReviewSection } from '../components/ClientReviewSection';
import { FinalDeliverySection } from '../components/FinalDeliverySection';
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
  ShieldCheck,
  Settings
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

  const { 
    currentUserCommissions = [], 
    activeCommission, 
    setActiveCommissionId, 
    setActiveView,
    updatePaymentStatus,
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

  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'timeline' | 'delivery' | 'profile'>('overview');

  // Sync activeTab when deep-linking from notifications
  useEffect(() => {
    if (activeDashboardTab) {
      if (activeDashboardTab === 'chat') {
        setActiveView('chat');
        return;
      }
      if (
        activeDashboardTab === 'review' || 
        activeDashboardTab === 'timeline' || 
        activeDashboardTab === 'delivery' || 
        activeDashboardTab === 'profile'
      ) {
        setActiveTab(activeDashboardTab);
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
            Sign in with your client account to inspect project sheets, review design proofs, and converse directly with Brewster.
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

  if (!commission) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#71717A] dark:text-[#A1A1AA]">
          <FolderArchive className="w-5 h-5 text-[#A1A1AA]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            No projects yet
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            Your commissioned projects will appear here once initiated.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('commission-form')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-all cursor-pointer"
        >
          <span>Start a Commission</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const isFinalDelivery = commission.currentStage === 8 || commission.status === 'Completed' || commission.status === 'completed';
  const effectiveProofs = proofs && proofs.length > 0 ? proofs : (commission.proofs || []);
  const latestProof = effectiveProofs.length > 0 ? effectiveProofs[0] : null;

  const stageNum = commission.currentStage;
  const commStatus = (commission.status || '').toLowerCase();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 sm:space-y-12 animate-in fade-in duration-300">
      
      {/* Human Editorial Header */}
      <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-8 sm:pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {getGreeting()}, {currentUser.name}.
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
              Your creative projects
            </h1>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] font-normal">
              Everything related to your current and past projects, in one place.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>New Project Consultation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editorial Current Projects Sheet */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC] dark:border-[#27272A]">
          <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold">
            Current Projects ({currentUserCommissions.length})
          </span>
          <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] hidden sm:inline">
            Active Studio Records
          </span>
        </div>

        <div className="space-y-3">
          {currentUserCommissions.map((proj) => {
            const isSelected = proj.id === commission.id;
            const updatedDate = proj.updatedAt
              ? new Date(proj.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Recently';

            return (
              <article
                key={proj.id}
                onClick={() => setActiveCommissionId(proj.id)}
                className={`group p-5 sm:p-6 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-white dark:bg-[#18181B] border-[#EA580C] shadow-2xs'
                    : 'bg-[#FAF9F6] dark:bg-[#0F0F11] border-[#E4E2DC] dark:border-[#27272A] hover:bg-white dark:hover:bg-[#18181B] hover:border-[#D4D2CA]'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    <span>{proj.serviceType}</span>
                    <span>·</span>
                    <span className="text-[#EA580C] font-semibold">{formatCommissionStatus(proj.status)}</span>
                  </div>

                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDEC] group-hover:translate-x-1 transition-transform duration-300 truncate">
                    {proj.projectName}
                  </h3>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] line-clamp-1">
                    Stage 0{proj.currentStage} · {COMMISSION_STAGES.find(s => s.number === proj.currentStage)?.name || 'Production'}
                  </p>
                </div>

                {/* Progress Metric & Timeline */}
                <div className="flex items-center gap-6 self-start md:self-auto shrink-0 font-mono text-xs">
                  <div className="w-28 sm:w-36 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                      <span>Progress</span>
                      <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">{proj.progress}%</span>
                    </div>
                    <div className="h-1 w-full bg-[#E4E2DC] dark:bg-[#27272A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#EA580C]" style={{ width: `${proj.progress}%` }} />
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Activity</span>
                    <span className="font-medium text-[#18181B] dark:text-[#EDEDEC]">{updatedDate}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 font-semibold text-xs text-[#EA580C] group-hover:translate-x-1 transition-transform">
                    <span>{isSelected ? 'Viewing' : 'Select'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Production Document Area for Active Commission */}
      <section className="space-y-8 pt-4">
        
        {/* Active Project Sheet Header */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-6 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                <span>Ref: #{commission.id.slice(0, 8)}</span>
                <span>·</span>
                <span className="text-[#EA580C] font-semibold">{commission.serviceType}</span>
                <span>·</span>
                <span>Designer: {commission.assignedDesigner || studioProfile.designerName}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                {commission.projectName}
              </h2>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#71717A] dark:text-[#A1A1AA]">Status:</span>
              <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{formatCommissionStatus(commission.status)}</span>
            </div>
          </div>

          {/* 8-Stage Production Timeline Component */}
          <ProgressBar commission={commission} interactiveAdmin={false} />
        </div>

        {/* Quiet Tab Navigation Bar (Understated Text Links, No Giant Pills) */}
        <nav className="flex items-center gap-2 border-b border-[#E4E2DC] dark:border-[#27272A] pb-1 overflow-x-auto no-scrollbar" aria-label="Project details navigation">
          {[
            { id: 'overview' as const, label: 'Specifications', icon: FileText },
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
              <FinalDeliverySection commission={commission} />
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
                  {formatCommissionDate(commission.deadline)}
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
                  {commission.budget}
                </p>
                <div className="pt-0.5">
                  {commission.paymentStatus === 'Paid' ? (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">✓ Settled in Full</span>
                  ) : commission.paymentStatus === 'Partial' ? (
                    <button
                      type="button"
                      onClick={() => updatePaymentStatus(commission.id, 'Paid')}
                      className="text-[11px] font-mono text-[#EA580C] hover:underline"
                    >
                      50% Deposit Received · Settle Balance →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updatePaymentStatus(commission.id, 'Partial')}
                      className="text-[11px] font-mono text-[#EA580C] hover:underline"
                    >
                      Awaiting Deposit · Settle 50% →
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                  Revision Cycles
                </span>
                <p className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                  {commission.revisionsUsed || 0} used / {commission.revisionsAllowed || 2} included
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
                    {commission.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {commission.purpose && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                        Purpose & Context
                      </span>
                      <p className="text-[#18181B] dark:text-[#EDEDEC]">{commission.purpose}</p>
                    </div>
                  )}

                  {commission.targetAudience && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                        Target Audience
                      </span>
                      <p className="text-[#18181B] dark:text-[#EDEDEC]">{commission.targetAudience}</p>
                    </div>
                  )}

                  {commission.preferredStyle && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                        Aesthetic Direction
                      </span>
                      <p className="text-[#18181B] dark:text-[#EDEDEC]">{commission.preferredStyle}</p>
                    </div>
                  )}

                  {commission.requiredDimensions && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1">
                        Required Formats & Dimensions
                      </span>
                      <p className="font-mono text-[#18181B] dark:text-[#EDEDEC]">{commission.requiredDimensions}</p>
                    </div>
                  )}
                </div>

                {commission.preferredColors && commission.preferredColors.length > 0 && (
                  <div className="pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1.5">
                      Brand Palette
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {commission.preferredColors.map((color, idx) => (
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

                {commission.referenceLinks && commission.referenceLinks.length > 0 && (
                  <div className="pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block mb-1.5">
                      Inspiration References
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {commission.referenceLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[#EA580C] hover:underline"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PROOF REVIEW */}
        {activeTab === 'review' && (
          <div className="animate-in fade-in duration-200">
            <ClientReviewSection commission={commission} />
          </div>
        )}

        {/* TAB 4: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="animate-in fade-in duration-200">
            <ProgressTimeline updates={commission.timelineUpdates || timelineUpdates.filter(t => t.commissionId === commission.id)} />
          </div>
        )}

        {/* TAB 5: FINAL DELIVERY */}
        {activeTab === 'delivery' && (
          <div className="animate-in fade-in duration-200">
            <FinalDeliverySection commission={commission} />
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

      </section>

    </div>
  );
};
