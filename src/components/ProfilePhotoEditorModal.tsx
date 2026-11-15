import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Loader2, Move, AlertCircle } from 'lucide-react';

export interface ProfilePhotoEditorModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  onClose: () => void;
  onSave: (croppedBlob: Blob, fileExtension: string) => Promise<void>;
  isSaving: boolean;
}

export const ProfilePhotoEditorModal: React.FC<ProfilePhotoEditorModalProps> = ({
  isOpen,
  imageSrc,
  fileName = 'profile.jpg',
  onClose,
  onSave,
  isSaving,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dragStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Responsive crop size: 280px on larger screens, 240px on mobile
  const [cropBoxSize, setCropBoxSize] = useState<number>(280);

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        setCropBoxSize(window.innerWidth < 480 ? 240 : 280);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Reset state when new image opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setErrorMessage(null);
    }
  }, [isOpen, imageSrc]);

  // Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Handle image load to get natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 800,
    });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Base scale calculation to make sure image covers the crop circle
  const baseScale = imageSize
    ? Math.max(cropBoxSize / imageSize.width, cropBoxSize / imageSize.height)
    : 1;

  const currentScale = baseScale * zoom;
  const renderedWidth = imageSize ? imageSize.width * currentScale : cropBoxSize;
  const renderedHeight = imageSize ? imageSize.height * currentScale : cropBoxSize;

  // Maximum allowed pan to keep circle fully covered by image
  const maxPanX = Math.max(0, (renderedWidth - cropBoxSize) / 2);
  const maxPanY = Math.max(0, (renderedHeight - cropBoxSize) / 2);

  const clampPan = useCallback(
    (x: number, y: number) => {
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    [maxPanX, maxPanY]
  );

  // Adjust pan when zoom changes so image does not pop outside bounds
  useEffect(() => {
    setPan((prev) => clampPan(prev.x, prev.y));
  }, [clampPan, zoom]);

  // Pointer drag events (supports mouse & touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSaving) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || isSaving) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const nextPan = clampPan(
      dragStartRef.current.initialPanX + deltaX,
      dragStartRef.current.initialPanY + deltaY
    );
    setPan(nextPan);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore if pointer capture release fails
      }
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setErrorMessage(null);
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(1, Math.min(3, newZoom));
    setZoom(clamped);
  };

  // Generate cropped image and save
  const handleConfirmSave = async () => {
    if (!imageSrc || !imgRef.current || !imageSize) return;

    try {
      setErrorMessage(null);
      const outputSize = 512; // High-resolution output for crisp avatars
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not initialize image processing canvas.');
      }

      // High-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scaleRatio = outputSize / cropBoxSize;
      const outW = renderedWidth * scaleRatio;
      const outH = renderedHeight * scaleRatio;

      const drawX = (outputSize - outW) / 2 + pan.x * scaleRatio;
      const drawY = (outputSize - outH) / 2 + pan.y * scaleRatio;

      // Draw the exact framing the user positioned
      ctx.drawImage(imgRef.current, drawX, drawY, outW, outH);

      const mimeType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      const ext = mimeType === 'image/png' ? 'png' : 'jpg';

      canvas.toBlob(
        async (blob) => {
          if (!isMountedRef.current) return;
          if (!blob) {
            setErrorMessage('Could not generate cropped profile photo.');
            return;
          }
          try {
            await onSave(blob, ext);
          } catch (err: any) {
            if (isMountedRef.current) {
              setErrorMessage(err?.message || 'Failed to save cropped profile photo.');
            }
          }
        },
        mimeType,
        0.92
      );
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorMessage(err?.message || 'Failed to crop profile photo.');
      }
    }
  };

  if (!isOpen || !imageSrc) return null;

  // Compute image position inside crop box
  const imgLeft = (cropBoxSize - renderedWidth) / 2 + pan.x;
  const imgTop = (cropBoxSize - renderedHeight) / 2 + pan.y;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-photo-editor-title"
      onClick={() => {
        if (!isSaving) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-hairline rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between shrink-0">
          <div>
            <h3 id="profile-photo-editor-title" className="font-display text-base sm:text-lg font-black text-carbon">
              Adjust Profile Photo
            </h3>
            <p className="text-[11px] text-graphite font-medium">
              Drag to position and zoom to frame your face inside the circle.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 flex flex-col items-center">
          {/* Crop Area Container */}
          <div className="relative flex flex-col items-center">
            {/* Instruction Badge */}
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-mono-code text-graphite-strong font-semibold bg-surface-secondary border border-hairline px-3 py-1 rounded-full">
              <Move className="w-3 h-3 text-accent" />
              <span>Drag to reposition photo</span>
            </div>

            {/* Circular Crop Frame */}
            <div
              style={{ width: cropBoxSize, height: cropBoxSize }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative rounded-full overflow-hidden bg-zinc-950 shadow-inner ring-4 ring-accent/30 touch-none select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Underlying Image */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop Target"
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                  width: `${renderedWidth}px`,
                  height: `${renderedHeight}px`,
                  left: `${imgLeft}px`,
                  top: `${imgTop}px`,
                }}
                className="absolute max-w-none pointer-events-none select-none transition-none"
              />

              {/* Circular subtle alignment guide overlay */}
              <div className="absolute inset-0 rounded-full border border-white/40 pointer-events-none" />
            </div>

            {/* Live circular thumbnail indicator */}
            <div className="mt-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-hairline shrink-0 bg-surface-secondary relative">
                {imageSize && (
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="absolute max-w-none pointer-events-none"
                    style={{
                      width: `${(renderedWidth / cropBoxSize) * 40}px`,
                      height: `${(renderedHeight / cropBoxSize) * 40}px`,
                      left: `${(imgLeft / cropBoxSize) * 40}px`,
                      top: `${(imgTop / cropBoxSize) * 40}px`,
                    }}
                  />
                )}
              </div>
              <span className="text-[11px] text-graphite font-medium">
                Live circular avatar preview
              </span>
            </div>
          </div>

          {/* Zoom & Adjustment Controls */}
          <div className="w-full space-y-3 pt-3 border-t border-hairline">
            <div className="flex items-center justify-between text-xs font-bold text-carbon">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-accent" />
                <span>Zoom Level</span>
              </span>
              <span className="font-mono-code text-[11px] text-graphite">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                disabled={zoom <= 1 || isSaving}
                title="Zoom Out"
                aria-label="Zoom out"
                className="p-2 rounded-full bg-surface-secondary hover:bg-surface border border-hairline text-carbon disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoom}
                disabled={isSaving}
                aria-label="Zoom level"
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-accent cursor-pointer h-2 bg-surface-secondary rounded-lg appearance-none"
              />

              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                disabled={zoom >= 3 || isSaving}
                title="Zoom In"
                aria-label="Zoom in"
                className="p-2 rounded-full bg-surface-secondary hover:bg-surface border border-hairline text-carbon disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving || (zoom === 1 && pan.x === 0 && pan.y === 0)}
                title="Reset Position and Zoom"
                className="px-3 py-2 rounded-full bg-surface-secondary hover:bg-surface border border-hairline text-graphite hover:text-carbon disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="w-full p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-secondary border-t border-hairline flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-full border border-hairline bg-surface text-carbon hover:bg-surface-secondary text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-save-profile-photo"
            onClick={handleConfirmSave}
            disabled={isSaving}
            className="btn-tactile px-5 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111114]" />
                <span>Saving Photo...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-[#111114]" />
                <span>Save Profile Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
