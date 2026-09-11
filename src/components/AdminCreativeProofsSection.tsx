import React, { useState, useEffect, useRef } from 'react';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing proofs for this commission
  const loadProofs = async () => {
    if (!commission?.id) return;
    setIsLoadingProofs(true);
    setProofsError(null);

    try {
      const result = await fetchProofsForCommission(commission.id);
      if (result.success) {
        setProofs(result.data);
      } else {
        setProofsError(result.error || 'Failed to load creative proofs.');
      }
    } catch (err: any) {
      setProofsError(err?.message || 'Error loading creative proofs.');
    } finally {
      setIsLoadingProofs(false);
    }
  };

  // Update expected next version
  const refreshNextVersion = async () => {
    if (!commission?.id) return;
    const nextVer = await getNextProofVersion(commission.id);
    setNextExpectedVersion(nextVer);
  };

  useEffect(() => {
    loadProofs();
    refreshNextVersion();
    // Reset selection when commission changes
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(null);
  }, [commission?.id]);

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
      setUploadError('Permission denied: Only Brewster Creative administrators can upload proofs.');
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

        if (onProofUploaded) {
          onProofUploaded(newProof);
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
        window.open(result.signedUrl, '_blank', 'noopener,noreferrer');
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
      proof.fileName.toLowerCase().endsWith('.pdf')
    );
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: EXISTING CREATIVE PROOFS */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-lg sm:text-xl font-black text-zinc-900">
                  Creative Proofs
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-code font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {proofs.length} {proofs.length === 1 ? 'Proof' : 'Proofs'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-code font-bold bg-zinc-900 text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Private Storage
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Target Project: <strong className="text-zinc-800 font-bold">{commission.projectName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadProofs}
            disabled={isLoadingProofs}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh creative proofs from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProofs ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {viewError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{viewError}</span>
            </div>
            <button
              type="button"
              onClick={() => setViewError(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Proofs List */}
        {isLoadingProofs ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-xs font-medium">Loading creative proofs...</span>
          </div>
        ) : proofsError ? (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{proofsError}</span>
          </div>
        ) : proofs.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-zinc-200 rounded-[24px] bg-zinc-50/60">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-display text-sm font-bold text-zinc-800">
              No creative proofs uploaded yet
            </h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 font-medium">
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
                  className="bg-zinc-50/80 hover:bg-zinc-50 border border-zinc-200 rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
                      {pdfFile ? (
                        <FileText className="w-5 h-5 text-rose-500" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-orange-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-code font-black bg-orange-100 text-orange-800 border border-orange-200">
                          v{proof.version}
                        </span>
                        <h4 className="font-display text-sm font-bold text-zinc-900 truncate" title={proof.fileName}>
                          {proof.fileName}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium mt-1 flex-wrap">
                        <span>Type: <strong className="text-zinc-700 font-mono-code font-semibold">{proof.fileType || 'File'}</strong></span>
                        <span>•</span>
                        <span>Size: <strong className="text-zinc-700 font-mono-code font-semibold">{formatProofFileSize(proof.fileSize)}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {formatProofDate(proof.createdAt)}
                        </span>
                      </div>

                      {proof.revisionNote && (
                        <p className="mt-2 text-xs text-zinc-600 bg-white border border-zinc-200 rounded-xl p-2.5">
                          <strong className="text-zinc-800">Revision Note:</strong> {proof.revisionNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenProof(proof)}
                      disabled={isOpening}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
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
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-black text-zinc-900">
              Upload Creative Proof
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              Files will be stored securely in the private <code className="text-zinc-800 font-mono-code font-bold">commission-proofs</code> bucket as <strong className="text-orange-600 font-bold">Version {nextExpectedVersion}</strong>.
            </p>
          </div>
        </div>

        {uploadSuccess && (
          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadSuccess(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploadError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-500 hover:text-rose-800"
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
            className={`border-2 border-dashed rounded-[28px] p-6 sm:p-8 text-center transition-all ${
              selectedFile
                ? 'border-orange-500 bg-orange-50/20'
                : 'border-zinc-200 hover:border-orange-400 bg-zinc-50/50 hover:bg-zinc-50'
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
                  <div className="max-w-xs mx-auto aspect-[16/10] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-2xs relative">
                    <img
                      src={filePreviewUrl}
                      alt="Selected preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono-code text-white font-bold">
                      Local Preview
                    </span>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                    <FileCheck className="w-8 h-8" />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold text-zinc-900 font-display break-all">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-zinc-500 font-mono-code mt-0.5">
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
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Choose Different File</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto shadow-2xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">
                    Click to browse or drag and drop your creative proof
                  </p>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Supported formats: <strong className="text-zinc-700">JPG, PNG, WebP, GIF, PDF</strong> (Up to 50 MB)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold border border-zinc-300 shadow-2xs transition-all inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4 text-orange-500" />
                  <span>Select Proof File</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-zinc-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Next Version to assign: <strong className="text-zinc-800 font-mono-code font-bold">v{nextExpectedVersion}</strong></span>
            </div>

            <button
              id="btn-upload-creative-proof-submit"
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};
