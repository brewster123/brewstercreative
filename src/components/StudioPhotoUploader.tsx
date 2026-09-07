import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  uploadStudioWebsitePhoto,
  deletePreviousUserPhoto,
  validateAvatarFile,
} from '../lib/storage';
import { ProfilePhotoEditorModal } from './ProfilePhotoEditorModal';

export interface StudioPhotoUploaderProps {
  adminUserId: string;
  currentPhoto?: string;
  onPhotoUpdated?: (newUrl: string) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const StudioPhotoUploader: React.FC<StudioPhotoUploaderProps> = ({
  adminUserId,
  currentPhoto,
  onPhotoUpdated,
  label = 'Studio / Website Brand Photo',
  description = "Professional portrait displayed on the public website homepage 'Meet The Designer' section. Represents Brewster A. Cabando (Studio Lead).",
  className = '',
}) => {
  const { studioProfile, updateStudioProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('studio.jpg');

  // Loading & Feedback State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayedPhoto =
    previewUrl ||
    currentPhoto ||
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

    if (!adminUserId) {
      setErrorMessage('Admin session is required to update the studio photo.');
      return;
    }

    setSelectedFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setSelectedImageSrc(objectUrl);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    if (isUploading) return;
    setIsEditorOpen(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
    }
  };

  const handleSaveCroppedPhoto = async (croppedBlob: Blob, fileExtension: string) => {
    if (!adminUserId) {
      setErrorMessage('Admin user ID is missing.');
      return;
    }

    const previousPhotoUrl = currentPhoto || studioProfile.avatar;
    setIsUploading(true);

    try {
      // Strictly upload to: avatars/{adminUserId}/studio-{timestamp}.{extension}
      const result = await uploadStudioWebsitePhoto(
        croppedBlob,
        adminUserId,
        `studio-cropped.${fileExtension}`
      );

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || 'Failed to upload studio photo to storage.');
      }

      const newPublicUrl = result.publicUrl;

      // Update immediate local preview
      setPreviewUrl(newPublicUrl);

      // Persist to studioProfile in AppContext & LocalStorage (controls public homepage "Meet The Designer")
      // CRITICAL: Does NOT call updateUserProfile, ensuring personal account photos remain completely separate!
      updateStudioProfile({ avatar: newPublicUrl });

      if (onPhotoUpdated) {
        onPhotoUpdated(newPublicUrl);
      }

      handleCloseEditor();

      setSuccessMessage('Studio / Website photo updated! Live on public homepage.');

      // Storage cleanup: delete previous studio photo from admin's folder
      if (previousPhotoUrl && previousPhotoUrl !== newPublicUrl) {
        deletePreviousUserPhoto(previousPhotoUrl, adminUserId, 'studio');
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while saving studio photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerUpload = () => {
    if (isUploading) return;
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
        {/* Studio Photo Preview in Rounded Frame matching Homepage Bento Tile */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-orange-500/20 shadow-md bg-zinc-900">
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
            className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-zinc-900 text-white hover:bg-orange-600 transition-colors shadow-md border-2 border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Description */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-mono-code font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Public Homepage Representation
            </span>
          </div>

          <div>
            <span className="block text-xs sm:text-sm font-bold text-zinc-900">{label}</span>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">{description}</p>
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
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
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
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn"
        >
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
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
