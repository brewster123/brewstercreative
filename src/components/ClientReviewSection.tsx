import React, { useState, useEffect, useCallback } from 'react';
import { Commission, CommissionProof, ProofStatus } from '../types';
import {
  fetchCommissionProofs,
  getProofSignedUrl,
  submitClientReviewRpc,
  formatProofFileSize,
  formatProofFileType,
  getProofStatusMeta,
} from '../lib/proofs';
import {
  CheckCircle,
  RotateCcw,
  Eye,
  Maximize2,
  AlertCircle,
  Clock,
  Send,
  X,
  RefreshCw,
  FileText,
  ExternalLink,
  ShieldCheck,
  Check,
  FileCheck2,
} from 'lucide-react';

interface ClientReviewSectionProps {
  commission: Commission;
}

export const ClientReviewSection: React.FC<ClientReviewSectionProps> = ({ commission }) => {
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

  // Auto-dismiss success message
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
      setActionError(error || 'Failed to generate secure viewing link.');
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
      // PDF or other document format: open signed URL in a secure new tab
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Open approve modal
  const handleOpenApproveModal = (proof: CommissionProof) => {
    setActionError(null);
    setApproveModalProof(proof);
  };

  // Open revision modal
  const handleOpenRevisionModal = (proof: CommissionProof) => {
    setActionError(null);
    setRevisionNoteError(null);
    setRevisionNote('');
    setRevisionModalProof(proof);
  };

  // Confirm approve via RPC
  const handleConfirmApprove = async () => {
    if (!approveModalProof) return;
    setActionError(null);
    setSubmittingProofId(approveModalProof.id);

    const { error } = await submitClientReviewRpc(
      approveModalProof.id,
      'approved',
      null
    );

    setSubmittingProofId(null);

    if (error) {
      setActionError(error);
    } else {
      const versionNumber = approveModalProof.version;
      setApproveModalProof(null);
      setSuccessMsg(`Proof Version ${versionNumber} has been successfully approved!`);
      // Refetch proofs to update status in UI
      loadProofs(true);
    }
  };

  // Submit revision request via RPC
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalProof) return;

    const trimmed = revisionNote.trim();
    if (!trimmed) {
      setRevisionNoteError('Please enter a revision note describing the requested changes.');
      return;
    }

    setActionError(null);
    setRevisionNoteError(null);
    setSubmittingProofId(revisionModalProof.id);

    const { error } = await submitClientReviewRpc(
      revisionModalProof.id,
      'revision_requested',
      trimmed
    );

    setSubmittingProofId(null);

    if (error) {
      setActionError(error);
    } else {
      const versionNumber = revisionModalProof.version;
      setRevisionModalProof(null);
      setRevisionNote('');
      setSuccessMsg(`Revision request for Proof Version ${versionNumber} has been submitted.`);
      // Refetch proofs to update status in UI
      loadProofs(true);
    }
  };

  // Format date helper
  const formatUploadDate = (isoString: string) => {
    if (!isoString) return 'Recent';
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
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="p-1 rounded-lg text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action / Mutation Error Banner */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="p-1 rounded-lg text-rose-600 hover:text-rose-900 hover:bg-rose-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Creative Proofs Card Container */}
      <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code font-bold border border-orange-200">
                Phase 3C — Client Creative Proof Review
              </span>
              <span className="text-xs text-zinc-400 font-mono-code font-medium">
                Commission: #{commission.id.slice(0, 8)}
              </span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-black text-zinc-900 mt-1">
              Creative Proofs
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Inspect your design drafts and iterations. You can approve or request revisions directly through secure review controls.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Revisions Allowance Counter */}
            <div className="bg-zinc-50 px-4 py-2.5 rounded-2xl border border-zinc-200/80 shrink-0">
              <div className="text-[11px] text-zinc-500 font-mono-code uppercase font-bold">
                Revisions Used
              </div>
              <div className="text-sm font-bold text-zinc-800 flex items-center gap-1.5">
                <span className="text-orange-600 text-lg font-black font-display">
                  {commission.revisionsUsed || 0}
                </span>
                <span className="text-zinc-400">/</span>
                <span>{commission.revisionsAllowed || 3} allowed</span>
              </div>
            </div>

            {/* Refresh Proofs Button */}
            <button
              type="button"
              onClick={() => loadProofs(true)}
              disabled={refreshing || loading}
              className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 transition-all border border-zinc-200 disabled:opacity-50"
              title="Refresh creative proofs list"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Security / Proof Vault Notice */}
        <div className="mt-4 mb-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-600 leading-relaxed">
            <strong className="text-zinc-900">Encrypted Proof Vault:</strong> Creative proofs are securely hosted in a private storage repository. All viewing links are short-lived signed URLs generated specifically for your active session.
          </div>
        </div>

        {/* Proof Content Area */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600 animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <p className="text-xs text-zinc-500 font-mono-code">
              Loading creative proofs from secure database...
            </p>
          </div>
        ) : fetchError ? (
          <div className="py-12 px-6 text-center space-y-3 rounded-2xl bg-rose-50/60 border border-rose-200">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-900">
              Unable to Load Creative Proofs
            </p>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={() => loadProofs(false)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300 shadow-2xs transition-all"
            >
              Try Again
            </button>
          </div>
        ) : proofs.length === 0 ? (
          /* Empty State when no proofs uploaded to Supabase */
          <div className="py-12 px-6 text-center space-y-4 rounded-2xl bg-zinc-50/80 border border-dashed border-zinc-300">
            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 shadow-2xs">
              <FileCheck2 className="w-6 h-6 text-orange-500" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-base sm:text-lg font-bold text-zinc-900">
                No Creative Proofs Uploaded Yet
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                Your designer {commission.assignedDesigner || 'Brewster'} will upload high-resolution proof iterations for <strong className="text-zinc-700">{commission.projectName}</strong> once initial drafts are rendered.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-[11px] font-mono-code text-zinc-500">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Awaiting designer proof upload</span>
            </div>
          </div>
        ) : (
          /* Proofs List */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-mono-code text-zinc-600 uppercase tracking-wider font-bold">
                Available Proof Iterations ({proofs.length})
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">
                Latest iterations appear first
              </span>
            </div>

            <div className="space-y-4">
              {proofs.map((proof) => {
                const statusMeta = getProofStatusMeta(proof.status);
                const isApproved = proof.status === 'approved';
                const isRevisionRequested = proof.status === 'revision_requested';
                const isActionInProgress = submittingProofId === proof.id;
                const isSigningUrl = loadingSignedUrlProofId === proof.id;

                return (
                  <div
                    key={proof.id}
                    className="p-5 sm:p-6 rounded-2xl border border-zinc-200/90 bg-white hover:border-zinc-300 transition-all shadow-2xs space-y-4"
                  >
                    {/* Top Row: Version, Metadata & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Version Badge */}
                        <span className="px-3 py-1 rounded-xl bg-zinc-900 text-white font-mono-code text-xs font-black shadow-2xs">
                          v{proof.version}
                        </span>

                        {/* File Name */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                          <h4
                            className="text-sm sm:text-base font-bold text-zinc-900 truncate"
                            title={proof.file_name}
                          >
                            {proof.file_name}
                          </h4>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-code font-bold border ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* Meta Details Row: Type, Size, Upload Date */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-zinc-50/70 p-3 rounded-xl border border-zinc-200/60 font-medium text-zinc-600">
                      <div>
                        <span className="text-[10px] font-mono-code uppercase text-zinc-400 block">
                          Version
                        </span>
                        <span className="font-bold text-zinc-800">
                          Iteration #{proof.version}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono-code uppercase text-zinc-400 block">
                          Format
                        </span>
                        <span className="font-bold text-zinc-800">
                          {formatProofFileType(proof.file_type, proof.file_name)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono-code uppercase text-zinc-400 block">
                          Size
                        </span>
                        <span className="font-bold text-zinc-800">
                          {formatProofFileSize(proof.file_size)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono-code uppercase text-zinc-400 block">
                          Uploaded
                        </span>
                        <span className="font-bold text-zinc-800">
                          {formatUploadDate(proof.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Revision Note Callout (if revision was requested on this proof) */}
                    {isRevisionRequested && proof.revision_note && (
                      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Revision Requested with Note:</span>
                        </div>
                        <p className="text-amber-800 italic leading-relaxed font-medium pl-5">
                          "{proof.revision_note}"
                        </p>
                      </div>
                    )}

                    {/* Approved State Notice (Read-Only) */}
                    {isApproved && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Approved Proof — Ready for Production Packaging</span>
                        </div>
                        <span className="text-[11px] font-mono-code text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md font-bold">
                          READ-ONLY
                        </span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100">
                      {/* View Proof Button */}
                      <button
                        type="button"
                        onClick={() => handleViewProof(proof)}
                        disabled={isSigningUrl}
                        className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all border border-zinc-200 flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
                      >
                        {isSigningUrl ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-orange-500" />
                        )}
                        <span>{isSigningUrl ? 'Generating Access...' : 'View Proof'}</span>
                      </button>

                      {/* Review Actions: Only shown if proof is NOT approved */}
                      {!isApproved ? (
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          {/* Request Revision Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenRevisionModal(proof)}
                            disabled={isActionInProgress}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-700 hover:text-amber-800 text-xs font-bold transition-all border border-amber-300 flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                            <span>Request Revision</span>
                          </button>

                          {/* Approve Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(proof)}
                            disabled={isActionInProgress}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve Proof</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono-code">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved Direction Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CONFIRM APPROVAL MODAL */}
      {approveModalProof && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-[28px] max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle className="w-7 h-7" />
            </div>

            <h3 className="font-display text-lg font-black text-zinc-900 text-center mb-1">
              Approve Proof Version {approveModalProof.version}?
            </h3>
            <p className="text-xs text-zinc-500 text-center mb-6 leading-relaxed">
              By approving <strong className="text-zinc-800">{approveModalProof.file_name}</strong>, you confirm this creative direction. The proof status will be permanently marked as <strong className="text-emerald-700">Approved</strong> (read-only) and your designer can proceed to final deliverable packaging.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setApproveModalProof(null)}
                disabled={submittingProofId !== null}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={submittingProofId !== null}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submittingProofId === approveModalProof.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Yes, Approve Proof</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST REVISION MODAL */}
      {revisionModalProof && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-zinc-900">
                    Request Revision — Version {revisionModalProof.version}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    File: {revisionModalProof.file_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevisionModalProof(null)}
                disabled={submittingProofId !== null}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Revision Feedback & Adjustments Required *
                </label>
                <textarea
                  id="input-proof-revision-note"
                  rows={4}
                  required
                  placeholder="Please describe specifically what adjustments or iterations you would like to see in the next draft version..."
                  value={revisionNote}
                  onChange={(e) => {
                    setRevisionNote(e.target.value);
                    if (revisionNoteError) setRevisionNoteError(null);
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
                />
                {revisionNoteError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">
                    {revisionNoteError}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 space-y-1">
                <p className="font-bold text-zinc-800">💡 Designer Tip:</p>
                <p>
                  Specific feedback regarding typography weight, geometry, proportions, contrast, or color tones helps your designer deliver precisely what you envision.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalProof(null)}
                  disabled={submittingProofId !== null}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-proof-revision"
                  type="submit"
                  disabled={submittingProofId !== null}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingProofId === revisionModalProof.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Revision Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LIGHTBOX / INLINE PROOF PREVIEW */}
      {viewingProof && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setViewingProof(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Bar */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-white/20 font-mono-code text-xs font-bold">
                  v{viewingProof.proof.version}
                </span>
                <span className="text-sm font-bold truncate max-w-xs sm:max-w-md">
                  {viewingProof.proof.file_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingProof.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Open high resolution in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>
                <button
                  type="button"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  onClick={() => setViewingProof(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Proof Image Container */}
            <div className="w-full flex items-center justify-center overflow-auto rounded-2xl bg-zinc-950/80 border border-zinc-800 p-2">
              <img
                src={viewingProof.signedUrl}
                alt={viewingProof.proof.file_name}
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
