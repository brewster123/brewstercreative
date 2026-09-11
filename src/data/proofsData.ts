import { supabase } from '../lib/supabase';
import { CommissionProof, CommissionProofStatus, User } from '../types';

export const PROOFS_STORAGE_BUCKET = 'commission-proofs';
export const MAX_PROOF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_PROOF_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

export const ALLOWED_PROOF_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'] as const;

export interface CommissionProofDbRow {
  id: string;
  commission_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  version: number;
  status: CommissionProofStatus;
  revision_note: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Maps a database row from public.commission_proofs to the application CommissionProof type.
 */
export function mapDbProofToAppProof(row: CommissionProofDbRow): CommissionProof {
  return {
    id: row.id,
    commissionId: row.commission_id,
    uploadedBy: row.uploaded_by,
    fileName: row.file_name,
    filePath: row.file_path,
    fileUrl: row.file_url || undefined,
    fileType: row.file_type || undefined,
    fileSize: row.file_size !== null && row.file_size !== undefined ? Number(row.file_size) : undefined,
    version: row.version,
    status: row.status,
    revisionNote: row.revision_note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Validates the creative proof file before initiating storage upload.
 * - Allowed formats: JPG, PNG, WebP, GIF, PDF
 * - Maximum size: 50 MB
 */
export function validateProofFile(file: File | null | undefined): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected. Please choose a creative proof file.' };
  }

  // Validate file size (50 MB limit)
  if (file.size > MAX_PROOF_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMb} MB) exceeds the 50 MB limit. Please select a file under 50 MB.`,
    };
  }

  // Validate MIME type & file extension
  const fileName = file.name || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  const isAllowedExt = ALLOWED_PROOF_EXTENSIONS.includes(extension as any);
  const isAllowedMime = ALLOWED_PROOF_MIME_TYPES.includes(mimeType as any);

  if (!isAllowedExt && !isAllowedMime) {
    return {
      valid: false,
      error: 'Unsupported file type. Supported formats: JPG/JPEG, PNG, WebP, GIF, or PDF.',
    };
  }

  return { valid: true };
}

/**
 * Generates an RFC4122 v4 UUID with safe fallback.
 */
export function generateProofUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formats bytes into a human-readable file size string.
 */
export function formatProofFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Determines the next proof version for the selected commission.
 * If no proofs exist: version = 1
 * Otherwise: version = maximum existing version + 1
 */
export async function getNextProofVersion(commissionId: string): Promise<number> {
  if (!commissionId) return 1;

  try {
    const { data, error } = await supabase
      .from('commission_proofs')
      .select('version')
      .eq('commission_id', commissionId)
      .order('version', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 1;
    }

    const currentMax = data[0]?.version;
    if (typeof currentMax === 'number' && currentMax > 0) {
      return currentMax + 1;
    }
    return 1;
  } catch (err) {
    console.error('[Proof Versioning] Error fetching next version:', err);
    return 1;
  }
}

/**
 * Fetches all creative proofs for a commission from public.commission_proofs.
 * Orders them descending by version so the latest draft is first.
 */
export async function fetchProofsForCommission(
  commissionId: string
): Promise<{ success: boolean; data: CommissionProof[]; error?: string }> {
  if (!commissionId) {
    return { success: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('commission_proofs')
      .select('*')
      .eq('commission_id', commissionId)
      .order('version', { ascending: false });

    if (error) {
      console.error('[Proof DB] Error fetching proofs:', error);
      return { success: false, data: [], error: error.message };
    }

    const mapped = ((data || []) as CommissionProofDbRow[]).map(mapDbProofToAppProof);
    return { success: true, data: mapped };
  } catch (err: any) {
    console.error('[Proof DB] Exception during fetchProofsForCommission:', err);
    return {
      success: false,
      data: [],
      error: err?.message || 'An unexpected error occurred while loading creative proofs.',
    };
  }
}

export interface UploadCreativeProofParams {
  file: File;
  commissionId: string;
  currentUser: User | null;
}

export interface UploadCreativeProofResult {
  success: boolean;
  proof?: CommissionProof;
  error?: string;
}

/**
 * Executes the safe Admin-only creative proof upload workflow:
 * 1. Confirms current user is authenticated and has admin role.
 * 2. Confirms commission exists.
 * 3. Generates a unique proof ID.
 * 4. Determines the next proof version (max + 1, or 1 if none).
 * 5. Builds safe storage path: {commission_id}/{proof_id}/{filename}
 * 6. Uploads the file to private bucket 'commission-proofs'.
 * 7. Inserts matching row into public.commission_proofs (file_url = null, status = 'pending_review').
 * 8. If database insert fails, automatically removes the just-uploaded Storage object (rollback).
 */
export async function uploadAdminCreativeProof({
  file,
  commissionId,
  currentUser,
}: UploadCreativeProofParams): Promise<UploadCreativeProofResult> {
  // 1. Confirm authentication & admin role
  if (!currentUser) {
    return {
      success: false,
      error: 'Authentication error: You must be logged in as an administrator to upload creative proofs.',
    };
  }

  if (currentUser.role !== 'admin') {
    return {
      success: false,
      error: 'Permission denied: Only Brewster Creative administrators are authorized to upload creative proofs.',
    };
  }

  // 2. Confirm commission exists
  if (!commissionId || !commissionId.trim()) {
    return {
      success: false,
      error: 'Please select an existing commission to upload a creative proof.',
    };
  }

  // Validate file
  const validation = validateProofFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'The selected file is not supported.',
    };
  }

  // 3. Generate unique proof ID
  const proofId = generateProofUUID();

  // 4. Calculate next version
  const nextVersion = await getNextProofVersion(commissionId);

  // Clean filename to prevent path issues while preserving extension
  const safeFileName = file.name.replace(/[/\\]/g, '_').trim();
  // 5. Build storage path: {commission_id}/{proof_id}/{filename}
  const storagePath = `${commissionId}/${proofId}/${safeFileName}`;

  // 6. Upload file to private bucket 'commission-proofs'
  const { data: storageData, error: storageError } = await supabase.storage
    .from(PROOFS_STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (storageError || !storageData) {
    console.error('[Proof Storage] Upload error:', storageError);
    return {
      success: false,
      error: storageError?.message || 'Failed to upload creative proof file to private storage.',
    };
  }

  // 7. Insert matching row into public.commission_proofs
  const dbPayload = {
    id: proofId,
    commission_id: commissionId,
    uploaded_by: currentUser.id,
    file_name: file.name,
    file_path: storagePath,
    file_url: null, // Private bucket: never expose a public URL
    file_type: file.type || 'application/octet-stream',
    file_size: file.size,
    version: nextVersion,
    status: 'pending_review',
    revision_note: null,
  };

  try {
    const { data: insertedRow, error: dbError } = await supabase
      .from('commission_proofs')
      .insert(dbPayload)
      .select()
      .single();

    if (dbError || !insertedRow) {
      console.error('[Proof DB] Insert error, rolling back storage object:', dbError);

      // Rollback: remove just-uploaded Storage object
      try {
        await supabase.storage.from(PROOFS_STORAGE_BUCKET).remove([storagePath]);
      } catch (rollbackErr) {
        console.error('[Proof Storage] Failed to remove storage object after DB failure:', rollbackErr);
      }

      return {
        success: false,
        error: dbError?.message || 'Failed to record creative proof in the database. Storage upload was rolled back.',
      };
    }

    const appProof = mapDbProofToAppProof(insertedRow as CommissionProofDbRow);

    return {
      success: true,
      proof: appProof,
    };
  } catch (err: any) {
    console.error('[Proof DB] Exception during insert, rolling back storage object:', err);

    // Rollback: remove just-uploaded Storage object
    try {
      await supabase.storage.from(PROOFS_STORAGE_BUCKET).remove([storagePath]);
    } catch (rollbackErr) {
      console.error('[Proof Storage] Failed to remove storage object after DB failure:', rollbackErr);
    }

    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while saving the creative proof. Storage upload was rolled back.',
    };
  }
}

/**
 * Generates a short-lived signed URL for a private creative proof.
 * Uses createSignedUrl() so credentials and permanent URLs are never exposed.
 *
 * @param filePath The storage path {commission_id}/{proof_id}/{filename}
 * @param expiresInSeconds Validity duration (defaults to 300 seconds / 5 minutes)
 */
export async function getProofSignedUrl(
  filePath: string,
  expiresInSeconds = 300
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  if (!filePath) {
    return {
      success: false,
      error: 'Storage path is required to view this proof.',
    };
  }

  try {
    const { data, error } = await supabase.storage
      .from(PROOFS_STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error('[Proof Storage] createSignedUrl error:', error);
      return {
        success: false,
        error: error?.message || 'Could not generate temporary access link for this proof.',
      };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (err: any) {
    console.error('[Proof Storage] Exception during createSignedUrl:', err);
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while generating temporary access link.',
    };
  }
}
