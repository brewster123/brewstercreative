import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
  title?: string;
  images?: string[];
  currentIndex?: number;
  onNavigate?: (newIndex: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText,
  title,
  images,
  currentIndex,
  onNavigate,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = (document.activeElement as HTMLElement) || null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' && images && typeof currentIndex === 'number' && onNavigate) {
        if (currentIndex > 0) {
          e.preventDefault();
          onNavigate(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight' && images && typeof currentIndex === 'number' && onNavigate) {
        if (currentIndex < images.length - 1) {
          e.preventDefault();
          onNavigate(currentIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent background scrolling while lightbox is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previousActiveElement?.focus();
    };
  }, [isOpen, onClose, images, currentIndex, onNavigate]);

  if (!isOpen) return null;

  const hasMultipleImages = Boolean(images && images.length > 1 && typeof currentIndex === 'number' && onNavigate);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Image viewer: ${title}` : 'Image viewer'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200 select-none cursor-zoom-out"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent pointer-events-none"
      >
        <div className="pointer-events-auto">
          {title && (
            <p className="text-xs sm:text-sm font-medium text-white/90 truncate max-w-[70vw] drop-shadow-sm font-sans">
              {title}
            </p>
          )}
          {hasMultipleImages && (
            <p className="text-[11px] text-[#A1A1AA] font-mono">
              {(currentIndex ?? 0) + 1} / {images!.length}
            </p>
          )}
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close image viewer"
          className="pointer-events-auto p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-[#18181B]/90 hover:bg-[#222225] text-white/90 hover:text-white transition-all cursor-pointer border border-[#222225] shadow-lg ml-auto focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Optional previous button */}
      {hasMultipleImages && (currentIndex ?? 0) > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate!((currentIndex ?? 0) - 1);
          }}
          aria-label="Previous image"
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-[#18181B]/90 hover:bg-[#222225] text-white transition-all cursor-pointer border border-[#222225] shadow-lg z-10 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Image Container */}
      <div
        className="relative max-w-full max-h-full flex items-center justify-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {Boolean(imageUrl && imageUrl.trim()) && (
          <img
            src={imageUrl}
            alt={altText}
            className="max-h-[85vh] max-w-[92vw] object-contain rounded-lg shadow-2xl transition-all select-none"
          />
        )}
      </div>

      {/* Optional next button */}
      {hasMultipleImages && (currentIndex ?? 0) < images!.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate!((currentIndex ?? 0) + 1);
          }}
          aria-label="Next image"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-[#18181B]/90 hover:bg-[#222225] text-white transition-all cursor-pointer border border-[#222225] shadow-lg z-10 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
};
