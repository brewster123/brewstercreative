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
  Copy, 
  Check, 
  Eye, 
  FileText, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  fetchCommissionPaymentProofs, 
  uploadPaymentProof, 
  getPaymentProofSignedUrl, 
  validatePaymentReceiptFile,
  formatPaymentFileSize,
  subscribeToPaymentProofs
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
  const [paymentType, setPaymentType] = useState<'deposit' | 'full' | 'balance'>(
    commission.paymentStatus === 'Partial' ? 'balance' : 'deposit'
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

  // Financial calculations
  const rawBudget = commission.budget || '₱0';
  const numericBudget = parseFloat(rawBudget.replace(/[^0-9.]/g, '')) || 0;
  const depositPercent = studioProfile.gcashDetails?.depositPercentage || 50;
  const depositAmount = Math.round(numericBudget * (depositPercent / 100));
  const balanceAmount = numericBudget - depositAmount;

  const currencySymbol = studioProfile.currencySymbol || '₱';
  const currencyCode = commission.currency || studioProfile.currency || 'PHP';

  // Load existing proofs for this commission
  const loadProofs = async () => {
    if (!commission?.id) return;
    setLoadingProofs(true);
    setProofsError(null);
    try {
      const { data, error } = await fetchCommissionPaymentProofs(commission.id);
      if (error) {
        setProofsError(error);
      } else {
        setProofs(data || []);
      }
    } catch (err: any) {
      setProofsError(err?.message || 'Failed to load payment records.');
    } finally {
      setLoadingProofs(false);
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

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

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
    if (!selectedFile) {
      setUploadError('Please select a screenshot or image of your GCash receipt.');
      return;
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
      if (error || !signedUrl) {
        setLightboxError(error || 'Could not generate secure view link for receipt.');
      } else {
        setActiveProofSignedUrl(signedUrl);
      }
    } catch (err: any) {
      setLightboxError(err?.message || 'Failed to open receipt preview.');
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const gcashDetails = studioProfile.gcashDetails || {
    accountName: 'Brewster Cabando',
    accountNumber: '0965-706-4331',
    instructions: '1. Open GCash > Send Money > Express Send.\n2. Send required deposit to the studio number.\n3. Save transaction receipt screenshot with Reference No.\n4. Upload below for manual verification.',
  };

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xs">
      
      {/* 1. Header & Financial Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E2DC] dark:border-[#27272A]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
              Financial Settlement
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA]">
              Manual GCash Verification
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#EA580C]" />
            <span>Studio Payment & Deposit Verification</span>
          </h3>
        </div>

        {/* Current Settlement Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {commission.paymentStatus === 'Paid' || commission.totalPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmed: Settled in Full</span>
            </span>
          ) : commission.paymentStatus === 'Partial' || commission.depositPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Deposit Confirmed · Balance Due</span>
            </span>
          ) : latestProof?.status === 'pending_verification' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-mono font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>Receipt Pending Studio Verification</span>
            </span>
          ) : latestProof?.status === 'rejected' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-mono font-bold">
              <XCircle className="w-3.5 h-3.5" />
              <span>Receipt Rejected · Action Required</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#232327] text-[#71717A] dark:text-[#A1A1AA] border border-[#E4E2DC] dark:border-[#27272A] text-xs font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Awaiting Deposit</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Clear Direct Studio Payment Policy Explanation */}
      <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
          <p className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">
            Direct GCash Transfer Notice
          </p>
          <p>
            DESTALION operates on a personalized, direct studio payment model. Payments are sent directly to the artist's registered GCash account—there is no automated card gateway or instant charging. Once you upload your transfer receipt, the studio director manually verifies the transaction and confirms your production milestone.
          </p>
        </div>
      </div>

      {/* 3. Financial Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
            Total Project Investment
          </span>
          <p className="font-mono text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
            {commission.budget || `${currencySymbol}0`}
          </p>
          <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
            Contracted amount
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
            50% Initial Deposit
          </span>
          <p className="font-mono text-lg font-bold text-[#EA580C]">
            {currencySymbol}{depositAmount.toLocaleString()} {currencyCode}
          </p>
          <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
            Required to initiate production
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
            50% Final Settlement
          </span>
          <p className="font-mono text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
            {currencySymbol}{balanceAmount.toLocaleString()} {currencyCode}
          </p>
          <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
            Unlocks master deliverables
          </span>
        </div>
      </div>

      {/* 4. Official GCash Payment Instructions & Account Box */}
      <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-transparent dark:from-blue-950/20 dark:via-blue-900/10 dark:to-transparent border border-blue-500/20 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              G
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                Studio GCash Payment Information
              </h4>
              <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                Official studio receiver account
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
            Verified Studio Account
          </span>
        </div>

        {/* Account Details Copy Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] block">
                Account Name
              </span>
              <p className="font-semibold text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] truncate">
                {gcashDetails.accountName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(gcashDetails.accountName, 'accountName')}
              className="p-1.5 rounded-md hover:bg-[#FAF9F6] dark:hover:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer shrink-0"
              title="Copy account name"
            >
              {copiedField === 'accountName' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] block">
                GCash Mobile Number
              </span>
              <p className="font-mono font-bold text-xs sm:text-sm text-[#EA580C] truncate">
                {gcashDetails.accountNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(gcashDetails.accountNumber, 'accountNumber')}
              className="p-1.5 rounded-md hover:bg-[#FAF9F6] dark:hover:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer shrink-0"
              title="Copy mobile number"
            >
              {copiedField === 'accountNumber' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Step-by-step instructions text */}
        <div className="pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA] whitespace-pre-line leading-relaxed font-sans bg-white/60 dark:bg-black/30 p-3.5 rounded-lg border border-[#E4E2DC]/80 dark:border-[#27272A]/80">
          {gcashDetails.instructions}
        </div>
      </div>

      {/* 5. Rejection Notice Alert (if latest proof was rejected) */}
      {latestProof && latestProof.status === 'rejected' && (
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 space-y-2 animate-in fade-in">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Submit Replacement Receipt Proof</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Pending Verification Banner */}
      {latestProof && latestProof.status === 'pending_verification' && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-blue-600 dark:text-blue-400">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Verification In Progress</span>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Submitted on {new Date(latestProof.createdAt).toLocaleDateString()} · Ref: {latestProof.referenceNumber || 'N/A'} · Amount: {currencySymbol}{latestProof.amount.toLocaleString()} {latestProof.currency}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleViewReceipt(latestProof)}
            disabled={loadingSignedUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18181B] hover:bg-[#FAF9F6] border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>View Submitted Receipt</span>
          </button>
        </div>
      )}

      {/* 7. Action Button to Open Upload Form if not already open */}
      {!showUploadForm && (commission.paymentStatus !== 'Paid' && !commission.totalPaid) && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Have you completed your GCash transfer? Submit your screenshot to confirm your production slot.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{latestProof ? 'Submit Another Receipt' : 'Upload GCash Receipt'}</span>
          </button>
        </div>
      )}

      {/* 8. Upload Form */}
      {showUploadForm && (
        <form onSubmit={handleSubmitProof} className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
              Submit GCash Payment Proof
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
                setUploadError(null);
              }}
              className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] block">
              Payment Milestone Covered
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'deposit' as const, label: `50% Deposit (${currencySymbol}${depositAmount.toLocaleString()})` },
                { id: 'balance' as const, label: `50% Final Balance (${currencySymbol}${balanceAmount.toLocaleString()})` },
                { id: 'full' as const, label: `Full Settlement (${currencySymbol}${numericBudget.toLocaleString()})` },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentType(id)}
                  className={`p-3 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                    paymentType === id
                      ? 'border-[#EA580C] bg-[#EA580C]/10 text-[#EA580C] font-bold'
                      : 'border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:border-[#D4D2CA]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* File Picker / Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] block">
              Transaction Screenshot (JPEG, PNG, WebP · Max 10 MB)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E4E2DC] dark:border-[#27272A] hover:border-[#EA580C] dark:hover:border-[#EA580C] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#FAF9F6] dark:bg-[#0F0F11]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-[#EA580C] mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC]">
                {selectedFile ? selectedFile.name : 'Click to select or drop GCash screenshot'}
              </p>
              <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mt-1">
                {selectedFile ? formatPaymentFileSize(selectedFile.size) : 'Ensure Reference Number and Date/Time are clearly visible'}
              </p>
            </div>
          </div>

          {/* Local Preview if chosen */}
          {Boolean(filePreviewUrl && filePreviewUrl.trim()) && (
            <div className="p-3 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={filePreviewUrl!}
                  alt="Selected receipt preview"
                  className="w-14 h-14 object-cover rounded-lg border border-[#E4E2DC] dark:border-[#27272A] shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] block truncate">
                    {selectedFile?.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
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
              <label htmlFor="gcash-ref-input" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] block">
                GCash Reference Number (Optional)
              </label>
              <input
                id="gcash-ref-input"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. 9012 3456 7890"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E2DC] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="gcash-notes-input" className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] block">
                Note for Studio (Optional)
              </label>
              <input
                id="gcash-notes-input"
                type="text"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="e.g. Sent from Juan D. GCash account"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E2DC] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>
          </div>

          {/* Error & Success Feedback */}
          {uploadError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
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
                setUploadError(null);
              }}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
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
        <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold">
              Payment Submission History ({proofs.length})
            </span>
            <button
              type="button"
              onClick={loadProofs}
              className="text-[11px] font-mono text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC] inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2">
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#EA580C] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#18181B] dark:text-[#EDEDEC] truncate">
                      {proof.paymentType === 'deposit' ? '50% Deposit' : proof.paymentType === 'balance' ? '50% Balance' : 'Full Payment'} · {currencySymbol}{proof.amount.toLocaleString()} {proof.currency}
                    </p>
                    <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      {new Date(proof.createdAt).toLocaleDateString()} · Ref: {proof.referenceNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {proof.status === 'confirmed' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Confirmed
                    </span>
                  ) : proof.status === 'rejected' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      Rejected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Pending
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleViewReceipt(proof)}
                    className="p-1 rounded text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
                    title="View Receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Lightbox Modal for Receipt Preview */}
      {activeProofSignedUrl && (
        <div 
          onClick={() => setActiveProofSignedUrl(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-xl max-h-[85vh] bg-[#18181B] border border-white/10 rounded-2xl p-4 flex flex-col items-center cursor-default"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 text-white text-xs font-mono">
              <span className="truncate max-w-xs">{activeProofName}</span>
              <button
                type="button"
                onClick={() => setActiveProofSignedUrl(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                Close (✕)
              </button>
            </div>
            <div className="py-3 max-h-[70vh] overflow-auto flex items-center justify-center">
              {Boolean(activeProofSignedUrl && activeProofSignedUrl.trim()) && (
                <img
                  src={activeProofSignedUrl!}
                  alt="GCash Receipt Screenshot"
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
