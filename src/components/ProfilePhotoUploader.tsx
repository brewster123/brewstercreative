import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  uploadAccountProfilePhoto,
  deletePreviousUserPhoto,
  validateAvatarFile,
} from '../lib/storage';
import { ProfilePhotoEditorModal } from './ProfilePhotoEditorModal';

export interface ProfilePhotoUploaderProps {
  userId: string;
  currentAvatar?: string;
  onAvatarUpdated?: (newUrl: string) => void;
  label?: string;
  description?: string;
  className?: string;
  avatarSizeClass?: string;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  userId,
  currentAvatar,
  onAvatarUpdated,
  label = 'Account Profile Photo',
  description = 'Upload and crop your personal account portrait. JPEG, PNG, WebP, or GIF up to 5 MB.',
  className = '',
  avatarSizeClass = 'w-20 h-20 sm:w-24 sm:h-24',
}) => {
  const { updateUserProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('avatar.jpg');

  // Loading & Feedback State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayedAvatar =
    previewUrl ||
    currentAvatar ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

  // STEP 1: Computer file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) {
      e.target.value = '';
    }
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate type and size before opening editor
    const validation = validateAvatarFile(file, file.name);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.');
      return;
    }

    if (!userId) {
      setErrorMessage('You must be signed in to upload an account profile photo.');
      return;
    }

    // Read file into Object URL for adjustment editor
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

  // STEP 3: Save adjusted/cropped photo from editor
  const handleSaveCroppedPhoto = async (croppedBlob: Blob, fileExtension: string) => {
    if (!userId) {
      setErrorMessage('User session missing.');
      return;
    }

    const previousAvatarUrl = currentAvatar;
    setIsUploading(true);

    try {
      // Upload cropped blob to: avatars/{userId}/profile-{timestamp}.{extension}
      const result = await uploadAccountProfilePhoto(
        croppedBlob,
        userId,
        `cropped.${fileExtension}`
      );

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || 'Failed to upload cropped photo to storage.');
      }

      const newPublicUrl = result.publicUrl;

      // Persist to user's profile in Supabase & AppContext (must succeed before updating UI state)
      await updateUserProfile(userId, { avatar: newPublicUrl });

      // Update immediate local preview only AFTER successful database update
      setPreviewUrl(newPublicUrl);

      if (onAvatarUpdated) {
        onAvatarUpdated(newPublicUrl);
      }

      // Close editor modal
      handleCloseEditor();

      setSuccessMessage('Profile photo updated successfully!');

      // Old photo cleanup: delete previous personal profile photo if from user's folder
      if (previousAvatarUrl && previousAvatarUrl !== newPublicUrl) {
        deletePreviousUserPhoto(previousAvatarUrl, userId, 'profile');
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while saving profile photo.');
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
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        {/* Avatar image with circular overlay */}
        <div className="relative group shrink-0">
          <img
            src={displayedAvatar}
            alt="Account Profile Avatar"
            className={`${avatarSizeClass} rounded-full object-cover ring-4 ring-orange-500/20 shadow-xs transition-opacity duration-200 ${
              isUploading ? 'opacity-50' : 'opacity-100'
            }`}
          />

          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}

          <button
            type="button"
            onClick={handleTriggerUpload}
            disabled={isUploading}
            title="Change Profile Photo"
            aria-label="Change Profile Photo"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-zinc-900 text-white hover:bg-orange-600 transition-colors shadow-md border-2 border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls & Description */}
        <div className="flex-1 space-y-2">
          <div>
            <span className="block text-xs font-bold text-zinc-900">{label}</span>
            <p className="text-xs text-zinc-500 font-medium">{description}</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id={`profile-photo-input-${userId}`}
            />

            <button
              type="button"
              id="btn-upload-profile-photo"
              onClick={handleTriggerUpload}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                  <span>Processing photo...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Change Profile Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error state alert */}
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

      {/* Success state badge */}
      {successMessage && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn"
        >
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STEP 2: Facebook-Style Profile Photo Editor Modal */}
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
