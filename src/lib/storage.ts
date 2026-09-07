import { supabase } from './supabase';

export const AVATARS_BUCKET = 'avatars';
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type AllowedAvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];

export interface UploadAvatarResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Validates file type and size according to Brewster Creative storage constraints.
 */
export function validateAvatarFile(file: File | Blob, fileName = 'photo.jpg'): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Please select an image file to upload.' };
  }

  // Check MIME type
  const mime = file.type.toLowerCase();
  const isAllowedMime = ALLOWED_AVATAR_MIME_TYPES.includes(mime as AllowedAvatarMimeType);

  // Also verify file extension if available
  const extensionMatch = fileName.split('.').pop()?.toLowerCase();
  const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extensionMatch || '');

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF image.',
    };
  }

  // Check file size (5MB max)
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMb} MB) exceeds the 5 MB limit. Please choose an image under 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Normalizes file extension to safe storage values.
 */
function normalizeExtension(rawNameOrType: string): string {
  const lower = rawNameOrType.toLowerCase();
  if (lower.includes('png')) return 'png';
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('gif')) return 'gif';
  return 'jpg';
}

/**
 * Extracts storage path inside the 'avatars' bucket only if it strictly
 * belongs to the specified userId folder and matches category prefix if given.
 * Prevents unauthorized deletion or modifying another user's files.
 */
export function extractUserAvatarStoragePath(
  url: string | undefined | null,
  userId: string,
  categoryPrefix?: 'profile' | 'studio'
): string | null {
  if (!url || !userId) return null;
  try {
    const decodedUrl = decodeURIComponent(url);
    // Matches paths like:
    // https://<project>.supabase.co/storage/v1/object/public/avatars/{userId}/profile-123.ext
    // avatars/{userId}/profile-123.ext
    const pattern = new RegExp(`(?:/storage/v1/object/(?:public|sign)/)?avatars/(${userId}/[^?#]+)`);
    const match = decodedUrl.match(pattern);
    if (match && match[1]) {
      const path = match[1];
      // Strict prefix check to ensure path is inside this user's folder only
      if (path.startsWith(`${userId}/`)) {
        const filename = path.split('/').pop() || '';
        if (categoryPrefix) {
          // If category specified, ensure filename starts with category prefix (e.g. 'profile-' or 'studio-')
          if (filename.startsWith(`${categoryPrefix}-`)) {
            return path;
          }
          return null;
        }
        return path;
      }
    }
  } catch (err) {
    console.error('Error parsing avatar URL for storage path extraction:', err);
  }
  return null;
}

/**
 * Safely removes the previous photo from Supabase Storage if it strictly belongs to the user's folder.
 * Non-blocking: will not throw or undo the successful profile update.
 */
export async function deletePreviousUserPhoto(
  previousUrl: string | undefined | null,
  userId: string,
  categoryPrefix?: 'profile' | 'studio'
): Promise<void> {
  const oldPath = extractUserAvatarStoragePath(previousUrl, userId, categoryPrefix);
  if (!oldPath) return;

  try {
    const { error } = await supabase.storage.from(AVATARS_BUCKET).remove([oldPath]);
    if (error) {
      console.warn(`Storage cleanup note: could not remove previous ${categoryPrefix || ''} photo:`, error.message);
    }
  } catch (err) {
    console.warn('Storage cleanup error (non-blocking):', err);
  }
}

/**
 * SYSTEM 2: INDIVIDUAL ACCOUNT PROFILE PHOTO
 * Uploads an individual user's account profile photo to:
 * avatars/{userId}/profile-{timestamp}.{extension}
 * 
 * Never touches the studio website photo.
 */
export async function uploadAccountProfilePhoto(
  fileOrBlob: File | Blob,
  userId: string,
  originalFileName?: string
): Promise<UploadAvatarResult> {
  if (!userId) {
    return { success: false, error: 'Authenticated user ID is required to upload profile photo.' };
  }

  const nameForValidation = originalFileName || (fileOrBlob instanceof File ? fileOrBlob.name : 'avatar.jpg');
  const validation = validateAvatarFile(fileOrBlob, nameForValidation);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const extension = normalizeExtension(nameForValidation || fileOrBlob.type);
  const timestamp = Date.now();
  // Strictly enforce path format: avatars/{userId}/profile-{timestamp}.{extension}
  const filePath = `${userId}/profile-${timestamp}.${extension}`;

  const contentType = fileOrBlob.type || (extension === 'jpg' ? 'image/jpeg' : `image/${extension}`);

  try {
    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, fileOrBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || 'Failed to upload profile photo to Supabase Storage.',
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return {
        success: false,
        error: 'Could not retrieve public URL for uploaded profile photo.',
      };
    }

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during profile photo upload.',
    };
  }
}

/**
 * SYSTEM 1: STUDIO / WEBSITE BRAND PHOTO
 * Uploads the Studio / Website representation photo to:
 * avatars/{adminUserId}/studio-{timestamp}.{extension}
 * 
 * Used for Brewster A. Cabando (Studio Lead) on the public homepage "Meet The Designer" section.
 * Never modifies personal client or admin account profile photos.
 */
export async function uploadStudioWebsitePhoto(
  fileOrBlob: File | Blob,
  adminUserId: string,
  originalFileName?: string
): Promise<UploadAvatarResult> {
  if (!adminUserId) {
    return { success: false, error: 'Admin user ID is required to upload studio photo.' };
  }

  const nameForValidation = originalFileName || (fileOrBlob instanceof File ? fileOrBlob.name : 'studio.jpg');
  const validation = validateAvatarFile(fileOrBlob, nameForValidation);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const extension = normalizeExtension(nameForValidation || fileOrBlob.type);
  const timestamp = Date.now();
  // Strictly enforce path format: avatars/{adminUserId}/studio-{timestamp}.{extension}
  const filePath = `${adminUserId}/studio-${timestamp}.${extension}`;

  const contentType = fileOrBlob.type || (extension === 'jpg' ? 'image/jpeg' : `image/${extension}`);

  try {
    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, fileOrBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || 'Failed to upload studio photo to Supabase Storage.',
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return {
        success: false,
        error: 'Could not retrieve public URL for uploaded studio photo.',
      };
    }

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during studio photo upload.',
    };
  }
}

/**
 * Backward compatibility alias for existing code
 */
export const uploadAvatarToSupabase = uploadAccountProfilePhoto;
export const deletePreviousUserAvatar = (url: string | null | undefined, userId: string) =>
  deletePreviousUserPhoto(url, userId, 'profile');
