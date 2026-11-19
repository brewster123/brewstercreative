import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { getProjectLikes, getProjectViews } from '../lib/portfolio';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Heart,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import heroSkyClouds from '../assets/images/hero_sky_clouds_1794752480825.jpg';

const STANDBY_EXHIBITION_SLIDES = [
  {
    id: 'standby-1',
    slot: 'Slot 01',
    category: 'Brand Identity',
    title: 'Featured Works Showcase',
    subtitle: 'Mark portfolio works as Featured to exhibit them in this carousel.',
  },
  {
    id: 'standby-2',
    slot: 'Slot 02',
    category: 'Poster & Key Art',
    title: 'Editorial Direction',
    subtitle: 'High-impact print and key art releases synced live from your archive.',
  },
  {
    id: 'standby-3',
    slot: 'Slot 03',
    category: 'Typography',
    title: 'Visual Systems',
    subtitle: 'Custom wordmarks and archival identity suites open directly into case studies.',
  },
  {
    id: 'standby-4',
    slot: 'Slot 04',
    category: 'Illustration',
    title: 'Multimedia Works',
    subtitle: 'Original artwork and concept series displayed in interactive 3D coverflow.',
  },
  {
    id: 'standby-5',
    slot: 'Slot 05',
    category: 'Studio Concept',
    title: 'Archival Editions',
    subtitle: 'Curated exhibition highlights ready for real-time client discovery.',
  },
];

