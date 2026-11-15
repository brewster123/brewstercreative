import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Commission, 
  CommissionProof, 
  User 
} from '../types';
import {
  fetchProofsForCommission,
  uploadAdminCreativeProof,
  getProofSignedUrl,
  formatProofFileSize,
  validateProofFile,
  getNextProofVersion,
  ALLOWED_PROOF_EXTENSIONS,
} from '../data/proofsData';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Clock,
  Layers,
  FileCheck,
  X,
  ShieldCheck,
} from 'lucide-react';

interface AdminCreativeProofsSectionProps {
  commission: Commission;
  currentUser: User | null;
  onProofUploaded?: (proof: CommissionProof) => void;
}

export const AdminCreativeProofsSection: React.FC<AdminCreativeProofsSectionProps> = ({
  commission,
  currentUser,
  onProofUploaded,
}) => {
  const { dispatchNotification, updateCommissionStatus } = useApp();
  const [proofs, setProofs] = useState<CommissionProof[]>([]);
  const [isLoadingProofs, setIsLoadingProofs] = useState<boolean>(true);
  const [proofsError, setProofsError] = useState<string | null>(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [nextExpectedVersion, setNextExpectedVersion] = useState<number>(1);

  // Signed URL Viewing State
  const [openingProofId, setOpeningProofId] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [lightboxProof, setLightboxProof] = useState<{
    proof: CommissionProof;
    signedUrl: string;
    isImage: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCommissionIdRef = useRef<string | undefined>(commission?.id);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load existing proofs for this commission
  const loadProofs = async () => {
    const targetId = commission?.id;
    if (!targetId) return;
    setIsLoadingProofs(true);
    setProofsError(null);

    try {
      const result = await fetchProofsForCommission(targetId);
      if (!isMountedRef.current || activeCommissionIdRef.current !== targetId) return;
      if (result.success) {
        setProofs(result.data);
      } else {
        setProofsError(result.error || 'Failed to load creative proofs.');
      }
    } catch (err: any) {
      if (!isMountedRef.current || activeCommissionIdRef.current !== targetId) return;
      setProofsError(err?.message || 'Error loading creative proofs.');
    } finally {
      if (isMountedRef.current && activeCommissionIdRef.current === targetId) {
        setIsLoadingProofs(false);
      }
    }
  };

  // Update expected next version
  const refreshNextVersion = async () => {
    const targetId = commission?.id;
    if (!targetId) return;
    const nextVer = await getNextProofVersion(targetId);
    if (isMountedRef.current && activeCommissionIdRef.current === targetId) {
      setNextExpectedVersion(nextVer);
    }
  };

  useEffect(() => {
    activeCommissionIdRef.current = commission?.id;
    loadProofs();
    refreshNextVersion();
    // Reset selection when commission changes
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(null);
    setViewError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [commission?.id]);

  // Handle Escape key to dismiss proof lightbox modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxProof) {
        setLightboxProof(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxProof]);

  // Clean up object URL on file change or unmount
  useEffect(() => {
    if (!selectedFile) {
      setFilePreviewUrl(null);
      return;
    }

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setFilePreviewUrl(null);
    }
  }, [selectedFile]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    setUploadSuccess(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validateProofFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadError(null);
    setUploadSuccess(null);

    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validation = validateProofFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setUploadError('Please select a file to upload as a creative proof.');
      return;
    }

    if (isUploading) return; // Prevent duplicate submissions

    if (!currentUser || currentUser.role !== 'admin') {
      setUploadError('Permission denied: Only DESTALION administrators can upload proofs.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await uploadAdminCreativeProof({
        file: selectedFile,
        commissionId: commission.id,
        currentUser,
      });

      if (!result.success || !result.proof) {
        setUploadError(result.error || 'Creative proof upload failed.');
      } else {
        const newProof = result.proof;
        setUploadSuccess(
          `Creative proof (Version ${newProof.version}) "${newProof.fileName}" uploaded successfully to private storage.`
        );
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Update local list
        setProofs((prev) => [newProof, ...prev.filter((p) => p.id !== newProof.id)]);
        refreshNextVersion();

        // Advance commission lifecycle to 'for_review' only if in active production or under revision
        const normStatus = (commission.status || '').toLowerCase().trim();
        const isEligibleForReview =
          normStatus === 'in_progress' ||
          normStatus === 'revision';

        if (isEligibleForReview) {
          const statusRes = await updateCommissionStatus(commission.id, 'for_review');
          if (!statusRes.success) {
            console.warn('[AdminCreativeProofsSection] Notice updating commission status to for_review:', statusRes.error);
          }
        }

        if (onProofUploaded) {
          onProofUploaded(newProof);
        }

        // Notify client that a new creative proof is ready for review
        if (commission.clientId) {
          dispatchNotification({
            recipientId: commission.clientId,
            type: 'proof_review',
            title: 'Creative Proof Ready',
            message: `Creative proof (Version ${newProof.version}) for "${commission.projectName}" is ready for your review.`,
            commissionId: commission.id,
            linkTab: 'review',
          });
        }
      }
    } catch (err: any) {
      setUploadError(err?.message || 'An unexpected error occurred during proof upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle opening / viewing a private proof via short-lived signed URL
  const handleOpenProof = async (proof: CommissionProof) => {
    if (openingProofId) return;

    setOpeningProofId(proof.id);
    setViewError(null);

    try {
      // Generate 5-minute signed URL (300 seconds)
      const result = await getProofSignedUrl(proof.filePath, 300);

      if (result.success && result.signedUrl) {
        const lowerName = (proof.fileName || '').toLowerCase();
        const lowerType = (proof.fileType || '').toLowerCase();
        const isImage =
          lowerType.startsWith('image/') ||
          lowerName.endsWith('.png') ||
          lowerName.endsWith('.jpg') ||
          lowerName.endsWith('.jpeg') ||
          lowerName.endsWith('.webp') ||
          lowerName.endsWith('.gif') ||
          lowerName.endsWith('.svg');

        setLightboxProof({ proof, signedUrl: result.signedUrl, isImage });
      } else {
        setViewError(result.error || 'Failed to generate secure link for this proof.');
      }
    } catch (err: any) {
      setViewError(err?.message || 'Error generating proof access link.');
    } finally {
      setOpeningProofId(null);
    }
  };

  const formatProofStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'revision_requested':
        return {
          label: 'Revision Requested',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'pending_review':
      default:
        return {
          label: 'Pending Review',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
    }
  };

  const formatProofDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isPdf = (proof: CommissionProof) => {
    return (
      proof.fileType === 'application/pdf' ||
      (proof.fileName || '').toLowerCase().endsWith('.pdf')
    );
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: EXISTING CREATIVE PROOFS */}
      <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-accent flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-lg sm:text-xl font-black text-carbon">
                  Creative Proofs
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-code font-bold bg-surface-secondary text-graphite-strong border border-hairline">
                  {proofs.length} {proofs.length === 1 ? 'Proof' : 'Proofs'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-code font-bold bg-[#111114] text-white dark:bg-white dark:text-[#111114] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Private Storage
                </span>
              </div>
              <p className="text-xs text-graphite font-medium mt-0.5">
                Target Project: <strong className="text-carbon font-bold">{commission.projectName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadProofs}
            disabled={isLoadingProofs}
            className="self-start sm:self-auto px-4 py-1.5 rounded-full border border-hairline text-xs font-bold text-graphite hover:text-carbon hover:bg-surface-secondary transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Refresh creative proofs from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProofs ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {viewError && (
          <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{viewError}</span>
            </div>
            <button
              type="button"
              onClick={() => setViewError(null)}
              className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Proofs List */}
        {isLoadingProofs ? (
          <div className="py-12 flex flex-col items-center justify-center text-graphite space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-xs font-medium">Loading creative proofs...</span>
          </div>
        ) : proofsError ? (
          <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{proofsError}</span>
          </div>
        ) : proofs.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-hairline rounded-3xl bg-surface-secondary/60">
            <div className="w-12 h-12 rounded-2xl bg-surface text-graphite border border-hairline flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-display text-sm font-bold text-carbon">
              No creative proofs uploaded yet
            </h4>
            <p className="text-xs text-graphite max-w-md mx-auto mt-1 font-medium">
              Use the upload section below to submit high-resolution proofs, draft iterations, or concept PDF presentations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {proofs.map((proof) => {
              const statusInfo = formatProofStatus(proof.status);
              const pdfFile = isPdf(proof);
              const isOpening = openingProofId === proof.id;

              return (
                <div
                  key={proof.id}
                  className="bg-surface-secondary/80 hover:bg-surface-secondary border border-hairline rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-surface border border-hairline text-carbon flex items-center justify-center shrink-0 shadow-2xs">
                      {pdfFile ? (
                        <FileText className="w-5 h-5 text-rose-500" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-accent" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-code font-black bg-sky-500/15 text-accent border border-accent/30">
                          v{proof.version}
                        </span>
                        <h4 className="font-display text-sm font-bold text-carbon truncate" title={proof.fileName || 'Untitled Proof'}>
                          {proof.fileName || 'Untitled Proof'}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-graphite font-medium mt-1 flex-wrap">
                        <span>Type: <strong className="text-carbon font-mono-code font-semibold">{proof.fileType || 'File'}</strong></span>
                        <span>•</span>
                        <span>Size: <strong className="text-carbon font-mono-code font-semibold">{formatProofFileSize(proof.fileSize)}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-graphite" />
                          {formatProofDate(proof.createdAt)}
                        </span>
                      </div>

                      {proof.revisionNote && (
                        <p className="mt-2 text-xs text-graphite-strong bg-surface border border-hairline rounded-xl p-2.5">
                          <strong className="text-carbon">Revision Note:</strong> {proof.revisionNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenProof(proof)}
                      disabled={isOpening}
                      className="px-4 py-2 rounded-full bg-[#111114] hover:bg-black text-white dark:bg-white dark:text-[#111114] dark:hover:bg-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                      title="Generate secure signed link and open file"
                    >
                      {isOpening ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Authorizing...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: UPLOAD CREATIVE PROOF */}
      <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-hairline">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-accent flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-black text-carbon">
              Upload Creative Proof
            </h3>
            <p className="text-xs text-graphite font-medium">
              Files will be stored securely in the private <code className="text-carbon font-mono-code font-bold">commission-proofs</code> bucket as <strong className="text-accent font-bold">Version {nextExpectedVersion}</strong>.
            </p>
          </div>
        </div>

        {uploadSuccess && (
          <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadSuccess(null)}
              className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploadError && (
          <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-5">
          {/* File Picker / Drag and Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
              selectedFile
                ? 'border-accent bg-sky-500/5'
                : 'border-hairline hover:border-accent/60 bg-surface-secondary/60 hover:bg-surface-secondary'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="creative-proof-file-input"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-4">
                {filePreviewUrl ? (
                  <div className="max-w-xs mx-auto aspect-[16/10] rounded-2xl overflow-hidden border border-hairline bg-surface-secondary shadow-2xs relative">
                    <img
                      src={filePreviewUrl}
                      alt="Selected preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] font-mono-code text-white font-bold">
                      Local Preview
                    </span>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/15 text-accent flex items-center justify-center mx-auto">
                    <FileCheck className="w-8 h-8" />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold text-carbon font-display break-all">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-graphite font-mono-code mt-0.5">
                    {formatProofFileSize(selectedFile.size)} • {selectedFile.type || 'Document'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isUploading}
                    className="px-4 py-1.5 rounded-full border border-hairline text-xs font-bold text-graphite hover:text-carbon hover:bg-surface-secondary transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Choose Different File</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-accent flex items-center justify-center mx-auto shadow-2xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-carbon">
                    Click to browse or drag and drop your creative proof
                  </p>
                  <p className="text-xs text-graphite font-medium mt-1">
                    Supported formats: <strong className="text-carbon">JPG, PNG, WebP, GIF, PDF</strong> (Up to 50 MB)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-full bg-surface hover:bg-surface-secondary text-carbon text-xs font-bold border border-hairline shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-accent" />
                  <span>Select Proof File</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-graphite font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Next Version to assign: <strong className="text-carbon font-mono-code font-bold">v{nextExpectedVersion}</strong></span>
            </div>

            <button
              id="btn-upload-creative-proof-submit"
              type="submit"
              disabled={!selectedFile || isUploading}
              className="btn-tactile px-6 py-3 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Proof to Storage...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Creative Proof (v{nextExpectedVersion})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Creative Proof Lightbox Modal */}
      {lightboxProof && (
        <div 
          onClick={() => setLightboxProof(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Proof preview: ${lightboxProof.proof.fileName}`}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden cursor-default shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  v{lightboxProof.proof.version}
                </span>
                <span className="text-white text-xs sm:text-sm font-semibold truncate max-w-xs sm:max-w-md">
                  {lightboxProof.proof.fileName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxProof(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Viewport */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
              {lightboxProof.isImage ? (
                <img
                  src={lightboxProof.signedUrl}
                  alt={lightboxProof.proof.fileName}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-xl"
                />
              ) : (
                <iframe
                  src={lightboxProof.signedUrl}
                  title={lightboxProof.proof.fileName}
                  className="w-full h-[75vh] rounded-lg bg-white border border-zinc-800"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
