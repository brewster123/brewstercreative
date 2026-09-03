import React, { useState, useRef } from 'react';
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
    const updated = uploadedList.filter((_, i) => i !== index);
    setUploadedList(updated);
    onFilesSelected(updated);
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-bold text-zinc-800 mb-1.5">
          {label}
        </label>
      )}

      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[24px] p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-orange-500 bg-orange-50 scale-[1.01]'
            : 'border-zinc-300 bg-zinc-50 hover:border-orange-400 hover:bg-orange-50/30'
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

        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-xs sm:text-sm font-bold text-zinc-800">
          Click to upload or drag & drop files here
        </p>
        <p className="text-[11px] text-zinc-500 mt-1 max-w-md mx-auto font-medium">
          {description}
        </p>
      </div>

      {/* Uploaded File List Badges */}
      {uploadedList.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider font-bold block">
            Uploaded Attachments ({uploadedList.length}):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {uploadedList.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E5E5E5] text-xs text-zinc-800 shadow-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {file.type === 'image' ? (
                    <ImageIcon className="w-4 h-4 text-orange-500 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate font-mono-code text-[11px] font-bold">{file.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] text-zinc-400 font-mono-code font-bold">{file.size}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx);
                    }}
                    className="p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 rounded-lg transition-colors"
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