export const ParallaxHero: React.FC = () => {
  const { setActiveView, portfolio, studioProfile, openCaseStudy, currentUser } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeModalRef = useRef<HTMLButtonElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGalleryIndex, setExpandedGalleryIndex] = useState(0);
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain'>('cover');
  const [stageWidth, setStageWidth] = useState(1040);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleChange);
    return () => motionQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    let rafId: number | null = null;

    const updateParallax = () => {
      rafId = null;
      if (!containerRef.current || !cloudsRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = Math.max(0, -rect.top);
      if (scrollY <= rect.height + 100) {
        cloudsRef.current.style.transform = `translate3d(0, ${Math.min(scrollY * 0.05, 16)}px, 0) scale(1.06)`;
      }
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const updateWidth = () => {
      const measured = stageEl.clientWidth;
      if (measured > 0) {
        setStageWidth(measured);
      }
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(stageEl);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const explicitFeatured = portfolio.filter((p) => p.featured);
  const featuredWorks = (explicitFeatured.length > 0 ? explicitFeatured : portfolio).slice(0, 10);
  const hasRealWorks = featuredWorks.length > 0;
  const totalSlides = hasRealWorks ? featuredWorks.length : STANDBY_EXHIBITION_SLIDES.length;

  useEffect(() => {
    if (activeIndex >= totalSlides) {
      setActiveIndex(0);
    }
  }, [activeIndex, totalSlides]);

  useEffect(() => {
    setExpandedGalleryIndex(0);
  }, [activeIndex, hasRealWorks]);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || isExpanded || totalSlides <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, 4500);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, isPaused, isExpanded, totalSlides]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  };

  useEffect(() => {
    if (!isExpanded) return;

    const previousActiveElement = (document.activeElement as HTMLElement) || null;
    closeModalRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsExpanded(false);
      } else if (e.key === 'ArrowLeft' && totalSlides > 1) {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
      } else if (e.key === 'ArrowRight' && totalSlides > 1) {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % totalSlides);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previousActiveElement?.focus();
    };
  }, [isExpanded, totalSlides]);

  const activeWork = hasRealWorks ? featuredWorks[activeIndex] ?? featuredWorks[0] : null;
  const activeStandbySlide = !hasRealWorks
    ? STANDBY_EXHIBITION_SLIDES[activeIndex] ?? STANDBY_EXHIBITION_SLIDES[0]
    : null;
  const activeWorkImages = activeWork
    ? Array.from(
        new Set(
          [activeWork.image, ...(activeWork.gallery || [])].filter(
            (url): url is string => Boolean(url && url.trim())
          )
        )
      )
    : [];
  const activeExpandedImageUrl =
    activeWorkImages[expandedGalleryIndex] || activeWork?.image || '';
  const activeExpandedImageKey = activeWork
    ? `${activeWork.id}::${activeExpandedImageUrl}`
    : '';

  const getCircularOffset = (index: number, current: number, length: number) => {
    if (length <= 1) return 0;
    let diff = index - current;
    const half = length / 2;
    if (diff > half) diff -= length;
    if (diff < -half) diff += length;
    return diff;
  };

  const showOuterTier = stageWidth >= 860;
  const showInnerTier = stageWidth >= 520;
  const cardBaseWidth = 310;
  const halfStage = stageWidth / 2;
  const safeEdgeMargin = 16;
  const tier2Half = (cardBaseWidth * 0.74) / 2;
  const tier1Half = (cardBaseWidth * 0.86) / 2;
  const tier2Distance = Math.max(0, Math.min(380, halfStage - tier2Half - safeEdgeMargin));
  const tier1Distance = showOuterTier
    ? Math.max(0, Math.min(215, Math.round(tier2Distance * 0.57)))
    : Math.max(0, Math.min(215, halfStage - tier1Half - safeEdgeMargin));

  const isSlideHidden = (offset: number) => {
    const abs = Math.abs(offset);
    if (abs > 2) return true;
    if (abs === 2 && !showOuterTier) return true;
    if (abs === 1 && !showInnerTier) return true;
    return false;
  };

  const getSlideStyle = (offset: number): React.CSSProperties => {
    const abs = Math.abs(offset);
    const direction = offset > 0 ? 1 : -1;
    if (isSlideHidden(offset)) {
      const hiddenX = showOuterTier ? tier2Distance : showInnerTier ? tier1Distance : 0;
      return {
        opacity: 0,
        pointerEvents: 'none',
        transform: `translate3d(${direction * hiddenX}px, 18px, 0) scale(0.68)`,
        zIndex: 0,
      };
    }
    if (offset === 0) {
      return {
        opacity: 1,
        transform: 'translate3d(0px, 0px, 0) scale(1)',
        zIndex: 30,
      };
    }
    if (abs === 1) {
      return {
        opacity: 0.94,
        transform: `translate3d(${direction * tier1Distance}px, 8px, 0) scale(0.86) rotateY(${offset * -8}deg)`,
        zIndex: 20,
      };
    }
    return {
      opacity: 0.72,
      transform: `translate3d(${direction * tier2Distance}px, 18px, 0) scale(0.74) rotateY(${offset * -12}deg)`,
      zIndex: 10,
    };
  };

  return (
    <section
      ref={containerRef}
      aria-label="DESTALION Studio Exhibition Hero"
      className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 pt-2 sm:pt-4"
    >
      <div className="relative rounded-[24px] sm:rounded-[34px] overflow-hidden hero-sky-gradient text-white shadow-lg">
        {/* Seamless Full-Height Atmospheric Clouds Horizon Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
        >
          <img
            ref={cloudsRef}
            src={heroSkyClouds}
            alt=""
            className="w-full h-full object-cover object-bottom scale-[1.06] opacity-95"
            loading="eager"
            decoding="sync"
          />
          <div className="absolute inset-0 hero-sky-top-fade" />
        </div>

        {/* Centered Editorial Proposition & Primary Actions */}
        <div className="relative z-10 px-4 sm:px-8 pt-8 sm:pt-10 lg:pt-12 pb-4 sm:pb-6 text-center max-w-4xl mx-auto space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-semibold tracking-tight leading-[1.05] text-white text-balance">
            Crafting bold brands
            <span className="block font-light text-white/90">
              with art and precision
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed font-normal text-balance">
            Distinctive visual identities, editorial poster systems, and custom multimedia artwork directed from sketch to archival master files.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
            <button
              id="hero-cta-explore-portfolio"
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="px-6 py-3 rounded-full bg-[#065994]/55 hover:bg-[#065994]/75 text-white border border-white/20 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-xs min-h-[44px] whitespace-nowrap focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              View Works
            </button>

            <button
              id="hero-cta-start-commission"
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="pl-5 pr-1.5 py-1.5 rounded-full bg-[#D4FF38] hover:bg-[#C6F426] text-[#111114] text-xs font-bold uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-3 cursor-pointer min-h-[44px] whitespace-nowrap btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#111114]"
            >
              <span>Start Commission</span>
              <span className="w-8 h-8 rounded-full bg-[#111114] text-white flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>

        {/* Interactive 3D Coverflow Featured Works Carousel */}
        <div
          className="relative z-10 px-3 sm:px-6 lg:px-8 pt-2 pb-8 sm:pb-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              handlePrev();
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              handleNext();
            }
          }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 sm:gap-4 relative">
            {/* Previous Slide Button */}
            {totalSlides > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous featured work"
                className="relative z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-white/95 hover:bg-[#D4FF38] text-[#111114] shadow-md border border-white/80 flex items-center justify-center transition-all cursor-pointer shrink-0 btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Coverflow Stage */}
            <div
              ref={stageRef}
              className="relative flex-1 h-[235px] sm:h-[255px] flex items-center justify-center overflow-visible"
              style={{ perspective: '1200px' }}
              role="region"
              aria-roledescription="carousel"
              aria-label="Featured Works Carousel"
            >
              {hasRealWorks
                ? featuredWorks.map((work, index) => {
                    const offset = getCircularOffset(index, activeIndex, featuredWorks.length);
                    const isActive = offset === 0;
                    const hidden = isSlideHidden(offset);
                    const hasValidImage = Boolean(
                      work.image && work.image.trim() && !failedImages[work.id]
                    );
                    const likes = getProjectLikes(work);
                    const views = getProjectViews(work);

                    return (
                      <button
                        key={work.id}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setExpandedGalleryIndex(0);
                            setIsExpanded(true);
                          } else {
                            setActiveIndex(index);
                          }
                        }}
                        aria-label={
                          isActive
                            ? `Enlarge artwork preview: ${work.title}`
                            : `Focus featured work: ${work.title}`
                        }
                        aria-current={isActive ? 'true' : undefined}
                        aria-hidden={hidden || undefined}
                        tabIndex={hidden ? -1 : 0}
                        style={getSlideStyle(offset)}
                        className={`group absolute w-[250px] sm:w-[310px] h-[210px] sm:h-[230px] rounded-2xl overflow-hidden bg-white dark:bg-white text-[#111114] shadow-xl border transition-all duration-500 ease-out flex flex-col justify-between text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38] ${
                          isActive
                            ? 'border-white ring-1 ring-white/80 cursor-zoom-in'
                            : 'border-white/70 hover:brightness-105 cursor-pointer'
                        }`}
                      >
                        {hasValidImage ? (
                          <img
                            src={work.image}
                            alt={work.title}
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [work.id]: true }))
                            }
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                            loading="eager"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#073866] to-[#0284C7] flex items-center justify-center">
                            <ImageIcon className="w-9 h-9 text-white/40" />
                          </div>
                        )}

                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15 pointer-events-none"
                        />

                        {/* Top Bar */}
                        <div className="relative z-10 p-3 flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs ${
                              work.featured
                                ? 'bg-[#D4FF38] text-[#111114]'
                                : 'bg-white/95 dark:bg-white/95 text-[#111114]'
                            }`}
                          >
                            {work.featured ? 'Featured' : work.date || 'Archive'}
                          </span>

                          {isActive && (
                            <span
                              title="Click to enlarge image"
                              className="w-7 h-7 rounded-full bg-[#111114]/85 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-[#D4FF38] group-hover:text-[#111114] transition-colors"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        {/* Bottom Frosted Case Study Caption */}
                        <div className="relative z-10 m-2.5 p-3 rounded-xl bg-white/95 dark:bg-white/95 backdrop-blur-xs shadow-sm space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0284C7] truncate">
                              {work.category}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-[#6B7280] tabular-nums shrink-0">
                              <span className="inline-flex items-center gap-0.5">
                                <Heart className="w-3 h-3 text-rose-500" />
                                {likes}
                              </span>
                              <span className="inline-flex items-center gap-0.5">
                                <Eye className="w-3 h-3" />
                                {views}
                              </span>
                            </div>
                          </div>
                          <span className="font-display font-bold text-sm text-[#111114] block truncate">
                            {work.title}
                          </span>
                          <span className="text-[11px] text-[#6B7280] block truncate">
                            {work.projectType === 'client'
                              ? work.client || 'Client Commission'
                              : 'Studio Concept'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                : STANDBY_EXHIBITION_SLIDES.map((slide, index) => {
                    const offset = getCircularOffset(
                      index,
                      activeIndex,
                      STANDBY_EXHIBITION_SLIDES.length
                    );
                    const isActive = offset === 0;
                    const hidden = isSlideHidden(offset);

                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setIsExpanded(true);
                          } else {
                            setActiveIndex(index);
                          }
                        }}
                        aria-label={
                          isActive
                            ? `Enlarge preview: ${slide.title}`
                            : `Preview ${slide.slot}: ${slide.category}`
                        }
                        aria-current={isActive ? 'true' : undefined}
                        aria-hidden={hidden || undefined}
                        tabIndex={hidden ? -1 : 0}
                        style={getSlideStyle(offset)}
                        className={`group absolute w-[250px] sm:w-[310px] h-[205px] sm:h-[225px] rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-500 ease-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38] ${
                          isActive
                            ? 'bg-[#0D0F14] text-white border border-white/25 shadow-2xl cursor-zoom-in'
                            : 'bg-white/90 dark:bg-white/95 text-[#111114] border border-white/80 shadow-lg backdrop-blur-xs cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-[#D4FF38] text-[#111114]'
                                : 'bg-[#F4F5F7] dark:bg-[#F4F5F7] text-[#0284C7]'
                            }`}
                          >
                            {isActive ? <Sparkles className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                            <span>{slide.category}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider ${
                                isActive ? 'text-white/60' : 'text-[#6B7280]'
                              }`}
                            >
                              {slide.slot}
                            </span>
                            {isActive && (
                              <span
                                title="Click to expand preview"
                                className="w-6 h-6 rounded-full bg-white/10 text-white/80 group-hover:bg-[#D4FF38] group-hover:text-[#111114] flex items-center justify-center transition-colors"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h3
                            className={`font-display text-base sm:text-lg font-bold tracking-tight ${
                              isActive ? 'text-white' : 'text-[#111114]'
                            }`}
                          >
                            {slide.title}
                          </h3>
                          <p
                            className={`text-xs leading-relaxed line-clamp-2 ${
                              isActive ? 'text-[#9CA3AF]' : 'text-[#4B5563]'
                            }`}
                          >
                            {slide.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
            </div>

            {/* Next Slide Button */}
            {totalSlides > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next featured work"
                className="relative z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-white/95 hover:bg-[#D4FF38] text-[#111114] shadow-md border border-white/80 flex items-center justify-center transition-all cursor-pointer shrink-0 btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Grounded Trust Caption Above Cloud Horizon */}
          <div className="pt-3 text-center">
            <p className="text-xs font-medium text-[#111114]/85 inline-flex items-center justify-center gap-2 bg-white/80 dark:bg-white/90 backdrop-blur-xs px-4 py-1.5 rounded-full shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
              <span>
                {hasRealWorks
                  ? `Featured Works by ${studioProfile.designerName} · Click active card to enlarge image`
                  : `Directed personally by ${studioProfile.designerName} · Click active card to expand preview`}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Full-Bleed Artwork Showcase Modal */}
      {isExpanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              activeWork
                ? `Enlarged preview: ${activeWork.title}`
                : activeStandbySlide
                  ? `Expanded exhibition preview: ${activeStandbySlide.title}`
                  : 'Expanded preview'
            }
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-md p-3 sm:p-5 lg:p-8 animate-in fade-in duration-200 cursor-zoom-out select-none"
          >
            {/* Full-Bleed Edge-to-Edge Showcase Frame */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-6xl h-[80vh] sm:h-[85vh] max-h-[860px] min-h-[440px] rounded-[24px] sm:rounded-[32px] overflow-hidden bg-[#07090E] ring-1 ring-white/15 shadow-[0_32px_90px_-16px_rgba(0,0,0,0.9)] cursor-default animate-in zoom-in-95 duration-200"
            >
              {/* Layer 1: Full-Bleed Visual Canvas */}
              {activeWork ? (
                activeExpandedImageUrl &&
                !(expandedGalleryIndex === 0 && failedImages[activeWork.id]) &&
                !failedImages[activeExpandedImageKey] ? (
                  <>
                    {imageFitMode === 'contain' && (
                      <img
                        src={activeExpandedImageUrl}
                        alt=""
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35 pointer-events-none"
                      />
                    )}
                    <img
                      src={activeExpandedImageUrl}
                      alt={activeWork.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [activeExpandedImageKey]: true,
                        }))
                      }
                      className={`absolute inset-0 w-full h-full transition-all duration-300 ${
                        imageFitMode === 'contain'
                          ? 'object-contain p-4 sm:p-8 pb-36 sm:pb-40'
                          : 'object-cover'
                      }`}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#081226] via-[#073866] to-[#0284C7] flex flex-col items-center justify-center gap-3 text-white/60">
                    <ImageIcon className="w-12 h-12 opacity-50" />
                    <span className="text-xs font-medium tracking-wide">
                      Artwork preview unavailable
                    </span>
                  </div>
                )
              ) : (
                <div className="absolute inset-0 overflow-hidden bg-[#061326]">
                  <img
                    src={heroSkyClouds}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-center scale-105 opacity-55"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-br from-[#041833]/85 via-[#073866]/55 to-[#0284C7]/35"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-grid-pattern opacity-40"
                  />
                </div>
              )}

              {/* Layer 2: Subtle Top Edge Scrim (keeps top-right controls legible over bright images) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 via-black/20 to-transparent z-10"
              />

              {/* Layer 3: Rich Bottom Dark Gradient Scrim for Overlaid Typography */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] sm:h-[52%] bg-gradient-to-t from-black/95 via-black/70 via-45% to-transparent z-10"
              />

              {/* Layer 4: Integrated Top-Right Glass Controls */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
                {activeWork && activeExpandedImageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setImageFitMode((prev) => (prev === 'cover' ? 'contain' : 'cover'))
                    }
                    aria-label={
                      imageFitMode === 'cover'
                        ? 'Fit entire artwork inside frame'
                        : 'Fill frame edge-to-edge'
                    }
                    title={imageFitMode === 'cover' ? 'Fit full artwork' : 'Fill frame'}
                    className="h-11 px-3.5 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white/90 hover:text-white border border-white/15 inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
                  >
                    {imageFitMode === 'cover' ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Fit</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Fill</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  ref={closeModalRef}
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close expanded preview"
                  className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Layer 5: Side Navigation Arrows */}
              {totalSlides > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous work"
                    className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/45 hover:bg-[#D4FF38] backdrop-blur-md text-white hover:text-[#111114] border border-white/15 shadow-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next work"
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/45 hover:bg-[#D4FF38] backdrop-blur-md text-white hover:text-[#111114] border border-white/15 shadow-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Layer 6: Bottom Overlaid Editorial Typography & Primary Action */}
              <div className="absolute inset-x-0 bottom-0 z-20 px-5 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10 pt-12 flex flex-col gap-4">
                {/* Multi-Image Gallery Strip (only for real works with additional boards) */}
                {activeWork && activeWorkImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
                    {activeWorkImages.map((imgUrl, idx) => (
                      <button
                        key={`${activeWork.id}-thumb-${idx}`}
                        type="button"
                        onClick={() => setExpandedGalleryIndex(idx)}
                        aria-label={`View image ${idx + 1} of ${activeWorkImages.length}`}
                        className={`w-14 h-10 sm:w-16 sm:h-11 rounded-xl overflow-hidden border transition-all cursor-pointer shrink-0 ${
                          expandedGalleryIndex === idx
                            ? 'border-[#D4FF38] ring-2 ring-[#D4FF38]/40 opacity-100'
                            : 'border-white/25 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${activeWork.title} preview ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {activeWork ? (
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 text-white">
                    <div className="min-w-0 max-w-2xl space-y-2">
                      {/* Quiet Unboxed Editorial Metadata */}
                      <div className="flex items-center gap-2 text-xs font-medium text-white/75 flex-wrap tracking-wide">
                        <span className="text-[#D4FF38] font-semibold">{activeWork.category}</span>
                        <span aria-hidden="true" className="text-white/35">·</span>
                        <span>
                          {activeWork.projectType === 'client'
                            ? activeWork.client || 'Client Commission'
                            : 'Studio Concept'}
                        </span>
                        {activeWork.date && (
                          <>
                            <span aria-hidden="true" className="text-white/35">·</span>
                            <span>{activeWork.date}</span>
                          </>
                        )}
                        <span aria-hidden="true" className="text-white/35">·</span>
                        <span className="inline-flex items-center gap-1 tabular-nums text-white/70">
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                          {getProjectLikes(activeWork)}
                        </span>
                        <span className="inline-flex items-center gap-1 tabular-nums text-white/70">
                          <Eye className="w-3.5 h-3.5" />
                          {getProjectViews(activeWork)}
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight leading-[1.08] text-white text-balance">
                        {activeWork.title}
                      </h3>

                      {activeWork.shortDesc && (
                        <p className="text-sm sm:text-[15px] text-white/80 leading-relaxed line-clamp-2 max-w-xl">
                          {activeWork.shortDesc}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        openCaseStudy(activeWork);
                      }}
                      className="pl-5 pr-1.5 py-1.5 min-h-[44px] rounded-full bg-[#D4FF38] hover:bg-[#C6F426] text-[#111114] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-3 transition-colors cursor-pointer shrink-0 self-start sm:self-auto whitespace-nowrap shadow-lg btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span>Open Case Study</span>
                      <span className="w-8 h-8 rounded-full bg-[#111114] text-white flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </button>
                  </div>
                ) : (
                  activeStandbySlide && (
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 text-white">
                      <div className="min-w-0 max-w-2xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-white/75 tracking-wide">
                          <span className="text-[#D4FF38] font-semibold">
                            {activeStandbySlide.category}
                          </span>
                          <span aria-hidden="true" className="text-white/35">·</span>
                          <span>{activeStandbySlide.slot}</span>
                          <span aria-hidden="true" className="text-white/35">·</span>
                          <span className="text-white/60">Featured archive showcase</span>
                        </div>

                        <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight leading-[1.08] text-white text-balance">
                          {activeStandbySlide.title}
                        </h3>

                        <p className="text-sm sm:text-[15px] text-white/80 leading-relaxed max-w-xl">
                          {activeStandbySlide.subtitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          setActiveView('portfolio');
                        }}
                        className="pl-5 pr-1.5 py-1.5 min-h-[44px] rounded-full bg-[#D4FF38] hover:bg-[#C6F426] text-[#111114] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-3 transition-colors cursor-pointer shrink-0 self-start sm:self-auto whitespace-nowrap shadow-lg btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <span>
                          {currentUser?.role === 'admin' ? 'Add Portfolio Work' : 'View Portfolio'}
                        </span>
                        <span className="w-8 h-8 rounded-full bg-[#111114] text-white flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
