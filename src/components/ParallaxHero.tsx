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
  X,
} from 'lucide-react';
import heroSkyClouds from '../assets/images/hero_sky_clouds_1794752480825.jpg';
import { ArtworkHoverWave } from './ArtworkHoverWave';

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
  const headlineRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeModalRef = useRef<HTMLButtonElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalSwipeRef = useRef(false);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalTouchStartXRef = useRef<number | null>(null);
  const modalTouchStartYRef = useRef<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGalleryIndex, setExpandedGalleryIndex] = useState(0);
  const [stageWidth, setStageWidth] = useState(1040);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);

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
      if (scrollY <= rect.height + 160) {
        const cloudOffset = Math.min(scrollY * 0.14, 52);
        cloudsRef.current.style.transform = `translate3d(0, ${cloudOffset}px, 0) scale(1.1)`;

        if (headlineRef.current) {
          const textLift = Math.min(scrollY * 0.08, 28);
          const progress = Math.min(scrollY / 420, 1);
          headlineRef.current.style.transform = `translate3d(0, ${textLift}px, 0)`;
          headlineRef.current.style.opacity = `${1 - progress * 0.25}`;
        }
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
    return () => {
      if (suppressClickTimerRef.current) clearTimeout(suppressClickTimerRef.current);
    };
  }, []);

  const mouseStartXRef = useRef<number | null>(null);
  const isMouseDraggingRef = useRef(false);

  const handleCarouselMouseDown = (e: React.MouseEvent) => {
    if (totalSlides <= 1 || e.button !== 0) return;
    mouseStartXRef.current = e.clientX;
    isMouseDraggingRef.current = false;
  };

  const handleCarouselMouseMove = (e: React.MouseEvent) => {
    if (totalSlides <= 1 || mouseStartXRef.current === null) return;
    const dx = e.clientX - mouseStartXRef.current;

    if (!isMouseDraggingRef.current && Math.abs(dx) > 10) {
      isMouseDraggingRef.current = true;
      suppressClickRef.current = true;
    }

    if (isMouseDraggingRef.current) {
      const clamped = Math.max(-76, Math.min(76, dx * 0.5));
      setSwipeOffsetX(clamped);
    }
  };

  const handleCarouselMouseEnd = (e: React.MouseEvent) => {
    if (mouseStartXRef.current !== null && totalSlides > 1) {
      const dx = e.clientX - mouseStartXRef.current;
      if (isMouseDraggingRef.current && Math.abs(dx) >= 34) {
        if (dx < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }

    mouseStartXRef.current = null;
    isMouseDraggingRef.current = false;
    setSwipeOffsetX(0);

    if (suppressClickRef.current) {
      if (suppressClickTimerRef.current) clearTimeout(suppressClickTimerRef.current);
      suppressClickTimerRef.current = setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
    }
  };

  const handleCarouselTouchStart = (e: React.TouchEvent) => {
    if (totalSlides <= 1 || e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = false;
    setIsPaused(true);
  };

  const handleCarouselTouchMove = (e: React.TouchEvent) => {
    if (
      totalSlides <= 1 ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null ||
      e.touches.length !== 1
    ) {
      return;
    }

    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = e.touches[0].clientY - touchStartYRef.current;

    // Abort horizontal swipe tracking if user is clearly scrolling vertically
    if (!isHorizontalSwipeRef.current && Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      setSwipeOffsetX(0);
      return;
    }

    if (!isHorizontalSwipeRef.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.1) {
      isHorizontalSwipeRef.current = true;
      suppressClickRef.current = true;
    }

    if (isHorizontalSwipeRef.current) {
      const clamped = Math.max(-76, Math.min(76, dx * 0.5));
      setSwipeOffsetX(clamped);
    }
  };

  const handleCarouselTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && totalSlides > 1) {
      const endX = e.changedTouches?.[0]?.clientX ?? touchStartXRef.current;
      const dx = endX - touchStartXRef.current;

      if (isHorizontalSwipeRef.current && Math.abs(dx) >= 34) {
        if (dx < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalSwipeRef.current = false;
    setSwipeOffsetX(0);
    setIsPaused(false);

    if (suppressClickRef.current) {
      if (suppressClickTimerRef.current) clearTimeout(suppressClickTimerRef.current);
      suppressClickTimerRef.current = setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
    }
  };

  const handleModalTouchStart = (e: React.TouchEvent) => {
    if (totalSlides <= 1 || e.touches.length !== 1) return;
    modalTouchStartXRef.current = e.touches[0].clientX;
    modalTouchStartYRef.current = e.touches[0].clientY;
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (
      totalSlides <= 1 ||
      modalTouchStartXRef.current === null ||
      modalTouchStartYRef.current === null
    ) {
      return;
    }
    const endX = e.changedTouches?.[0]?.clientX ?? modalTouchStartXRef.current;
    const endY = e.changedTouches?.[0]?.clientY ?? modalTouchStartYRef.current;
    const dx = endX - modalTouchStartXRef.current;
    const dy = endY - modalTouchStartYRef.current;

    if (Math.abs(dx) >= 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    modalTouchStartXRef.current = null;
    modalTouchStartYRef.current = null;
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
  const cardBaseWidth = 320;
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
      const dragRotate = swipeOffsetX !== 0 ? swipeOffsetX * 0.04 : 0;
      return {
        opacity: 1,
        transform: `translate3d(${swipeOffsetX}px, 0px, 0) scale(1) rotateZ(${dragRotate}deg)`,
        zIndex: 30,
        transition: swipeOffsetX !== 0 ? 'none' : undefined,
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
            className="w-full h-full object-cover object-bottom scale-[1.1] opacity-95 will-change-transform"
            loading="eager"
            decoding="sync"
          />
          <div className="absolute inset-0 hero-sky-top-fade" />
        </div>

        {/* Centered Editorial Proposition & Primary Actions */}
        <div
          ref={headlineRef}
          className="relative z-10 px-4 sm:px-8 pt-8 sm:pt-10 lg:pt-12 pb-4 sm:pb-6 text-center max-w-4xl mx-auto space-y-4 will-change-transform"
        >
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
          <div className="max-w-6xl mx-auto flex items-center justify-center relative">
            {/* Coverflow Stage (Click flanking cards, swipe, drag, or use arrow keys) */}
            <div
              ref={stageRef}
              onMouseDown={handleCarouselMouseDown}
              onMouseMove={handleCarouselMouseMove}
              onMouseUp={handleCarouselMouseEnd}
              onMouseLeave={handleCarouselMouseEnd}
              onTouchStart={handleCarouselTouchStart}
              onTouchMove={handleCarouselTouchMove}
              onTouchEnd={handleCarouselTouchEnd}
              onTouchCancel={handleCarouselTouchEnd}
              className="relative w-full h-[255px] sm:h-[285px] flex items-center justify-center overflow-visible touch-pan-y select-none"
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
                          if (suppressClickRef.current) return;
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
                        className={`group absolute w-[280px] sm:w-[320px] h-[230px] sm:h-[260px] rounded-2xl overflow-hidden bg-[#0B0D12] text-white shadow-xl border transition-all duration-500 ease-out flex flex-col justify-between text-left cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38] ${
                          isActive
                            ? 'border-white/80 ring-1 ring-white/50'
                            : 'border-white/30 hover:brightness-105'
                        }`}
                      >
                        {hasValidImage ? (
                          <img
                            src={work.image}
                            alt={work.title}
                            draggable={false}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [work.id]: true }))
                            }
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transform-none"
                            loading="eager"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#073866] to-[#0284C7] flex items-center justify-center">
                            <ImageIcon className="w-9 h-9 text-white/40" />
                          </div>
                        )}

                        {/* Measured Dark Gradient Scrims (Keeps upper artwork clear & bottom text legible) */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent pointer-events-none"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-[56%] bg-gradient-to-t from-black/90 via-black/50 via-45% to-transparent pointer-events-none"
                        />

                        {/* Fluid Hover Wave Overlay (replaces zoom cursor feedback) */}
                        <ArtworkHoverWave className="z-[5]" />

                        {/* Top Bar */}
                        <div className="relative z-10 p-3 flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs ${
                              work.featured
                                ? 'bg-[#D4FF38] text-[#111114]'
                                : 'bg-black/50 backdrop-blur-md text-white border border-white/15'
                            }`}
                          >
                            {work.featured ? 'Featured' : work.date || 'Archive'}
                          </span>

                          {isActive && (
                            <span
                              title="Click to enlarge image"
                              className="w-7 h-7 rounded-full bg-black/55 backdrop-blur-md text-white border border-white/15 flex items-center justify-center shadow-xs shrink-0 group-hover:bg-[#D4FF38] group-hover:text-[#111114] transition-colors"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        {/* Overlaid Caption Directly Over Dark Bottom Gradient */}
                        <div className="relative z-10 px-3.5 pb-3.5 pt-6 space-y-0.5 text-white">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4FF38] truncate drop-shadow-xs">
                              {work.category}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-white/80 tabular-nums shrink-0">
                              <span className="inline-flex items-center gap-0.5">
                                <Heart className="w-3 h-3 text-rose-400" />
                                {likes}
                              </span>
                              <span className="inline-flex items-center gap-0.5">
                                <Eye className="w-3 h-3" />
                                {views}
                              </span>
                            </div>
                          </div>
                          <span className="font-display font-bold text-sm sm:text-[15px] text-white block truncate leading-tight drop-shadow-xs">
                            {work.title}
                          </span>
                          <span className="text-[11px] text-white/75 block truncate">
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
                          if (suppressClickRef.current) return;
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
                        className={`group absolute w-[272px] sm:w-[310px] h-[205px] sm:h-[225px] rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left transition-all duration-500 ease-out cursor-pointer overflow-hidden focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38] ${
                          isActive
                            ? 'bg-[#0D0F14] text-white border border-white/25 shadow-2xl'
                            : 'bg-white/90 dark:bg-white/95 text-[#111114] border border-white/80 shadow-lg backdrop-blur-xs'
                        }`}
                      >
                        {isActive && <ArtworkHoverWave className="z-0" />}
                        <div className="relative z-10 flex items-center justify-between gap-2">
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

                        <div className="relative z-10 space-y-1.5">
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
          </div>

          {/* Grounded Trust Caption Above Cloud Horizon */}
          <div className="pt-3 text-center">
            <p className="text-xs font-medium text-[#111114]/85 inline-flex items-center justify-center gap-2 bg-white/80 dark:bg-white/90 backdrop-blur-xs px-4 py-1.5 rounded-full shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
              <span className="hidden sm:inline">
                {hasRealWorks
                  ? `Featured Works by ${studioProfile.designerName} · Click active card to enlarge image`
                  : `Directed personally by ${studioProfile.designerName} · Click active card to expand preview`}
              </span>
              <span className="sm:hidden">
                {hasRealWorks
                  ? `Featured Works by ${studioProfile.designerName} · Swipe or tap to view`
                  : `Directed by ${studioProfile.designerName} · Swipe or tap to preview`}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-md p-2.5 sm:p-4 lg:p-6 animate-in fade-in duration-200 cursor-pointer select-none"
          >
            {/* Full-Bleed Exhibition Showcase Frame */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-6xl h-[86vh] sm:h-[88vh] max-h-[920px] min-h-[460px] rounded-[24px] sm:rounded-[32px] overflow-hidden bg-[#07090E] ring-1 ring-white/15 shadow-[0_32px_90px_-16px_rgba(0,0,0,0.9)] cursor-default animate-in zoom-in-95 duration-200 flex flex-col"
            >
              {/* Background Atmospheric Backdrop & Gradient Scrims */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                {activeWork ? (
                  activeExpandedImageUrl &&
                  !(expandedGalleryIndex === 0 && failedImages[activeWork.id]) &&
                  !failedImages[activeExpandedImageKey] ? (
                    <>
                      <img
                        src={activeExpandedImageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-40"
                      />
                      <div className="absolute inset-0 bg-[#07090E]/50" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#081226] via-[#073866] to-[#0284C7]" />
                  )
                ) : (
                  <div className="absolute inset-0 bg-[#061326]">
                    <img
                      src={heroSkyClouds}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover object-center scale-105 opacity-55"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#041833]/85 via-[#073866]/55 to-[#0284C7]/35" />
                    <div className="absolute inset-0 bg-grid-pattern opacity-40" />
                  </div>
                )}

                {/* Subtle Top & Bottom Atmospheric Gradient Scrims */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/95 via-black/75 via-55% to-transparent" />
              </div>

              {/* Integrated Top-Right Close Button */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center">
                <button
                  ref={closeModalRef}
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close expanded preview"
                  className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Flex Child 1: Dedicated Uncropped Artwork Stage (never overlaps bottom typography; swipe-enabled on mobile) */}
              <div
                onTouchStart={handleModalTouchStart}
                onTouchEnd={handleModalTouchEnd}
                className="relative z-10 flex-1 min-h-0 flex items-center justify-center pt-5 sm:pt-7 pb-3 sm:pb-4 px-5 sm:px-20 touch-pan-y"
              >
                {/* Side Navigation Arrows Centered Against Artwork (Desktop & Tablet) */}
                {totalSlides > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="Previous work"
                      className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/45 hover:bg-[#D4FF38] backdrop-blur-md text-white hover:text-[#111114] border border-white/15 shadow-lg items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Next work"
                      className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/45 hover:bg-[#D4FF38] backdrop-blur-md text-white hover:text-[#111114] border border-white/15 shadow-lg items-center justify-center transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4FF38]"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {activeWork &&
                  (activeExpandedImageUrl &&
                  !(expandedGalleryIndex === 0 && failedImages[activeWork.id]) &&
                  !failedImages[activeExpandedImageKey] ? (
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
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-[0_24px_70px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 transition-all duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-white/60">
                      <ImageIcon className="w-12 h-12 opacity-50" />
                      <span className="text-xs font-medium tracking-wide">
                        Artwork preview unavailable
                      </span>
                    </div>
                  ))}
              </div>

              {/* Flex Child 2: Dedicated Bottom Editorial Typography & Primary Action Bar */}
              <div className="relative z-20 shrink-0 px-5 sm:px-8 lg:px-10 pt-3 sm:pt-4 pb-5 sm:pb-7 lg:pb-8 flex flex-col gap-3.5 bg-gradient-to-t from-black/95 via-black/75 to-transparent">
                {/* Multi-Image Gallery Strip (only for real works with additional boards) */}
                {activeWork && activeWorkImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
                    {activeWorkImages.map((imgUrl, idx) => (
                      <button
                        key={`${activeWork.id}-thumb-${idx}`}
                        type="button"
                        onClick={() => setExpandedGalleryIndex(idx)}
                        aria-label={`View image ${idx + 1} of ${activeWorkImages.length}`}
                        className={`w-14 h-10 sm:w-16 sm:h-11 rounded-xl overflow-hidden bg-black/70 border transition-all cursor-pointer shrink-0 ${
                          expandedGalleryIndex === idx
                            ? 'border-[#D4FF38] ring-2 ring-[#D4FF38]/40 opacity-100'
                            : 'border-white/25 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${activeWork.title} preview ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {activeWork ? (
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 text-white">
                    <div className="min-w-0 max-w-2xl space-y-1.5">
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
