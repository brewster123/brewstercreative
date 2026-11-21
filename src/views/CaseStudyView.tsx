import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PortfolioProject, ServiceItem } from '../types';
import { 
  isProjectLikedLocally, 
  extractCaseStudyIdFromHash,
  getProjectViews,
  getProjectLikes,
  getProjectShares,
  normalizeNumericStat,
} from '../lib/portfolio';
import { 
  ArrowLeft, 
  Heart, 
  Eye, 
  Share2, 
  Check, 
  Send, 
  ArrowRight, 
  ArrowUpRight,
  Sparkles, 
  Maximize2,
  Calendar,
  User,
  Wrench,
  Tag,
  Palette,
  ExternalLink,
  Edit3,
  Trash2,
  Layers
} from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard';
import { ImageLightbox } from '../components/ImageLightbox';
import { ArtworkHoverWave } from '../components/ArtworkHoverWave';
import { ScrollReveal } from '../components/ScrollMotion';
import {
  PortfolioEditorModal,
  PortfolioDeleteModal,
} from '../components/admin/PortfolioEditorModal';

export const CaseStudyView: React.FC = () => {
  const { 
    selectedPortfolioProject, 
    portfolio, 
    services,
    studioProfile,
    openCaseStudy, 
    closeCaseStudy, 
    setPreselectedService, 
    setActiveView,
    toggleProjectLikeInContext,
    recordProjectViewInContext,
    currentUser,
  } = useApp();

  // Resolve target project: when URL hash specifies a case study ID, resolve strictly against that ID
  const hashId = typeof window !== 'undefined' ? extractCaseStudyIdFromHash(window.location.hash) : null;
  const project: PortfolioProject | null = hashId
    ? (selectedPortfolioProject?.id === hashId ? selectedPortfolioProject : null) ||
      portfolio.find(p => p.id === hashId) ||
      null
    : selectedPortfolioProject || portfolio[0] || null;

  const [isLiked, setIsLiked] = useState<boolean>(() => project ? isProjectLikedLocally(project.id) : false);
  const [likesCount, setLikesCount] = useState<number>(() => getProjectLikes(project));
  const [viewsCount, setViewsCount] = useState<number>(() => getProjectViews(project));
  const [sharesCount, setSharesCount] = useState<number>(() => getProjectShares(project));
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const isAdmin = currentUser?.role === 'admin';
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
  }>({ isOpen: false, images: [], index: 0 });
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const isMountedRef = useRef(true);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (shareTimerRef.current) {
        clearTimeout(shareTimerRef.current);
      }
    };
  }, []);

  // View recording effect: strictly triggered ONLY when the actual viewed project changes
  useEffect(() => {
    if (!project?.id) return;
    setActiveGalleryIndex(0);
    setLightboxState({ isOpen: false, images: [], index: 0 });
    setIsEditorOpen(false);
    setIsDeleteOpen(false);

    // Scroll instantly to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Strictly authenticated accounts generate portfolio views
    if (!currentUser?.id) return;

    let isMounted = true;
    recordProjectViewInContext(project.id).then((res) => {
      if (isMounted && res.viewed && res.viewsCount !== null) {
        setViewsCount(normalizeNumericStat(res.viewsCount, 0));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [project?.id, currentUser?.id]);

  // Synchronize local like, views, and shares state when project data changes without re-triggering view recording
  useEffect(() => {
    if (!project) return;
    setIsLiked(isProjectLikedLocally(project.id));
    setLikesCount(getProjectLikes(project));
    setViewsCount(getProjectViews(project));
    setSharesCount(getProjectShares(project));
  }, [
    project?.id, 
    project?.likesCount, 
    (project as any)?.likes_count, 
    project?.viewsCount, 
    (project as any)?.views_count,
    (project as any)?.sharesCount,
    (project as any)?.shares_count
  ]);

  if (!project && hashId && portfolio.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-graphite">
          Opening case study archive...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-carbon">
          Case study not found
        </h2>
        <p className="text-xs text-graphite">
          The requested portfolio piece could not be located in the studio archive.
        </p>
        <button
          type="button"
          onClick={closeCaseStudy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Exhibition Archive</span>
        </button>
      </div>
    );
  }

  const fallbackCaseStudyImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80';
  const rawGallery = project.gallery?.length ? project.gallery : [project.image];
  const galleryImages = rawGallery
    .map((img: any) => (typeof img === 'string' ? img.trim() : ''))
    .filter((img: string) => img.length > 0);
  if (galleryImages.length === 0) galleryImages.push(fallbackCaseStudyImage);
  const cs = project.caseStudy;

  // Resolve Associated Service
  const associatedService: ServiceItem | undefined = project.serviceId 
    ? services.find(s => s.id === project.serviceId) 
    : services.find(s => s.category.toLowerCase() === project.category.toLowerCase());

  // Resolve Related Projects (same category or project type, exclude self, limit 3)
  const relatedProjects: PortfolioProject[] = portfolio
    .filter(p => p.id !== project.id && (p.category.toLowerCase() === project.category.toLowerCase() || p.projectType === project.projectType))
    .slice(0, 3);

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (isLiking || !project) return;
    setIsLiking(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
    const nextLiked = !prevLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await toggleProjectLikeInContext(project.id);
      if (!res.error) {
        setIsLiked(res.liked);
        setLikesCount(res.likesCount);
      } else {
        // Rollback on RPC error
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
      }
    } catch {
      // Rollback on network failure
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle Share Link
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${window.location.pathname}#case-study-${project.id}`
      : '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${project.title} — DESTALION Case Study`,
          text: project.shortDesc,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard if user dismissed native share sheet
      }
    }

    if (navigator.clipboard && shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (!isMountedRef.current) return;
        setCopiedShare(true);
        if (shareTimerRef.current) {
          clearTimeout(shareTimerRef.current);
        }
        shareTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setCopiedShare(false);
          }
        }, 2500);
      } catch {
        // Ignore clipboard permission errors silently
      }
    }
  };

  // Handle CTA Commission Preselection
  const handleInitiateCommission = () => {
    if (associatedService) {
      setPreselectedService(associatedService.name);
    } else {
      setPreselectedService(project.category);
    }
    setActiveView('commission-form');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Visual Case Study Presentation boards & optional external deck link
  const presentationSlides = Array.isArray(cs?.media?.presentation)
    ? cs!.media!.presentation.filter((item) => item && typeof item.url === 'string' && item.url.trim().length > 0)
    : [];
  const presentationUrls = presentationSlides.map((s) => s.url.trim());
  const presentationLayout = cs?.presentationLayout === 'spaced' ? 'spaced' : 'seamless';
  const safePresentationLink = (() => {
    const raw = cs?.presentationLink?.trim();
    if (!raw) return null;
    try {
      const parsed = new URL(raw);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
    } catch {
      return null;
    }
  })();
  const hasPresentation = presentationSlides.length > 0 || Boolean(safePresentationLink);

  // Helper to determine if any legacy narrative content is present
  const hasNarrative = Boolean(
    cs?.overview ||
    cs?.challenge ||
    cs?.objective ||
    cs?.researchInspiration ||
    cs?.conceptDevelopment ||
    cs?.designDecisions ||
    cs?.finalSolution ||
    cs?.reflection
  );
  const trimmedFullDesc = (project.fullDesc || '').trim();
  const hasDistinctFullDesc =
    Boolean(trimmedFullDesc) &&
    trimmedFullDesc !== (project.shortDesc || '').trim() &&
    trimmedFullDesc !== (project.title || '').trim();

  const formattedViews = `${viewsCount.toLocaleString()} ${viewsCount === 1 ? 'View' : 'Views'}`;
  const formattedLikes = `${likesCount.toLocaleString()} ${likesCount === 1 ? 'Like' : 'Likes'}`;
  const formattedShares = `${sharesCount.toLocaleString()} ${sharesCount === 1 ? 'Share' : 'Shares'}`;

  return (
    <article className="min-h-screen pb-24">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP SUB-NAV BAR (Breadcrumbs & Engagement Action Controls) */}
      {/* ------------------------------------------------------------- */}
      <div className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-md border-b border-hairline px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back Navigation */}
          <button
            type="button"
            onClick={closeCaseStudy}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-graphite hover:text-carbon transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Exhibition Archive</span>
          </button>

          {/* Engagement Strip & Admin-Only Direct Edit Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* View Count Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-hairline text-xs text-graphite tabular-nums">
              <Eye className="w-3.5 h-3.5 text-graphite" />
              <span>{formattedViews}</span>
            </div>

            {/* Like Button */}
            <button
              type="button"
              onClick={handleToggleLike}
              aria-disabled={isLiking}
              aria-label={isLiked ? "Unlike case study" : "Like case study"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                  : 'bg-surface hover:bg-surface-secondary text-carbon border-hairline'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
              <span className="tabular-nums">{formattedLikes}</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share case study"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface hover:bg-surface-secondary text-carbon border border-hairline text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-graphite" />
                  <span>{formattedShares}</span>
                </>
              )}
            </button>

            {/* Strictly Admin-Only Direct Edit & Delete Controls */}
            {isAdmin && (
              <>
                <span aria-hidden="true" className="hidden sm:inline-block h-4 w-px bg-hairline" />
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Work</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(true)}
                  aria-label={`Delete ${project.title}`}
                  title="Delete work"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface hover:bg-red-50 dark:hover:bg-red-950/40 text-graphite hover:text-red-600 dark:hover:text-red-400 border border-hairline hover:border-red-200 dark:hover:border-red-900/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. EDITORIAL HERO SECTION                                    */}
      {/* ------------------------------------------------------------- */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8 space-y-8">
        
        {/* Eyebrow & Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Type Badge */}
          <span className={`text-[11px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full border ${
            project.projectType === 'concept' || !project.projectType
              ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
          }`}>
            {project.projectType === 'concept' || !project.projectType ? 'Concept Exploration' : 'Client Commission'}
          </span>

          <span className="text-[11px] uppercase tracking-wider text-graphite px-3 py-1 rounded-full bg-surface-secondary border border-hairline">
            {project.category}
          </span>

          {project.featured && (
            <span className="text-[11px] uppercase tracking-wider text-[#111114] px-3 py-1 rounded-full bg-[#D4FF38] font-bold inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Featured Studio Work</span>
            </span>
          )}
        </div>

        {/* Title & Short Abstract */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-carbon tracking-tight leading-[1.08]">
            {project.title}
          </h1>

          <p className="text-base sm:text-xl text-graphite-strong leading-relaxed font-normal">
            {project.shortDesc}
          </p>
        </div>

        {/* Metadata Ledger Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-hairline text-xs">
          <div>
            <span className="text-graphite uppercase tracking-wider text-[10px] block mb-1">
              {project.projectType === 'concept' || !project.projectType ? 'Project Origin' : 'Commission Client'}
            </span>
            <span className="text-carbon font-semibold">
              {project.projectType === 'concept' || !project.projectType
                ? (project.client && project.client !== 'Client Commission' && project.client !== 'Commission Client' ? project.client : 'Self-Initiated Studio Work')
                : (project.client || 'Client Commission')}
            </span>
          </div>

          <div>
            <span className="text-graphite uppercase tracking-wider text-[10px] block mb-1">Timeline / Date</span>
            <span className="text-carbon font-semibold">{project.date}</span>
          </div>

          <div>
            <span className="text-graphite uppercase tracking-wider text-[10px] block mb-1">Discipline</span>
            <span className="text-carbon font-semibold">{project.category}</span>
          </div>

          <div>
            <span className="text-graphite uppercase tracking-wider text-[10px] block mb-1">Archive Classification</span>
            <span className="text-carbon font-semibold">
              {project.projectType === 'concept' || !project.projectType ? 'Studio R&D' : 'Client Production'}
            </span>
          </div>
        </div>

        {/* Full-Artwork Exhibition Viewport (Uncropped for Portrait, Square & Landscape Works) */}
        <div className="space-y-3">
          <div className="relative rounded-3xl overflow-hidden bg-surface-secondary border border-hairline shadow-lg group">
            <button
              type="button"
              onClick={() =>
                setLightboxState({
                  isOpen: true,
                  images: galleryImages,
                  index: activeGalleryIndex,
                })
              }
              aria-label="Enlarge full artwork in viewer"
              className="w-full flex items-center justify-center p-3 sm:p-5 lg:p-6 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <span className="relative inline-flex overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={galleryImages[activeGalleryIndex] || fallbackCaseStudyImage}
                  alt={project.title || 'Exhibition artwork'}
                  referrerPolicy="no-referrer"
                  className="w-auto h-auto max-w-full max-h-[82vh] object-contain"
                />
                <ArtworkHoverWave className="z-10" />
              </span>
            </button>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white transition-opacity backdrop-blur-xs shadow-md opacity-80 group-hover:opacity-100 duration-200"
            >
              <Maximize2 className="w-4 h-4" />
            </span>
          </div>

          {/* Secondary Gallery Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`relative w-20 sm:w-24 aspect-[16/10] rounded-xl overflow-hidden bg-surface-secondary border transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                    activeGalleryIndex === idx
                      ? 'border-accent ring-2 ring-accent/30 scale-102'
                      : 'border-hairline opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl || fallbackCaseStudyImage}
                    alt={`Thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. CASE STUDY EDITORIAL CHAPTERS (Conditional Rendering)     */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Visual Presentation & Editorial Details (Span 8) */}
          <div className="lg:col-span-8 space-y-12">

            {/* Visual Case Study Presentation Boards */}
            {presentationSlides.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs uppercase tracking-widest text-accent font-semibold">
                      Case Study Presentation
                    </span>
                    <span className="text-[11px] font-mono text-graphite px-2.5 py-0.5 rounded-full bg-surface-secondary border border-hairline">
                      {presentationSlides.length}{' '}
                      {presentationSlides.length === 1 ? 'Board' : 'Boards'}
                    </span>
                  </div>

                  {safePresentationLink && (
                    <a
                      href={safePresentationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface hover:bg-surface-secondary border border-hairline text-xs font-semibold text-carbon transition-colors"
                    >
                      <span>Open External Deck</span>
                      <ExternalLink className="w-3.5 h-3.5 text-accent" />
                    </a>
                  )}
                </div>

                {presentationLayout === 'seamless' ? (
                  <div className="rounded-3xl overflow-hidden border border-hairline bg-surface shadow-sm flex flex-col">
                    {presentationSlides.map((slide, idx) => (
                      <figure
                        key={slide.id || `${slide.url}-${idx}`}
                        className="relative group m-0"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxState({
                              isOpen: true,
                              images: presentationUrls,
                              index: idx,
                            })
                          }
                          aria-label={`Inspect presentation board ${idx + 1} fullscreen`}
                          className="relative block w-full text-left overflow-hidden cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                        >
                          <img
                            src={slide.url}
                            alt={slide.caption || `${project.title} — Presentation board ${idx + 1}`}
                            loading={idx === 0 ? 'eager' : 'lazy'}
                            className="w-full h-auto block"
                          />
                          <ArtworkHoverWave className="z-10" />
                        </button>
                        <span className="pointer-events-none absolute top-3.5 right-3.5 p-2 rounded-full bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                        {slide.caption && (
                          <figcaption className="px-5 py-3 text-xs text-graphite-strong bg-surface border-y border-hairline">
                            {slide.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {presentationSlides.map((slide, idx) => (
                      <ScrollReveal key={slide.id || `${slide.url}-${idx}`} y={26}>
                        <figure className="relative group rounded-3xl overflow-hidden border border-hairline bg-surface shadow-2xs m-0">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxState({
                                isOpen: true,
                                images: presentationUrls,
                                index: idx,
                              })
                            }
                            aria-label={`Inspect presentation slide ${idx + 1} fullscreen`}
                            className="relative block w-full text-left overflow-hidden cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                          >
                            <img
                              src={slide.url}
                              alt={slide.caption || `${project.title} — Presentation slide ${idx + 1}`}
                              loading={idx === 0 ? 'eager' : 'lazy'}
                              className="w-full h-auto block"
                            />
                            <ArtworkHoverWave className="z-10" />
                          </button>
                          <span className="pointer-events-none absolute top-3.5 right-3.5 p-2 rounded-full bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </span>
                          {slide.caption && (
                            <figcaption className="px-5 py-3 text-xs text-graphite-strong border-t border-hairline">
                              {slide.caption}
                            </figcaption>
                          )}
                        </figure>
                      </ScrollReveal>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* External Presentation Link Card (when linked without uploaded image boards) */}
            {presentationSlides.length === 0 && safePresentationLink && (
              <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-widest text-accent font-semibold block">
                    Case Study Presentation
                  </span>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-carbon">
                    View Full Interactive Presentation
                  </h2>
                  <p className="text-xs text-graphite leading-relaxed">
                    Open the full studio presentation deck for this project in a new tab.
                  </p>
                </div>
                <a
                  href={safePresentationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-colors shrink-0 shadow-2xs"
                >
                  <span>Open Presentation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
            
            {/* Overview / Background (Legacy Narrative Chapters) */}
            {(cs?.overview || (!hasPresentation && hasDistinctFullDesc)) && (
              <ScrollReveal className={`space-y-4 ${hasPresentation ? 'pt-10 border-t border-hairline' : ''}`}>
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  01 / Project Overview
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  Context &amp; Architectural Foundation
                </h2>
                <div className="text-sm sm:text-base text-graphite-strong leading-relaxed space-y-4">
                  <p>{cs?.overview || project.fullDesc}</p>
                </div>
              </ScrollReveal>
            )}

            {/* The Challenge */}
            {cs?.challenge && (
              <ScrollReveal className="space-y-4 pt-10 border-t border-hairline">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  02 / The Challenge
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  Design Dilemmas &amp; Constraints
                </h2>
                <div className="text-sm sm:text-base text-graphite-strong leading-relaxed space-y-4">
                  <p>{cs.challenge}</p>
                </div>
              </ScrollReveal>
            )}

            {/* Objective */}
            {cs?.objective && (
              <ScrollReveal className="space-y-4 pt-10 border-t border-hairline">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  03 / Core Objective
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  Target Outcomes &amp; Strategic Scope
                </h2>
                <div className="text-sm sm:text-base text-graphite-strong leading-relaxed space-y-4">
                  <p>{cs.objective}</p>
                </div>
              </ScrollReveal>
            )}

            {/* Research & Inspiration */}
            {cs?.researchInspiration && (
              <ScrollReveal className="space-y-4 pt-10 border-t border-hairline">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  04 / Research &amp; Aesthetic Inquiries
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  Archival References &amp; Typographic Exploration
                </h2>
                <div className="text-sm sm:text-base text-graphite-strong leading-relaxed space-y-4">
                  <p>{cs.researchInspiration}</p>
                </div>
              </ScrollReveal>
            )}

            {/* Concept Development */}
            {cs?.conceptDevelopment && (
              <ScrollReveal className="space-y-4 pt-10 border-t border-hairline">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  05 / Concept Development
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  Iteration, Vector Construction &amp; Prototyping
                </h2>
                <div className="text-sm sm:text-base text-graphite-strong leading-relaxed space-y-4">
                  <p>{cs.conceptDevelopment}</p>
                </div>
              </ScrollReveal>
            )}

            {/* Design Decisions */}
            {cs?.designDecisions && (
              <ScrollReveal className="space-y-4 pt-10 border-t border-hairline">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  06 / Design Decisions
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  Form, Color Balance &amp; Grid Architecture
                </h2>
                <div className="text-sm sm:text-base text-graphite-strong leading-relaxed space-y-4">
                  <p>{cs.designDecisions}</p>
                </div>
              </ScrollReveal>
            )}

            {/* Final Solution */}
            {cs?.finalSolution && (
              <ScrollReveal className="space-y-4 pt-10 border-t border-hairline">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  07 / Final Solution
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  The Completed Visual System
                </h2>
                <div className="text-sm sm:text-base text-graphite-strong leading-relaxed space-y-4">
                  <p>{cs.finalSolution}</p>
                </div>
              </ScrollReveal>
            )}

            {/* Reflection / Lessons */}
            {cs?.reflection && (
              <div className="space-y-4 pt-10 border-t border-hairline">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  08 / Studio Reflection
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
                  Retrospective &amp; Critical Takeaways
                </h2>
                <div className="text-sm sm:text-base text-graphite-strong leading-relaxed space-y-4">
                  <p>{cs.reflection}</p>
                </div>
              </div>
            )}

            {/* Fallback if no presentation or narrative is entered yet */}
            {!hasPresentation && !hasNarrative && !hasDistinctFullDesc && (
              <div className="p-8 rounded-3xl bg-surface border border-hairline text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-surface-secondary border border-hairline flex items-center justify-center mx-auto text-accent">
                  <Layers className="w-4 h-4" />
                </div>
                <p className="font-display text-base font-bold text-carbon">
                  Case Study Presentation in Production
                </p>
                <p className="text-xs text-graphite max-w-md mx-auto">
                  Full presentation boards and visual documentation for this piece are being prepared.
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Upload Presentation</span>
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Specifications & Sidebar Details (Span 4) */}
          <aside className="lg:col-span-4 space-y-8 sticky top-20">
            
            {/* Project Specifications Card */}
            <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xs">
              <h3 className="font-display text-base font-bold text-carbon pb-3 border-b border-hairline">
                Project Specifications
              </h3>

              {/* Tools Employed */}
              {project.tools && project.tools.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-graphite font-semibold flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-accent" />
                    <span>Tools &amp; Production Software</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 rounded-full bg-surface-secondary border border-hairline text-carbon"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables Summary */}
              {cs?.deliverablesSummary && cs.deliverablesSummary.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-hairline">
                  <span className="text-[11px] uppercase tracking-wider text-graphite font-semibold">
                    Key Deliverables Package
                  </span>
                  <ul className="space-y-1.5 pt-1 text-xs text-graphite-strong">
                    {cs.deliverablesSummary.map((deliv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                        <span>{deliv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags / Keywords */}
              {project.tags && project.tags.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-hairline">
                  <span className="text-[11px] uppercase tracking-wider text-graphite font-semibold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-accent" />
                    <span>Archival Taxonomy</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-secondary text-graphite"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Palette */}
              {project.colorPalette && project.colorPalette.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-hairline">
                  <span className="text-[11px] uppercase tracking-wider text-graphite font-semibold flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-accent" />
                    <span>Identity Color Palette</span>
                  </span>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {project.colorPalette.map((color, idx) => (
                      <div key={idx} className="space-y-1 text-center">
                        <div
                          className="h-9 rounded-lg border border-black/10 dark:border-white/10 shadow-2xs"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[9px] uppercase text-graphite block truncate">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Associated Studio Service Offering */}
            {associatedService && (
              <div className="bg-surface-secondary border border-hairline rounded-3xl p-6 space-y-4 shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block">
                    Associated Service Offering
                  </span>
                  <h4 className="font-display text-base font-bold text-carbon">
                    {associatedService.name}
                  </h4>
                  <p className="text-xs text-graphite-strong line-clamp-2">
                    {associatedService.shortDesc}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-hairline">
                  <span className="text-graphite">Starting at</span>
                  <span className="font-bold text-carbon tabular-nums">
                    {studioProfile?.currencySymbol || '₱'}{associatedService.startingPrice.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleInitiateCommission}
                  className="w-full py-2.5 px-4 rounded-full bg-[#111114] dark:bg-white text-white dark:text-[#111114] font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Commission Similar Scope</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D4FF38] dark:text-[#0284C7]" />
                </button>
              </div>
            )}

            {/* Direct Consultation Box */}
            <div className="p-6 rounded-3xl hero-sky-gradient text-white space-y-3 shadow-md">
              <span className="text-[10px] uppercase tracking-widest text-white/85 font-semibold block">
                · Visionary Inquiry
              </span>
              <h4 className="font-display text-lg font-bold text-white tracking-tight">
                Commission Something Similar
              </h4>
              <p className="text-xs text-white/85 leading-relaxed">
                Bring your bespoke branding, poster, or illustration concept into reality with custom hand-crafted design.
              </p>
              <button
                type="button"
                onClick={handleInitiateCommission}
                className="w-full mt-2 pl-5 pr-2 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>Start Studio Inquiry</span>
                <span className="w-7 h-7 rounded-full bg-[#111114] text-white flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>

          </aside>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. RELATED WORKS (2–3 projects in same category/discipline)  */}
      {/* ------------------------------------------------------------- */}
      {relatedProjects.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-hairline">
          <div className="space-y-8">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
                  Archive Continuity
                </span>
                <h3 className="font-display text-2xl font-bold text-carbon tracking-tight">
                  Related Works in {project.category}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeCaseStudy}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedProjects.map((relProj) => (
                <div
                  key={relProj.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openCaseStudy(relProj)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openCaseStudy(relProj);
                    }
                  }}
                  className="group bg-surface border border-hairline hover:border-accent/40 rounded-3xl overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all flex flex-col justify-between focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div>
                    <div className="aspect-[16/10] overflow-hidden bg-surface-secondary">
                      <img
                        src={relProj.image || fallbackCaseStudyImage}
                        alt={relProj.title || 'Related project'}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] uppercase text-graphite">
                        <span>{relProj.category}</span>
                        <span>·</span>
                        <span>{relProj.date}</span>
                      </div>
                      <h4 className="font-display text-base font-bold text-carbon group-hover:text-accent transition-colors leading-snug">
                        {relProj.title}
                      </h4>
                      <p className="text-xs text-graphite-strong line-clamp-2">
                        {relProj.shortDesc}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-3 border-t border-hairline mt-2 flex items-center justify-between text-xs font-semibold text-accent">
                    <span>Read Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. LIGHTBOX PREVIEW MODAL (Lightweight image-focused lightbox) */}
      {/* ------------------------------------------------------------- */}
      <ImageLightbox
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={lightboxState.images[lightboxState.index] || galleryImages[activeGalleryIndex] || fallbackCaseStudyImage}
        altText={`${project.title} - Board ${(lightboxState.index + 1).toString()}`}
        title={project.title}
        images={lightboxState.images.length > 0 ? lightboxState.images : galleryImages}
        currentIndex={lightboxState.index}
        onNavigate={(newIdx) => setLightboxState((prev) => ({ ...prev, index: newIdx }))}
      />

      {/* Admin-Only Direct Case Study Editor & Delete Confirmation Modals */}
      {isAdmin && (
        <>
          <PortfolioEditorModal
            isOpen={isEditorOpen}
            project={project}
            onClose={() => setIsEditorOpen(false)}
          />
          <PortfolioDeleteModal
            project={isDeleteOpen ? { id: project.id, title: project.title } : null}
            onClose={() => setIsDeleteOpen(false)}
            onDeleted={() => closeCaseStudy()}
          />
        </>
      )}

    </article>
  );
};
