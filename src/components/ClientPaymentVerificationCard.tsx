import React, { useState, useEffect, useRef } from 'react';
import { Commission, CommissionPaymentProof, User } from '../types';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  X,
  Copy, 
  Check, 
  Eye, 
  FileText, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Info, 
  Lock
} from 'lucide-react';
import { 
  fetchCommissionPaymentProofs, 
  uploadPaymentProof, 
  getPaymentProofSignedUrl, 
  validatePaymentReceiptFile,
  formatPaymentFileSize,
  subscribeToPaymentProofs,
  parseCommissionBudget,
  validateReferenceNumber
} from '../lib/payments';

interface ClientPaymentVerificationCardProps {
  commission: Commission;
  currentUser: User;
  onPaymentProofSubmitted?: () => void;
}

export const ClientPaymentVerificationCard: React.FC<ClientPaymentVerificationCardProps> = ({
  commission,
  currentUser,
  onPaymentProofSubmitted,
}) => {
  const { studioProfile } = useApp();

  // State
  const [proofs, setProofs] = useState<CommissionPaymentProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState<boolean>(true);
  const [proofsError, setProofsError] = useState<string | null>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const isDepositAlreadyConfirmed = commission.paymentStatus === 'Partial' || commission.depositPaid === true;

  const [paymentType, setPaymentType] = useState<'deposit' | 'full' | 'balance'>(
    isDepositAlreadyConfirmed ? 'balance' : 'deposit'
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);

  // Lightbox Preview State
  const [activeProofSignedUrl, setActiveProofSignedUrl] = useState<string | null>(null);
  const [activeProofName, setActiveProofName] = useState<string>('');
  const [loadingSignedUrl, setLoadingSignedUrl] = useState<boolean>(false);
  const [lightboxError, setLightboxError] = useState<string | null>(null);

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const activeCommissionIdRef = useRef<string>(commission.id);
  const filePreviewUrlRef = useRef<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    filePreviewUrlRef.current = filePreviewUrl;
  }, [filePreviewUrl]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (filePreviewUrlRef.current) {
        URL.revokeObjectURL(filePreviewUrlRef.current);
      }
    };
  }, []);

  // Financial calculations with strict budget validation
  const depositPercent = studioProfile.gcashDetails?.depositPercentage || 50;
  const currencySymbol = studioProfile.currencySymbol || '₱';
  const currencyCode = commission.currency || studioProfile.currency || 'PHP';

  const budgetAnalysis = parseCommissionBudget(
    commission.budget,
    depositPercent,
    currencySymbol,
    currencyCode
  );

  const numericBudget = budgetAnalysis.numericBudget;
  const depositAmount = budgetAnalysis.depositAmount;
  const balanceAmount = budgetAnalysis.balanceAmount;
  const isBudgetValid = budgetAnalysis.isValid;

  // Sync paymentType & reset form cleanly when commission or deposit status changes
  useEffect(() => {
    if (activeCommissionIdRef.current !== commission.id) {
      activeCommissionIdRef.current = commission.id;
      setSelectedFile(null);
      if (filePreviewUrlRef.current) {
        URL.revokeObjectURL(filePreviewUrlRef.current);
      }
      setFilePreviewUrl(null);
      setReferenceNumber('');
      setClientNotes('');
      setUploadError(null);
      setUploadSuccess(null);
      setShowUploadForm(false);
      setActiveProofSignedUrl(null);
      setLightboxError(null);
    }
    setPaymentType(isDepositAlreadyConfirmed ? 'balance' : 'deposit');
  }, [commission.id, isDepositAlreadyConfirmed]);

  // Load existing proofs for this commission
  const loadProofs = async () => {
    const targetId = commission?.id;
    if (!targetId) return;
    setLoadingProofs(true);
    setProofsError(null);
    try {
      const { data, error } = await fetchCommissionPaymentProofs(targetId);
      if (!isMountedRef.current || activeCommissionIdRef.current !== targetId) return;
      if (error) {
        setProofsError(error);
      } else {
        setProofs(data || []);
      }
    } catch (err: any) {
      if (isMountedRef.current && activeCommissionIdRef.current === targetId) {
        setProofsError(err?.message || 'Failed to load payment records.');
      }
    } finally {
      if (isMountedRef.current && activeCommissionIdRef.current === targetId) {
        setLoadingProofs(false);
      }
    }
  };

  useEffect(() => {
    loadProofs();

    const unsubscribe = subscribeToPaymentProofs(commission.id, () => {
      loadProofs();
    });

    return () => {
      unsubscribe();
    };
  }, [commission?.id]);

  // Handle Escape key to dismiss receipt preview lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (activeProofSignedUrl || lightboxError)) {
        setActiveProofSignedUrl(null);
        setLightboxError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProofSignedUrl, lightboxError]);

  // Determine latest proof status
  const latestProof = proofs.length > 0 ? proofs[0] : null;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const validation = validatePaymentReceiptFile(file, file.name);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format.');
      return;
    }

    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setFilePreviewUrl(localUrl);
  };

  // Submit payment proof
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBudgetValid) {
      setUploadError(budgetAnalysis.errorMessage || 'Commission budget must be finalized with the studio before submitting payments.');
      return;
    }

    if (!selectedFile) {
      setUploadError('Please select a screenshot or image of your GCash receipt.');
      return;
    }

    if (referenceNumber && referenceNumber.trim()) {
      const refCheck = validateReferenceNumber(referenceNumber);
      if (!refCheck.valid) {
        setUploadError(refCheck.error || 'Invalid GCash reference number.');
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const targetAmount = paymentType === 'deposit' 
      ? depositAmount 
      : paymentType === 'balance' 
      ? balanceAmount 
      : numericBudget;

    try {
      const { data, error } = await uploadPaymentProof({
        commissionId: commission.id,
        clientId: currentUser.id,
        file: selectedFile,
        fileName: selectedFile.name,
        amount: targetAmount,
        currency: currencyCode,
        paymentType,
        referenceNumber: referenceNumber.trim() || undefined,
        clientNotes: clientNotes.trim() || undefined,
      });

      if (error || !data) {
        setUploadError(error || 'Failed to upload receipt. Please check your network and try again.');
        return;
      }

      setUploadSuccess('GCash payment receipt submitted successfully! Brewster will verify your transaction shortly.');
      setSelectedFile(null);
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
      }
      setReferenceNumber('');
      setClientNotes('');
      setShowUploadForm(false);
      await loadProofs();
      onPaymentProofSubmitted?.();
    } catch (err: any) {
      setUploadError(err?.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsUploading(false);
    }
  };

  // View receipt in lightbox via signed URL
  const handleViewReceipt = async (proof: CommissionPaymentProof) => {
    setLoadingSignedUrl(true);
    setLightboxError(null);
    setActiveProofName(proof.fileName || 'GCash Receipt');
    try {
      const { signedUrl, error } = await getPaymentProofSignedUrl(proof.filePath, 3600);
      if (!isMountedRef.current) return;
      if (error || !signedUrl) {
        setLightboxError(error || 'Could not generate secure view link for receipt.');
      } else {
        setActiveProofSignedUrl(signedUrl);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setLightboxError(err?.message || 'Failed to open receipt preview.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingSignedUrl(false);
      }
    }
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        if (!isMountedRef.current) return;
        setCopiedField(fieldName);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setCopiedField(null);
        }, 2500);
      }
    } catch {
      // Clipboard unavailable in restricted browser contexts
    }
  };

  const gcashDetails = studioProfile.gcashDetails || {
    accountName: 'Brewster Cabando',
    accountNumber: '0965-706-4331',
    instructions: '1. Open GCash > Send Money > Express Send.\n2. Send required deposit to the studio number.\n3. Save transaction receipt screenshot with Reference No.\n4. Upload below for manual verification.',
  };

  return (
    <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
      
      {/* 1. Header & Financial Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-hairline">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold">
              Financial Settlement
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[10px] uppercase text-graphite">
              Manual GCash Verification
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-carbon flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-accent" />
            <span>Studio Payment & Deposit Verification</span>
          </h3>
        </div>

        {/* Current Settlement Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {commission.paymentStatus === 'Paid' && commission.totalPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmed: Settled in Full</span>
            </span>
          ) : commission.paymentStatus === 'Partial' || commission.depositPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Deposit Confirmed · Balance Due</span>
            </span>
          ) : latestProof?.status === 'pending_verification' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-mono font-semibold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>Receipt Pending Studio Verification</span>
            </span>
          ) : latestProof?.status === 'rejected' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[11px] font-mono font-semibold">
              <XCircle className="w-3.5 h-3.5" />
              <span>Receipt Rejected · Action Required</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-graphite border border-hairline text-[11px] font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Awaiting Deposit</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Clear Direct Studio Payment Policy Explanation */}
      <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline flex items-start gap-3">
        <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-graphite leading-relaxed">
          <p className="font-semibold text-carbon">
            Direct GCash Transfer Notice
          </p>
          <p>
            DESTALION operates on a personalized, direct studio payment model. Payments are sent directly to the artist's registered GCash account—there is no automated card gateway or instant charging. Once you upload your transfer receipt, the studio director manually verifies the transaction and confirms your production milestone.
          </p>
        </div>
      </div>

      {/* 2.5 Budget Pending Notice if budget is unfinalized or invalid */}
      {!isBudgetValid && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-graphite leading-relaxed">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Budget Pending Final Studio Confirmation
            </p>
            <p>
              {budgetAnalysis.errorMessage || 'Commission budget requires scope confirmation.'} Payment calculation and GCash receipt uploads will unlock once Brewster verifies your project scope and confirms the fixed budget.
            </p>
          </div>
        </div>
      )}

      {/* 3. Financial Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block">
            Total Project Investment
          </span>
          <p className="font-mono text-lg font-bold text-carbon">
            {isBudgetValid ? `${currencySymbol}${numericBudget.toLocaleString()} ${currencyCode}` : (commission.budget || 'Pending Confirmation')}
          </p>
          <span className="font-mono text-[10px] text-graphite">
            {isBudgetValid ? 'Contracted amount' : 'Awaiting scope confirmation'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block">
            50% Initial Deposit
          </span>
          <p className="font-mono text-lg font-bold text-accent">
            {isBudgetValid ? `${currencySymbol}${depositAmount.toLocaleString()} ${currencyCode}` : 'Awaiting Final Budget'}
          </p>
          <span className="font-mono text-[10px] text-graphite">
            Required to initiate production
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold block">
            50% Final Settlement
          </span>
          <p className="font-mono text-lg font-bold text-carbon">
            {isBudgetValid ? `${currencySymbol}${balanceAmount.toLocaleString()} ${currencyCode}` : 'Awaiting Final Budget'}
          </p>
          <span className="font-mono text-[10px] text-graphite">
            Unlocks master deliverables
          </span>
        </div>
      </div>

      {/* 4. Official GCash Payment Instructions & Account Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-sky-500/8 via-sky-500/12 to-transparent dark:from-sky-950/30 dark:via-sky-900/15 dark:to-transparent border border-sky-500/25 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0284C7] text-white flex items-center justify-center font-bold text-xs">
              G
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-carbon">
                Studio GCash Payment Information
              </h4>
              <p className="text-[11px] font-mono text-graphite">
                Official studio receiver account
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
            Verified Studio Account
          </span>
        </div>

        {/* Account Details Copy Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-surface border border-hairline flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-graphite block">
                Account Name
              </span>
              <p className="font-semibold text-xs sm:text-sm text-carbon truncate">
                {gcashDetails.accountName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(gcashDetails.accountName, 'accountName')}
              className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full hover:bg-surface-secondary text-graphite hover:text-carbon transition-colors cursor-pointer shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              title="Copy account name"
              aria-label="Copy account name"
            >
              {copiedField === 'accountName' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface border border-hairline flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-graphite block">
                GCash Mobile Number
              </span>
              <p className="font-mono font-bold text-xs sm:text-sm text-accent truncate">
                {gcashDetails.accountNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(gcashDetails.accountNumber, 'accountNumber')}
              className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full hover:bg-surface-secondary text-graphite hover:text-carbon transition-colors cursor-pointer shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              title="Copy mobile number"
              aria-label="Copy mobile number"
            >
              {copiedField === 'accountNumber' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Step-by-step instructions text */}
        <div className="pt-2 text-xs text-graphite whitespace-pre-line leading-relaxed font-sans bg-surface/80 p-3.5 rounded-2xl border border-hairline">
          {gcashDetails.instructions}
        </div>
      </div>

      {/* 5. Rejection Notice Alert (if latest proof was rejected) */}
      {latestProof && latestProof.status === 'rejected' && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <h4 className="font-bold text-sm text-red-600 dark:text-red-400">
              Payment Verification Unsuccessful
            </h4>
          </div>
          <p className="text-xs text-red-800 dark:text-red-300">
            <strong>Reason from Studio Director:</strong> {latestProof.adminNotes || 'The provided transaction screenshot could not be validated. Please ensure the official GCash reference number and date are fully legible.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowUploadForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Submit Replacement Receipt Proof</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Pending Verification Banner */}
      {latestProof && latestProof.status === 'pending_verification' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Verification In Progress</span>
            </div>
            <p className="text-xs text-graphite">
              Submitted on {(() => {
                const d = new Date(latestProof.createdAt);
                return !isNaN(d.getTime()) ? d.toLocaleDateString() : 'Recently';
              })()} · Ref: {latestProof.referenceNumber || 'N/A'} · Amount: {currencySymbol}{(latestProof.amount ?? 0).toLocaleString()} {latestProof.currency || currencyCode}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleViewReceipt(latestProof)}
            disabled={loadingSignedUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface hover:bg-surface-secondary border border-hairline text-xs font-semibold text-carbon transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5 text-accent" />
            <span>View Submitted Receipt</span>
          </button>
        </div>
      )}

      {/* 7. Action Button to Open Upload Form if not already open */}
      {!showUploadForm && (commission.paymentStatus !== 'Paid' && !commission.totalPaid) && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-graphite">
            {isBudgetValid 
              ? 'Have you completed your GCash transfer? Submit your screenshot to confirm your production slot.'
              : 'Payment submission is temporarily disabled pending studio budget confirmation.'}
          </p>
          {isBudgetValid ? (
            <button
              type="button"
              onClick={() => setShowUploadForm(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{latestProof ? 'Submit Another Receipt' : 'Upload GCash Receipt'}</span>
            </button>
          ) : (
            <div 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-secondary text-graphite text-xs font-mono cursor-not-allowed select-none border border-hairline"
              title="Awaiting studio budget scope confirmation before accepting receipts"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Awaiting Budget Confirmation</span>
            </div>
          )}
        </div>
      )}

      {/* 8. Upload Form */}
      {showUploadForm && (
        <form onSubmit={handleSubmitProof} className="pt-4 border-t border-hairline space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-carbon">
              Submit GCash Payment Proof
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
                if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
                setFilePreviewUrl(null);
                setReferenceNumber('');
                setClientNotes('');
                setUploadError(null);
              }}
              className="text-xs text-graphite hover:text-carbon transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-carbon block">
              Payment Milestone Covered
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'deposit' as const, label: `50% Deposit (${currencySymbol}${depositAmount.toLocaleString()})`, disabled: isDepositAlreadyConfirmed },
                { id: 'balance' as const, label: `50% Final Balance (${currencySymbol}${balanceAmount.toLocaleString()})`, disabled: false },
                { id: 'full' as const, label: `Full Settlement (${currencySymbol}${numericBudget.toLocaleString()})`, disabled: isDepositAlreadyConfirmed },
              ].map(({ id, label, disabled }) => (
                <button
                  key={id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setPaymentType(id)}
                  title={disabled ? 'Initial deposit has already been confirmed for this commission' : undefined}
                  className={`p-3 rounded-2xl border text-left text-xs font-mono transition-all ${
                    disabled
                      ? 'border-hairline text-graphite opacity-50 cursor-not-allowed'
                      : paymentType === id
                      ? 'border-accent bg-accent/10 text-accent font-bold cursor-pointer'
                      : 'border-hairline text-graphite hover:border-graphite/50 cursor-pointer'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* File Picker / Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-carbon block">
              Transaction Screenshot (JPEG, PNG, WebP · Max 10 MB)
            </label>
            <div 
              role="button"
              tabIndex={0}
              aria-label="Upload GCash transaction screenshot (JPEG, PNG, WebP up to 10 MB)"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className="border-2 border-dashed border-hairline hover:border-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded-2xl p-6 text-center cursor-pointer transition-colors bg-surface-secondary"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-accent mx-auto mb-2 opacity-90" />
              <p className="text-xs font-semibold text-carbon">
                {selectedFile ? selectedFile.name : 'Click to select or drop GCash screenshot'}
              </p>
              <p className="text-[11px] font-mono text-graphite mt-1">
                {selectedFile ? formatPaymentFileSize(selectedFile.size) : 'Ensure Reference Number and Date/Time are clearly visible'}
              </p>
            </div>
          </div>

          {/* Local Preview if chosen */}
          {Boolean(filePreviewUrl && filePreviewUrl.trim()) && (
            <div className="p-3 rounded-2xl bg-surface border border-hairline flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={filePreviewUrl!}
                  alt="Selected receipt preview"
                  className="w-14 h-14 object-cover rounded-xl border border-hairline shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-carbon block truncate">
                    {selectedFile?.name}
                  </span>
                  <span className="text-[11px] font-mono text-graphite">
                    {selectedFile ? formatPaymentFileSize(selectedFile.size) : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
                  setFilePreviewUrl(null);
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Optional Reference Number & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="gcash-ref-input" className="text-xs font-semibold text-carbon block">
                GCash Reference Number (Optional)
              </label>
              <input
                id="gcash-ref-input"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. 9012 3456 7890"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-hairline bg-surface-secondary text-carbon focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="gcash-notes-input" className="text-xs font-semibold text-carbon block">
                Note for Studio (Optional)
              </label>
              <input
                id="gcash-notes-input"
                type="text"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="e.g. Sent from Juan D. GCash account"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-hairline bg-surface-secondary text-carbon focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Error & Success Feedback */}
          {uploadError && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
                if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
                setFilePreviewUrl(null);
                setReferenceNumber('');
                setClientNotes('');
                setUploadError(null);
              }}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-graphite hover:text-carbon transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] disabled:opacity-50 text-[#111114] font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to Secure Storage...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Confirm & Submit Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 9. Historical Receipts Manifest (if multiple exists) */}
      {proofs.length > 0 && (
        <div className="pt-4 border-t border-hairline space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-graphite font-semibold">
              Payment Submission History ({proofs.length})
            </span>
            <button
              type="button"
              onClick={loadProofs}
              className="text-[11px] font-mono text-graphite hover:text-carbon inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2">
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="p-3.5 rounded-2xl bg-surface-secondary border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-carbon truncate">
                      {proof.paymentType === 'deposit' ? '50% Deposit' : proof.paymentType === 'balance' ? '50% Balance' : 'Full Payment'} · {currencySymbol}{(proof.amount ?? 0).toLocaleString()} {proof.currency || currencyCode}
                    </p>
                    <p className="text-[11px] font-mono text-graphite">
                      {(() => {
                        const d = new Date(proof.createdAt);
                        return !isNaN(d.getTime()) ? d.toLocaleDateString() : 'Recently';
                      })()} · Ref: {proof.referenceNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-hairline">
                  {proof.status === 'confirmed' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Confirmed
                    </span>
                  ) : proof.status === 'rejected' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      Rejected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Pending
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleViewReceipt(proof)}
                    className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-graphite hover:text-carbon hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                    title="View Receipt"
                    aria-label="View Receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt Preview Error Alert */}
      {lightboxError && !activeProofSignedUrl && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{lightboxError}</span>
          </div>
          <button
            type="button"
            onClick={() => setLightboxError(null)}
            aria-label="Dismiss receipt error"
            className="p-1 rounded-full hover:bg-red-500/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 10. Lightbox Modal for Receipt Preview */}
      {activeProofSignedUrl && (
        <div 
          onClick={() => setActiveProofSignedUrl(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-zoom-out animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-xl max-h-[90dvh] w-full bg-[#121214] border border-[#222225] rounded-3xl p-4 sm:p-5 flex flex-col items-center cursor-default shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#222225] text-white text-xs font-mono">
              <span className="truncate max-w-[200px] sm:max-w-xs">{activeProofName}</span>
              <button
                type="button"
                onClick={() => setActiveProofSignedUrl(null)}
                className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close receipt preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-3 max-h-[72dvh] overflow-auto flex items-center justify-center w-full">
              {Boolean(activeProofSignedUrl && activeProofSignedUrl.trim()) && (
                <img
                  src={activeProofSignedUrl!}
                  alt="GCash Receipt Screenshot"
                  className="max-h-[65dvh] w-auto object-contain rounded-2xl shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
