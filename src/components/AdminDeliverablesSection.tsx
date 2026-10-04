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
  getDeliverableSignedUrl,
  formatDeliverableFileSize,
  validateDeliverableFile
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

  // Load deliverables for commission
  const loadDeliverables = async () => {
    if (!commission?.id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await fetchCommissionDeliverables(commission.id);
      if (error) {
        setErrorMsg(error);
      } else {
        setDeliverables(data || []);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load deliverables.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliverables();
  }, [commission?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDeliverableFile(file, file.name);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid deliverable file.');
      setSelectedFile(null);
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
      const nextVersion = deliverables.length + 1;
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
    setDownloadingId(item.id);
    setActionError(null);
    try {
      const { signedUrl, error: signErr } = await getDeliverableSignedUrl(item.filePath, 3600);
      if (signErr || !signedUrl) {
        setActionError(signErr || 'Failed to acquire secure signed download URL.');
        return;
      }

      // Open signed URL or trigger download
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = item.fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setActionError(err?.message || 'Download attempt failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (item: CommissionDeliverable) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete deliverable "${item.fileName}"? This will permanently remove the file from private Storage and the database.`
    );
    if (!confirmDelete) return;

    setActionError(null);
    try {
      const { success, error: delErr } = await deleteCommissionDeliverable(item);
      if (!success) {
        setActionError(delErr || 'Failed to remove deliverable.');
        return;
      }
      setDeliverables(prev => prev.filter(d => d.id !== item.id));
    } catch (err: any) {
      setActionError(err?.message || 'Error occurred while deleting deliverable.');
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
    <div className="bg-white border border-zinc-200 rounded-[28px] p-6 space-y-6 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-black text-base text-zinc-900">
                Final Deliverables Management
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                Stage 08
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Deliver production-ready master files (.ZIP, .SVG, .PDF, .PNG) stored in private Supabase Storage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAlreadyCompleted ? (
            <span className="px-3 py-1 rounded-xl bg-zinc-900 text-white border border-zinc-900 text-xs font-mono-code font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Completed (Stage 08)
            </span>
          ) : isStageReadyForDelivery ? (
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono-code font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready for Delivery
            </span>
          ) : (
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono-code font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Stage 0{commission.currentStage} (Prior to Final Approval)
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{actionError}</span>
        </div>
      )}

      {completionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{completionSuccess}</span>
        </div>
      )}

      {/* Completion Action Banner for final_approval */}
      {isFinalApproval && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-[10px] uppercase tracking-wider text-emerald-800 font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                Action Required · Stage 07 Approved
              </span>
            </div>
            <h5 className="font-display font-bold text-sm text-zinc-900">
              Ready to Finalize Commission
            </h5>
            <p className="text-xs text-zinc-600">
              The creative proof has been approved by the client. Once all production assets are uploaded below, mark this commission as completed to finalize the engagement and update the client portal.
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkCompleted}
            disabled={isCompleting || deliverables.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
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
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-zinc-900">
                Commission Completed · Stage 08 (100%)
              </h5>
              <p className="text-[11px] text-zinc-500">
                This project has been finalized and completed. All master files are released to the client.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono-code font-bold">
            Archived / Complete
          </span>
        </div>
      )}

      {/* Upload Box Form */}
      <form onSubmit={handleUploadSubmit} className="bg-zinc-50/80 border border-zinc-200/90 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono-code font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-orange-500" />
            Upload Production Deliverable
          </span>
          <span className="text-[11px] font-mono-code text-zinc-400">
            Max 100 MB per file (Private Storage)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Select Production File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="w-full text-xs text-zinc-700 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 file:cursor-pointer p-2 rounded-xl bg-white border border-zinc-200"
            />
            {selectedFile && (
              <p className="text-[11px] font-mono-code text-emerald-600 mt-1">
                Selected: {selectedFile.name} ({formatDeliverableFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Deliverable Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Master Production Suite (.ZIP) or Primary Vector Marks"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={isUploading}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">
            Optional Manifest Notes / Instructions
          </label>
          <input
            type="text"
            placeholder="e.g. Includes vector EPS, print PDF, and layered PSD files."
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            disabled={isUploading}
            className="w-full text-xs px-3.5 py-2 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-zinc-400 font-medium">
            File is encrypted and stored in private Supabase Storage. Clients receive real-time alert.
          </p>
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
              !selectedFile || isUploading
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <h5 className="text-xs font-mono-code font-bold uppercase text-zinc-600 tracking-wider">
            Active Deliverables Manifest ({deliverables.length})
          </h5>
          <button
            type="button"
            onClick={loadDeliverables}
            className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Refresh list
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-zinc-400 font-mono-code">
            Loading deliverables from Supabase...
          </div>
        ) : errorMsg ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            {errorMsg}
          </div>
        ) : deliverables.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-zinc-500 text-xs space-y-1">
            <FileText className="w-6 h-6 text-zinc-300 mx-auto mb-1" />
            <p className="font-bold text-zinc-700">No final files delivered yet</p>
            <p className="text-[11px] text-zinc-400">
              When the commission is ready for completion, upload the production assets above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
            {deliverables.map((item) => {
              const isDownloading = downloadingId === item.id;
              const dateFormatted = item.createdAt 
                ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent';

              return (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0 mt-0.5">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h6 className="text-xs font-bold text-zinc-900">
                          {item.title || item.fileName}
                        </h6>
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-mono-code font-bold text-zinc-600">
                          v{item.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono-code mt-0.5">
                        {item.fileName} · {formatDeliverableFileSize(item.fileSize)} · Delivered {dateFormatted}
                      </p>
                      {item.description && (
                        <p className="text-xs text-zinc-600 mt-1">
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
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Generate secure signed download URL"
                    >
                      {isDownloading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-100">
            <span className="text-xs text-zinc-500 font-medium">
              All deliverables uploaded? Finalize and complete this commission.
            </span>
            <button
              type="button"
              onClick={handleMarkCompleted}
              disabled={isCompleting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
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

    </div>
  );
};
