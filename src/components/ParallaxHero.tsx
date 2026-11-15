import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowUpRight,
  Plus,
  Layers,
  CheckCircle2,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import heroSkyClouds from '../assets/images/hero_sky_clouds_1794752480825.jpg';
import studioBentoSky from '../assets/images/studio_bento_sky_1794752481393.jpg';

export const ParallaxHero: React.FC = () => {
  const { setActiveView, portfolio, services, studioProfile, openCaseStudy } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLImageElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
        cloudsRef.current.style.transform = `translate3d(0, ${scrollY * 0.08}px, 0) scale(1.03)`;
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

  const leadProject = portfolio[0] || null;
  const startingServicePrice = services[0]?.startingPrice
    ? `${studioProfile.currencySymbol}${services[0].startingPrice.toLocaleString()}`
    : `${studioProfile.currencySymbol}3,500`;

  // Desktop parabolic perspective transforms matching the fanned curved arc
  const arcTransforms = [
    'lg:-translate-y-4 lg:rotate-y-12 lg:scale-95',
    'lg:-translate-y-1 lg:rotate-y-6 lg:scale-[0.98]',
    'lg:translate-y-2 lg:rotate-y-3',
    'lg:translate-y-3 z-20',
    'lg:translate-y-2 lg:-rotate-y-3',
    'lg:-translate-y-1 lg:-rotate-y-6 lg:scale-[0.98]',
    'lg:-translate-y-4 lg:-rotate-y-12 lg:scale-95',
  ];

  return (
    <section
      ref={containerRef}
      aria-label="DESTALION Studio Exhibition Hero"
      className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 pt-2 sm:pt-4"
    >
      <div className="relative rounded-[24px] sm:rounded-[34px] overflow-hidden hero-sky-gradient text-white shadow-lg">
        {/* Soft Atmospheric Clouds Horizon Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[62%] pointer-events-none select-none overflow-hidden"
        >
          <img
            ref={cloudsRef}
            src={heroSkyClouds}
            alt=""
            className="w-full h-full object-cover object-bottom opacity-95 will-change-transform"
            loading="eager"
            decoding="sync"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(9, 140, 224, 0.96) 0%, rgba(14, 165, 233, 0.45) 36%, rgba(255, 255, 255, 0) 75%)',
            }}
          />
        </div>

        {/* Centered Editorial Proposition & Primary Actions */}
        <div className="relative z-10 px-4 sm:px-8 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 text-center max-w-4xl mx-auto space-y-5">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-semibold tracking-tight leading-[1.05] text-white text-balance">
            Crafting bold brands
            <span className="block font-light text-white/90">
              with art and precision
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed font-normal text-balance">
            Distinctive visual identities, editorial poster systems, and custom multimedia artwork directed from sketch to archival master files.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
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

        {/* Curved 3D Perspective Studio Showcase Arc */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-10 pt-2 pb-10 sm:pb-12">
          <div
            className="flex lg:grid lg:grid-cols-7 items-stretch gap-3.5 sm:gap-4 overflow-x-auto lg:overflow-visible no-scrollbar pb-3 lg:pb-6 snap-x snap-mandatory"
            style={{ perspective: '1400px' }}
          >
            {/* Card 1: Service Menu Preview */}
            <button
              type="button"
              onClick={() => setActiveView('services')}
              className={`snap-center shrink-0 w-[180px] sm:w-[190px] lg:w-auto bg-white dark:bg-white text-[#111114] rounded-2xl p-4 shadow-md border border-white/80 flex flex-col justify-between text-left transition-transform duration-300 hover:-translate-y-1 cursor-pointer min-h-[185px] ${arcTransforms[0]}`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0284C7]">
                  Starting Scope
                </span>
                <p className="font-display font-bold text-sm leading-snug text-[#111114]">
                  {services[0]?.name || 'Logo Design'}
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-100">
                <span className="text-lg font-bold tracking-tight tabular-nums text-[#111114] block">
                  {startingServicePrice}
                </span>
                <div className="flex items-end gap-1 h-7">
                  <span className="flex-1 bg-[#E0F2FE] rounded-t h-3" />
                  <span className="flex-1 bg-[#BAE6FD] rounded-t h-5" />
                  <span className="flex-1 bg-[#38BDF8] rounded-t h-4" />
                  <span className="flex-1 bg-[#0284C7] rounded-t h-7" />
                </div>
              </div>
            </button>

            {/* Card 2: Sculptural Studio Visual */}
            <button
              type="button"
              onClick={() => (leadProject ? openCaseStudy(leadProject) : setActiveView('portfolio'))}
              className={`snap-center shrink-0 w-[180px] sm:w-[190px] lg:w-auto bg-white dark:bg-white text-[#111114] rounded-2xl overflow-hidden shadow-md border border-white/80 relative flex flex-col justify-end text-left transition-transform duration-300 hover:-translate-y-1 cursor-pointer min-h-[185px] ${arcTransforms[1]}`}
            >
              <img
                src={leadProject?.image || studioBentoSky}
                alt={leadProject?.title || 'DESTALION studio visual composition'}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
              <div className="relative z-10 m-2 p-2.5 rounded-xl bg-white/95 dark:bg-white/95 backdrop-blur-xs shadow-xs">
                <span className="text-[10px] font-semibold text-[#6B7280] block truncate">
                  {leadProject ? leadProject.category : 'Exhibition Visual'}
                </span>
                <span className="font-display font-bold text-xs text-[#111114] block truncate">
                  {leadProject ? leadProject.title : 'Sculptural Direction'}
                </span>
              </div>
            </button>

            {/* Card 3: Milestone Curve Card */}
            <button
              type="button"
              onClick={() => setActiveView('services')}
              className={`snap-center shrink-0 w-[180px] sm:w-[190px] lg:w-auto bg-white dark:bg-white text-[#111114] rounded-2xl p-4 shadow-md border border-white/80 flex flex-col justify-between text-left transition-transform duration-300 hover:-translate-y-1 cursor-pointer min-h-[185px] ${arcTransforms[2]}`}
            >
              <div>
                <span className="text-xs font-bold leading-snug text-[#111114] block">
                  Precision in Every Pixel
                </span>
                <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                  {services.length} Studio Disciplines
                </span>
              </div>
              <svg viewBox="0 0 120 48" className="w-full h-12 text-[#0284C7]" aria-hidden="true">
                <defs>
                  <linearGradient id="skyChartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 42 C24 38, 36 22, 58 26 C80 30, 96 10, 120 6 L120 48 L0 48 Z"
                  fill="url(#skyChartFill)"
                />
                <path
                  d="M0 42 C24 38, 36 22, 58 26 C80 30, 96 10, 120 6"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Card 4: Center Anchor Obsidian Statement Card */}
            <button
              type="button"
              onClick={() => setActiveView('portfolio')}
              className={`snap-center shrink-0 w-[195px] sm:w-[205px] lg:w-auto bg-[#0D0F14] text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-white/15 flex flex-col justify-between text-left transition-transform duration-300 hover:-translate-y-1 cursor-pointer min-h-[185px] ${arcTransforms[3]}`}
            >
              <div className="flex items-center justify-between">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4FF38]" />
                <ArrowUpRight className="w-4 h-4 text-white/60" />
              </div>
              <p className="font-display text-sm sm:text-[15px] font-medium leading-snug text-white">
                Craft that combines{' '}
                <span className="text-[#9CA3AF]">Strategy,</span> Typography, and Visual Art
              </p>
            </button>

            {/* Card 5: Glassy Sky Quick Brief Card */}
            <button
              type="button"
              onClick={() => setActiveView('commission-form')}
              className={`snap-center shrink-0 w-[180px] sm:w-[190px] lg:w-auto bg-[#0EA5E9]/45 hover:bg-[#0EA5E9]/60 backdrop-blur-md text-white rounded-2xl p-4 shadow-md border border-white/40 flex flex-col items-center justify-center text-center gap-2.5 transition-transform duration-300 hover:-translate-y-1 cursor-pointer min-h-[185px] ${arcTransforms[4]}`}
            >
              <span className="w-10 h-10 rounded-full bg-white dark:bg-white text-[#0284C7] flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5" />
              </span>
              <div>
                <span className="font-display font-bold text-sm block">Start a Brief</span>
                <span className="text-[11px] text-white/85 block mt-0.5">
                  Submit project scope
                </span>
              </div>
            </button>

            {/* Card 6: Archival Deliverables Metric Card */}
            <button
              type="button"
              onClick={() => setActiveView('services')}
              className={`snap-center shrink-0 w-[180px] sm:w-[190px] lg:w-auto bg-white dark:bg-white text-[#111114] rounded-2xl p-4 shadow-md border border-white/80 flex flex-col justify-between text-left transition-transform duration-300 hover:-translate-y-1 cursor-pointer min-h-[185px] ${arcTransforms[5]}`}
            >
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#F4F5F7] dark:bg-[#F4F5F7] text-[#4B5563] dark:text-[#4B5563]">AI / SVG</span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#D4FF38] text-[#111114]">300 DPI</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider block">
                  Deliverables
                </span>
                <span className="font-display text-2xl font-bold tracking-tight text-[#111114] tabular-nums block">
                  100%
                </span>
                <span className="text-[11px] text-[#6B7280] block">
                  Archival master files
                </span>
              </div>
            </button>

            {/* Card 7: Studio Shop & Editions Card */}
            <button
              type="button"
              onClick={() => setActiveView('shop')}
              className={`snap-center shrink-0 w-[180px] sm:w-[190px] lg:w-auto bg-white dark:bg-white text-[#111114] rounded-2xl p-4 shadow-md border border-white/80 flex flex-col justify-between text-left transition-transform duration-300 hover:-translate-y-1 cursor-pointer min-h-[185px] ${arcTransforms[6]}`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#F4F5F7] dark:bg-[#F4F5F7] text-[#0284C7] flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-bold text-sm text-[#111114] block">
                  Studio Editions
                </span>
                <span className="text-[11px] text-[#6B7280] block leading-snug">
                  Templates, kits &amp; exhibition prints
                </span>
              </div>
            </button>
          </div>

          {/* Grounded Trust Caption Above Cloud Horizon */}
          <div className="pt-2 text-center">
            <p className="text-xs font-medium text-[#111114]/80 inline-flex items-center justify-center gap-2 bg-white/75 dark:bg-white/85 backdrop-blur-xs px-4 py-1.5 rounded-full shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
              <span>Directed personally by {studioProfile.designerName} · Real-time client workspace</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
