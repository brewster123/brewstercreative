import React, { useState, useRef, useEffect } from 'react';
import { Camera, UploadCloud, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  uploadStudioWebsitePhoto,
  deletePreviousUserPhoto,
  validateAvatarFile,
} from '../lib/storage';
import { ProfilePhotoEditorModal } from './ProfilePhotoEditorModal';

export interface StudioPhotoUploaderProps {
  adminUserId?: string;
  currentPhoto?: string;
  currentPhotoUrl?: string;
  onPhotoUpdated?: (newUrl: string) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const StudioPhotoUploader: React.FC<StudioPhotoUploaderProps> = ({
  adminUserId: propAdminUserId,
  currentPhoto,
  currentPhotoUrl,
  onPhotoUpdated,
  label = 'Studio Lead Photo',
  description = "Professional portrait displayed on the public website homepage 'Meet The Designer' section. Represents Brewster A. Cabando (Studio Lead).",
  className = '',
}) => {
  const { currentUser, studioProfile, updateStudioProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const selectedImageSrcRef = useRef<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveAdminUserId = propAdminUserId || (currentUser?.role === 'admin' ? currentUser.id : '');
  const photoFromProps = currentPhoto || currentPhotoUrl;

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('studio.jpg');

  // Loading & Feedback State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    selectedImageSrcRef.current = selectedImageSrc;
  }, [selectedImageSrc]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      if (selectedImageSrcRef.current) {
        URL.revokeObjectURL(selectedImageSrcRef.current);
        selectedImageSrcRef.current = null;
      }
    };
  }, []);

  // If user is not authenticated as admin, do not allow access
  if (currentUser?.role !== 'admin') {
    return null;
  }

  const displayedPhoto =
    previewUrl ||
    photoFromProps ||
    studioProfile.avatar ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) {
      e.target.value = '';
    }
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate type and size
    const validation = validateAvatarFile(file, file.name);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.');
      return;
    }

    if (!effectiveAdminUserId || currentUser?.role !== 'admin') {
      setErrorMessage('Admin session is required to update the studio photo.');
      return;
    }

    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    selectedImageSrcRef.current = objectUrl;
    setSelectedImageSrc(objectUrl);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    if (isUploading) return;
    setIsEditorOpen(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      selectedImageSrcRef.current = null;
      setSelectedImageSrc(null);
    }
  };

  const handleSaveCroppedPhoto = async (croppedBlob: Blob, fileExtension: string) => {
    if (!effectiveAdminUserId || currentUser?.role !== 'admin') {
      setErrorMessage('Admin session is required to update the studio photo.');
      return;
    }

    const previousPhotoUrl = photoFromProps || studioProfile.avatar;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Upload via storage utility
      const result = await uploadStudioWebsitePhoto(
        croppedBlob,
        effectiveAdminUserId,
        `studio-cropped.${fileExtension}`
      );

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || 'Failed to upload studio photo to storage.');
      }

      const newPublicUrl = result.publicUrl;

      // Persist to studioProfile in AppContext, LocalStorage, and Supabase DB BEFORE updating preview
      const updateResult = await updateStudioProfile({ avatar: newPublicUrl });
      if (updateResult && !updateResult.success) {
        throw new Error(updateResult.error || 'Failed to persist studio profile photo.');
      }

      if (!isMountedRef.current) return;

      // Update immediate local preview only after successful persistence
      setPreviewUrl(newPublicUrl);

      if (onPhotoUpdated) {
        onPhotoUpdated(newPublicUrl);
      }

      setIsEditorOpen(false);
      if (selectedImageSrcRef.current) {
        URL.revokeObjectURL(selectedImageSrcRef.current);
        selectedImageSrcRef.current = null;
        setSelectedImageSrc(null);
      }

      setSuccessMessage('Studio Lead Photo updated! Live on public homepage.');

      // Storage cleanup: safely delete previous studio photo from admin's folder
      if (previousPhotoUrl && previousPhotoUrl !== newPublicUrl) {
        deletePreviousUserPhoto(previousPhotoUrl, effectiveAdminUserId, 'studio');
      }

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSuccessMessage(null);
        }
      }, 4000);
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorMessage(err?.message || 'An unexpected error occurred while saving studio photo.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  };

  const handleTriggerUpload = () => {
    if (isUploading) return;
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 sm:p-5 rounded-3xl bg-surface-secondary border border-hairline">
        {/* Studio Photo Preview in Rounded Frame matching Homepage Bento Tile */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-accent/25 shadow-md bg-zinc-900">
            <img
              src={displayedPhoto}
              alt="Studio Lead Photo"
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                isUploading ? 'opacity-50' : 'opacity-100'
              }`}
            />
          </div>

          {isUploading && (
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}

          <button
            type="button"
            onClick={handleTriggerUpload}
            disabled={isUploading}
            title="Change Studio Photo"
            aria-label="Change Studio Photo"
            className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-[#111114] text-white hover:bg-accent transition-colors shadow-md border-2 border-white dark:border-[#11131B] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Description */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-accent border border-sky-200 dark:border-sky-800 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Public Homepage Representation
            </span>
          </div>

          <div>
            <span className="block text-xs sm:text-sm font-bold text-carbon">{label}</span>
            <p className="text-xs text-graphite font-normal leading-relaxed">{description}</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id="studio-photo-input"
            />

            <button
              type="button"
              id="btn-upload-studio-photo"
              onClick={handleTriggerUpload}
              disabled={isUploading}
              className="px-4 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-tactile"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111114]" />
                  <span>Processing Studio Photo...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload & Crop Studio Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-start gap-2 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn"
        >
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Adjustment / Crop Modal */}
      <ProfilePhotoEditorModal
        isOpen={isEditorOpen}
        imageSrc={selectedImageSrc}
        fileName={selectedFileName}
        onClose={handleCloseEditor}
        onSave={handleSaveCroppedPhoto}
        isSaving={isUploading}
      />
    </div>
  );
};
