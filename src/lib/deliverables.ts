import { supabase } from './supabase';
import { CommissionDeliverable } from '../types';

export const FINAL_DELIVERABLES_BUCKET = 'final-deliverables';

/**
 * Validates deliverable files before upload.
 * Enforces maximum size (100MB) and non-empty filename.
 */
export const MAX_DELIVERABLE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function validateDeliverableFile(
  file: File | Blob,
  fileName: string
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Please select a file to upload.' };
  }
  if (!fileName || !fileName.trim()) {
    return { valid: false, error: 'File name cannot be empty.' };
  }
  if (file.size <= 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }
  if (file.size > MAX_DELIVERABLE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 100 MB limit per deliverable.`,
    };
  }
  return { valid: true };
}

/**
 * Sanitizes file names to prevent directory traversal or invalid storage keys.
 */
export function sanitizeDeliverableFileName(rawName: string): string {
  const trimmed = (rawName || 'deliverable').trim();
  // Strip slashes, backslashes, null bytes
  const base = trimmed.replace(/[\/\\]/g, '_').replace(/\0/g, '');
  // Replace multiple spaces or unusual symbols with underscores
  const clean = base.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return clean || `deliverable_${Date.now()}`;
}

/**
 * Formats bytes into a human-readable string (e.g., "12.4 MB", "84 KB").
 */
export function formatDeliverableFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Converts a database row from public.commission_deliverables to the UI CommissionDeliverable model.
 */
export function mapDbRowToDeliverable(row: any): CommissionDeliverable {
  return {
    id: row.id,
    commissionId: row.commission_id,
    commission_id: row.commission_id,
    uploadedBy: row.uploaded_by,
    uploaded_by: row.uploaded_by,
    fileName: row.file_name,
    file_name: row.file_name,
    filePath: row.file_path,
    file_path: row.file_path,
    fileType: row.file_type || 'application/octet-stream',
    file_type: row.file_type || 'application/octet-stream',
    fileSize: Number(row.file_size) || 0,
    file_size: Number(row.file_size) || 0,
    version: row.version || 1,
    title: row.title || row.file_name,
    description: row.description || '',
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
  };
}

/**
 * Fetches all persistent deliverables for a commission from Supabase.
 * Row-Level Security automatically ensures clients only receive deliverables for their own commissions.
 */
export async function fetchCommissionDeliverables(
  commissionId: string
): Promise<{ data: CommissionDeliverable[] | null; error: string | null }> {
  if (!commissionId) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('commission_deliverables')
      .select('*')
      .eq('commission_id', commissionId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table has not yet been initialized in remote SQL editor, report cleanly
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { data: [], error: null };
      }
      return { data: null, error: error.message || 'Failed to fetch commission deliverables.' };
    }

    const mapped = (data || []).map(mapDbRowToDeliverable);
    return { data: mapped, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'An unexpected network error occurred while fetching deliverables.',
    };
  }
}

/**
 * Generates a short-lived signed URL for a deliverable file in the private 'final-deliverables' bucket.
 * Never constructs or exposes public storage URLs.
 */
export async function getDeliverableSignedUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<{ signedUrl: string | null; error: string | null }> {
  if (!filePath) {
    return { signedUrl: null, error: 'Deliverable file path is missing.' };
  }

  let cleanPath = filePath.trim();
  if (cleanPath.startsWith('final-deliverables/')) {
    cleanPath = cleanPath.replace(/^final-deliverables\//, '');
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }

  try {
    const { data, error } = await supabase.storage
      .from(FINAL_DELIVERABLES_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return {
        signedUrl: null,
        error: error?.message || 'Failed to generate secure signed URL for deliverable.',
      };
    }

    return { signedUrl: data.signedUrl, error: null };
  } catch (err: any) {
    return {
      signedUrl: null,
      error: err?.message || 'An unexpected error occurred while signing deliverable URL.',
    };
  }
}

/**
 * Uploads a final deliverable file to private Supabase Storage and records metadata in database.
 * Follows safe upload order:
 * 1. Validate inputs
 * 2. Upload to private bucket
 * 3. Insert database record
 * 4. Cleanup Storage if database insertion fails
 */
export async function uploadCommissionDeliverable(params: {
  commissionId: string;
  adminUserId: string;
  file: File | Blob;
  fileName: string;
  fileType?: string;
  title?: string;
  description?: string;
  version?: number;
}): Promise<{ data: CommissionDeliverable | null; error: string | null }> {
  const {
    commissionId,
    adminUserId,
    file,
    fileName,
    fileType,
    title,
    description,
    version = 1,
  } = params;

  if (!commissionId) {
    return { data: null, error: 'Commission ID is required for deliverable upload.' };
  }
  if (!adminUserId) {
    return { data: null, error: 'Admin User ID is required.' };
  }

  const validation = validateDeliverableFile(file, fileName);
  if (!validation.valid) {
    return { data: null, error: validation.error || 'Invalid deliverable file.' };
  }

  const safeFileName = sanitizeDeliverableFileName(fileName);
  const deliverableId = crypto.randomUUID ? crypto.randomUUID() : `deliv-${Date.now()}`;
  // Enforce secure path structure: {commission_id}/{deliverable_id}/{safe_filename}
  const storagePath = `${commissionId}/${deliverableId}/${safeFileName}`;

  const resolvedMime = fileType || (file as File).type || 'application/octet-stream';

  try {
    // Step 1: Upload to private storage
    const { error: storageError } = await supabase.storage
      .from(FINAL_DELIVERABLES_BUCKET)
      .upload(storagePath, file, {
        contentType: resolvedMime,
        upsert: false,
      });

    if (storageError) {
      return {
        data: null,
        error: `Storage upload failed: ${storageError.message}`,
      };
    }

    // Step 2: Record in database table public.commission_deliverables
    const insertPayload: any = {
      id: deliverableId,
      commission_id: commissionId,
      uploaded_by: adminUserId,
      file_name: safeFileName,
      file_path: storagePath,
      file_type: resolvedMime,
      file_size: file.size,
      version: version || 1,
      title: title || safeFileName,
      description: description || '',
    };

    const { data: dbData, error: dbError } = await supabase
      .from('commission_deliverables')
      .insert(insertPayload)
      .select()
      .single();

    if (dbError) {
      // Step 3: Attempt Storage cleanup to prevent orphaned file
      try {
        await supabase.storage.from(FINAL_DELIVERABLES_BUCKET).remove([storagePath]);
      } catch (cleanupErr) {
        console.error('[Deliverables] Storage cleanup error after failed DB insert:', cleanupErr);
      }

      return {
        data: null,
        error: `Database registration failed: ${dbError.message}`,
      };
    }

    const mapped = mapDbRowToDeliverable(dbData);
    return { data: mapped, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'An unexpected error occurred during deliverable delivery.',
    };
  }
}

/**
 * Deletes a commission deliverable (Storage object + database record).
 * Restricted to Studio Administrators.
 */
export async function deleteCommissionDeliverable(
  deliverable: CommissionDeliverable
): Promise<{ success: boolean; error: string | null }> {
  if (!deliverable?.id || !deliverable.filePath) {
    return { success: false, error: 'Deliverable ID and path are required for deletion.' };
  }

  let cleanPath = deliverable.filePath.trim();
  if (cleanPath.startsWith('final-deliverables/')) {
    cleanPath = cleanPath.replace(/^final-deliverables\//, '');
  }

  try {
    // 1. Remove from Storage
    const { error: storageError } = await supabase.storage
      .from(FINAL_DELIVERABLES_BUCKET)
      .remove([cleanPath]);

    if (storageError) {
      console.warn('[Deliverables] Notice removing storage object:', storageError.message);
    }

    // 2. Remove from database
    const { error: dbError } = await supabase
      .from('commission_deliverables')
      .delete()
      .eq('id', deliverable.id);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete deliverable.' };
  }
}

/**
 * Subscribes to realtime deliverable inserts or deletions for a commission.
 */
export function subscribeToCommissionDeliverables(
  commissionId: string,
  onDeliverablesChanged: () => void
): () => void {
  if (!commissionId) return () => {};

  const channelId = `realtime-deliv-${commissionId}-${Date.now()}`;
  const channel = supabase.channel(channelId);

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'commission_deliverables',
        filter: `commission_id=eq.${commissionId}`,
      },
      () => {
        onDeliverablesChanged();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
