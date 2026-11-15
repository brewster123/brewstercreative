import React, { useState, useEffect, useRef } from 'react';
import { 
  Commission, 
  CommissionDeliverable, 
  User 
} from '../types';
import { 
  fetchCommissionDeliverables, 
  uploadCommissionDeliverable, 
  deleteCommissionDeliverable, 
  downloadDeliverableFile,
  getDeliverableSignedUrl,
  formatDeliverableFileSize,
  validateDeliverableFile,
  DELIVERABLE_SIGNED_URL_EXPIRY_SECONDS
} from '../lib/deliverables';
import { useApp } from '../context/AppContext';
import { 
  UploadCloud, 
  FolderArchive, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  FileCheck, 
  Clock, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

interface AdminDeliverablesSectionProps {
  commission: Commission;
  currentUser?: User | null;
  onDeliverableUploaded?: (deliverable: CommissionDeliverable) => void;
}

export const AdminDeliverablesSection: React.FC<AdminDeliverablesSectionProps> = ({
  commission,
  currentUser: propUser,
  onDeliverableUploaded,
}) => {
  const { currentUser: contextUser, dispatchNotification, updateCommissionStage } = useApp();
  const currentUser = propUser || contextUser;
  const [deliverables, setDeliverables] = useState<CommissionDeliverable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mark Completed action state
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [completionSuccess, setCompletionSuccess] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signed URL downloading state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deliverableToDelete, setDeliverableToDelete] = useState<CommissionDeliverable | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const activeCommissionIdRef = useRef<string | undefined>(commission?.id);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load deliverables for commission
  const loadDeliverables = async () => {
    const targetId = commission?.id;
    if (!targetId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await fetchCommissionDeliverables(targetId);
      if (!isMountedRef.current || activeCommissionIdRef.current !== targetId) return;
      if (error) {
        setErrorMsg(error);
      } else {
        setDeliverables(data || []);
      }
    } catch (err: any) {
      if (!isMountedRef.current || activeCommissionIdRef.current !== targetId) return;
      setErrorMsg(err?.message || 'Failed to load deliverables.');
    } finally {
      if (isMountedRef.current && activeCommissionIdRef.current === targetId) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    activeCommissionIdRef.current = commission?.id;
    setSelectedFile(null);
    setCustomTitle('');
    setCustomDescription('');
    setUploadError(null);
    setUploadSuccess(null);
    setCompletionSuccess(null);
    setActionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    loadDeliverables();
  }, [commission?.id]);

  // Handle Escape key to dismiss delete confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deliverableToDelete && !isDeleting) {
        setDeliverableToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deliverableToDelete, isDeleting]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDeliverableFile(file, file.name);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid deliverable file.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (!customTitle) {
      // Set default title from file name without extension
      const namePart = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setCustomTitle(namePart.replace(/[_-]/g, ' '));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose a file to deliver.');
      return;
    }
    if (!currentUser?.id) {
      setUploadError('Authenticated admin session required.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const nextVersion = deliverables.reduce((max, d) => Math.max(max, Number(d.version) || 0), 0) + 1;
      const { data: newDeliv, error: uploadErr } = await uploadCommissionDeliverable({
        commissionId: commission.id,
        adminUserId: currentUser.id,
        file: selectedFile,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        title: customTitle.trim() || selectedFile.name,
        description: customDescription.trim() || undefined,
        version: nextVersion,
      });

      if (uploadErr || !newDeliv) {
        setUploadError(uploadErr || 'Deliverable upload failed.');
        return;
      }

      setUploadSuccess(`✓ "${newDeliv.fileName}" successfully uploaded to private storage and logged.`);
      setSelectedFile(null);
      setCustomTitle('');
      setCustomDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Prepend to list
      setDeliverables(prev => [newDeliv, ...prev]);

      if (onDeliverableUploaded) {
        onDeliverableUploaded(newDeliv);
      }

      // Notify Client: Phase 5B integration
      if (commission.clientId) {
        dispatchNotification({
          recipientId: commission.clientId,
          type: 'commission_completed',
          title: 'Final Delivery Ready',
          message: `Final production deliverable "${newDeliv.title || newDeliv.fileName}" is ready for download in your Final Delivery dashboard!`,
          commissionId: commission.id,
          linkTab: 'delivery',
        });
      }
    } catch (err: any) {
      setUploadError(err?.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (item: CommissionDeliverable) => {
    if (downloadingId) return; // Prevent duplicate clicks during active download
    setDownloadingId(item.id);
    setActionError(null);
    try {
      const { success, error: downloadErr } = await downloadDeliverableFile(
        item.filePath,
        item.fileName
      );
      if (!success || downloadErr) {
        setActionError(downloadErr || 'Failed to download deliverable file.');
        return;
      }
    } catch (err: any) {
      setActionError(err?.message || 'Download attempt failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRequestDelete = (item: CommissionDeliverable) => {
    setActionError(null);
    setDeliverableToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!deliverableToDelete) return;

    setIsDeleting(true);
    setActionError(null);
    try {
      const { success, error: delErr } = await deleteCommissionDeliverable(deliverableToDelete);
      if (!success) {
        setActionError(delErr || 'Failed to remove deliverable.');
        return;
      }
      setDeliverables(prev => prev.filter(d => d.id !== deliverableToDelete.id));
      setDeliverableToDelete(null);
    } catch (err: any) {
      setActionError(err?.message || 'Error occurred while deleting deliverable.');
    } finally {
      setIsDeleting(false);
    }
  };

  const normStatus = (commission.status || '').toLowerCase().trim();
  const isFinalApproval = normStatus === 'final_approval' || normStatus === 'final approval';
  const isAlreadyCompleted = normStatus === 'completed' || commission.currentStage === 8;
  const isStageReadyForDelivery = commission.currentStage >= 7;

  // Handle explicit admin action to complete the project
  const handleMarkCompleted = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setActionError('Permission denied: Only administrators can complete commissions.');
      return;
    }

    if (!isFinalApproval) {
      setActionError(`Cannot complete commission: Current status is "${commission.status}". Project must be in "final_approval" after creative proof approval.`);
      return;
    }

    if (deliverables.length === 0) {
      setActionError('Please upload at least one final production deliverable before marking this commission as completed.');
      return;
    }

    setIsCompleting(true);
    setActionError(null);
    setCompletionSuccess(null);

    try {
      const res = await updateCommissionStage(
        commission.id,
        8,
        'Final Delivery',
        'Project marked completed by administrator. All final deliverables deployed to client portal.'
      );

      if (!res.success) {
        setActionError(res.error || 'Failed to mark commission as completed in database.');
        return;
      }

      setCompletionSuccess('✓ Commission successfully marked as completed! Milestone advanced to Stage 08 (100%).');
    } catch (err: any) {
      setActionError(err?.message || 'An unexpected error occurred while completing the commission.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-surface border border-hairline rounded-3xl p-6 space-y-6 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-hairline">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-black text-base text-carbon">
                Final Deliverables Management
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-surface-secondary text-graphite-strong border border-hairline">
                Stage 08
              </span>
            </div>
            <p className="text-xs text-graphite mt-0.5">
              Deliver production-ready master files (.ZIP, .SVG, .PDF, .PNG) stored in private Supabase Storage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAlreadyCompleted ? (
            <span className="px-3.5 py-1 rounded-full bg-[#111114] text-white dark:bg-white dark:text-[#111114] text-xs font-mono-code font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Completed (Stage 08)
            </span>
          ) : isStageReadyForDelivery ? (
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-mono-code font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready for Delivery
            </span>
          ) : (
            <span className="px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-mono-code font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Stage 0{commission.currentStage} (Prior to Final Approval)
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{actionError}</span>
        </div>
      )}

      {completionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{completionSuccess}</span>
        </div>
      )}

      {/* Completion Action Banner for final_approval */}
      {isFinalApproval && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/90 dark:border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50">
                Action Required · Stage 07 Approved
              </span>
            </div>
            <h5 className="font-display font-bold text-sm text-carbon">
              Ready to Finalize Commission
            </h5>
            <p className="text-xs text-graphite">
              The creative proof has been approved by the client. Once all production assets are uploaded below, mark this commission as completed to finalize the engagement and update the client portal.
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkCompleted}
            disabled={isCompleting || deliverables.length === 0}
            className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            title={deliverables.length === 0 ? "Upload at least one final deliverable before completing" : "Mark Commission Completed"}
          >
            {isCompleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Completing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Commission Completed</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Already Completed Status Banner */}
      {isAlreadyCompleted && (
        <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-carbon">
                Commission Completed · Stage 08 (100%)
              </h5>
              <p className="text-[11px] text-graphite">
                This project has been finalized and completed. All master files are released to the client.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-mono-code font-bold">
            Archived / Complete
          </span>
        </div>
      )}

      {/* Upload Box Form */}
      <form onSubmit={handleUploadSubmit} className="bg-surface-secondary/80 border border-hairline rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono-code font-bold text-carbon uppercase tracking-wider flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-accent" />
            Upload Production Deliverable
          </span>
          <span className="text-[11px] font-mono-code text-graphite">
            Max 100 MB per file (Private Storage)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-graphite-strong mb-1">
              Select Production File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="w-full text-xs text-carbon file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#111114] file:text-white hover:file:bg-black dark:file:bg-white dark:file:text-[#111114] file:cursor-pointer p-2 rounded-xl bg-surface border border-hairline"
            />
            {selectedFile && (
              <p className="text-[11px] font-mono-code text-emerald-600 dark:text-emerald-400 mt-1">
                Selected: {selectedFile.name} ({formatDeliverableFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-bold text-graphite-strong mb-1">
              Deliverable Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Master Production Suite (.ZIP) or Primary Vector Marks"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={isUploading}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface text-carbon border border-hairline focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-graphite-strong mb-1">
            Optional Manifest Notes / Instructions
          </label>
          <input
            type="text"
            placeholder="e.g. Includes vector EPS, print PDF, and layered PSD files."
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            disabled={isUploading}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-surface text-carbon border border-hairline focus:outline-none focus:border-accent"
          />
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-graphite font-medium">
            File is encrypted and stored in private Supabase Storage. Clients receive real-time alert.
          </p>
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 ${
              !selectedFile || isUploading
                ? 'bg-surface border border-hairline text-graphite opacity-50 cursor-not-allowed'
                : 'btn-tactile bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] cursor-pointer'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#111114] border-t-transparent rounded-full animate-spin" />
                <span>Uploading Deliverable...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload to Client Deliverables</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Deliverables Table / Manifest */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-mono-code font-bold uppercase text-graphite tracking-wider">
            Active Deliverables Manifest ({deliverables.length})
          </h5>
          <button
            type="button"
            onClick={loadDeliverables}
            className="text-[11px] font-bold text-graphite hover:text-carbon transition-colors cursor-pointer"
          >
            Refresh list
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-graphite font-mono-code">
            Loading deliverables from Supabase...
          </div>
        ) : errorMsg ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs">
            {errorMsg}
          </div>
        ) : deliverables.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surface-secondary border border-dashed border-hairline text-graphite text-xs space-y-1">
            <FileText className="w-6 h-6 text-graphite/60 mx-auto mb-1" />
            <p className="font-bold text-carbon">No final files delivered yet</p>
            <p className="text-[11px] text-graphite">
              When the commission is ready for completion, upload the production assets above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hairline border border-hairline rounded-2xl overflow-hidden bg-surface">
            {deliverables.map((item) => {
              const isDownloading = downloadingId === item.id;
              const dateFormatted = item.createdAt 
                ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent';

              return (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-secondary/70 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h6 className="text-xs font-bold text-carbon">
                          {item.title || item.fileName}
                        </h6>
                        <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-[10px] font-mono-code font-bold text-graphite border border-hairline">
                          v{item.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-graphite font-mono-code mt-0.5">
                        {item.fileName} · {formatDeliverableFileSize(item.fileSize)} · Delivered {dateFormatted}
                      </p>
                      {item.description && (
                        <p className="text-xs text-graphite-strong mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      disabled={isDownloading}
                      className="px-4 py-1.5 rounded-full bg-[#111114] hover:bg-black text-white dark:bg-white dark:text-[#111114] dark:hover:bg-zinc-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Generate secure signed download URL"
                    >
                      {isDownloading ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestDelete(item)}
                      className="p-1.5 rounded-full text-graphite hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete deliverable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom completion CTA if deliverables exist and project is in final_approval */}
        {isFinalApproval && deliverables.length > 0 && (
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-hairline">
            <span className="text-xs text-graphite font-medium">
              All deliverables uploaded? Finalize and complete this commission.
            </span>
            <button
              type="button"
              onClick={handleMarkCompleted}
              disabled={isCompleting}
              className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isCompleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Commission Completed</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Delete Deliverable Confirmation Modal */}
      {deliverableToDelete && (
        <div 
          onClick={() => !isDeleting && setDeliverableToDelete(null)}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-hairline rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-carbon">Delete Deliverable</h4>
                <p className="text-xs text-graphite">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-graphite-strong leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-carbon">"{deliverableToDelete.fileName}"</strong>? The file will be removed from private Storage and the project ledger.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeliverableToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete File</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
