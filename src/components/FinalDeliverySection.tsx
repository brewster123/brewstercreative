import React, { useState, useEffect } from 'react';
import { Commission, CommissionDeliverable } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Download, 
  CheckCircle2, 
  FolderArchive, 
  Calendar, 
  FileText, 
  Send,
  ShieldCheck,
  Star,
  FileCheck,
  AlertTriangle,
  Clock,
  ExternalLink
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
  const { setActiveView } = useApp();
  const [deliverables, setDeliverables] = useState<CommissionDeliverable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Download states per file ID
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Load real deliverables from Supabase
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

  // Secure signed download handler
  const handleDownloadFile = async (deliverable: CommissionDeliverable) => {
    setDownloadingId(deliverable.id);
    setDownloadError(null);
    try {
      // Generate temporary authorized signed URL with 1-hour expiration
      const { signedUrl, error: signErr } = await getDeliverableSignedUrl(deliverable.filePath, 3600);
      if (signErr || !signedUrl) {
        setDownloadError(signErr || 'Failed to acquire authorized signed download URL. Please try again.');
        return;
      }

      // Trigger secure browser download
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = deliverable.fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccessId(deliverable.id);
      setTimeout(() => setDownloadSuccessId(null), 3500);
    } catch (err: any) {
      setDownloadError(err?.message || 'A network error occurred while starting download.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download all files in sequence
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
          // Small pause between multiple trigger clicks
          await new Promise(r => setTimeout(r, 400));
        }
      }
      setDownloadSuccessId('all');
      setTimeout(() => setDownloadSuccessId(null), 3500);
    } catch (err: any) {
      setDownloadError(err?.message || 'Failed while preparing all download links.');
    } finally {
      setDownloadingId(null);
    }
  };

  const completedDate = commission.updatedAt 
    ? new Date(commission.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Completed';

  // Calculate total package size
  const totalSizeBytes = deliverables.reduce((acc, d) => acc + (d.fileSize || 0), 0);
  const totalSizeFormatted = formatDeliverableFileSize(totalSizeBytes);

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-10 shadow-xs relative overflow-hidden text-center sm:text-left">
      
      {/* Background celebration glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-zinc-200/80">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 p-0.5 shadow-xs shrink-0 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="text-center sm:text-left">
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono-code font-bold border border-emerald-200 inline-block mb-1">
              ✓ STAGE 08 — FINAL DELIVERY
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
              {deliverables.length > 0 ? '🎉 Your deliverables are ready!' : 'Preparing Final Deliverables'}
            </h2>
          </div>
        </div>

        <div className="bg-zinc-50 px-5 py-3 rounded-2xl border border-zinc-200/80 text-center sm:text-right">
          <div className="text-[11px] text-zinc-500 font-mono-code uppercase font-bold">Project State</div>
          <div className="text-sm font-bold text-zinc-800 flex items-center gap-1.5 justify-center sm:justify-end">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{completedDate}</span>
          </div>
        </div>
      </div>

      {downloadError && (
        <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Project Final Showcase & Downloads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 text-left">
        
        {/* Left: Summary / Specs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h4 className="font-display text-base font-bold text-zinc-900">
                {commission.projectName}
              </h4>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {commission.description || 'Custom creative design production commissioned through Brewster Creative.'}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl border border-zinc-200">
                <span className="text-[10px] font-mono-code text-zinc-400 font-bold uppercase block">
                  Lead Designer
                </span>
                <span className="text-xs font-bold text-zinc-800">
                  {commission.assignedDesigner || 'Brewster A. Cabando'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-zinc-200">
                <span className="text-[10px] font-mono-code text-zinc-400 font-bold uppercase block">
                  Delivered Total Files
                </span>
                <span className="text-xs font-bold text-emerald-600 font-mono-code">
                  {deliverables.length} {deliverables.length === 1 ? 'Asset' : 'Assets'}
                </span>
              </div>
            </div>
          </div>

          {/* Licensing & Commercial Rights Note */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-zinc-600 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-900 block text-xs">Full Commercial Release</span>
              <span className="text-[11px] leading-relaxed text-zinc-600 mt-0.5 block">
                All production master files delivered below are licensed for worldwide commercial distribution, reproduction, and trademark registration.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Deliverables List & Downloads */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-[28px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-orange-500" />
                <h4 className="font-display text-sm font-black text-zinc-900">
                  Production Deliverables
                </h4>
              </div>
              {deliverables.length > 0 && (
                <span className="text-xs font-mono-code text-zinc-500 font-bold">
                  {totalSizeFormatted}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-zinc-400 font-mono-code">
                Loading production files...
              </div>
            ) : loadError ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                {loadError}
              </div>
            ) : deliverables.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs space-y-1">
                <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2 opacity-60" />
                <p className="font-bold text-zinc-700">Final files are being prepared</p>
                <p className="text-[11px] text-zinc-400">
                  Brewster is compiling your master production files. You will receive an alert once uploaded.
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {deliverables.map((item) => {
                    const isDownloading = downloadingId === item.id;
                    const isSuccess = downloadSuccessId === item.id;

                    return (
                      <li key={item.id} className="p-3 rounded-xl bg-white border border-zinc-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="block truncate font-mono-code text-xs font-bold text-zinc-800">
                              {item.title || item.fileName}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono-code">
                              {item.fileName} · {formatDeliverableFileSize(item.fileSize)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadFile(item)}
                          disabled={isDownloading}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-orange-500 hover:text-white text-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                          title="Generate secure download link"
                        >
                          {isDownloading ? (
                            <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          ) : isSuccess ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[11px] font-mono-code">
                            {isDownloading ? 'Signing...' : isSuccess ? 'Ready' : 'Get'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Master Download Action Button */}
                {deliverables.length > 1 && (
                  <button
                    id="btn-download-final-package"
                    type="button"
                    onClick={handleDownloadAll}
                    disabled={downloadingId === 'all'}
                    className={`w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                      downloadSuccessId === 'all'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {downloadingId === 'all' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating Secure Signed Links...</span>
                      </>
                    ) : downloadSuccessId === 'all' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>All Downloads Initiated!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download All Production Deliverables</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Thank you note & CTA */}
      <div className="pt-8 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 bg-zinc-50 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-6 sm:p-8 rounded-b-[32px]">
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-1.5 text-amber-500 mb-1 justify-center sm:justify-start">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h4 className="font-display text-lg font-black text-zinc-900">
            Thank you for collaborating with Brewster Creative!
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            It was a pleasure bringing your vision for {commission.projectName} to life.
          </p>
        </div>

        <button
          id="btn-commission-another-project"
          type="button"
          onClick={() => setActiveView('commission-form')}
          className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Commission Another Project</span>
        </button>
      </div>

    </div>
  );
};
