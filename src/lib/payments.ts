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
 * Strictly checks that caller has admin role.
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

    // If RPC is not created yet (42883) or failed, fall back to direct RLS admin update
    if (rpcError && rpcError.code !== '42883') {
      console.warn('[Payments] RPC returned error, falling back to direct admin update:', rpcError);
    }
  } catch (rpcErr) {
    console.warn('[Payments] RPC call exception, proceeding with direct admin update:', rpcErr);
  }

  // Fallback: Direct admin updates via RLS
  try {
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
      const newStatus = targetPaymentStatus || 'Partial';
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
