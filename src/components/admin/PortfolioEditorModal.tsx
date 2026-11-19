import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PortfolioProject,
  ProjectType,
  CaseStudyContent,
  CaseStudyMediaItem,
} from '../../types';
import { uploadPortfolioMedia } from '../../lib/portfolio';
import {
  X,
  UploadCloud,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Link2,
  Image as ImageIcon,
} from 'lucide-react';

export const PORTFOLIO_CATEGORIES: readonly PortfolioProject['category'][] = [
  'Branding',
  'Logo',
  'Poster',
  'Illustration',
  'Social Media',
  'Book Covers',
  'Other',
];

const isPortfolioCategory = (val: unknown): val is PortfolioProject['category'] =>
  typeof val === 'string' && (PORTFOLIO_CATEGORIES as readonly string[]).includes(val);

const DEFAULT_PROJECT_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80';

const isValidHttpUrl = (raw: string): boolean => {
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const isDisallowedSvgFile = (file: File): boolean =>
  file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);

const makeSlideId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `slide-${crypto.randomUUID().slice(0, 8)}`
    : `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

interface PortfolioEditorModalProps {
  isOpen: boolean;
  project: PortfolioProject | null;
  defaultCategory?: PortfolioProject['category'];
  defaultProjectType?: ProjectType;
  onClose: () => void;
  onSaved?: (saved: PortfolioProject) => void;
}

export const PortfolioEditorModal: React.FC<PortfolioEditorModalProps> = ({
  isOpen,
  project,
  defaultCategory = 'Branding',
  defaultProjectType = 'concept',
  onClose,
  onSaved,
}) => {
  const {
    currentUser,
    services = [],
    addPortfolioProject,
    updatePortfolioProject,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PortfolioProject['category']>(
    isPortfolioCategory(defaultCategory) ? defaultCategory : 'Branding'
  );
  const [client, setClient] = useState('');
  const [date, setDate] = useState(new Date().getFullYear().toString());
  const [shortDesc, setShortDesc] = useState('');
  const [image, setImage] = useState('');
  const [featured, setFeatured] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>(defaultProjectType);
  const [serviceId, setServiceId] = useState<string | undefined>(undefined);
  const [toolsInput, setToolsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Visual Case Study Presentation state
  const [presentationSlides, setPresentationSlides] = useState<CaseStudyMediaItem[]>([]);
  const [presentationLayout, setPresentationLayout] = useState<'seamless' | 'spaced'>('seamless');
  const [presentationLink, setPresentationLink] = useState('');
  const [slideUrlInput, setSlideUrlInput] = useState('');
  const [isPresentationExpanded, setIsPresentationExpanded] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);
  const [slideUploadProgress, setSlideUploadProgress] = useState<string | null>(null);

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (project) {
      setTitle(project.title || '');
      const validCat: PortfolioProject['category'] = isPortfolioCategory(project.category)
        ? project.category
        : 'Other';
      setCategory(validCat);
      setClient(project.client || '');
      setDate(project.date || new Date().getFullYear().toString());
      setShortDesc(project.shortDesc || '');
      setImage(project.image || '');
      setFeatured(Boolean(project.featured));
      setProjectType(project.projectType || 'concept');
      setServiceId(project.serviceId);
      setToolsInput((project.tools || []).join(', '));
      setTagsInput((project.tags || []).join(', '));

      const existingSlides = Array.isArray(project.caseStudy?.media?.presentation)
        ? project.caseStudy!.media!.presentation.map((item) => ({
            id: item.id || makeSlideId(),
            url: item.url,
            caption: item.caption || '',
            type: item.type || 'image',
          }))
        : [];
      setPresentationSlides(existingSlides);
      setPresentationLayout(
        project.caseStudy?.presentationLayout === 'spaced' ? 'spaced' : 'seamless'
      );
      setPresentationLink(project.caseStudy?.presentationLink || '');
      setSlideUrlInput('');
      setIsPresentationExpanded(true);
    } else {
      setTitle('');
      setCategory(isPortfolioCategory(defaultCategory) ? defaultCategory : 'Branding');
      setClient('');
      setDate(new Date().getFullYear().toString());
      setShortDesc('');
      setImage('');
      setFeatured(false);
      setProjectType(defaultProjectType);
      setServiceId(undefined);
      setToolsInput('');
      setTagsInput('');
      setPresentationSlides([]);
      setPresentationLayout('seamless');
      setPresentationLink('');
      setSlideUrlInput('');
      setIsPresentationExpanded(true);
    }
    setSlideUploadProgress(null);
    setIsDragActive(false);
    setError(null);
  }, [isOpen, project, defaultCategory, defaultProjectType]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving && !slideUploadProgress) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, slideUploadProgress, onClose]);

  if (!isOpen || !isAdmin) return null;

  const handleCoverMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isDisallowedSvgFile(file)) {
      setError('SVG files are not supported. Please upload PNG, JPG, or WebP images.');
      e.target.value = '';
      return;
    }
    setIsUploadingMedia(true);
    setError(null);
    try {
      const result = await uploadPortfolioMedia(file, file.name || 'artwork.jpg');
      if (result.error || !result.publicUrl) {
        setError(result.error || 'Failed to upload portfolio media.');
        return;
      }
      setImage(result.publicUrl);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload portfolio media.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const uploadPresentationFiles = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    if (incoming.length === 0) return;

    const validFiles: File[] = [];
    for (const file of incoming) {
      if (isDisallowedSvgFile(file)) {
        setError('SVG files are not supported. Export your presentation boards as PNG, JPG, or WebP.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" is not a supported image file. Export slides as PNG, JPG, or WebP.`);
        return;
      }
      validFiles.push(file);
    }

    setError(null);
    const uploaded: CaseStudyMediaItem[] = [];
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setSlideUploadProgress(
          validFiles.length > 1
            ? `Uploading board ${i + 1} of ${validFiles.length}...`
            : 'Uploading presentation board...'
        );
        const result = await uploadPortfolioMedia(file, file.name || `slide-${i + 1}.png`);
        if (result.error || !result.publicUrl) {
          setError(result.error || `Failed to upload "${file.name}".`);
          break;
        }
        uploaded.push({
          id: makeSlideId(),
          url: result.publicUrl,
          caption: '',
          type: 'image',
        });
      }

      if (uploaded.length > 0) {
        setPresentationSlides((prev) => [...prev, ...uploaded]);
        if (!image.trim()) {
          setImage(uploaded[0].url);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload presentation boards.');
    } finally {
      setSlideUploadProgress(null);
    }
  };

  const handlePresentationFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadPresentationFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDropSlides = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (slideUploadProgress) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadPresentationFiles(e.dataTransfer.files);
    }
  };

  const handleAddSlideByUrl = () => {
    const trimmed = slideUrlInput.trim();
    if (!trimmed) return;
    if (!isValidHttpUrl(trimmed)) {
      setError('Please enter a valid http:// or https:// image URL for the presentation board.');
      return;
    }
    setError(null);
    const nextSlide: CaseStudyMediaItem = {
      id: makeSlideId(),
      url: trimmed,
      caption: '',
      type: 'image',
    };
    setPresentationSlides((prev) => [...prev, nextSlide]);
    if (!image.trim()) {
      setImage(trimmed);
    }
    setSlideUrlInput('');
  };

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= presentationSlides.length) return;
    setPresentationSlides((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleSlideCaptionChange = (id: string | undefined, index: number, caption: string) => {
    setPresentationSlides((prev) =>
      prev.map((slide, idx) =>
        (id ? slide.id === id : idx === index) ? { ...slide, caption } : slide
      )
    );
  };

  const handleRemoveSlide = (index: number) => {
    setPresentationSlides((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Project title is required.');
      return;
    }

    const cleanPresentationLink = presentationLink.trim();
    if (cleanPresentationLink && !isValidHttpUrl(cleanPresentationLink)) {
      setError('Presentation link must be a valid http:// or https:// URL.');
      return;
    }

    const parsedTools = toolsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const parsedTags = tagsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const resolvedTags = parsedTags.length > 0 ? parsedTags : [category];

    const cleanedSlides: CaseStudyMediaItem[] = presentationSlides
      .filter((s) => typeof s.url === 'string' && s.url.trim().length > 0)
      .map((s) => ({
        id: s.id || makeSlideId(),
        url: s.url.trim(),
        caption: s.caption?.trim() || undefined,
        type: 'image',
      }));

    const resolvedImg =
      image.trim() ||
      (cleanedSlides.length > 0 ? cleanedSlides[0].url : DEFAULT_PROJECT_IMAGE);

    const existingCaseStudy = project?.caseStudy || {};
    const nextMedia = {
      ...(existingCaseStudy.media || {}),
      presentation: cleanedSlides,
    };

    const nextCaseStudy: CaseStudyContent = {
      ...existingCaseStudy,
      media: nextMedia,
      presentationLayout,
      presentationLink: cleanPresentationLink || undefined,
    };

    setIsSaving(true);
    try {
      if (project) {
        const updatedGallery = resolvedImg
          ? [
              resolvedImg,
              ...(project.gallery || []).filter(
                (g) => g !== resolvedImg && g !== project.image
              ),
            ]
          : project.gallery;

        const updates: Partial<PortfolioProject> = {
          title: cleanTitle,
          category,
          client: client.trim(),
          date: date.trim() || new Date().getFullYear().toString(),
          shortDesc: shortDesc.trim(),
          fullDesc: shortDesc.trim() || project.fullDesc || '',
          image: resolvedImg,
          gallery: updatedGallery,
          featured,
          projectType,
          serviceId,
          tools: parsedTools,
          tags: resolvedTags,
          caseStudy: nextCaseStudy,
        };

        const res = await updatePortfolioProject(project.id, updates);
        if (res && !res.success) {
          throw new Error(res.error || 'Failed to update portfolio project.');
        }
        onSaved?.({ ...project, ...updates });
      } else {
        const newId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `proj-${crypto.randomUUID().slice(0, 8)}`
            : `proj-${Date.now()}`;

        const newProject: PortfolioProject = {
          id: newId,
          title: cleanTitle,
          category,
          client: client.trim(),
          date: date.trim() || new Date().getFullYear().toString(),
          shortDesc: shortDesc.trim(),
          fullDesc: shortDesc.trim(),
          image: resolvedImg,
          gallery: [resolvedImg],
          featured,
          projectType,
          serviceId,
          tools: parsedTools,
          tags: resolvedTags,
          caseStudy: nextCaseStudy,
        };

        const res = await addPortfolioProject(newProject);
        if (res && !res.success) {
          throw new Error(res.error || 'Failed to save portfolio project.');
        }
        onSaved?.(newProject);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save portfolio project.');
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isSaving || isUploadingMedia || Boolean(slideUploadProgress);

  return (
    <div
      onClick={() => !isBusy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-editor-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-hairline rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <h3
            id="portfolio-editor-modal-title"
            className="font-display text-xl font-bold text-carbon"
          >
            {project ? 'Edit Portfolio Work' : 'Add Portfolio Work'}
          </h3>
          <button
            type="button"
            onClick={() => !isBusy && onClose()}
            aria-label="Close project editor"
            className="p-1.5 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
              Project Title
            </label>
            <input
              type="text"
              required
              value={title}
              placeholder="e.g. Solaris Brand System"
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-hidden focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PortfolioProject['category'])}
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-hidden focus:border-accent"
              >
                {PORTFOLIO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Client / Entity
              </label>
              <input
                type="text"
                value={client}
                placeholder="e.g. Acme Studio"
                onChange={(e) => setClient(e.target.value)}
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-hidden focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Year / Date
              </label>
              <input
                type="text"
                value={date}
                placeholder="e.g. 2026"
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-hidden focus:border-accent"
              />
            </div>
          </div>

          {/* Classification, Associated Service, Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-secondary border border-hairline">
            <div>
              <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                Archive Classification
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full bg-surface border border-hairline rounded-xl px-3 py-2 text-xs text-carbon focus:outline-hidden focus:border-accent"
              >
                <option value="concept">Concept Exploration (Studio R&D)</option>
                <option value="client">Client Work (Commissioned)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                Associated Studio Service
              </label>
              <select
                value={serviceId || ''}
                onChange={(e) => setServiceId(e.target.value || undefined)}
                className="w-full bg-surface border border-hairline rounded-xl px-3 py-2 text-xs text-carbon focus:outline-hidden focus:border-accent"
              >
                <option value="">-- No associated service --</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} ({svc.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 pt-1 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-carbon">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-hairline text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                />
                <span>Feature this project on the Home Page showcase</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
              Short Description / Abstract
            </label>
            <textarea
              rows={2}
              value={shortDesc}
              placeholder="Concise editorial summary displayed on cards and previews..."
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-hidden focus:border-accent resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase text-graphite font-semibold">
              Cover Thumbnail Image URL or Upload
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={image}
                placeholder="https://... (auto-uses first presentation board if blank)"
                onChange={(e) => setImage(e.target.value)}
                className="flex-1 bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-hidden focus:border-accent"
              />
              <label className="shrink-0 px-4 py-2 rounded-full bg-surface-secondary border border-hairline text-xs font-mono text-carbon hover:border-accent cursor-pointer flex items-center gap-1.5 transition-colors">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isUploadingMedia ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleCoverMediaUpload}
                  className="hidden"
                  disabled={isUploadingMedia}
                />
              </label>
            </div>
            {image.trim() && (
              <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-hairline bg-surface-secondary">
                <img
                  src={image.trim()}
                  alt="Cover artwork preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Tools Used <span className="font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={toolsInput}
                placeholder="Illustrator, Photoshop, Figma"
                onChange={(e) => setToolsInput(e.target.value)}
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-hidden focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Tags <span className="font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                placeholder="Identity, Typography, Print"
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-hidden focus:border-accent"
              />
            </div>
          </div>

          {/* Case Study Visual Presentation Uploader */}
          <div className="border border-hairline rounded-2xl overflow-hidden bg-surface-secondary">
            <button
              type="button"
              onClick={() => setIsPresentationExpanded((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                <span className="font-display text-sm font-bold text-carbon">
                  Case Study Presentation
                </span>
                {presentationSlides.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-surface border border-hairline text-graphite">
                    {presentationSlides.length}{' '}
                    {presentationSlides.length === 1 ? 'board' : 'boards'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-graphite font-mono">
                <span>{isPresentationExpanded ? 'Collapse' : 'Expand'}</span>
                {isPresentationExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {isPresentationExpanded && (
              <div className="p-4 sm:p-5 border-t border-hairline space-y-4 bg-surface animate-in fade-in duration-150">
                <p className="text-[11px] text-graphite leading-relaxed">
                  Design your case study presentation in Figma, Illustrator, Photoshop, or Canva, then export and upload your slides or long-form boards here in order. Boards display uncropped at full width.
                </p>

                {/* Multi-file Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragActive(false);
                  }}
                  onDrop={handleDropSlides}
                  className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
                    isDragActive
                      ? 'border-accent bg-accent/5'
                      : 'border-hairline bg-surface-secondary/60 hover:border-accent/60'
                  }`}
                >
                  {slideUploadProgress ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                      <Loader2 className="w-5 h-5 text-accent animate-spin" />
                      <p className="text-xs font-semibold text-carbon">{slideUploadProgress}</p>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-surface border border-hairline flex items-center justify-center text-accent">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-carbon">
                          Drop presentation boards here, or{' '}
                          <span className="text-accent underline">browse files</span>
                        </p>
                        <p className="text-[11px] text-graphite">
                          Select one or multiple PNG, JPG, or WebP boards (up to 20 MB each)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        onChange={handlePresentationFilesChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Add Board by URL */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="w-3.5 h-3.5 text-graphite absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={slideUrlInput}
                      placeholder="Or paste a board image URL (https://...)"
                      onChange={(e) => setSlideUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSlideByUrl();
                        }
                      }}
                      className="w-full bg-surface-secondary border border-hairline rounded-xl pl-8 pr-3 py-2 text-xs text-carbon focus:outline-hidden focus:border-accent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSlideByUrl}
                    disabled={!slideUrlInput.trim()}
                    className="shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-surface-secondary border border-hairline hover:border-accent text-xs font-semibold text-carbon disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Board</span>
                  </button>
                </div>

                {/* Ordered Slide List & Layout Toggle */}
                {presentationSlides.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase text-graphite font-semibold">
                        Presentation Sequence ({presentationSlides.length})
                      </span>

                      <div className="inline-flex p-0.5 rounded-full bg-surface-secondary border border-hairline text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPresentationLayout('seamless')}
                          className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                            presentationLayout === 'seamless'
                              ? 'bg-[#111114] text-white dark:bg-white dark:text-[#111114]'
                              : 'text-graphite hover:text-carbon'
                          }`}
                        >
                          Seamless Flow
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresentationLayout('spaced')}
                          className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                            presentationLayout === 'spaced'
                              ? 'bg-[#111114] text-white dark:bg-white dark:text-[#111114]'
                              : 'text-graphite hover:text-carbon'
                          }`}
                        >
                          Spaced Slides
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {presentationSlides.map((slide, idx) => (
                        <div
                          key={slide.id || `${slide.url}-${idx}`}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-secondary border border-hairline"
                        >
                          <span className="w-6 text-center font-mono text-[11px] font-bold text-graphite shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </span>

                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-surface border border-hairline shrink-0">
                            <img
                              src={slide.url}
                              alt={`Presentation board ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <input
                            type="text"
                            value={slide.caption || ''}
                            placeholder="Optional caption (leave blank for clean board)"
                            onChange={(e) =>
                              handleSlideCaptionChange(slide.id, idx, e.target.value)
                            }
                            className="flex-1 min-w-0 bg-surface border border-hairline rounded-lg px-2.5 py-1.5 text-xs text-carbon focus:outline-hidden focus:border-accent"
                          />

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveSlide(idx, -1)}
                              disabled={idx === 0}
                              aria-label={`Move board ${idx + 1} up`}
                              title="Move up"
                              className="p-1.5 rounded-lg text-graphite hover:text-carbon hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSlide(idx, 1)}
                              disabled={idx === presentationSlides.length - 1}
                              aria-label={`Move board ${idx + 1} down`}
                              title="Move down"
                              className="p-1.5 rounded-lg text-graphite hover:text-carbon hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlide(idx)}
                              aria-label={`Remove board ${idx + 1}`}
                              title="Remove board"
                              className="p-1.5 rounded-lg text-graphite hover:text-red-600 hover:bg-red-500/10 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional External Presentation Link */}
                <div className="pt-2 border-t border-hairline space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase text-graphite font-semibold">
                    External Presentation Link <span className="font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Link2 className="w-3.5 h-3.5 text-graphite absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={presentationLink}
                      placeholder="https://figma.com/..., Canva, Behance, or PDF deck link"
                      onChange={(e) => setPresentationLink(e.target.value)}
                      className="w-full bg-surface-secondary border border-hairline rounded-xl pl-8 pr-3.5 py-2 text-xs text-carbon focus:outline-hidden focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="btn-tactile px-6 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : project ? 'Save Changes' : 'Publish Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PortfolioDeleteModalProps {
  project: { id: string; title: string } | null;
  onClose: () => void;
  onDeleted?: (projectId: string) => void;
}

export const PortfolioDeleteModal: React.FC<PortfolioDeleteModalProps> = ({
  project,
  onClose,
  onDeleted,
}) => {
  const { currentUser, deletePortfolioProject } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, isDeleting, onClose]);

  if (!project || !isAdmin) return null;

  const handleConfirm = async () => {
    if (!isAdmin) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deletePortfolioProject(project.id);
      if (res && !res.success) {
        setError(res.error || 'Failed to delete portfolio project.');
        return;
      }
      onDeleted?.(project.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete portfolio project.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-portfolio-work-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-hairline rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3
              id="delete-portfolio-work-title"
              className="font-display text-base sm:text-lg font-bold text-carbon"
            >
              Delete Portfolio Work
            </h3>
            <p className="text-xs sm:text-sm text-graphite leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-carbon">"{project.title}"</span>? This
              work will be permanently removed from the studio portfolio.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Work</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
