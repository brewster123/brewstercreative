import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressTimeline } from '../components/ProgressTimeline';
import { ClientReviewSection } from '../components/ClientReviewSection';
import { FinalDeliverySection } from '../components/FinalDeliverySection';
import { ChatWindow } from '../components/ChatWindow';
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader';
import { formatCommissionDate } from '../utils/dateUtils';
import { isValidReferenceUrl } from '../utils/urlUtils';
import { fetchCommissionProofs, formatProofFileSize } from '../lib/proofs';
import { CommissionProof } from '../types';
import { 
  Sparkles, 
  Clock, 
  Calendar, 
  RotateCcw, 
  DollarSign, 
  ShieldCheck, 
  FolderArchive, 
  MessageSquare, 
  FileText, 
  ExternalLink,
  PlusCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  User as UserIcon,
  Check
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
    timelineUpdates = []
  } = useApp();

  const commission = activeCommission || (currentUserCommissions && currentUserCommissions.length > 0 ? currentUserCommissions[0] : undefined);
  const [proofs, setProofs] = useState<CommissionProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'review' | 'timeline' | 'profile'>('overview');

  // Fetch creative proofs for active commission to support actionability status
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

  // Keep in sync if currentUser changes
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

    setProfileSavedMsg('Your personal client profile has been updated successfully!');
    setTimeout(() => setProfileSavedMsg(''), 4000);
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto animate-pulse">
          <span className="font-display font-black text-xl">✨</span>
        </div>
        <p className="text-xs text-zinc-500 font-mono-code">
          Hydrating client workspace session...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-600 shadow-xs">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
            Sign In to Access Your Workspace
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            Please sign in with your email to view your ongoing projects, approve milestone design proofs, and chat directly with Brewster.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('auth')}
            className="px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveView('commission-form')}
            className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            Start a Commission
          </button>
        </div>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-500">
          <FolderArchive className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
          No Commissions Found
        </h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          You don't have any commissions on record. Submit a new brief to collaborate with {studioProfile.designerName}.
        </p>
        <button
          type="button"
          onClick={() => setActiveView('commission-form')}
          className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-sm"
        >
          Start a Commission
        </button>
      </div>
    );
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono-code font-bold text-xs border border-emerald-200">✓ Fully Settled</span>;
      case 'Partial':
        return <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-mono-code font-bold text-xs border border-amber-200">⚡ 50% Deposit Paid</span>;
      case 'Unpaid':
      default:
        return <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-mono-code font-bold text-xs border border-rose-200">⏳ Awaiting Deposit</span>;
    }
  };

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

  const formatUploadDate = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const renderProofActionBanner = () => {
    // 4. Completed / Stage 08: Do not show the proof action banner
    if (isFinalDelivery || commission.currentStage === 8 || (commission.status || '').toLowerCase() === 'completed') {
      return null;
    }

    const stageNum = commission.currentStage;
    const commStatus = (commission.status || '').toLowerCase();

    // 5. Stages 01–04: Do not show an action banner
    if (
      stageNum < 5 &&
      commStatus !== 'for_review' &&
      commStatus !== 'client review' &&
      commStatus !== 'revision' &&
      commStatus !== 'revision requested' &&
      commStatus !== 'final_approval' &&
      commStatus !== 'final approval'
    ) {
      return null;
    }

    const effectiveProofs = proofs && proofs.length > 0 ? proofs : (commission.proofs || []);
    const latestProof = effectiveProofs.length > 0 ? effectiveProofs[0] : null;

    if (loadingProofs && !latestProof) {
      return (
        <div className="bg-orange-50/50 border border-orange-200/60 rounded-[28px] p-5 sm:p-6 shadow-xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Loading creative proof status...</p>
              <p className="text-xs text-zinc-500 font-mono-code">Checking for pending client actions</p>
            </div>
          </div>
        </div>
      );
    }

    // 6. Stage 05 but no proof uploaded
    if (!latestProof && (stageNum === 5 || commStatus === 'for_review' || commStatus === 'client review')) {
      return (
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-[28px] p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0 shadow-2xs mt-0.5">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    Stage 05 Milestone
                  </span>
                  <span className="text-xs text-zinc-400 font-mono-code">In Preparation</span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                  Creative proof is being prepared
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed font-medium">
                  {commission.assignedDesigner || 'Your designer'} is currently preparing the first creative proof iteration for <strong className="text-zinc-700">{commission.projectName}</strong>. You will be prompted here to inspect and review the proof once it has been uploaded.
                </p>
              </div>
            </div>
            <div className="sm:self-center shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-mono-code text-zinc-500 font-bold shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Awaiting Upload</span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (!latestProof) {
      return null;
    }

    const proofStatus = (latestProof.status || '').toLowerCase().trim();
    const isPendingReview =
      proofStatus === 'pending_review' ||
      proofStatus === 'pending review' ||
      proofStatus === 'pending' ||
      (stageNum === 5 &&
        !proofStatus.includes('revision') &&
        proofStatus !== 'approved');

    const isRevisionRequested =
      proofStatus === 'revision_requested' ||
      proofStatus === 'revision requested' ||
      stageNum === 6 ||
      commStatus === 'revision' ||
      commStatus === 'revision requested';

    const isApproved =
      proofStatus === 'approved' ||
      stageNum === 7 ||
      commStatus === 'final_approval' ||
      commStatus === 'final approval';

    // 1. Pending proof review
    if (isPendingReview) {
      const fileName = latestProof.fileName || latestProof.file_name || 'Design Proof';
      const fileSize = latestProof.fileSize ?? latestProof.file_size;
      const createdAt = latestProof.createdAt || latestProof.created_at;
      const versionNumber = latestProof.version || 1;

      return (
        <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/80 border-2 border-orange-300 rounded-[28px] p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/30 mt-0.5">
                <Eye className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-mono-code font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Action Required
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-mono-code font-bold">
                    Iteration v{versionNumber}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-black text-zinc-900">
                  Action Required: Creative Proof v{versionNumber} Ready for Review
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
                  Inspect the latest design iteration for <strong className="text-zinc-800">{commission.projectName}</strong> and submit your approval or request adjustments.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] font-mono-code text-zinc-500 font-medium">
                  <span className="flex items-center gap-1 truncate max-w-[240px] sm:max-w-xs">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{fileName}</span>
                  </span>
                  {fileSize && (
                    <span>• {formatProofFileSize(fileSize)}</span>
                  )}
                  <span>• Uploaded {formatUploadDate(createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="lg:self-center shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:translate-y-[-1px]"
              >
                <Eye className="w-4 h-4" />
                <span>Review Proof v{versionNumber}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Revision requested
    if (isRevisionRequested) {
      const revisionNote = latestProof.revisionNote || latestProof.revision_note || commission.clientReviewData?.revisionFeedback;
      const versionNumber = latestProof.version || 1;

      return (
        <div className="bg-amber-50/60 border border-amber-200/90 rounded-[28px] p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs mt-0.5">
                <RotateCcw className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    Stage 06 — Revision in Progress
                  </span>
                  <span className="text-xs text-zinc-400 font-mono-code">v{versionNumber} Iteration</span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                  Revision in Progress for Proof v{versionNumber}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
                  Your revision requests have been received and are currently in progress. {commission.assignedDesigner || 'Brewster'} is implementing your requested adjustments. You do not need to take any action at this time.
                </p>
                {revisionNote && (
                  <div className="mt-2 p-3 rounded-xl bg-white border border-amber-200/70 text-xs text-zinc-700 font-medium">
                    <span className="font-bold text-amber-800 font-mono-code block text-[11px] mb-0.5">
                      Your Feedback Note:
                    </span>
                    <p className="italic text-zinc-600 line-clamp-2">"{revisionNote}"</p>
                  </div>
                )}
              </div>
            </div>
            <div className="sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-amber-100/60 text-amber-800 text-xs font-bold border border-amber-200 shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>View Proof History</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 3. Approved / Final Approval
    if (isApproved) {
      const versionNumber = latestProof?.version || 1;
      return (
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-[28px] p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    Stage 07 — Direction Approved
                  </span>
                  <span className="text-xs text-zinc-400 font-mono-code">Milestone Locked</span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                  Creative Proof v{versionNumber} Approved — Preparing Final Delivery
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
                  Design proof v{versionNumber} has been approved. The design direction is locked and preparation is underway for final production deliverables (Stage 08).
                </p>
              </div>
            </div>
            <div className="sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-100/60 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Approved Proof</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderCreativeProofsSidebarCard = () => {
    const versionNumber = latestProof?.version || 1;

    // 4. Completed / Final Delivery (Stage 08)
    if (isFinalDelivery || stageNum === 8 || commStatus === 'completed') {
      return (
        <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <Eye className="w-4 h-4 text-zinc-500" />
              <span>Creative Proofs</span>
            </div>
            <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              Proofs Complete
            </span>
          </div>
          <div>
            <h5 className="font-display font-bold text-sm text-zinc-900">
              Proofs Complete
            </h5>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-1">
              All design iterations are concluded and finalized deliverables have been handed off.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className="w-full py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-zinc-200 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            <span>View Proof Archive</span>
          </button>
        </div>
      );
    }

    // 1. Pending Review (Action Required)
    if (isProofPendingReview) {
      return (
        <div className="bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 border-2 border-orange-300 rounded-[28px] p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <Eye className="w-4 h-4 text-orange-500" />
              <span>Creative Proofs</span>
            </div>
            <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Review v{versionNumber}
            </span>
          </div>
          <div>
            <h5 className="font-display font-bold text-sm text-zinc-900">
              Creative Proof v{versionNumber} Ready for Review
            </h5>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium mt-1">
              Review the latest design iteration and submit approval or revision feedback.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Creative Proofs</span>
          </button>
        </div>
      );
    }

    // 2. Revision Requested (Stage 06)
    if (
      latestProofStatus === 'revision_requested' ||
      latestProofStatus === 'revision requested' ||
      stageNum === 6 ||
      commStatus === 'revision' ||
      commStatus === 'revision requested'
    ) {
      return (
        <div className="bg-white border border-amber-200/80 rounded-[28px] p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <span>Creative Proofs</span>
            </div>
            <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              v{versionNumber} in Revision
            </span>
          </div>
          <div>
            <h5 className="font-display font-bold text-sm text-zinc-900">
              Revision in Progress
            </h5>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-1">
              Your feedback has been received. Brewster Creative is working on the requested adjustments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-zinc-200 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-600" />
            <span>View Proof History</span>
          </button>
        </div>
      );
    }

    // 3. Approved / Final Approval (Stage 07)
    if (
      latestProofStatus === 'approved' ||
      stageNum === 7 ||
      commStatus === 'final_approval' ||
      commStatus === 'final approval'
    ) {
      return (
        <div className="bg-white border border-emerald-200/80 rounded-[28px] p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Creative Proofs</span>
            </div>
            <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Direction Approved
            </span>
          </div>
          <div>
            <h5 className="font-display font-bold text-sm text-zinc-900">
              Creative Direction Approved
            </h5>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-1">
              Proof v{versionNumber} has been approved. Final delivery preparation is underway.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-emerald-200 shadow-2xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>View Approved Proof</span>
          </button>
        </div>
      );
    }

    // 5. Stage 05 — No Proof Yet
    if (!latestProof && (stageNum === 5 || commStatus === 'for_review' || commStatus === 'client review')) {
      return (
        <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Creative Proofs</span>
            </div>
            <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              Preparing
            </span>
          </div>
          <div>
            <h5 className="font-display font-bold text-sm text-zinc-900">
              Creative Proof Being Prepared
            </h5>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-1">
              Your designer is preparing the first proof iteration. You will be prompted to review once uploaded.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-zinc-200 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            <span>Open Creative Proofs</span>
          </button>
        </div>
      );
    }

    // 6. Stages 01–04: Pre-Review Stage
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
            <Eye className="w-4 h-4 text-orange-500" />
            <span>Creative Proofs</span>
          </div>
          <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
            Stage 05 Milestone
          </span>
        </div>
        <div>
          <h5 className="font-display text-sm font-bold text-zinc-900">
            Visual Drafting & Production
          </h5>
          <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-1">
            Design drafts and proofs will be uploaded here once active production reaches Stage 05 (Client Review).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className="w-full py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-zinc-200 shadow-2xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-zinc-400" />
          <span>Open Creative Proofs</span>
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Commission Switcher (if multiple projects exist) */}
      {currentUserCommissions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-mono-code text-zinc-500 uppercase tracking-wider font-bold shrink-0">Your Projects:</span>
          {currentUserCommissions.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCommissionId(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                c.id === commission.id
                  ? 'bg-zinc-900 text-white font-bold shadow-sm'
                  : 'bg-white text-zinc-700 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              {c.projectName} ({formatCommissionStatus(c.status)})
            </button>
          ))}
          <button
            onClick={() => setActiveView('commission-form')}
            className="px-4 py-2 rounded-full bg-white hover:bg-orange-50 text-orange-600 text-xs font-bold flex items-center gap-1.5 border border-orange-200 shrink-0 shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Commission</span>
          </button>
        </div>
      )}

      {/* Main Project Header Bento Card */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code font-bold border border-orange-200">
                {commission.serviceType}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono-code font-bold border ${
                commission.status === 'Completed' || commission.status === 'completed' || commission.status === 'Final Approval' || commission.status === 'final_approval'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : commission.status === 'In Progress' || commission.status === 'in_progress' || commission.status === 'accepted'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : commission.status === 'Client Review' || commission.status === 'Revision Requested' || commission.status === 'for_review' || commission.status === 'reviewing' || commission.status === 'revision'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : commission.status === 'Rejected' || commission.status === 'cancelled'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                Status: {formatCommissionStatus(commission.status)}
              </span>
              <span className="text-xs font-mono-code text-zinc-400 font-medium">
                Project Ref: #{commission.id.slice(0, 8)}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-black text-zinc-900">
              {commission.projectName}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Client: <strong className="text-zinc-800">{commission.clientName}</strong> • Assigned Designer: <strong className="text-orange-600">{commission.assignedDesigner}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="tab-open-chat"
              type="button"
              onClick={() => setActiveTab('chat')}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-bold border border-zinc-200 flex items-center gap-2 transition-all shadow-2xs"
            >
              <MessageSquare className="w-4 h-4 text-orange-500" />
              <span>Studio Chat</span>
            </button>

            <button
              id="tab-open-review"
              type="button"
              onClick={() => setActiveTab('review')}
              className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-sm shadow-orange-500/20 flex items-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Creative Proofs</span>
              {isProofPendingReview && (
                <span className="px-2 py-0.5 rounded-full bg-white text-orange-600 text-[10px] font-mono-code font-bold shadow-2xs leading-none">
                  Review
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 8-Stage Progress Tracker Visual Component */}
        <div className="mt-8">
          <ProgressBar commission={commission} interactiveAdmin={false} />
        </div>
      </div>

      {/* Navigation Tabs for Client Dashboard - Bento Pills */}
      <div className="flex items-center gap-2 bg-zinc-100/90 p-1.5 rounded-2xl border border-zinc-200/80 overflow-x-auto no-scrollbar w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Project Specifications</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Designer Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'review'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Creative Proofs</span>
          {isProofPendingReview && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-orange-500 text-white leading-none">
              Review
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Milestone Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>My Profile & Information</span>
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Final Delivery Card (If Stage 8 is reached) */}
          {isFinalDelivery && (
            <FinalDeliverySection commission={commission} />
          )}

          {/* Contextual Proof Action / Milestone Banner (Level 1 UX Improvement) */}
          {renderProofActionBanner()}

          {/* Key Metrics Quick Stats Grid - Bento Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Status & Deadline */}
            <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block font-bold">
                Target Deadline
              </span>
              <div className="flex items-center gap-2 text-zinc-900 font-black text-sm sm:text-base">
                <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{formatCommissionDate(commission.deadline)}</span>
              </div>
              <span className="text-[11px] text-zinc-400 block font-medium">
                {commission.startDate ? `Started on ${formatCommissionDate(commission.startDate)}` : ''}
              </span>
            </div>

            {/* Budget & Payment */}
            <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block font-bold">
                Budget & Settlement
              </span>
              <div className="flex items-center justify-between">
                <span className="text-zinc-900 font-display font-black text-base">
                  {commission.budget}
                </span>
                {getPaymentBadge(commission.paymentStatus)}
              </div>
              {commission.paymentStatus !== 'Paid' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => updatePaymentStatus(commission.id, commission.paymentStatus === 'Unpaid' ? 'Partial' : 'Paid')}
                    className="text-[11px] font-mono-code text-orange-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    {commission.paymentStatus === 'Unpaid' ? '💳 Settle 50% Deposit' : '💳 Settle Final Balance'}
                  </button>
                </div>
              )}
            </div>

            {/* Revisions Count */}
            <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block font-bold">
                Revisions Status
              </span>
              <div className="flex items-center gap-2 text-zinc-900 font-black text-base">
                <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{commission.revisionsUsed || 1} Used / {commission.revisionsAllowed || 3} Allowed</span>
              </div>
              <span className="text-[11px] text-zinc-400 block font-medium">
                Stage 05 handles revision loops
              </span>
            </div>

            {/* Stage Progress */}
            <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block font-bold">
                Current Completion
              </span>
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-lg text-orange-600">
                  {commission.progress}%
                </span>
                <span className="text-xs font-mono-code text-zinc-500 font-medium">
                  Stage {commission.currentStage} of 8
                </span>
              </div>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                <div 
                  className="bg-orange-500 h-full rounded-full"
                  style={{ width: `${commission.progress}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* Project Brief Specifications & Details Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Full Brief Breakdown */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 sm:p-7 space-y-5 shadow-xs">
                <h3 className="font-display text-lg font-bold text-zinc-900 pb-3 border-b border-zinc-200/80 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  Commission Project Details
                </h3>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                      Project Description
                    </span>
                    <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-200/70 font-medium">
                      {commission.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Purpose & Context
                      </span>
                      <p className="text-zinc-800 font-semibold text-xs sm:text-sm">
                        {commission.purpose || 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Target Audience
                      </span>
                      <p className="text-zinc-800 font-semibold text-xs sm:text-sm">
                        {commission.targetAudience || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Aesthetic Style Direction
                      </span>
                      {commission.preferredStyle ? (
                        <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold font-mono-code inline-block border border-orange-200">
                          {commission.preferredStyle}
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-xs font-medium italic">
                          Flexible / Designer discretion
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Required Dimensions
                      </span>
                      <p className="text-zinc-800 text-xs font-mono-code font-semibold">
                        {commission.requiredDimensions || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Colors */}
                  {commission.preferredColors && commission.preferredColors.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1.5 font-bold">
                        Selected Brand Palette
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {commission.preferredColors.map((hex, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-mono-code text-zinc-800 font-medium shadow-2xs">
                            {hex.startsWith('#') && (
                              <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 shadow-2xs shrink-0" style={{ backgroundColor: hex }}></span>
                            )}
                            <span>{hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {commission.additionalNotes && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Additional Requirements / Notes
                      </span>
                      <p className="text-zinc-700 text-xs bg-zinc-50 p-3 rounded-xl border border-zinc-200 whitespace-pre-line leading-relaxed">
                        {commission.additionalNotes}
                      </p>
                    </div>
                  )}

                  {commission.communicationGoals && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Communication Goals
                      </span>
                      <p className="text-zinc-700 italic text-xs bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        "{commission.communicationGoals}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Col: Client Contacts & Reference Assets */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Reference Links & Documents */}
              <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 space-y-4 shadow-xs">
                <h4 className="font-display text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-orange-500" />
                  Attached References ({(commission.referenceImages?.length || 0) + (commission.referenceLinks?.length || 0) + (commission.referenceDocs?.length || 0)})
                </h4>

                {commission.referenceImages && commission.referenceImages.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono-code text-zinc-400 uppercase block mb-2 font-bold">
                      Inspiration Moodboard
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {commission.referenceImages.map((img, i) => (
                        <div key={i} className="aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
                          <img src={img} alt="Reference" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {commission.referenceLinks && commission.referenceLinks.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono-code text-zinc-400 uppercase block mb-1.5 font-bold">
                      External Reference URLs
                    </span>
                    <ul className="space-y-1.5 text-xs">
                      {commission.referenceLinks.map((link, i) => {
                        const isUrl = isValidReferenceUrl(link);
                        return (
                          <li key={i}>
                            {isUrl ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-orange-600 hover:underline flex items-center gap-1.5 truncate font-medium"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span className="truncate">{link}</span>
                              </a>
                            ) : (
                              <span className="text-zinc-600 flex items-center gap-1.5 truncate font-medium text-xs">
                                <span className="truncate">{link}</span>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Creative Proofs Dynamic Status Card (Level 3 UX Improvement) */}
              {renderCreativeProofsSidebarCard()}

              {/* Designer Contact Card */}
              <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={studioProfile.avatar}
                    alt={studioProfile.designerName}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-orange-500/30"
                  />
                  <div>
                    <h5 className="font-display font-bold text-sm text-zinc-900">
                      {studioProfile.designerName}
                    </h5>
                    <p className="text-xs text-orange-600 font-mono-code font-semibold">Studio Lead & Artist</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed">
                  Have questions about your commission or need to discuss modifications?
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                  <span>Open Studio Chat</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CHAT */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <ChatWindow commission={commission} />
        </div>
      )}

      {/* TAB CONTENT 3: REVIEW PROOFS */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          <ClientReviewSection commission={commission} />
        </div>
      )}

      {/* TAB CONTENT 4: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <ProgressTimeline updates={commission.timelineUpdates || timelineUpdates.filter(t => t.commissionId === commission.id)} />
        </div>
      )}

      {/* TAB CONTENT 5: MY PROFILE & INFORMATION */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-3xl">
          {/* Privilege explanation notice */}
          <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-950">
              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Client Profile & Privacy Control</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              As a client, you can manage and update your personal contact details, brand handles, and preferences here. You cannot edit the studio portfolio, services, or website settings—those are maintained by Brewster A. Cabando.
            </p>
          </div>

          {profileSavedMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSavedMsg}</span>
            </div>
          )}

          <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 sm:p-8 shadow-xs">
            <h3 className="font-display text-lg font-black text-zinc-900 mb-1">
              Edit My Client Information
            </h3>
            <p className="text-xs text-zinc-500 mb-6 font-mono-code">
              Updates will automatically sync with your commission brief and chat identity.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="pb-5 border-b border-zinc-100">
                <ProfilePhotoUploader
                  userId={currentUser.id}
                  currentAvatar={profileAvatar || currentUser.avatar}
                  onAvatarUpdated={(newUrl) => {
                    setProfileAvatar(newUrl);
                  }}
                  label="Client Profile Photo"
                  description="Upload a photo from your computer. Updates will sync with your commission briefs and chat."
                  avatarSizeClass="w-16 h-16 sm:w-20 sm:h-20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Email Address (Account Login)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profileEmail}
                    className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-500 font-mono-code cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Brand / Company Handle
                  </label>
                  <input
                    type="text"
                    value={profileHandle}
                    onChange={(e) => setProfileHandle(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Preferred Communication
                  </label>
                  <select
                    value={profileContact}
                    onChange={(e) => setProfileContact(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  >
                    <option value="Platform Chat & Email">Platform Chat & Email</option>
                    <option value="Discord">Discord</option>
                    <option value="Telegram">Telegram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram / Social">Instagram / Social DM</option>
                    <option value="Email Only">Email Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Client Bio / Brand Note
                </label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="e.g. Founder at Solis Labs — Sustainable Tech Products"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
