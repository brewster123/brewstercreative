import { supabase } from './supabase';

export const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments';
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Sanitizes a filename to remove risky characters, directory traversals, and non-ASCII glyphs.
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'file';
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
}

/**
 * Formats bytes to human-readable string (e.g. "1.5 MB").
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generates a short-lived signed URL for an attachment stored in 'chat-attachments'.
 * Time-limited to 3600 seconds (1 hour).
 */
export async function getChatAttachmentSignedUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<{ signedUrl: string | null; error: string | null }> {
  if (!filePath) {
    return { signedUrl: null, error: 'Attachment file path is missing.' };
  }

  let cleanPath = filePath.trim();
  if (cleanPath.startsWith('chat-attachments/')) {
    cleanPath = cleanPath.replace(/^chat-attachments\//, '');
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }

  try {
    const { data, error } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error) {
      return { signedUrl: null, error: error.message || 'Failed to generate secure attachment download link.' };
    }

    return { signedUrl: data?.signedUrl || null, error: null };
  } catch (err: any) {
    return {
      signedUrl: null,
      error: err?.message || 'Unexpected error generating signed URL.',
    };
  }
}

/**
 * Uploads a chat attachment file to the private 'chat-attachments' bucket.
 * The path is structured as: {commissionId}/{timestamp}_{uniqueId}_{sanitizedFileName}
 */
export async function uploadChatAttachmentFile(
  commissionId: string,
  file: File
): Promise<{
  path: string | null;
  name: string;
  type: 'image' | 'file';
  size: string;
  mime: string;
  error: string | null;
}> {
  if (!commissionId?.trim()) {
    return {
      path: null,
      name: file?.name || '',
      type: 'file',
      size: '',
      mime: '',
      error: 'Commission ID is required for chat attachment upload.',
    };
  }

  if (!file) {
    return {
      path: null,
      name: '',
      type: 'file',
      size: '',
      mime: '',
      error: 'No file provided for upload.',
    };
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      path: null,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: formatFileSize(file.size),
      mime: file.type,
      error: `Attachment exceeds the maximum allowed size of 25 MB (${formatFileSize(file.size)}).`,
    };
  }

  const sanitized = sanitizeFileName(file.name);
  const uniqueKey = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `${commissionId}/${uniqueKey}_${sanitized}`;
  const isImage = file.type.startsWith('image/');
  const formattedSize = formatFileSize(file.size);

  try {
    const { error: uploadError } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return {
        path: null,
        name: file.name,
        type: isImage ? 'image' : 'file',
        size: formattedSize,
        mime: file.type || 'application/octet-stream',
        error: uploadError.message || 'Failed to upload chat attachment file.',
      };
    }

    return {
      path: storagePath,
      name: file.name,
      type: isImage ? 'image' : 'file',
      size: formattedSize,
      mime: file.type || 'application/octet-stream',
      error: null,
    };
  } catch (err: any) {
    return {
      path: null,
      name: file.name,
      type: isImage ? 'image' : 'file',
      size: formattedSize,
      mime: file.type || 'application/octet-stream',
      error: err?.message || 'Network error during attachment upload.',
    };
  }
}

/**
 * Attempts to remove an uploaded chat attachment object from storage.
 * Used for cleanup if the corresponding database insert fails.
 */
export async function deleteChatAttachmentObject(storagePath: string): Promise<void> {
  if (!storagePath) return;

  let cleanPath = storagePath.trim();
  if (cleanPath.startsWith('chat-attachments/')) {
    cleanPath = cleanPath.replace(/^chat-attachments\//, '');
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }

  try {
    await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .remove([cleanPath]);
  } catch {
    // Non-fatal cleanup attempt
  }
}
