import React, { useState, useEffect } from 'react';
import { Commission, CommissionDeliverable } from '../types';
import { 
  Download, 
  Check, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  fetchCommissionDeliverables, 
  getDeliverableSignedUrl, 
  formatDeliverableFileSize,
  subscribeToCommissionDeliverables
} from '../lib/deliverables';

interface FinalDeliverySectionProps {
  commission: Commission;
}

export const FinalDeliverySection: React.FC<FinalDeliverySectionProps> = ({ commission }) => {
  const [deliverables, setDeliverables] = useState<CommissionDeliverable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const loadDeliverables = async () => {
    if (!commission?.id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await fetchCommissionDeliverables(commission.id);
      if (error) {
        setLoadError(error);
      } else {
        setDeliverables(data || []);
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to retrieve deliverables from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliverables();

    const unsubscribe = subscribeToCommissionDeliverables(commission.id, () => {
      loadDeliverables();
    });

    return () => {
      unsubscribe();
    };
  }, [commission?.id]);

  const handleDownloadFile = async (deliverable: CommissionDeliverable) => {
    setDownloadingId(deliverable.id);
    setDownloadError(null);
    try {
      const { signedUrl, error: signErr } = await getDeliverableSignedUrl(deliverable.filePath, 3600);
      if (signErr || !signedUrl) {
        setDownloadError(signErr || 'Failed to acquire authorized download URL.');
        return;
      }

      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = deliverable.fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccessId(deliverable.id);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err: any) {
      setDownloadError(err?.message || 'Network error initiating download.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    if (deliverables.length === 0) return;
    setDownloadingId('all');
    setDownloadError(null);

    try {
      for (const item of deliverables) {
        const { signedUrl } = await getDeliverableSignedUrl(item.filePath, 3600);
        if (signedUrl) {
          const a = document.createElement('a');
          a.href = signedUrl;
          a.download = item.fileName;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise(r => setTimeout(r, 350));
        }
      }
      setDownloadSuccessId('all');
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err: any) {
      setDownloadError(err?.message || 'Error occurred while preparing file links.');
    } finally {
      setDownloadingId(null);
    }
  };

  const completedDate = commission.updatedAt 
    ? new Date(commission.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Completed';

  const totalSizeBytes = deliverables.reduce((acc, d) => acc + (d.fileSize || 0), 0);
  const totalSizeFormatted = formatDeliverableFileSize(totalSizeBytes);

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-10 space-y-8">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4E2DC] dark:border-[#27272A]">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <span>Final Delivery · Stage 08 Archive</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
            {commission.projectName}
          </h2>

          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            All approved vector masters, production formats, and full commercial licensing documents.
          </p>
        </div>

        <div className="flex items-baseline gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Released {completedDate}</span>
        </div>
      </div>

      {downloadError && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Main Download Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
            <span>Production Assets</span>
            <span>·</span>
            <span>{deliverables.length} files ({totalSizeFormatted})</span>
          </div>

          {deliverables.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={downloadingId !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadingId === 'all' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing Package...</span>
                </>
              ) : downloadSuccessId === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Package Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Complete Package</span>
                </>
              )}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
            Loading production deliverables...
          </div>
        ) : loadError ? (
          <div className="py-12 text-center text-xs text-red-600 dark:text-red-400">
            {loadError}
          </div>
        ) : deliverables.length === 0 ? (
          <div className="py-16 text-center space-y-2 max-w-sm mx-auto">
            <Clock className="w-6 h-6 text-[#A1A1AA] mx-auto opacity-70" />
            <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
              Final Packaging Underway
            </h4>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Brewster is packaging and verifying your master vector and print files. Once uploaded, download links will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliverables.map((item) => {
              const isDownloading = downloadingId === item.id;
              const isDownloaded = downloadSuccessId === item.id;

              return (
                <article
                  key={item.id}
                  className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 flex items-center justify-between gap-4 transition-all hover:border-[#D4D2CA]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#EA580C]" />
                    </div>

                    <div className="min-w-0">
                      <h4 
                        className="font-display text-sm font-bold text-[#18181B] dark:text-[#EDEDEC] truncate"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </h4>
                      <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                        {formatDeliverableFileSize(item.fileSize)} · {item.fileType?.split('/')?.[1] || 'Asset'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(item)}
                    disabled={isDownloading}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#18181B] dark:hover:border-[#EDEDEC] text-[#18181B] dark:text-[#EDEDEC] transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    title={`Download ${item.fileName}`}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#EA580C]" />
                    ) : isDownloaded ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Download className="w-4 h-4 text-[#EA580C]" />
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Commercial Licensing Ledger */}
      <div className="pt-6 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
          <strong className="text-[#18181B] dark:text-[#EDEDEC] block font-display">
            Full Commercial Rights & Ownership Released
          </strong>
          <span>
            All production master files delivered above are cleared for unrestricted worldwide commercial reproduction, digital publishing, physical fabrication, and trademark registration.
          </span>
        </div>
      </div>

    </div>
  );
};
