import React, { useState, useEffect } from 'react';
import { Commission, CommissionPaymentProof, User } from '../types';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  X, 
  Loader2, 
  AlertTriangle, 
  Search, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react';
import { 
  fetchCommissionPaymentProofs, 
  getPaymentProofSignedUrl, 
  adminReviewPaymentProof, 
  formatPaymentFileSize,
  subscribeToPaymentProofs 
} from '../lib/payments';

interface AdminPaymentVerificationSectionProps {
  commissions: Commission[];
  currentUser: User | null;
  onPaymentConfirmed?: (commissionId: string, targetStatus: 'Partial' | 'Paid') => void;
  selectedCommissionId?: string;
}

export const AdminPaymentVerificationSection: React.FC<AdminPaymentVerificationSectionProps> = ({
  commissions,
  currentUser,
  onPaymentConfirmed,
  selectedCommissionId: initialSelectedCommissionId,
}) => {
  const { updateCommissionStatus } = useApp();

  const [proofs, setProofs] = useState<CommissionPaymentProof[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_verification' | 'confirmed' | 'rejected'>('all');
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>(initialSelectedCommissionId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep filter synced when parent dashboard changes selected commission
  useEffect(() => {
    if (initialSelectedCommissionId) {
      setSelectedCommissionId(initialSelectedCommissionId);
    }
  }, [initialSelectedCommissionId]);

  // Review Modal State
  const [reviewingProof, setReviewingProof] = useState<CommissionPaymentProof | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'confirmed' | 'rejected'>('confirmed');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [targetPaymentStatus, setTargetPaymentStatus] = useState<'Partial' | 'Paid'>('Partial');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Image Lightbox State
  const [lightboxProof, setLightboxProof] = useState<CommissionPaymentProof | null>(null);
  const [lightboxSignedUrl, setLightboxSignedUrl] = useState<string | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState<boolean>(false);
  const [signedUrlCache, setSignedUrlCache] = useState<Record<string, string>>({});

  const loadProofs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await fetchCommissionPaymentProofs();
      if (fetchErr) {
        setError(fetchErr);
      } else {
        setProofs(data || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load payment receipts from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProofs();

    const unsubscribe = subscribeToPaymentProofs(undefined, () => {
      loadProofs();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update commission filter if prop changes
  useEffect(() => {
    if (initialSelectedCommissionId) {
      setSelectedCommissionId(initialSelectedCommissionId);
    }
  }, [initialSelectedCommissionId]);

  // Handle Escape key to dismiss review dialog or receipt lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxProof) {
          handleCloseLightbox();
        } else if (reviewingProof && !isSubmittingReview) {
          handleCloseReview();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxProof, reviewingProof, isSubmittingReview]);

  // Open Lightbox
  const handleOpenLightbox = async (proof: CommissionPaymentProof) => {
    setLightboxProof(proof);
    setReviewError(null);

    if (signedUrlCache[proof.id]) {
      setLightboxSignedUrl(signedUrlCache[proof.id]);
      return;
    }

    setLoadingSignedUrl(true);
    try {
      const { signedUrl, error: signErr } = await getPaymentProofSignedUrl(proof.filePath, 3600);
      if (signErr || !signedUrl) {
        setReviewError(signErr || 'Failed to generate secure URL for receipt preview.');
      } else {
        setSignedUrlCache((prev) => ({ ...prev, [proof.id]: signedUrl }));
        setLightboxSignedUrl(signedUrl);
      }
    } catch (err: any) {
      setReviewError(err?.message || 'Error acquiring signed URL for receipt preview.');
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  const handleCloseLightbox = () => {
    setLightboxProof(null);
    setLightboxSignedUrl(null);
  };

  // Open Review Dialog
  const handleStartReview = (proof: CommissionPaymentProof, decision: 'confirmed' | 'rejected') => {
    setReviewingProof(proof);
    setReviewDecision(decision);
    setAdminNotes(proof.adminNotes || '');
    setReviewError(null);

    // If confirming a balance payment or final amount, default to Paid
    if (proof.paymentType === 'balance' || proof.paymentType === 'full') {
      setTargetPaymentStatus('Paid');
    } else {
      setTargetPaymentStatus('Partial');
    }

    // Auto-preload signed URL if not cached
    if (!signedUrlCache[proof.id]) {
      getPaymentProofSignedUrl(proof.filePath, 3600).then(({ signedUrl }) => {
        if (signedUrl) {
          setSignedUrlCache((prev) => ({ ...prev, [proof.id]: signedUrl }));
        }
      });
    }
  };

  const handleCloseReview = () => {
    setReviewingProof(null);
    setAdminNotes('');
    setReviewError(null);
  };

  // Submit Review (Confirm or Reject)
  const handleSubmitReview = async () => {
    if (!reviewingProof || !currentUser?.id) return;

    if (reviewDecision === 'rejected' && (!adminNotes || !adminNotes.trim())) {
      setReviewError('Please provide a clear reason for rejecting the receipt to inform the client.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const result = await adminReviewPaymentProof({
        proofId: reviewingProof.id,
        commissionId: reviewingProof.commissionId,
        decision: reviewDecision,
        adminNotes: adminNotes.trim(),
        targetPaymentStatus: reviewDecision === 'confirmed' ? targetPaymentStatus : undefined,
        adminUserId: currentUser.id,
      });

      if (!result.success) {
        setReviewError(result.error || 'Failed to submit review decision.');
        return;
      }

      // Update local state
      setProofs((prev) =>
        prev.map((p) =>
          p.id === reviewingProof.id
            ? {
                ...p,
                status: reviewDecision,
                adminNotes: adminNotes.trim() || undefined,
                reviewedBy: currentUser.id,
                reviewedAt: new Date().toISOString(),
              }
            : p
        )
      );

      // If confirmed, update commission payment status in UI context
      if (reviewDecision === 'confirmed') {
        if (onPaymentConfirmed) {
          onPaymentConfirmed(reviewingProof.commissionId, targetPaymentStatus);
        }
        // Also update local commission status if it was in pending
        const comm = commissions.find((c) => c.id === reviewingProof.commissionId);
        if (comm && comm.status === 'pending') {
          await updateCommissionStatus(comm.id, 'accepted');
        }
      }

      handleCloseReview();
    } catch (err: any) {
      setReviewError(err?.message || 'An unexpected error occurred while reviewing the payment.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filtered proofs
  const filteredProofs = proofs.filter((proof) => {
    if (statusFilter !== 'all' && proof.status !== statusFilter) {
      return false;
    }
    if (selectedCommissionId !== 'all' && proof.commissionId !== selectedCommissionId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const comm = commissions.find((c) => c.id === proof.commissionId);
      const matchRef = (proof.referenceNumber || '').toLowerCase().includes(q);
      const matchNotes = (proof.clientNotes || '').toLowerCase().includes(q);
      const matchProject = (comm?.projectName || '').toLowerCase().includes(q);
      const matchClient = (comm?.clientName || '').toLowerCase().includes(q);
      if (!matchRef && !matchNotes && !matchProject && !matchClient) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = proofs.filter((p) => p.status === 'pending_verification').length;
  const confirmedCount = proofs.filter((p) => p.status === 'confirmed').length;
  const rejectedCount = proofs.filter((p) => p.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold">
              Financial Audit
            </span>
            <span className="text-[#71717A] dark:text-[#A1A1AA]">·</span>
            <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              GCash Manual Verification
            </span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            GCash Payment Verifications
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-2xl">
            Audit manual client GCash transfers, verify reference numbers against your merchant records, and confirm payments to unlock production phases and final deliverables.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProofs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:bg-[#FAF9F6] dark:hover:bg-[#27272A] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setStatusFilter('pending_verification')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'pending_verification'
              ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40'
              : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-display font-black text-[#18181B] dark:text-[#EDEDEC] mt-2">
            {pendingCount}
          </p>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            {pendingCount === 1 ? '1 receipt awaits decision' : `${pendingCount} receipts await decision`}
          </span>
        </div>

        <div 
          onClick={() => setStatusFilter('confirmed')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'confirmed'
              ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/40'
              : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">
              Confirmed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-display font-black text-[#18181B] dark:text-[#EDEDEC] mt-2">
            {confirmedCount}
          </p>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            Authorized transfers verified
          </span>
        </div>

        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-red-500/10 border-red-500 ring-1 ring-red-500/40'
              : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] hover:border-red-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">
              Rejected
            </span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-display font-black text-[#18181B] dark:text-[#EDEDEC] mt-2">
            {rejectedCount}
          </p>
          <span className="text-[11px] font-mono text-red-600 dark:text-red-400">
            Declined with feedback
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['all', 'pending_verification', 'confirmed', 'rejected'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                statusFilter === filter
                  ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] font-semibold'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#FAF9F6] dark:hover:bg-[#27272A]'
              }`}
            >
              {filter === 'all'
                ? `All (${proofs.length})`
                : filter === 'pending_verification'
                ? `Pending (${pendingCount})`
                : filter === 'confirmed'
                ? `Confirmed (${confirmedCount})`
                : `Rejected (${rejectedCount})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Commission Dropdown */}
          <select
            value={selectedCommissionId}
            onChange={(e) => setSelectedCommissionId(e.target.value)}
            className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
          >
            <option value="all">All Commissions</option>
            {commissions.map((comm) => (
              <option key={comm.id} value={comm.id}>
                {comm.projectName} ({comm.clientName})
              </option>
            ))}
          </select>

          {/* Search Field */}
          <div className="relative min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Ref #, client, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C]"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#EA580C] mx-auto" />
          <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
            Loading payment verification ledger...
          </p>
        </div>
      ) : filteredProofs.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-8">
          <CreditCard className="w-8 h-8 text-[#A1A1AA] mx-auto opacity-70" />
          <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
            No Payment Proofs Found
          </h4>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto">
            {statusFilter === 'pending_verification'
              ? 'Great! There are no client payment receipts currently awaiting admin review.'
              : 'No receipts match the selected filters. When clients submit GCash screenshots, they will appear here.'}
          </p>
        </div>
      ) : (
        /* Proofs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProofs.map((proof) => {
            const comm = commissions.find((c) => c.id === proof.commissionId);
            const formattedDate = proof.createdAt
              ? new Date(proof.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <article
                key={proof.id}
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#E4E2DC] dark:border-[#27272A] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold">
                        {proof.paymentType === 'deposit'
                          ? '50% Initial Deposit'
                          : proof.paymentType === 'balance'
                          ? 'Final Balance'
                          : 'Full Payment'}
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          proof.status === 'confirmed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : proof.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                            : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 animate-pulse'
                        }`}
                      >
                        {proof.status === 'pending_verification'
                          ? 'Awaiting Review'
                          : proof.status === 'confirmed'
                          ? 'Confirmed'
                          : 'Rejected'}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC] truncate">
                      {comm?.projectName || 'Commission Project'}
                    </h4>

                    <div className="flex items-center justify-between text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      <span className="truncate max-w-[160px]">Client: {comm?.clientName || 'Unknown'}</span>
                      <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                        {proof.currency} {proof.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Preview Trigger / Meta */}
                  <div className="p-4 space-y-3">
                    <div 
                      onClick={() => handleOpenLightbox(proof)}
                      className="group relative aspect-[16/10] bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg overflow-hidden cursor-pointer flex items-center justify-center"
                    >
                      {signedUrlCache[proof.id] ? (
                        <img
                          src={signedUrlCache[proof.id]}
                          alt={proof.fileName || 'GCash Receipt'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-1.5 text-[#71717A] dark:text-[#A1A1AA] p-4 text-center">
                          <Eye className="w-5 h-5 text-[#EA580C]" />
                          <span className="text-xs font-mono">Click to preview receipt</span>
                          <span className="text-[10px] text-[#A1A1AA]">
                            {proof.fileName} ({formatPaymentFileSize(proof.fileSize)})
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>Enlarge Receipt</span>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-1 text-xs">
                      {proof.referenceNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[11px]">GCash Ref No:</span>
                          <span className="font-mono font-bold text-[#18181B] dark:text-[#EDEDEC] select-all bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            {proof.referenceNumber}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                        <span>Submitted:</span>
                        <span>{formattedDate}</span>
                      </div>

                      {proof.clientNotes && (
                        <div className="pt-1.5 border-t border-[#E4E2DC] dark:border-[#27272A] text-[11px] text-[#71717A] dark:text-[#A1A1AA] italic">
                          "{proof.clientNotes}"
                        </div>
                      )}

                      {proof.adminNotes && (
                        <div className="pt-1.5 border-t border-[#E4E2DC] dark:border-[#27272A] text-[11px] text-red-600 dark:text-red-400">
                          <span className="font-bold font-mono">Feedback:</span> {proof.adminNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-[#FAF9F6] dark:bg-[#0F0F11] border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center gap-2">
                  {proof.status === 'pending_verification' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartReview(proof, 'confirmed')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Payment</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartReview(proof, 'rejected')}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18181B] hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : proof.status === 'confirmed' ? (
                    <div className="w-full flex items-center justify-between text-xs font-mono text-emerald-600 dark:text-emerald-400 px-1">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Payment Verified</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartReview(proof, 'rejected')}
                        className="text-[11px] text-[#71717A] hover:text-red-600 underline cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs font-mono text-red-600 dark:text-red-400 px-1">
                      <span className="inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Declined</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartReview(proof, 'confirmed')}
                        className="text-[11px] text-[#71717A] hover:text-emerald-600 underline cursor-pointer"
                      >
                        Re-evaluate & Confirm
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ============================================================= */}
      {/* 4. RECEIPT LIGHTBOX MODAL                                     */}
      {/* ============================================================= */}
      {lightboxProof && (
        <div 
          onClick={handleCloseLightbox}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-2xl max-h-[90vh] bg-[#18181B] border border-white/10 rounded-2xl p-4 flex flex-col items-center cursor-default shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 text-white text-xs font-mono">
              <span className="truncate max-w-sm">
                Receipt: {lightboxProof.fileName} · Ref #{lightboxProof.referenceNumber || 'N/A'}
              </span>
              <button
                type="button"
                onClick={handleCloseLightbox}
                className="text-white/70 hover:text-white cursor-pointer p-1"
                aria-label="Close receipt lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 max-h-[72vh] overflow-auto flex items-center justify-center w-full">
              {loadingSignedUrl ? (
                <div className="py-20 flex flex-col items-center gap-2 text-white/70">
                  <Loader2 className="w-6 h-6 animate-spin text-[#EA580C]" />
                  <span className="text-xs font-mono">Acquiring secure preview link...</span>
                </div>
              ) : Boolean(lightboxSignedUrl && lightboxSignedUrl.trim()) ? (
                <img
                  src={lightboxSignedUrl!}
                  alt="GCash Receipt Screenshot"
                  className="max-h-[68vh] w-auto object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <div className="py-20 text-center text-red-400 text-xs font-mono">
                  Unable to load receipt preview. Check storage credentials.
                </div>
              )}
            </div>

            <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-white/70 font-mono text-[11px]">
              <span>Amount: PHP {lightboxProof.amount.toLocaleString()}</span>
              {Boolean(lightboxSignedUrl && lightboxSignedUrl.trim()) && (
                <a
                  href={lightboxSignedUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#EA580C] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Full Resolution</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 5. REVIEW DECISION MODAL (CONFIRM OR DECLINE)                 */}
      {/* ============================================================= */}
      {reviewingProof && (
        <div 
          onClick={handleCloseReview}
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-lg w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
              <div className="flex items-center gap-2">
                {reviewDecision === 'confirmed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC]">
                  {reviewDecision === 'confirmed' ? 'Confirm GCash Payment' : 'Decline GCash Payment Proof'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseReview}
                className="text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Commission & Receipt Snapshot */}
            <div className="p-3.5 rounded-xl bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] space-y-2 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Amount Claimed:</span>
                <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {reviewingProof.currency} {reviewingProof.amount.toLocaleString()}
                </span>
              </div>
              {reviewingProof.referenceNumber && (
                <div className="flex justify-between font-mono">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">GCash Reference No:</span>
                  <span className="font-bold text-[#EA580C]">{reviewingProof.referenceNumber}</span>
                </div>
              )}
              <div className="flex justify-between font-mono text-[#71717A] dark:text-[#A1A1AA]">
                <span>Payment Stage:</span>
                <span className="uppercase">{reviewingProof.paymentType}</span>
              </div>
            </div>

            {/* Confirmation Target Selection */}
            {reviewDecision === 'confirmed' ? (
              <div className="space-y-3">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                  Target Commission Payment Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetPaymentStatus('Partial')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      targetPaymentStatus === 'Partial'
                        ? 'border-[#EA580C] bg-[#EA580C]/10 text-[#EA580C] font-semibold'
                        : 'border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
                    }`}
                  >
                    <span className="block text-xs font-bold">50% Deposit (Partial)</span>
                    <span className="block text-[11px] mt-0.5 opacity-80">
                      Unlocks concept production & revision rounds.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPaymentStatus('Paid')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      targetPaymentStatus === 'Paid'
                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 font-semibold'
                        : 'border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
                    }`}
                  >
                    <span className="block text-xs font-bold">Settled in Full (Paid)</span>
                    <span className="block text-[11px] mt-0.5 opacity-80">
                      Unlocks final master asset downloads in Stage 8.
                    </span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    Optional Admin Notes / Internal Memo
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Verified via GCash merchant text at 2:45 PM"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>
            ) : (
              /* Rejection Reason Form */
              <div className="space-y-3">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Reason for Declining (Sent to Client) *
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Explain why this receipt cannot be accepted (e.g. Reference No. does not match, image is blurry, deposit amount is incomplete)..."
                  className="w-full p-3 text-xs rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-red-500 resize-none"
                />
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  The client will be notified and given the option to submit a corrected receipt screenshot.
                </p>
              </div>
            )}

            {/* Error Message */}
            {reviewError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E2DC] dark:border-[#27272A]">
              <button
                type="button"
                onClick={handleCloseReview}
                disabled={isSubmittingReview}
                className="px-4 py-2 text-xs font-mono text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                  reviewDecision === 'confirmed'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Decision...</span>
                  </>
                ) : reviewDecision === 'confirmed' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Authorize</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
