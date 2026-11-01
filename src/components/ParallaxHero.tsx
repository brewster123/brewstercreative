import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react';

export const ParallaxHero: React.FC = () => {
  const { setActiveView } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const sunburstRef = useRef<HTMLDivElement>(null);
  const halftoneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const illustrationRef = useRef<HTMLDivElement>(null);

  // Mouse tilt offsets for foreground illustration
  const mouseOffset = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [canHover, setCanHover] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Detect reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Detect true pointer/mouse hover capability
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setCanHover(hoverQuery.matches);

    const handleHoverChange = (e: MediaQueryListEvent) => {
      setCanHover(e.matches);
    };
    hoverQuery.addEventListener('change', handleHoverChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      hoverQuery.removeEventListener('change', handleHoverChange);
    };
  }, []);

  // Performance-optimized scroll and mouse parallax loop via requestAnimationFrame
  useEffect(() => {
    let animationFrameId: number;
    let isTicking = false;

    const updateTransforms = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const heroHeight = rect.height || 800;
      // Scroll progression relative to hero container
      const scrollY = Math.max(0, -rect.top);

      if (scrollY <= heroHeight + 200) {
        if (!prefersReducedMotion) {
          // Layer A: Background (0.10x movement)
          if (bgRef.current) {
            bgRef.current.style.transform = `translate3d(0, ${scrollY * 0.1}px, 0)`;
          }

          // Layer B: Sunburst Rays (0.30x movement + subtle scale)
          if (sunburstRef.current) {
            const scale = 1 + (scrollY / heroHeight) * 0.08;
            sunburstRef.current.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0) scale(${scale})`;
          }

          // Layer C: Halftone & Grain (0.15x movement to maintain tactile link)
          if (halftoneRef.current) {
            halftoneRef.current.style.transform = `translate3d(0, ${scrollY * 0.15}px, 0)`;
          }

          // Layer D: Hero Typography (0.60x movement)
          if (contentRef.current) {
            contentRef.current.style.transform = `translate3d(0, ${scrollY * 0.6}px, 0)`;
            // Subtle fade-out as user scrolls past 70% of hero height
            const opacity = Math.max(0, 1 - (scrollY / (heroHeight * 0.85)));
            contentRef.current.style.opacity = `${opacity}`;
          }

          // Layer E: Foreground Illustration (0.45x scroll + smooth mouse tilt)
          if (illustrationRef.current) {
            // Lerp mouse offset
            mouseOffset.current.x += (mouseOffset.current.targetX - mouseOffset.current.x) * 0.1;
            mouseOffset.current.y += (mouseOffset.current.targetY - mouseOffset.current.y) * 0.1;

            const scrollOffset = scrollY * 0.45;
            const tiltX = mouseOffset.current.x;
            const tiltY = mouseOffset.current.y;
            illustrationRef.current.style.transform = `translate3d(${tiltX}px, ${scrollOffset + tiltY}px, 0)`;
          }
        } else {
          // Reset styles when prefers-reduced-motion is enabled
          if (bgRef.current) bgRef.current.style.transform = 'none';
          if (sunburstRef.current) sunburstRef.current.style.transform = 'none';
          if (halftoneRef.current) halftoneRef.current.style.transform = 'none';
          if (contentRef.current) {
            contentRef.current.style.transform = 'none';
            contentRef.current.style.opacity = '1';
          }
          if (illustrationRef.current) illustrationRef.current.style.transform = 'none';
        }
      }

      // Continue animation loop if mouse has inertia or during active scroll
      if (
        Math.abs(mouseOffset.current.targetX - mouseOffset.current.x) > 0.05 ||
        Math.abs(mouseOffset.current.targetY - mouseOffset.current.y) > 0.05
      ) {
        animationFrameId = requestAnimationFrame(updateTransforms);
      } else {
        isTicking = false;
      }
    };

    const handleScroll = () => {
      if (!isTicking) {
        isTicking = true;
        animationFrameId = requestAnimationFrame(updateTransforms);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial run
    updateTransforms();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  // Pointer move handler with constrained delta (max ±12px)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canHover || prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const relY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

      mouseOffset.current.targetX = relX * 22; // max ±11px
      mouseOffset.current.targetY = relY * 22; // max ±11px
    },
    [canHover, prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    mouseOffset.current.targetX = 0;
    mouseOffset.current.targetY = 0;
  }, []);

  const scrollToNextSection = () => {
    if (containerRef.current) {
      const bottom = containerRef.current.offsetTop + containerRef.current.offsetHeight - 70;
      window.scrollTo({ top: bottom, behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[92vh] sm:min-h-[96vh] lg:min-h-[100vh] overflow-hidden bg-[#171311] text-[#F5EBCB] select-none flex flex-col justify-between"
      style={{
        // Isolate stacking context and prevent horizontal scroll
        contain: 'paint',
      }}
    >
      {/* ========================================================================= */}
      {/* LAYER A — DISTRESSED DEEP RED BACKGROUND (0.10x movement)                 */}
      {/* ========================================================================= */}
      <div
        ref={bgRef}
        aria-hidden="true"
        className="absolute -inset-x-0 -top-24 -bottom-32 pointer-events-none will-change-transform"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 75% 45%, #D62828 0%, #B91F20 40%, #7D1516 75%, #171311 100%)
          `,
        }}
      >
        {/* Subtle vintage paper fiber / fibrous distress texture */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(245, 235, 203, 0.15) 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* LAYER B — DRAMATIC VINTAGE SUNBURST RAYS (0.30x movement)                 */}
      {/* ========================================================================= */}
      <div
        ref={sunburstRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none will-change-transform flex items-center justify-end overflow-hidden"
      >
        <svg
          viewBox="0 0 1600 1200"
          className="w-[140%] sm:w-[130%] lg:w-[120%] h-auto max-w-none origin-[78%_48%] transform translate-x-12 sm:translate-x-20 lg:translate-x-32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g opacity="0.88">
            {/* Array of screen-printed radiating sunburst beams originating behind illustration */}
            {[
              // Angles radiating from (1180, 560)
              'M1180 560 L-300 -200 L-100 -400 Z',
              'M1180 560 L200 -400 L400 -400 Z',
              'M1180 560 L700 -400 L950 -400 Z',
              'M1180 560 L1250 -400 L1500 -350 Z',
              'M1180 560 L1800 -250 L2000 -100 Z',
              'M1180 560 L2100 150 L2100 350 Z',
              'M1180 560 L2100 550 L2100 750 Z',
              'M1180 560 L2100 950 L1950 1200 Z',
              'M1180 560 L1700 1400 L1450 1500 Z',
              'M1180 560 L1200 1550 L950 1550 Z',
              'M1180 560 L700 1550 L450 1500 Z',
              'M1180 560 L200 1450 L-50 1350 Z',
              'M1180 560 L-300 1150 L-400 900 Z',
              'M1180 560 L-450 650 L-450 400 Z',
              'M1180 560 L-400 150 L-350 -50 Z',
            ].map((d, index) => (
              <path
                key={index}
                d={d}
                fill={index % 2 === 0 ? '#F5EBCB' : '#F2E4BC'}
                opacity={index % 3 === 0 ? 0.38 : 0.28}
                style={{ mixBlendMode: 'screen' }}
              />
            ))}
          </g>

          {/* Concentric subtle screen-print register halos */}
          <circle cx="1180" cy="560" r="180" stroke="#F5EBCB" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.3" />
          <circle cx="1180" cy="560" r="340" stroke="#F5EBCB" strokeWidth="1" strokeDasharray="4 8" opacity="0.2" />
          <circle cx="1180" cy="560" r="520" stroke="#F5EBCB" strokeWidth="1" opacity="0.12" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* LAYER C — SCREEN-PRINT HALFTONE DOTS & VINTAGE GRAIN                      */}
      {/* ========================================================================= */}
      <div
        ref={halftoneRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none will-change-transform mix-blend-multiply opacity-55"
      >
        {/* Halftone Dot Matrix Pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, #171311 1.2px, transparent 1.6px)`,
            backgroundSize: '8px 8px',
            opacity: 0.45,
          }}
        />

        {/* Vintage noise and paper grain overlay */}
        <svg className="w-full h-full absolute inset-0 opacity-40">
          <filter id="heroDistressNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#heroDistressNoise)" />
        </svg>
      </div>

      {/* Inky Vignette Around Lower Edges for Dramatic Depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, rgba(23,19,17,0.4) 0%, transparent 25%, transparent 65%, rgba(23,19,17,0.92) 90%, #171311 100%),
            radial-gradient(ellipse at 15% 50%, rgba(23,19,17,0.45) 0%, transparent 60%)
          `,
        }}
      />

      {/* ========================================================================= */}
      {/* LAYER E — FOREGROUND ILLUSTRATION ARTWORK (0.45x movement + cursor tilt)  */}
      {/* ========================================================================= */}
      <div
        ref={illustrationRef}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-full lg:w-[58%] xl:w-[52%] h-[80%] max-h-[720px] pointer-events-none flex items-center justify-end pr-4 sm:pr-8 lg:pr-14 z-10 will-change-transform"
      >
        <div className="relative w-full max-w-[540px] aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-lg overflow-hidden shadow-2xl border border-[#F5EBCB]/20">
          {/* Distressed duotone treatment on poster focal point */}
          <div className="absolute inset-0 bg-[#B91F20] mix-blend-multiply opacity-60 z-10 pointer-events-none" />
          
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=85"
            alt="DESTALION Visual Artistry & Poster System Focal Illustration"
            className="w-full h-full object-cover object-center filter contrast-125 saturate-150"
            loading="eager"
            decoding="sync"
          />

          {/* Screen-print duotone gradient overlay for seamless sunburst blending */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background: `
                linear-gradient(135deg, rgba(234, 43, 11, 0.45) 0%, transparent 40%),
                linear-gradient(to top, #171311 0%, rgba(23, 19, 17, 0.6) 20%, transparent 60%),
                radial-gradient(circle at 80% 20%, rgba(245, 235, 203, 0.35) 0%, transparent 50%)
              `,
            }}
          />

          {/* Registration marks & editorial stamps (tactile print heritage) */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#F5EBCB]/90 bg-[#171311]/80 px-2.5 py-1 rounded border border-[#F5EBCB]/30 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-[#EA2B0B] animate-pulse" />
            <span>PRINT ARCHIVE · 2026</span>
          </div>

          <div className="absolute bottom-4 left-4 z-30 font-mono text-[9px] tracking-wider text-[#F5EBCB]/70 bg-[#171311]/85 px-2 py-0.5 rounded border border-[#F5EBCB]/20">
            SPEC ⌖ 300 DPI · SILKSCREEN POSTER
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER D — HERO TYPOGRAPHY & EDITORIAL CONTENT (0.60x movement)            */}
      {/* ========================================================================= */}
      <div
        ref={contentRef}
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 lg:pt-36 pb-12 sm:pb-16 flex-1 flex flex-col justify-center will-change-transform"
      >
        <div className="max-w-2xl lg:max-w-xl space-y-6 sm:space-y-8">
          
          {/* Small studio descriptor stamp */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#171311]/90 border border-[#F5EBCB]/30 shadow-md backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#EA2B0B]" />
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest font-bold text-[#F5EBCB]">
              EXPERIMENTAL MULTIMEDIA DESIGN STUDIO
            </span>
          </div>

          {/* Main Headline: MAKE NOISE. MAKE MEANING. */}
          <div className="space-y-0 tracking-tight">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase leading-[0.88] select-text"
              style={{
                fontFamily: `'Bebas Neue', 'Plus Jakarta Sans', sans-serif`,
                textShadow: `
                  2px 2px 0px #171311,
                  4px 4px 0px rgba(23, 19, 17, 0.7),
                  6px 6px 12px rgba(23, 19, 17, 0.8)
                `,
              }}
            >
              <span className="block text-[#F5EBCB] drop-shadow-sm">
                MAKE NOISE.
              </span>
              <span
                className="block text-[#EA2B0B]"
                style={{
                  textShadow: `
                    2px 2px 0px #171311,
                    4px 4px 0px rgba(23, 19, 17, 0.9)
                  `,
                }}
              >
                MAKE MEANING.
              </span>
            </h1>
          </div>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-[#F5EBCB]/90 font-normal leading-relaxed max-w-lg select-text font-sans">
            Experimental design. Bold visuals. Creative solutions. Let's turn ideas into something unforgettable.
          </p>

          {/* Primary CTA & Actions */}
          <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-4">
            <button
              id="hero-cta-start-commission"
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="px-7 sm:px-8 py-3.5 sm:py-4 rounded-md bg-[#EA2B0B] hover:bg-[#D42205] active:bg-[#B91F20] text-[#F5EBCB] font-mono text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-102 active:scale-98 flex items-center gap-3 cursor-pointer border border-[#F5EBCB]/30 min-h-[50px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#F5EBCB]"
            >
              <span>START A COMMISSION</span>
              <ArrowRight className="w-4 h-4 text-[#F5EBCB]" />
            </button>

            <button
              id="hero-cta-explore-portfolio"
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="px-6 py-3.5 sm:py-4 rounded-md bg-[#171311]/80 hover:bg-[#171311] text-[#F5EBCB] font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all border border-[#F5EBCB]/25 hover:border-[#F5EBCB]/50 min-h-[50px] cursor-pointer backdrop-blur-xs flex items-center gap-2"
            >
              <span>EXPLORE WORKS</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCROLL INDICATOR & CINEMATIC TRANSITION AT BOTTOM                          */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={scrollToNextSection}
          aria-label="Scroll to explore curated works"
          className="group flex flex-col items-center gap-1.5 text-[#F5EBCB]/70 hover:text-[#F5EBCB] transition-colors cursor-pointer focus:outline-hidden"
        >
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest font-bold">
            SCROLL TO EXPLORE
          </span>
          <ChevronDown className="w-4 h-4 text-[#EA2B0B] group-hover:translate-y-1 transition-transform animate-bounce" />
        </button>
      </div>

      {/* Seamless inky bottom transition into following section */}
      <div
        aria-hidden="true"
        className="absolute -bottom-1 inset-x-0 h-16 sm:h-24 pointer-events-none z-20"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, #171311 80%, var(--bg-canvas) 100%)`,
        }}
      />
    </div>
  );
};
