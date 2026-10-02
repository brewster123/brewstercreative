import React, { useState, useEffect, useCallback } from 'react';
import { Commission, CommissionProof } from '../types';
import {
  fetchCommissionProofs,
  getProofSignedUrl,
  formatProofFileSize,
  formatProofFileType,
  getProofStatusMeta,
} from '../lib/proofs';
import { useApp } from '../context/AppContext';
import {
  CheckCircle,
  RotateCcw,
  Eye,
  Maximize2,
  AlertCircle,
  X,
  RefreshCw,
  FileText,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ClientReviewSectionProps {
  commission: Commission;
}

export const ClientReviewSection: React.FC<ClientReviewSectionProps> = ({ commission }) => {
  const { submitClientReviewAction } = useApp();
  const [proofs, setProofs] = useState<CommissionProof[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Review RPC mutation state
  const [submittingProofId, setSubmittingProofId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [approveModalProof, setApproveModalProof] = useState<CommissionProof | null>(null);
  const [revisionModalProof, setRevisionModalProof] = useState<CommissionProof | null>(null);
  const [revisionNote, setRevisionNote] = useState<string>('');
  const [revisionNoteError, setRevisionNoteError] = useState<string | null>(null);

  // View / Lightbox state
  const [loadingSignedUrlProofId, setLoadingSignedUrlProofId] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<{
    proof: CommissionProof;
    signedUrl: string;
    isImage: boolean;
  } | null>(null);

  // Fetch proofs using client SELECT RLS boundary
  const loadProofs = useCallback(
    async (isRefresh = false) => {
      if (!commission?.id) {
        setLoading(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setFetchError(null);

      const { data, error } = await fetchCommissionProofs(commission.id);
      if (error) {
        setFetchError(error);
      } else {
        setProofs(data || []);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [commission?.id]
  );

  useEffect(() => {
    loadProofs();
  }, [loadProofs]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Handle generating short-lived signed URL for private bucket
  const handleViewProof = async (proof: CommissionProof) => {
    setActionError(null);
    setLoadingSignedUrlProofId(proof.id);

    const { signedUrl, error } = await getProofSignedUrl(proof.file_path, 3600);
    setLoadingSignedUrlProofId(null);

    if (error || !signedUrl) {
      setActionError(error || 'Failed to acquire secure viewing link.');
      return;
    }

    const lowerName = (proof.file_name || '').toLowerCase();
    const lowerType = (proof.file_type || '').toLowerCase();
    const isImage =
      lowerType.startsWith('image/') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.webp') ||
      lowerName.endsWith('.gif') ||
      lowerName.endsWith('.svg');

    if (isImage) {
      setViewingProof({ proof, signedUrl, isImage: true });
    } else {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenApproveModal = (proof: CommissionProof) => {
    setActionError(null);
    setApproveModalProof(proof);
  };

  const handleOpenRevisionModal = (proof: CommissionProof) => {
    setActionError(null);
    setRevisionNoteError(null);
    setRevisionNote('');
    setRevisionModalProof(proof);
  };

  const handleConfirmApprove = async () => {
    if (!approveModalProof) return;
    setActionError(null);
    setSubmittingProofId(approveModalProof.id);

    const res = await submitClientReviewAction(approveModalProof.id, 'approved');
    setSubmittingProofId(null);

    if (res.success) {
      setApproveModalProof(null);
      setSuccessMsg(`Creative Proof v${approveModalProof.version} successfully approved. Milestone advanced.`);
      await loadProofs(true);
    } else {
      setActionError(res.error || 'Failed to record approval in database.');
    }
  };

  const handleConfirmRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalProof) return;

    const trimmed = revisionNote.trim();
    if (!trimmed) {
      setRevisionNoteError('Please describe the specific adjustments or composition changes needed.');
      return;
    }
    if (trimmed.length < 5) {
      setRevisionNoteError('Please provide more detailed feedback (minimum 5 characters).');
      return;
    }

    setActionError(null);
    setRevisionNoteError(null);
    setSubmittingProofId(revisionModalProof.id);

    const res = await submitClientReviewAction(revisionModalProof.id, 'revision_requested', trimmed);
    setSubmittingProofId(null);

    if (res.success) {
      setRevisionModalProof(null);
      setSuccessMsg(`Revision requested for Proof v${revisionModalProof.version}. Brewster has been notified.`);
      await loadProofs(true);
    } else {
      setActionError(res.error || 'Failed to submit revision request.');
    }
  };

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

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
            Art Approval Sheet
          </span>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
            Creative Proofs & Review Iterations
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Inspect high-resolution visual drafts and approve or request composition adjustments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadProofs(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#EA580C]' : ''}`} />
          <span>Refresh Iterations</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Proof Content */}
      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
          Loading creative proof iterations...
        </div>
      ) : fetchError ? (
        <div className="py-12 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">{fetchError}</p>
          <button
            type="button"
            onClick={() => loadProofs(false)}
            className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : proofs.length === 0 ? (
        <div className="py-16 text-center space-y-2 max-w-sm mx-auto">
          <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
            Awaiting Proof Delivery
          </h4>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            High-resolution visual iterations for {commission.projectName} will appear here once initial concepts are rendered.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {proofs.map((proof) => {
            const isApproved = proof.status === 'approved';
            const isRevisionRequested = proof.status === 'revision_requested';
            const isActionInProgress = submittingProofId === proof.id;
            const isSigningUrl = loadingSignedUrlProofId === proof.id;

            return (
              <article
                key={proof.id}
                className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 sm:p-6 space-y-4"
              >
                {/* Proof Title & Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B]">
                      v{proof.version}
                    </span>
                    <h4 className="font-display text-sm sm:text-base font-bold text-[#18181B] dark:text-[#EDEDEC] truncate max-w-xs sm:max-w-md">
                      {proof.file_name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                      {isApproved ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Direction Approved</span>
                      ) : isRevisionRequested ? (
                        <span className="text-amber-600 dark:text-amber-400">Revision in Progress</span>
                      ) : (
                        <span className="text-[#EA580C]">Awaiting Client Review</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Specs Ledger */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  <div>
                    <span className="text-[10px] uppercase block">Format</span>
                    <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                      {formatProofFileType(proof.file_type, proof.file_name)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block">Size</span>
                    <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                      {formatProofFileSize(proof.file_size)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block">Uploaded</span>
                    <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                      {formatUploadDate(proof.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block">Access</span>
                    <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">Private Vault</span>
                  </div>
                </div>

                {/* Revision Note if applicable */}
                {isRevisionRequested && proof.revision_note && (
                  <div className="p-3 bg-white dark:bg-[#18181B] border border-amber-300 dark:border-amber-800 rounded-lg text-xs space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold block">
                      Client Adjustment Notes:
                    </span>
                    <p className="text-[#18181B] dark:text-[#EDEDEC] italic leading-relaxed">
                      "{proof.revision_note}"
                    </p>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E4E2DC] dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => handleViewProof(proof)}
                    disabled={isSigningUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#18181B] dark:hover:border-[#EDEDEC] text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
                  >
                    {isSigningUrl ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#EA580C]" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-[#EA580C]" />
                    )}
                    <span>Inspect Artwork Full-Scale</span>
                  </button>

                  {!isApproved ? (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenRevisionModal(proof)}
                        disabled={isActionInProgress}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] hover:bg-white dark:hover:bg-[#18181B] text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-all cursor-pointer disabled:opacity-50"
                      >
                        Request Revision
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(proof)}
                        disabled={isActionInProgress}
                        className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Proof</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Approved · Direction Locked</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CONFIRM APPROVAL MODAL */}
      {approveModalProof && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
              Confirm Direction
            </span>
            <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              Approve Proof v{approveModalProof.version}?
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              By approving <strong>{approveModalProof.file_name}</strong>, you lock in this design direction. Brewster will proceed with compiling the final master production deliverables.
            </p>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setApproveModalProof(null)}
                disabled={submittingProofId !== null}
                className="flex-1 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={submittingProofId !== null}
                className="flex-1 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submittingProofId === approveModalProof.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST REVISION MODAL */}
      {revisionModalProof && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC] dark:border-[#27272A]">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                  Studio Dialogue
                </span>
                <h3 className="font-display text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  Request Revision on Proof v{revisionModalProof.version}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRevisionModalProof(null)}
                className="text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#18181B] dark:text-[#EDEDEC] mb-1.5 font-semibold">
                  Adjustment Directives <span className="text-[#EA580C]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={revisionNote}
                  onChange={(e) => {
                    setRevisionNote(e.target.value);
                    if (revisionNoteError) setRevisionNoteError(null);
                  }}
                  placeholder="Detail your feedback: typography weight, color balance, composition adjustments, or specific elements to refine..."
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] resize-none leading-relaxed"
                />
                {revisionNoteError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{revisionNoteError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalProof(null)}
                  disabled={submittingProofId !== null}
                  className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProofId !== null}
                  className="px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingProofId === revisionModalProof.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <span>Transmit Feedback</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCALE ARTWORK LIGHTBOX */}
      {viewingProof && (
        <div 
          onClick={() => setViewingProof(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-in fade-in duration-200"
        >
          <button
            type="button"
            onClick={() => setViewingProof(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewingProof.signedUrl}
            alt={viewingProof.proof.file_name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

    </div>
  );
};
