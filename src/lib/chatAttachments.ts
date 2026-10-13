import { supabase } from './supabase';

export const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments';
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Agreed, supported file formats for chat attachments across UI picker, client validator,
 * and Supabase Storage bucket policy.
 * Non-conforming or risky formats (including SVGs, executable formats, and unmapped binary blobs) are rejected.
 */
export const ALLOWED_CHAT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/markdown',
  'text/csv',
] as const;

export const ALLOWED_CHAT_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.zip',
  '.txt',
  '.md',
  '.csv',
] as const;

export const CHAT_FILE_INPUT_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,application/pdf,.zip,.txt,.md,.csv';

/**
 * Validates whether a file has an approved extension and MIME type.
 */
export function isAllowedAttachmentFile(file: File): { allowed: boolean; reason?: string } {
  if (!file) return { allowed: false, reason: 'No file provided.' };

  const lowerName = file.name.toLowerCase();

  // Strict rejection of SVG
  if (file.type === 'image/svg+xml' || lowerName.endsWith('.svg')) {
    return {
      allowed: false,
      reason: 'SVG files are not supported as chat attachments to protect against script injection.',
    };
  }

  const hasAllowedExt = ALLOWED_CHAT_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      allowed: false,
      reason: `File format not supported. Allowed formats: PNG, JPG, WebP, GIF, PDF, ZIP, TXT, MD, CSV.`,
    };
  }

  // If browser resolved a MIME type, ensure it is in the allowlist
  if (file.type && !(ALLOWED_CHAT_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase())) {
    return {
      allowed: false,
      reason: `File type "${file.type}" is not supported. Allowed formats: PNG, JPG, WebP, GIF, PDF, ZIP, TXT, MD, CSV.`,
    };
  }

  return { allowed: true };
}

/**
 * Determines appropriate contentType string when uploading to Supabase Storage.
 */
export function resolveAttachmentContentType(file: File): string {
  if (file.type && (ALLOWED_CHAT_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase())) {
    return file.type;
  }
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.gif')) return 'image/gif';
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  if (lowerName.endsWith('.zip')) return 'application/zip';
  if (lowerName.endsWith('.txt')) return 'text/plain';
  if (lowerName.endsWith('.md')) return 'text/markdown';
  if (lowerName.endsWith('.csv')) return 'text/csv';
  return 'application/octet-stream';
}

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

  // Validate allowed format and reject SVGs
  const formatValidation = isAllowedAttachmentFile(file);
  if (!formatValidation.allowed) {
    return {
      path: null,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: formatFileSize(file.size),
      mime: file.type,
      error: formatValidation.reason || 'Unsupported attachment format.',
    };
  }

  const sanitized = sanitizeFileName(file.name);
  const uniqueKey = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `${commissionId}/${uniqueKey}_${sanitized}`;
  const contentType = resolveAttachmentContentType(file);
  const isImage = contentType.startsWith('image/');
  const formattedSize = formatFileSize(file.size);

  try {
    const { error: uploadError } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .upload(storagePath, file, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return {
        path: null,
        name: file.name,
        type: isImage ? 'image' : 'file',
        size: formattedSize,
        mime: contentType,
        error: uploadError.message || 'Failed to upload chat attachment file.',
      };
    }

    return {
      path: storagePath,
      name: file.name,
      type: isImage ? 'image' : 'file',
      size: formattedSize,
      mime: contentType,
      error: null,
    };
  } catch (err: any) {
    return {
      path: null,
      name: file.name,
      type: isImage ? 'image' : 'file',
      size: formattedSize,
      mime: contentType,
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
