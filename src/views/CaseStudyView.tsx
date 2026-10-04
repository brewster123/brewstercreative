import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PortfolioProject, ServiceItem } from '../types';
import { 
  isProjectLikedLocally, 
  recordPortfolioViewDebounced,
  extractCaseStudyIdFromHash,
} from '../lib/portfolio';
import { 
  ArrowLeft, 
  Heart, 
  Eye, 
  Share2, 
  Check, 
  Send, 
  ArrowRight, 
  Sparkles, 
  Maximize2,
  Calendar,
  User,
  Wrench,
  Tag,
  Palette,
  ExternalLink
} from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard';
import { PortfolioModal } from '../components/PortfolioModal';

export const CaseStudyView: React.FC = () => {
  const { 
    selectedPortfolioProject, 
    portfolio, 
    services, 
    openCaseStudy, 
    closeCaseStudy, 
    setPreselectedService, 
    setActiveView,
    toggleProjectLikeInContext,
  } = useApp();

  // Resolve target project: prefer matching selected project, otherwise resolve by URL hash
  const hashId = typeof window !== 'undefined' ? extractCaseStudyIdFromHash(window.location.hash) : null;
  const project: PortfolioProject | null = 
    (hashId && selectedPortfolioProject?.id === hashId ? selectedPortfolioProject : null) ||
    (hashId ? portfolio.find(p => p.id === hashId) || null : null) ||
    selectedPortfolioProject || 
    portfolio[0] || 
    null;

  const [isLiked, setIsLiked] = useState<boolean>(() => project ? isProjectLikedLocally(project.id) : false);
  const [likesCount, setLikesCount] = useState<number>(() => project?.likesCount ?? 0);
  const [viewsCount, setViewsCount] = useState<number>(() => project?.viewsCount ?? 0);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Sync state when project or likes count changes
  useEffect(() => {
    if (!project) return;
    setIsLiked(isProjectLikedLocally(project.id));
    setLikesCount(project.likesCount ?? 0);
    setViewsCount(project.viewsCount ?? 0);
    setActiveGalleryIndex(0);

    // Scroll instantly to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Atomically increment views via RPC with in-memory session debounce
    let isMounted = true;
    recordPortfolioViewDebounced(project.id).then((res) => {
      if (isMounted && res.viewsCount !== null && typeof res.viewsCount === 'number') {
        setViewsCount(res.viewsCount);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [project?.id, project?.likesCount]);

  if (!project && hashId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#EA580C] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
          Opening case study archive...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
          Case study not found
        </h2>
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          The requested portfolio piece could not be located in the studio archive.
        </p>
        <button
          type="button"
          onClick={closeCaseStudy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#D94814] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Exhibition Archive</span>
        </button>
      </div>
    );
  }

  const galleryImages = project.gallery?.length ? project.gallery : [project.image];
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

    // Optimistic UI update
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await toggleProjectLikeInContext(project.id);
      if (!res.error) {
        setIsLiked(res.liked);
        setLikesCount(res.likesCount);
      } else {
        // Rollback on RPC error
        setIsLiked(!nextLiked);
        setLikesCount(project.likesCount ?? 0);
      }
    } catch {
      // Rollback on network failure
      setIsLiked(!nextLiked);
      setLikesCount(project.likesCount ?? 0);
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
          title: `${project.title} — Brewster Creative Case Study`,
          text: project.shortDesc,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard if user dismissed native share sheet
      }
    }

    if (navigator.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
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

  // Helper to determine if any narrative content is present
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

  return (
    <article className="min-h-screen pb-24">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP SUB-NAV BAR (Breadcrumbs & Engagement Action Controls) */}
      {/* ------------------------------------------------------------- */}
      <div className="sticky top-0 z-30 bg-[#FAF9F6]/90 dark:bg-[#0F0F11]/90 backdrop-blur-md border-b border-[#E4E2DC] dark:border-[#27272A] px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back Navigation */}
          <button
            type="button"
            onClick={closeCaseStudy}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Exhibition Archive</span>
          </button>

          {/* Engagement Strip */}
          <div className="flex items-center gap-3">
            {/* View Count Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              <Eye className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>{viewsCount.toLocaleString()}</span>
            </div>

            {/* Like Button */}
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={isLiking}
              aria-label={isLiked ? "Unlike case study" : "Like case study"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                  : 'bg-white dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border-[#E4E2DC] dark:border-[#27272A]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
              <span className="font-mono">{likesCount.toLocaleString()}</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share case study"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span>Share</span>
                </>
              )}
            </button>
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
          <span className={`font-mono text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded border ${
            project.projectType === 'concept'
              ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
          }`}>
            {project.projectType === 'concept' ? 'Concept Exploration' : 'Client Commission'}
          </span>

          <span className="font-mono text-[11px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] px-2.5 py-1 rounded bg-[#F4F2ED] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A]">
            {project.category}
          </span>

          {project.featured && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#EA580C] px-2.5 py-1 rounded bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 font-semibold inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Featured Studio Work</span>
            </span>
          )}
        </div>

        {/* Title & Short Abstract */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight leading-[1.08]">
            {project.title}
          </h1>

          <p className="text-base sm:text-xl text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
            {project.shortDesc}
          </p>
        </div>

        {/* Metadata Ledger Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-[#E4E2DC] dark:border-[#27272A] text-xs font-mono">
          <div>
            <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block mb-1">Commission Client</span>
            <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{project.client || 'Internal Studio Project'}</span>
          </div>

          <div>
            <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block mb-1">Timeline / Date</span>
            <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{project.date}</span>
          </div>

          <div>
            <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block mb-1">Discipline</span>
            <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{project.category}</span>
          </div>

          <div>
            <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block mb-1">Archive Classification</span>
            <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">
              {project.projectType === 'concept' ? 'Experimental R&D' : 'Client Production'}
            </span>
          </div>
        </div>

        {/* Full-Bleed Artwork Viewport */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-black/40 border border-[#E4E2DC] dark:border-[#27272A] aspect-[16/10] sm:aspect-[16/9] shadow-lg group">
            <img
              src={galleryImages[activeGalleryIndex]}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              aria-label="Enlarge image in viewer"
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/60 hover:bg-black text-white transition-colors backdrop-blur-xs cursor-pointer shadow-md opacity-0 group-hover:opacity-100 duration-200"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Secondary Gallery Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`relative w-20 sm:w-24 aspect-[16/10] rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 ${
                    activeGalleryIndex === idx
                      ? 'border-[#EA580C] ring-2 ring-[#EA580C]/30 scale-102'
                      : 'border-[#E4E2DC] dark:border-[#27272A] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
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
          
          {/* Left Column: Narrative Chapters (Span 8) */}
          <div className="lg:col-span-8 space-y-14">
            
            {/* Overview / Background */}
            {(cs?.overview || project.fullDesc) && (
              <div className="space-y-4">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  01 / Project Overview
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  Context & Architectural Foundation
                </h2>
                <div className="font-sans text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed space-y-4">
                  <p>{cs?.overview || project.fullDesc}</p>
                </div>
              </div>
            )}

            {/* The Challenge */}
            {cs?.challenge && (
              <div className="space-y-4 pt-10 border-t border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  02 / The Challenge
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  Design Dilemmas & Constraints
                </h2>
                <div className="font-sans text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed space-y-4">
                  <p>{cs.challenge}</p>
                </div>
              </div>
            )}

            {/* Objective */}
            {cs?.objective && (
              <div className="space-y-4 pt-10 border-t border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  03 / Core Objective
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  Target Outcomes & Strategic Scope
                </h2>
                <div className="font-sans text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed space-y-4">
                  <p>{cs.objective}</p>
                </div>
              </div>
            )}

            {/* Research & Inspiration */}
            {cs?.researchInspiration && (
              <div className="space-y-4 pt-10 border-t border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  04 / Research & Aesthetic Inquiries
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  Archival References & Typographic Exploration
                </h2>
                <div className="font-sans text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed space-y-4">
                  <p>{cs.researchInspiration}</p>
                </div>
              </div>
            )}

            {/* Concept Development */}
            {cs?.conceptDevelopment && (
              <div className="space-y-4 pt-10 border-t border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  05 / Concept Development
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  Iteration, Vector Construction & Prototyping
                </h2>
                <div className="font-sans text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed space-y-4">
                  <p>{cs.conceptDevelopment}</p>
                </div>
              </div>
            )}

            {/* Design Decisions */}
            {cs?.designDecisions && (
              <div className="space-y-4 pt-10 border-t border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  06 / Design Decisions
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  Form, Color Balance & Grid Architecture
                </h2>
                <div className="font-sans text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed space-y-4">
                  <p>{cs.designDecisions}</p>
                </div>
              </div>
            )}

            {/* Final Solution */}
            {cs?.finalSolution && (
              <div className="space-y-4 pt-10 border-t border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  07 / Final Solution
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  The Completed Visual System
                </h2>
                <div className="font-sans text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed space-y-4">
                  <p>{cs.finalSolution}</p>
                </div>
              </div>
            )}

            {/* Reflection / Lessons */}
            {cs?.reflection && (
              <div className="space-y-4 pt-10 border-t border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  08 / Studio Reflection
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  Retrospective & Critical Takeaways
                </h2>
                <div className="font-sans text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed space-y-4">
                  <p>{cs.reflection}</p>
                </div>
              </div>
            )}

            {/* Fallback if no narrative is entered yet */}
            {!hasNarrative && !project.fullDesc && (
              <div className="p-8 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] text-center space-y-2">
                <p className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  Editorial Case Study in Production
                </p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Detailed chapter documentation, design decisions, and production rationale are being compiled for this archival piece.
                </p>
              </div>
            )}

          </div>

          {/* Right Column: Specifications & Sidebar Details (Span 4) */}
          <aside className="lg:col-span-4 space-y-8 sticky top-20">
            
            {/* Project Specifications Card */}
            <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-7 space-y-6 shadow-2xs">
              <h3 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC] pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                Project Specifications
              </h3>

              {/* Tools Employed */}
              {project.tools && project.tools.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Tools & Production Software</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono px-2.5 py-1 rounded bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables Summary */}
              {cs?.deliverablesSummary && cs.deliverablesSummary.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-[#E4E2DC] dark:border-[#27272A]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold">
                    Key Deliverables Package
                  </span>
                  <ul className="space-y-1.5 pt-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                    {cs.deliverablesSummary.map((deliv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0 mt-1.5" />
                        <span>{deliv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags / Keywords */}
              {project.tags && project.tags.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-[#E4E2DC] dark:border-[#27272A]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Archival Taxonomy</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F4F2ED] dark:bg-[#232327] text-[#71717A] dark:text-[#A1A1AA]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Palette */}
              {project.colorPalette && project.colorPalette.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-[#E4E2DC] dark:border-[#27272A]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Identity Color Palette</span>
                  </span>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {project.colorPalette.map((color, idx) => (
                      <div key={idx} className="space-y-1 text-center">
                        <div
                          className="h-9 rounded-md border border-black/10 dark:border-white/10 shadow-2xs"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-mono text-[9px] uppercase text-[#71717A] dark:text-[#A1A1AA] block truncate">
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
              <div className="bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 space-y-4 shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] font-semibold block">
                    Associated Service Offering
                  </span>
                  <h4 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC]">
                    {associatedService.name}
                  </h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] line-clamp-2">
                    {associatedService.shortDesc}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-[#E4E2DC] dark:border-[#27272A]">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Starting at</span>
                  <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                    ${associatedService.startingPrice.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleInitiateCommission}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Commission Similar Scope</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#EA580C]" />
                </button>
              </div>
            )}

            {/* Direct Consultation Box */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#18181B] to-[#27272A] text-white space-y-3 shadow-md">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                Visionary Inquiry
              </span>
              <h4 className="font-display text-lg font-bold text-white tracking-tight">
                Commission Something Similar
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Bring your bespoke branding, poster, or illustration concept into reality with custom hand-crafted design.
              </p>
              <button
                type="button"
                onClick={handleInitiateCommission}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Start Studio Inquiry</span>
              </button>
            </div>

          </aside>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. RELATED WORKS (2–3 projects in same category/discipline)  */}
      {/* ------------------------------------------------------------- */}
      {relatedProjects.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-[#E4E2DC] dark:border-[#27272A]">
          <div className="space-y-8">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                  Archive Continuity
                </span>
                <h3 className="font-display text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                  Related Works in {project.category}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeCaseStudy}
                className="text-xs font-semibold text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedProjects.map((relProj) => (
                <div
                  key={relProj.id}
                  onClick={() => openCaseStudy(relProj)}
                  className="group bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46] rounded-xl overflow-hidden cursor-pointer shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/10] overflow-hidden bg-[#FAF9F6] dark:bg-[#0F0F11]">
                      <img
                        src={relProj.image}
                        alt={relProj.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA]">
                        <span>{relProj.category}</span>
                        <span>·</span>
                        <span>{relProj.date}</span>
                      </div>
                      <h4 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] transition-colors leading-snug">
                        {relProj.title}
                      </h4>
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] line-clamp-2">
                        {relProj.shortDesc}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-[#E4E2DC] dark:border-[#27272A] mt-2 flex items-center justify-between text-xs font-semibold text-[#EA580C]">
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
      {/* 5. LIGHTBOX PREVIEW MODAL (Reusing PortfolioModal for zoom)   */}
      {/* ------------------------------------------------------------- */}
      {isPreviewModalOpen && (
        <PortfolioModal
          project={project}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}

    </article>
  );
};
