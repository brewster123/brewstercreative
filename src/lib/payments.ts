import { supabase } from './supabase';
import { CommissionPaymentProof, PaymentProofType, PaymentProofStatus } from '../types';
import { updateCommissionPaymentInSupabase } from '../data/commissionsData';

export const PAYMENT_PROOFS_BUCKET = 'payment-proofs';
export const MAX_PAYMENT_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Validates a payment proof receipt file before upload.
 * Enforces image type (JPEG, PNG, WebP) and maximum 10MB file size.
 */
export function validatePaymentReceiptFile(
  file: File | Blob,
  fileName: string = 'receipt.jpg'
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Please select a receipt screenshot or image to upload.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'The selected receipt file is empty (0 bytes).' };
  }

  if (file.size > MAX_PAYMENT_RECEIPT_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Receipt file size (${sizeMb} MB) exceeds the 10 MB limit. Please select an image under 10 MB.`,
    };
  }

  const mime = (file.type || '').toLowerCase();
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  const isAllowedMime = ALLOWED_RECEIPT_MIME_TYPES.some((m) => mime.includes(m.replace('image/', '')));
  const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a clear JPEG, PNG, or WebP screenshot of your GCash receipt.',
    };
  }

  return { valid: true };
}

/**
 * Sanitizes receipt filenames to prevent directory traversal or malformed storage keys.
 */
export function sanitizePaymentFileName(rawName: string): string {
  const trimmed = (rawName || 'gcash_receipt.jpg').trim();
  // Strip path traversal prefixes (directory separators)
  const base = trimmed.replace(/^.*[\\\/]/, '').replace(/\0/g, '');
  // Eliminate any remaining dot-dot sequences and non-safe filename characters
  const safeDots = base.replace(/\.{2,}/g, '_');
  const clean = safeDots.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return clean || `receipt_${Date.now()}.jpg`;
}

/**
 * Formats bytes into a human-readable string.
 */
export function formatPaymentFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Normalizes a GCash reference number by removing whitespace, dashes, and converting to uppercase.
 */
export function normalizeReferenceNumber(ref?: string): string {
  if (!ref) return '';
  return ref.trim().replace(/[\s\-]/g, '').toUpperCase();
}

/**
 * Validates a GCash reference number if provided.
 */
export function validateReferenceNumber(ref?: string): { valid: boolean; error?: string } {
  if (!ref || !ref.trim()) {
    return { valid: true };
  }
  const clean = normalizeReferenceNumber(ref);
  if (clean.length < 6) {
    return { 
      valid: false, 
      error: 'GCash reference number is too short. Please enter the full reference number from your receipt.' 
    };
  }
  if (!/^[A-Z0-9]+$/.test(clean)) {
    return { 
      valid: false, 
      error: 'GCash reference number contains invalid characters. Only letters, numbers, and dashes are permitted.' 
    };
  }
  return { valid: true };
}

export interface BudgetAnalysis {
  isValid: boolean;
  numericBudget: number;
  depositAmount: number;
  balanceAmount: number;
  depositPercentage: number;
  currencySymbol: string;
  currencyCode: string;
  errorMessage?: string;
}

/**
 * Parses and validates commission budget strings to ensure unambiguous financial amounts.
 * Rejects non-numeric, range-based, or non-finalized budgets (e.g. "TBD", "Flexible", "5000-8000").
 */
export function parseCommissionBudget(
  rawBudget: string | number | undefined,
  depositPercentage: number = 50,
  defaultCurrencySymbol: string = '₱',
  defaultCurrencyCode: string = 'PHP'
): BudgetAnalysis {
  const safePercent = depositPercentage > 0 && depositPercentage <= 100 ? depositPercentage : 50;

  if (rawBudget === undefined || rawBudget === null) {
    return {
      isValid: false,
      numericBudget: 0,
      depositAmount: 0,
      balanceAmount: 0,
      depositPercentage: safePercent,
      currencySymbol: defaultCurrencySymbol,
      currencyCode: defaultCurrencyCode,
      errorMessage: 'Commission budget has not been set.',
    };
  }

  // If already a numeric primitive
  if (typeof rawBudget === 'number') {
    if (isNaN(rawBudget) || rawBudget <= 0) {
      return {
        isValid: false,
        numericBudget: 0,
        depositAmount: 0,
        balanceAmount: 0,
        depositPercentage: safePercent,
        currencySymbol: defaultCurrencySymbol,
        currencyCode: defaultCurrencyCode,
        errorMessage: 'Commission budget must be a positive amount.',
      };
    }
    const depositAmount = Math.round(rawBudget * (safePercent / 100));
    return {
      isValid: true,
      numericBudget: rawBudget,
      depositAmount,
      balanceAmount: rawBudget - depositAmount,
      depositPercentage: safePercent,
      currencySymbol: defaultCurrencySymbol,
      currencyCode: defaultCurrencyCode,
    };
  }

  const str = String(rawBudget).trim();
  if (!str) {
    return {
      isValid: false,
      numericBudget: 0,
      depositAmount: 0,
      balanceAmount: 0,
      depositPercentage: safePercent,
      currencySymbol: defaultCurrencySymbol,
      currencyCode: defaultCurrencyCode,
      errorMessage: 'Commission budget is empty.',
    };
  }

  // Check for non-finalized keywords: e.g., TBD, flexible, negotiable, discuss, to be decided
  const nonFinalKeywords = /^(tbd|flexible|negotiable|discuss|to be decided|inquire|open|custom|quote)$/i;
  if (nonFinalKeywords.test(str) || /tbd|negotiable|flexible/i.test(str)) {
    return {
      isValid: false,
      numericBudget: 0,
      depositAmount: 0,
      balanceAmount: 0,
      depositPercentage: safePercent,
      currencySymbol: defaultCurrencySymbol,
      currencyCode: defaultCurrencyCode,
      errorMessage: 'Commission budget is pending final scope confirmation with the studio.',
    };
  }

  // Check for range patterns (e.g., "5000 - 8000", "5000 to 8000")
  if (/[-–—]|\bto\b/i.test(str) && /\d+.*[-–—\bto\b].*\d+/i.test(str)) {
    return {
      isValid: false,
      numericBudget: 0,
      depositAmount: 0,
      balanceAmount: 0,
      depositPercentage: safePercent,
      currencySymbol: defaultCurrencySymbol,
      currencyCode: defaultCurrencyCode,
      errorMessage: 'Budget is specified as a range. Payment processing requires studio confirmation of the final fixed price.',
    };
  }

  // Extract currency symbol if present
  let detectedSymbol = defaultCurrencySymbol;
  if (str.includes('₱')) detectedSymbol = '₱';
  else if (str.includes('$')) detectedSymbol = '$';
  else if (str.includes('€')) detectedSymbol = '€';
  else if (str.includes('£')) detectedSymbol = '£';

  // Extract currency code if present
  let detectedCode = defaultCurrencyCode;
  const codeMatch = str.match(/\b(PHP|USD|EUR|GBP|AUD|CAD)\b/i);
  if (codeMatch) {
    detectedCode = codeMatch[1].toUpperCase();
  }

  // Strip currency symbols, currency codes, commas, and whitespace
  const sanitized = str
    .replace(/[₱$€£]/g, '')
    .replace(/\b(PHP|USD|EUR|GBP|AUD|CAD)\b/gi, '')
    .replace(/,/g, '')
    .trim();

  // Validate format: must be purely digits, optionally with decimal point
  const isValidNumericFormat = /^\d+(\.\d{1,2})?$/.test(sanitized);
  if (!isValidNumericFormat) {
    return {
      isValid: false,
      numericBudget: 0,
      depositAmount: 0,
      balanceAmount: 0,
      depositPercentage: safePercent,
      currencySymbol: detectedSymbol,
      currencyCode: detectedCode,
      errorMessage: 'Commission budget format could not be verified. Awaiting studio confirmation.',
    };
  }

  const num = parseFloat(sanitized);
  if (isNaN(num) || num <= 0) {
    return {
      isValid: false,
      numericBudget: 0,
      depositAmount: 0,
      balanceAmount: 0,
      depositPercentage: safePercent,
      currencySymbol: detectedSymbol,
      currencyCode: detectedCode,
      errorMessage: 'Commission budget must be greater than zero.',
    };
  }

  const depositAmount = Math.round(num * (safePercent / 100));
  const balanceAmount = num - depositAmount;

  return {
    isValid: true,
    numericBudget: num,
    depositAmount,
    balanceAmount,
    depositPercentage: safePercent,
    currencySymbol: detectedSymbol,
    currencyCode: detectedCode,
  };
}

/**
 * Maps a Supabase row to the frontend CommissionPaymentProof model.
 */
export function mapDbRowToPaymentProof(row: any): CommissionPaymentProof {
  return {
    id: row.id,
    commissionId: row.commission_id,
    clientId: row.client_id,
    amount: Number(row.amount) || 0,
    currency: row.currency || 'PHP',
    paymentType: (row.payment_type as PaymentProofType) || 'deposit',
    filePath: row.file_path,
    fileName: row.file_name,
    fileType: row.file_type || 'image/jpeg',
    fileSize: Number(row.file_size) || 0,
    referenceNumber: row.reference_number || undefined,
    clientNotes: row.client_notes || undefined,
    status: (row.status as PaymentProofStatus) || 'pending_verification',
    adminNotes: row.admin_notes || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // Raw alias compatibility
    commission_id: row.commission_id,
    client_id: row.client_id,
    payment_type: row.payment_type,
    file_path: row.file_path,
    file_name: row.file_name,
    file_type: row.file_type,
    file_size: Number(row.file_size) || 0,
    reference_number: row.reference_number,
    client_notes: row.client_notes,
    admin_notes: row.admin_notes,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Fetches payment proofs from Supabase.
 * If commissionId is provided, returns proofs for that commission.
 * If omitted, returns all payment proofs (authorized for admins via RLS).
 */
export async function fetchCommissionPaymentProofs(
  commissionId?: string
): Promise<{ data: CommissionPaymentProof[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('commission_payment_proofs')
      .select('*')
      .order('created_at', { ascending: false });

    if (commissionId) {
      query = query.eq('commission_id', commissionId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        // Table not created yet in remote database
        return { data: [], error: null };
      }
      return { data: null, error: error.message || 'Failed to fetch payment proofs.' };
    }

    const mapped = (data || []).map(mapDbRowToPaymentProof);
    return { data: mapped, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'An unexpected error occurred while fetching payment proofs.',
    };
  }
}

/**
 * Generates a short-lived signed URL for a receipt image stored in private 'payment-proofs' bucket.
 * Never constructs or exposes public storage URLs.
 */
export async function getPaymentProofSignedUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<{ signedUrl: string | null; error: string | null }> {
  if (!filePath) {
    return { signedUrl: null, error: 'Payment proof file path is missing.' };
  }

  let cleanPath = filePath.trim();
  if (cleanPath.startsWith('payment-proofs/')) {
    cleanPath = cleanPath.replace(/^payment-proofs\//, '');
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }

  try {
    const { data, error } = await supabase.storage
      .from(PAYMENT_PROOFS_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return {
        signedUrl: null,
        error: error?.message || 'Failed to generate secure signed URL for payment proof.',
      };
    }

    return { signedUrl: data.signedUrl, error: null };
  } catch (err: any) {
    return {
      signedUrl: null,
      error: err?.message || 'An unexpected error occurred while generating payment proof signed URL.',
    };
  }
}

/**
 * Uploads a GCash receipt screenshot to the private 'payment-proofs' storage bucket
 * and inserts a row in public.commission_payment_proofs with status 'pending_verification'.
 * Follows atomic rollback if database record insertion fails.
 */
export async function uploadPaymentProof(params: {
  commissionId: string;
  clientId: string;
  file: File | Blob;
  fileName?: string;
  amount: number;
  currency?: string;
  paymentType?: PaymentProofType;
  referenceNumber?: string;
  clientNotes?: string;
}): Promise<{ data: CommissionPaymentProof | null; error: string | null }> {
  const {
    commissionId,
    clientId,
    file,
    fileName = 'gcash_receipt.jpg',
    amount,
    currency = 'PHP',
    paymentType = 'deposit',
    referenceNumber,
    clientNotes,
  } = params;

  if (!commissionId) {
    return { data: null, error: 'Commission ID is required to submit payment proof.' };
  }
  if (!clientId) {
    return { data: null, error: 'User must be authenticated to submit payment proof.' };
  }

  const validation = validatePaymentReceiptFile(file, fileName);
  if (!validation.valid) {
    return { data: null, error: validation.error || 'Invalid payment receipt file.' };
  }

  // Pre-validate reference number format and check for duplicate active submissions
  if (referenceNumber && referenceNumber.trim()) {
    const refValidation = validateReferenceNumber(referenceNumber);
    if (!refValidation.valid) {
      return { data: null, error: refValidation.error };
    }

    try {
      const cleanRef = normalizeReferenceNumber(referenceNumber);
      const { data: existingProofs } = await supabase
        .from('commission_payment_proofs')
        .select('id, reference_number, status')
        .in('status', ['pending_verification', 'confirmed']);

      if (existingProofs && existingProofs.length > 0) {
        const isDuplicate = existingProofs.some(
          (p) => normalizeReferenceNumber(p.reference_number) === cleanRef
        );
        if (isDuplicate) {
          return {
            data: null,
            error: `GCash reference number "${referenceNumber.trim()}" has already been submitted for another active payment. Duplicate submissions are not allowed.`,
          };
        }
      }
    } catch (checkErr) {
      console.warn('[Payments] Pre-check for duplicate reference number noticed:', checkErr);
    }
  }

  const safeFileName = sanitizePaymentFileName(fileName);
  const fileExt = safeFileName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const proofId = crypto.randomUUID ? crypto.randomUUID() : `proof_${timestamp}`;
  // Enforce path format: {commission_id}/{proofId}_{timestamp}.{ext}
  const storagePath = `${commissionId}/${proofId}_${timestamp}.${fileExt}`;

  // STEP 1: Upload to private Supabase Storage bucket
  try {
    const { error: uploadError } = await supabase.storage
      .from(PAYMENT_PROOFS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('[Payments] Storage upload failed:', uploadError);
      return {
        data: null,
        error: `Failed to upload payment receipt to storage: ${uploadError.message}`,
      };
    }
  } catch (uploadErr: any) {
    console.error('[Payments] Unexpected storage exception:', uploadErr);
    return {
      data: null,
      error: `Storage upload error: ${uploadErr?.message || 'Network error'}`,
    };
  }

  // STEP 2: Insert metadata into public.commission_payment_proofs
  try {
    const dbPayload = {
      id: proofId,
      commission_id: commissionId,
      client_id: clientId,
      amount: amount || 0,
      currency,
      payment_type: paymentType,
      file_path: storagePath,
      file_name: safeFileName,
      file_type: file.type || 'image/jpeg',
      file_size: file.size,
      reference_number: referenceNumber ? referenceNumber.trim() : null,
      client_notes: clientNotes ? clientNotes.trim() : null,
      status: 'pending_verification' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedRow, error: insertError } = await supabase
      .from('commission_payment_proofs')
      .insert(dbPayload)
      .select()
      .single();

    if (insertError) {
      console.error('[Payments] Database record insertion failed, rolling back storage file:', insertError);
      // Clean up orphaned file
      await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([storagePath]);

      if (
        insertError.code === '23505' ||
        insertError.message?.includes('idx_payment_proofs_unique_active_ref') ||
        insertError.message?.toLowerCase().includes('duplicate')
      ) {
        return {
          data: null,
          error: `GCash reference number "${referenceNumber?.trim()}" has already been submitted for another active payment. Duplicate submissions are not allowed.`,
        };
      }

      return {
        data: null,
        error: `Failed to save payment proof in database: ${insertError.message}`,
      };
    }

    return { data: mapDbRowToPaymentProof(insertedRow), error: null };
  } catch (dbErr: any) {
    console.error('[Payments] Exception during database insertion, rolling back storage:', dbErr);
    await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([storagePath]);
    return {
      data: null,
      error: dbErr?.message || 'Failed to complete payment proof submission.',
    };
  }
}

/**
 * Admin action to confirm or reject a payment proof.
 * Uses atomic RPC if available, or direct admin-authorized update.
 * Strictly checks that caller has admin role, proof is still pending,
 * and balance payments require verified deposits.
 */
export async function adminReviewPaymentProof(params: {
  proofId: string;
  commissionId: string;
  decision: 'confirmed' | 'rejected';
  adminNotes?: string;
  targetPaymentStatus?: 'Partial' | 'Paid';
  adminUserId: string;
}): Promise<{ success: boolean; error?: string; data?: CommissionPaymentProof }> {
  const { proofId, commissionId, decision, adminNotes, targetPaymentStatus, adminUserId } = params;

  if (!proofId || !commissionId) {
    return { success: false, error: 'Payment proof ID and Commission ID are required.' };
  }
  if (!adminUserId) {
    return { success: false, error: 'Admin user authentication required.' };
  }
  if (decision === 'rejected' && (!adminNotes || !adminNotes.trim())) {
    return { success: false, error: 'Rejection reason is required when declining a payment receipt.' };
  }

  // Attempt RPC first for atomic single-transaction execution
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_review_payment_proof', {
      p_proof_id: proofId,
      p_decision: decision,
      p_admin_notes: adminNotes ? adminNotes.trim() : null,
      p_target_payment_status: targetPaymentStatus || (decision === 'confirmed' ? 'Partial' : null),
    });

    if (!rpcError && rpcData) {
      return { success: true, data: mapDbRowToPaymentProof(rpcData) };
    }

    if (rpcError) {
      // If RPC does not exist in schema (42883), fall back to guarded client transaction
      if (rpcError.code === '42883') {
        console.warn('[Payments] RPC admin_review_payment_proof not installed in database, proceeding with guarded fallback.');
      } else {
        // Legitimate business/security rejection from database (already reviewed, unauthorized, balance before deposit)
        return {
          success: false,
          error: rpcError.message || 'Payment review rejected by server security check.',
        };
      }
    }
  } catch (rpcErr) {
    console.warn('[Payments] RPC call exception, proceeding with guarded admin update:', rpcErr);
  }

  // Guarded Fallback: Direct admin updates via RLS
  try {
    // 1. Fetch current proof row to verify existence and pending status
    const { data: currentProof, error: fetchErr } = await supabase
      .from('commission_payment_proofs')
      .select('*')
      .eq('id', proofId)
      .maybeSingle();

    if (fetchErr || !currentProof) {
      return { success: false, error: 'Payment proof not found in database.' };
    }

    // 2. Reject repeated reviews
    if (currentProof.status !== 'pending_verification') {
      return {
        success: false,
        error: `Payment proof has already been ${currentProof.status} and cannot be reviewed again.`,
      };
    }

    // 3. Strict settlement rule enforcement during fallback
    let newStatus: 'Partial' | 'Paid';
    if (decision === 'confirmed') {
      if (currentProof.payment_type === 'deposit') {
        if (targetPaymentStatus === 'Paid') {
          return {
            success: false,
            error: 'A deposit payment receipt cannot mark a commission as fully paid (Paid). Deposit receipts only establish partial deposit settlement (Partial).',
          };
        }
        newStatus = 'Partial';
      } else if (currentProof.payment_type === 'balance') {
        const { data: targetComm } = await supabase
          .from('commissions')
          .select('id, deposit_paid')
          .eq('id', commissionId)
          .maybeSingle();

        if (targetComm && !targetComm.deposit_paid) {
          return {
            success: false,
            error: 'Cannot approve balance payment proof before deposit payment has been confirmed.',
          };
        }
        if (targetPaymentStatus && targetPaymentStatus !== 'Paid') {
          return {
            success: false,
            error: `A balance payment receipt completes full settlement and cannot set payment status to "${targetPaymentStatus}". Expected "Paid".`,
          };
        }
        newStatus = 'Paid';
      } else if (currentProof.payment_type === 'full') {
        if (targetPaymentStatus && targetPaymentStatus !== 'Paid') {
          return {
            success: false,
            error: `A full payment receipt covers 100% of project investment and cannot set payment status to "${targetPaymentStatus}". Expected "Paid".`,
          };
        }
        newStatus = 'Paid';
      } else {
        return {
          success: false,
          error: `Invalid payment type "${currentProof.payment_type}" on payment receipt.`,
        };
      }
    } else {
      newStatus = 'Partial';
    }

    const updatePayload: any = {
      status: decision,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (adminNotes && adminNotes.trim()) {
      updatePayload.admin_notes = adminNotes.trim();
    }

    const { data: updatedProof, error: updateProofErr } = await supabase
      .from('commission_payment_proofs')
      .update(updatePayload)
      .eq('id', proofId)
      .select()
      .single();

    if (updateProofErr) {
      return {
        success: false,
        error: updateProofErr.message || 'Failed to update payment proof record in database.',
      };
    }

    // If confirmed, update the commission payment status
    if (decision === 'confirmed') {
      const commUpdateRes = await updateCommissionPaymentInSupabase(commissionId, newStatus);
      if (!commUpdateRes.success) {
        console.error('[Payments] Proof marked confirmed, but commission status update failed:', commUpdateRes.error);
      }
    }

    return { success: true, data: mapDbRowToPaymentProof(updatedProof) };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while reviewing payment proof.',
    };
  }
}

/**
 * Invariant validation helper for payment review state transitions.
 * Pure model enforcing the exact security rules of admin_review_payment_proof.
 */
export function validatePaymentReviewTransition(params: {
  currentProofStatus: PaymentProofStatus;
  paymentType: PaymentProofType | string;
  commissionDepositPaid: boolean;
  decision: 'confirmed' | 'rejected' | string;
  adminNotes?: string;
  targetPaymentStatus?: string;
  isAdmin: boolean;
}): { allowed: boolean; error?: string; resultingPaymentStatus?: 'Partial' | 'Paid' } {
  const { 
    currentProofStatus, 
    paymentType, 
    commissionDepositPaid, 
    decision, 
    adminNotes, 
    targetPaymentStatus,
    isAdmin 
  } = params;

  if (!isAdmin) {
    return { allowed: false, error: 'Access Denied: Only studio directors are authorized to verify payments.' };
  }

  if (decision !== 'confirmed' && decision !== 'rejected') {
    return { allowed: false, error: `Invalid review decision "${decision}". Must be "confirmed" or "rejected".` };
  }

  // Idempotency & Repeat Review Guard:
  if (currentProofStatus !== 'pending_verification') {
    return {
      allowed: false,
      error: `Payment proof has already been processed with status "${currentProofStatus}" and cannot be reviewed again.`,
    };
  }

  // Validate paymentType
  if (paymentType !== 'deposit' && paymentType !== 'balance' && paymentType !== 'full') {
    return {
      allowed: false,
      error: `Invalid payment type "${paymentType}" on payment proof. Must be "deposit", "balance", or "full".`,
    };
  }

  // Validate targetPaymentStatus if provided
  if (targetPaymentStatus !== undefined && targetPaymentStatus !== null && targetPaymentStatus !== '') {
    if (targetPaymentStatus !== 'Partial' && targetPaymentStatus !== 'Paid') {
      return {
        allowed: false,
        error: `Invalid target payment status "${targetPaymentStatus}". Must be "Partial", "Paid", or null.`,
      };
    }
  }

  if (decision === 'rejected') {
    if (!adminNotes || !adminNotes.trim()) {
      return { allowed: false, error: 'Rejection reason is required when declining payment proof.' };
    }
    return { allowed: true };
  }

  // Decision === 'confirmed':
  if (paymentType === 'deposit') {
    // ANTI-BYPASS RULE: A deposit receipt must NEVER mark a commission as fully paid (Paid)
    if (targetPaymentStatus === 'Paid') {
      return {
        allowed: false,
        error: 'A deposit payment receipt cannot mark a commission as fully paid (Paid). Deposit receipts only establish partial deposit settlement (Partial).',
      };
    }
    return { allowed: true, resultingPaymentStatus: 'Partial' };
  }

  if (paymentType === 'balance') {
    // SEQUENCE RULE: Balance approval requires pre-confirmed deposit
    if (!commissionDepositPaid) {
      return {
        allowed: false,
        error: 'Cannot approve balance payment proof before deposit payment has been confirmed.',
      };
    }
    if (targetPaymentStatus && targetPaymentStatus !== 'Paid') {
      return {
        allowed: false,
        error: `A balance payment receipt completes full settlement and cannot set payment status to "${targetPaymentStatus}". Expected "Paid".`,
      };
    }
    return { allowed: true, resultingPaymentStatus: 'Paid' };
  }

  if (paymentType === 'full') {
    if (targetPaymentStatus && targetPaymentStatus !== 'Paid') {
      return {
        allowed: false,
        error: `A full payment receipt covers 100% of project investment and cannot set payment status to "${targetPaymentStatus}". Expected "Paid".`,
      };
    }
    return { allowed: true, resultingPaymentStatus: 'Paid' };
  }

  return { allowed: false, error: 'Unhandled settlement path.' };
}

/**
 * Invariant validation helper for GCash reference number uniqueness.
 * Rejects duplicate active/confirmed submissions, but permits reuse if previous proof was rejected.
 */
export function validateReferenceNumberUniqueness(
  newRef: string,
  existingProofs: Array<{ referenceNumber?: string; status: PaymentProofStatus }>
): { allowed: boolean; error?: string } {
  if (!newRef || !newRef.trim()) return { allowed: true };
  const cleanNew = normalizeReferenceNumber(newRef);

  const duplicate = existingProofs.find((p) => {
    if (p.status !== 'pending_verification' && p.status !== 'confirmed') return false;
    if (!p.referenceNumber) return false;
    return normalizeReferenceNumber(p.referenceNumber) === cleanNew;
  });

  if (duplicate) {
    return {
      allowed: false,
      error: `GCash reference number "${newRef.trim()}" has already been submitted for another active payment. Duplicate submissions are not allowed.`,
    };
  }

  return { allowed: true };
}

/**
 * Strictly validates whether a user is authorized to download final deliverables.
 * For clients: requires BOTH paymentStatus === 'Paid' AND totalPaid === true.
 * For admins: always authorized.
 */
export function checkFinalDeliverableAccess(params: {
  userRole: 'client' | 'admin';
  isClientOwner: boolean;
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
  totalPaid: boolean;
}): { accessGranted: boolean; reason?: string } {
  const { userRole, isClientOwner, paymentStatus, totalPaid } = params;

  if (userRole === 'admin') {
    return { accessGranted: true };
  }

  if (!isClientOwner) {
    return { accessGranted: false, reason: 'Access denied: user is not the client owner of this commission.' };
  }

  if (paymentStatus !== 'Paid' || totalPaid !== true) {
    return {
      accessGranted: false,
      reason: 'Final deliverables are locked pending full payment verification (requires paymentStatus="Paid" AND totalPaid=true).',
    };
  }

  return { accessGranted: true };
}

/**
 * Subscribes to real-time changes on commission_payment_proofs.
 */
export function subscribeToPaymentProofs(
  commissionId: string | null,
  onUpdate: () => void
): () => void {
  try {
    const channelName = commissionId
      ? `payment_proofs_comm_${commissionId}`
      : 'payment_proofs_all';

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commission_payment_proofs',
          ...(commissionId ? { filter: `commission_id=eq.${commissionId}` } : {}),
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Payments] Realtime subscription could not be established:', err);
    return () => {};
  }
}
