import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, Check, Paperclip } from 'lucide-react';

interface FileUploaderProps {
  label?: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: { name: string; size: string; type: string; url: string }[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label = 'Upload Reference Assets / Documents',
  description = 'Drag & drop moodboard images, brand guidelines, PDF briefs, or vector references (PNG, JPG, SVG, PDF, AI, PSD up to 50MB)',
  accept = 'image/*,.pdf,.doc,.docx,.ai,.psd,.zip',
  multiple = true,
  onFilesSelected,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedList, setUploadedList] = useState<{ name: string; size: string; type: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedListRef = useRef<{ name: string; size: string; type: string; url: string }[]>([]);

  useEffect(() => {
    uploadedListRef.current = uploadedList;
  }, [uploadedList]);

  useEffect(() => {
    return () => {
      uploadedListRef.current.forEach((f) => {
        if (f.url && f.url.startsWith('blob:')) {
          URL.revokeObjectURL(f.url);
        }
      });
    };
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((f) => {
      const isImg = f.type.startsWith('image/');
      return {
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: isImg ? 'image' : 'document',
        url: isImg ? URL.createObjectURL(f) : 'https://example.com/files/uploaded.pdf',
      };
    });

    const combined = [...uploadedList, ...newFiles];
    setUploadedList(combined);
    onFilesSelected(combined);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const removed = uploadedList[index];
    if (removed?.url && removed.url.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url);
    }
    const updated = uploadedList.filter((_, i) => i !== index);
    setUploadedList(updated);
    onFilesSelected(updated);
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-bold text-carbon mb-1.5">
          {label}
        </label>
      )}

      {/* Drag & Drop Box */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
          isDragging
            ? 'border-accent bg-sky-500/10 scale-[1.01]'
            : 'border-hairline bg-surface-secondary/70 hover:border-accent/60 hover:bg-surface-secondary'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-accent/25 text-accent flex items-center justify-center mx-auto mb-3 shadow-xs">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-xs sm:text-sm font-bold text-carbon">
          Click to upload or drag & drop files here
        </p>
        <p className="text-[11px] text-graphite mt-1 max-w-md mx-auto font-medium">
          {description}
        </p>
      </div>

      {/* Uploaded File List Badges */}
      {uploadedList.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-mono-code text-graphite uppercase tracking-wider font-bold block">
            Uploaded Attachments ({uploadedList.length}):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {uploadedList.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-surface border border-hairline text-xs text-carbon shadow-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {file.type === 'image' ? (
                    <ImageIcon className="w-4 h-4 text-accent shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate font-mono-code text-[11px] font-bold">{file.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] text-graphite font-mono-code font-bold">{file.size}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx);
                    }}
                    className="p-1 text-graphite hover:text-red-500 hover:bg-surface-secondary rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
