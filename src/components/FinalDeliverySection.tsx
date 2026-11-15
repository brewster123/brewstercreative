import React, { useState, useEffect, useRef } from 'react';
import { Commission, CommissionDeliverable } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Download, 
  Check, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  Loader2,
  Lock,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { 
  fetchCommissionDeliverables, 
  downloadDeliverableFile,
  getDeliverableSignedUrl, 
  formatDeliverableFileSize,
  subscribeToCommissionDeliverables,
  DELIVERABLE_SIGNED_URL_EXPIRY_SECONDS
} from '../lib/deliverables';
import { parseCommissionBudget } from '../lib/payments';

interface FinalDeliverySectionProps {
  commission: Commission;
  onNavigateToPayment?: () => void;
}

export const FinalDeliverySection: React.FC<FinalDeliverySectionProps> = ({ 
  commission,
  onNavigateToPayment 
}) => {
  const { currentUser, studioProfile } = useApp();
  const [deliverables, setDeliverables] = useState<CommissionDeliverable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Deliverables are strictly locked for clients unless BOTH paymentStatus is 'Paid' AND totalPaid is true
  const isPaymentSettled = currentUser?.role === 'admin' || (
    commission.paymentStatus === 'Paid' && commission.totalPaid === true
  );

  // Financial calculations for locked deliverable breakdown
  const depositPercent = studioProfile?.gcashDetails?.depositPercentage || 50;
  const currencySymbol = studioProfile?.currencySymbol || '₱';
  const currencyCode = commission.currency || studioProfile?.currency || 'PHP';

  const budgetAnalysis = parseCommissionBudget(
    commission.budget,
    depositPercent,
    currencySymbol,
    currencyCode
  );

  const formatCurrency = (val: number) => {
    return `${budgetAnalysis.currencySymbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalBudgetFormatted = budgetAnalysis.isValid
    ? formatCurrency(budgetAnalysis.numericBudget)
    : String(commission.budget || '—');

  const amountPaidValue = (commission.paymentStatus === 'Paid' && commission.totalPaid)
    ? budgetAnalysis.numericBudget
    : (commission.depositPaid || commission.paymentStatus === 'Partial')
    ? budgetAnalysis.depositAmount
    : 0;

  const remainingBalanceValue = (commission.paymentStatus === 'Paid' && commission.totalPaid)
    ? 0
    : (commission.depositPaid || commission.paymentStatus === 'Partial')
    ? budgetAnalysis.balanceAmount
    : budgetAnalysis.numericBudget;

  const amountPaidFormatted = budgetAnalysis.isValid
    ? formatCurrency(amountPaidValue)
    : (commission.depositPaid ? 'Deposit Verified' : '₱0.00');

  const remainingBalanceFormatted = budgetAnalysis.isValid
    ? formatCurrency(remainingBalanceValue)
    : String(commission.budget || 'Pending calculation');

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const activeCommissionIdRef = useRef<string | undefined>(commission?.id);
  const downloadSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (downloadSuccessTimerRef.current) {
        clearTimeout(downloadSuccessTimerRef.current);
      }
    };
  }, []);

  const loadDeliverables = async () => {
    const targetCommissionId = commission?.id;
    if (!targetCommissionId) {
      if (isMountedRef.current) {
        setDeliverables([]);
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await fetchCommissionDeliverables(targetCommissionId);
      if (!isMountedRef.current || activeCommissionIdRef.current !== targetCommissionId) return;
      if (error) {
        setLoadError(error);
      } else {
        setDeliverables(data || []);
      }
    } catch (err: any) {
      if (!isMountedRef.current || activeCommissionIdRef.current !== targetCommissionId) return;
      setLoadError(err?.message || 'Failed to retrieve deliverables from server.');
    } finally {
      if (isMountedRef.current && activeCommissionIdRef.current === targetCommissionId) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    activeCommissionIdRef.current = commission?.id;
    setDownloadError(null);
    loadDeliverables();

    if (!commission?.id) return;
    const unsubscribe = subscribeToCommissionDeliverables(commission.id, () => {
      loadDeliverables();
    });

    return () => {
      unsubscribe();
    };
  }, [commission?.id]);

  const handleDownloadFile = async (deliverable: CommissionDeliverable) => {
    if (!isPaymentSettled) {
      setDownloadError('Deliverables are locked pending full payment verification. Please settle remaining balance via GCash.');
      return;
    }
    if (downloadingId) return; // Prevent duplicate clicks during active download
    setDownloadingId(deliverable.id);
    setDownloadError(null);
    try {
      const { success, error } = await downloadDeliverableFile(
        deliverable.filePath,
        deliverable.fileName
      );
      if (!isMountedRef.current) return;
      if (!success || error) {
        setDownloadError(error || 'Failed to acquire authorized download.');
        return;
      }

      setDownloadSuccessId(deliverable.id);
      if (downloadSuccessTimerRef.current) {
        clearTimeout(downloadSuccessTimerRef.current);
      }
      downloadSuccessTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) setDownloadSuccessId(null);
      }, 3000);
    } catch (err: any) {
      if (isMountedRef.current) {
        setDownloadError(err?.message || 'Network error initiating download.');
      }
    } finally {
      if (isMountedRef.current) {
        setDownloadingId(null);
      }
    }
  };

  const handleDownloadAll = async () => {
    if (!isPaymentSettled) {
      setDownloadError('Deliverables are locked pending full payment verification. Please settle remaining balance via GCash.');
      return;
    }
    if (deliverables.length === 0 || downloadingId) return; // Prevent duplicate clicks
    setDownloadingId('all');
    setDownloadError(null);

    try {
      for (const item of deliverables) {
        if (!isMountedRef.current) return;
        const { success, error } = await downloadDeliverableFile(
          item.filePath,
          item.fileName
        );
        if (!success || error) {
          console.warn(`[Deliverables] Notice during bulk download for ${item.fileName}:`, error);
        }
        await new Promise(r => setTimeout(r, 400));
      }
      if (!isMountedRef.current) return;
      setDownloadSuccessId('all');
      if (downloadSuccessTimerRef.current) {
        clearTimeout(downloadSuccessTimerRef.current);
      }
      downloadSuccessTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) setDownloadSuccessId(null);
      }, 3000);
    } catch (err: any) {
      if (isMountedRef.current) {
        setDownloadError(err?.message || 'Error occurred while downloading files.');
      }
    } finally {
      if (isMountedRef.current) {
        setDownloadingId(null);
      }
    }
  };

  const parsedUpdatedDate = commission.updatedAt ? new Date(commission.updatedAt) : null;
  const completedDate = parsedUpdatedDate && !isNaN(parsedUpdatedDate.getTime())
    ? parsedUpdatedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Completed';

  const totalSizeBytes = deliverables.reduce((acc, d) => acc + (d.fileSize || 0), 0);
  const totalSizeFormatted = formatDeliverableFileSize(totalSizeBytes);

  return (
    <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-10 space-y-8">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-hairline">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Final Delivery · Stage 08 Archive</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black text-carbon tracking-tight">
            {commission.projectName}
          </h2>

          <p className="text-xs sm:text-sm text-graphite leading-relaxed">
            All approved vector masters, production formats, and full commercial licensing documents.
          </p>
        </div>

        <div className="flex items-baseline gap-2 font-mono text-xs text-graphite">
          <Calendar className="w-3.5 h-3.5" />
          <span>Released {completedDate}</span>
        </div>
      </div>

      {downloadError && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Payment Security Gating Alert when commission is not fully settled */}
      {!isPaymentSettled && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-base text-carbon">
                Final Deliverables Locked
              </h4>
              <p className="text-xs text-graphite leading-relaxed">
                Your final production master files, vector packages, and full commercial licenses are ready for release once your remaining balance has been paid and verified.
              </p>
            </div>
          </div>

          {/* Exact Financial Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-surface/80 border border-amber-500/20 text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-graphite block mb-0.5">
                Total Project Budget
              </span>
              <span className="font-bold text-carbon text-sm">
                {totalBudgetFormatted}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-graphite block mb-0.5">
                Amount Paid
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {amountPaidFormatted}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-accent font-semibold block mb-0.5">
                Remaining Balance
              </span>
              <span className="font-bold text-accent text-sm">
                {remainingBalanceFormatted}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] font-mono text-graphite">
              Current status: <span className="font-semibold text-amber-700 dark:text-amber-400">{commission.paymentStatus === 'Partial' ? 'Partial (Deposit Paid · Balance Pending)' : 'Awaiting Payment'}</span>
            </span>

            {onNavigateToPayment && (
              <button
                type="button"
                onClick={onNavigateToPayment}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto btn-tactile"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>View Payments & Receipts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Download Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-graphite uppercase tracking-wider font-semibold">
            <span>Production Assets</span>
            <span>·</span>
            <span>{deliverables.length} files ({totalSizeFormatted})</span>
          </div>

          {deliverables.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={downloadingId !== null || !isPaymentSettled}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 btn-tactile"
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
              ) : !isPaymentSettled ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Downloads Locked</span>
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
          <div className="py-16 text-center text-xs font-mono text-graphite">
            Loading production deliverables...
          </div>
        ) : loadError ? (
          <div className="py-12 text-center text-xs text-red-600 dark:text-red-400">
            {loadError}
          </div>
        ) : deliverables.length === 0 ? (
          <div className="py-16 text-center space-y-2 max-w-sm mx-auto">
            <Clock className="w-6 h-6 text-graphite mx-auto opacity-70" />
            <h4 className="font-display font-bold text-base text-carbon">
              Final Packaging Underway
            </h4>
            <p className="text-xs text-graphite leading-relaxed">
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
                  className="bg-surface-secondary border border-hairline rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:border-accent"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-hairline flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>

                    <div className="min-w-0">
                      <h4 
                        className="font-display text-sm font-bold text-carbon truncate"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </h4>
                      <p className="text-[11px] font-mono text-graphite mt-0.5">
                        {formatDeliverableFileSize(item.fileSize)} · {item.fileType?.split('/')?.[1] || 'Asset'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(item)}
                    disabled={isDownloading || !isPaymentSettled}
                    className="p-2.5 rounded-full bg-surface border border-hairline hover:border-accent text-carbon transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    aria-label={
                      !isPaymentSettled
                        ? `${item.fileName} download locked pending full payment confirmation`
                        : `Download ${item.fileName}`
                    }
                    title={
                      !isPaymentSettled
                        ? 'Download locked pending full payment confirmation'
                        : `Download ${item.fileName}`
                    }
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    ) : isDownloaded ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : !isPaymentSettled ? (
                      <Lock className="w-4 h-4 text-graphite" />
                    ) : (
                      <Download className="w-4 h-4 text-accent" />
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Commercial Licensing Ledger */}
      <div className="pt-6 border-t border-hairline flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-graphite leading-relaxed">
          <strong className="text-carbon block font-display">
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
