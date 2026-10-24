import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Palette, 
  Compass, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { StudioDesignConfig } from '../../types';

interface PreviewSiteContentProps {
  config: StudioDesignConfig;
  previewMode: 'light' | 'dark';
}

/**
 * PreviewSiteContent
 * Renders real responsive website components inside the isolated preview frame.
 * Uses CSS variables mapped directly to the active draft token configuration.
 */
export const PreviewSiteContent: React.FC<PreviewSiteContentProps> = ({ config, previewMode }) => {
  const isDark = previewMode === 'dark';
  const colors = isDark ? config.dark : config.light;

  return (
    <div 
      className="w-full min-h-full transition-colors duration-200"
      style={{
        backgroundColor: colors.bgCanvas,
        color: colors.textPrimary,
        fontFamily: config.typography.fontFamily,
      }}
    >
      {/* 1. STUDIO NAVIGATION BAR */}
      <header 
        className="sticky top-0 z-30 border-b backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(18, 18, 20, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: colors.borderSubtle,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 flex items-center justify-center font-black text-sm tracking-tighter"
            style={{
              backgroundColor: colors.accent,
              color: '#FFFFFF',
              borderRadius: `${config.borders.radiusSm}px`,
            }}
          >
            D
          </div>
          <div className="flex flex-col">
            <span 
              className="font-bold tracking-tight text-sm uppercase"
              style={{
                fontFamily: config.typography.headingFontFamily,
                letterSpacing: config.typography.headingLetterSpacing,
              }}
            >
              DESTALION
            </span>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: colors.textMuted }}>
              Design Studio
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
          <span className="hover:opacity-80 transition-opacity cursor-pointer">Work</span>
          <span className="hover:opacity-80 transition-opacity cursor-pointer">Services</span>
          <span className="hover:opacity-80 transition-opacity cursor-pointer">Shop</span>
          <span className="hover:opacity-80 transition-opacity cursor-pointer">Atelier</span>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            style={{
              backgroundColor: colors.accent,
              color: '#FFFFFF',
              borderRadius: `${config.borders.radiusSm}px`,
            }}
          >
            <span>Commission</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section 
        className="px-6 md:px-12 border-b transition-all"
        style={{
          paddingTop: `${config.spacing.sectionPaddingY}px`,
          paddingBottom: `${config.spacing.sectionPaddingY}px`,
          borderColor: colors.borderSubtle,
        }}
      >
        <div 
          className="mx-auto flex flex-col items-start gap-6"
          style={{ maxWidth: `${config.maxContentWidthPx}px` }}
        >
          <div className="flex items-center gap-2">
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono uppercase tracking-wider font-semibold border"
              style={{
                backgroundColor: colors.bgSurfaceSecondary,
                borderColor: colors.borderSubtle,
                color: colors.accent,
                borderRadius: `${config.borders.radiusSm}px`,
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>Independent Multimedia Studio · 2026</span>
            </span>
          </div>

          <h1 
            className="font-black tracking-tight leading-[1.05]"
            style={{
              fontFamily: config.typography.headingFontFamily,
              letterSpacing: config.typography.headingLetterSpacing,
              fontSize: `clamp(2rem, 5vw, ${config.typography.baseFontSizePx * 3}px)`,
            }}
          >
            Make noise. <br />
            <span style={{ color: colors.accent }}>Make meaning.</span>
          </h1>

          <p 
            className="max-w-xl text-sm md:text-base leading-relaxed"
            style={{
              color: colors.textMuted,
              lineHeight: config.typography.bodyLineHeight,
            }}
          >
            DESTALION produces aggressive brand identities, experimental vector art, and high-precision digital systems for fearless ventures.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              style={{
                backgroundColor: colors.accent,
                color: '#FFFFFF',
                borderRadius: `${config.borders.radiusMd}px`,
              }}
            >
              Initiate Project
            </button>
            <button
              type="button"
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer"
              style={{
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                color: colors.textPrimary,
                borderRadius: `${config.borders.radiusMd}px`,
              }}
            >
              View Archive
            </button>
          </div>
        </div>
      </section>

      {/* 3. DISCIPLINES / SERVICES GRID */}
      <section 
        className="px-6 md:px-12 border-b transition-all"
        style={{
          paddingTop: `${Math.round(config.spacing.sectionPaddingY * 0.85)}px`,
          paddingBottom: `${Math.round(config.spacing.sectionPaddingY * 0.85)}px`,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.bgSurfaceSecondary,
        }}
      >
        <div 
          className="mx-auto space-y-8"
          style={{ maxWidth: `${config.maxContentWidthPx}px` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span 
                className="font-mono text-xs uppercase tracking-widest font-semibold block mb-1"
                style={{ color: colors.accent }}
              >
                Studio Capabilities
              </span>
              <h2 
                className="text-2xl font-bold tracking-tight"
                style={{
                  fontFamily: config.typography.headingFontFamily,
                  letterSpacing: config.typography.headingLetterSpacing,
                }}
              >
                Specialized Disciplines
              </h2>
            </div>
            <p className="text-xs max-w-sm" style={{ color: colors.textMuted }}>
              Production standards engineered for high-impact visual articulation.
            </p>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: `${config.spacing.gridGap}px` }}
          >
            {[
              {
                icon: Layers,
                number: '01',
                title: 'Brand Systems',
                desc: 'Complete vector identity ecosystems, typography hierarchies, and architectural guidelines.',
                tags: ['Logomarks', 'Typography', 'Color Systems'],
              },
              {
                icon: Palette,
                number: '02',
                title: 'Vector Art Direction',
                desc: 'Experimental high-precision key visuals, illustrative narratives, and brutalist packaging.',
                tags: ['Posters', 'Key Visuals', 'Print Production'],
              },
              {
                icon: Compass,
                number: '03',
                title: 'Digital Interfaces',
                desc: 'Responsive web experience architecture, modern front-end execution, and motion choreography.',
                tags: ['Web Design', 'UI Systems', 'Micro-Interactions'],
              },
            ].map((discipline) => {
              const Icon = discipline.icon;
              return (
                <div
                  key={discipline.number}
                  className="border p-6 flex flex-col justify-between space-y-6 transition-all"
                  style={{
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderSubtle,
                    borderRadius: `${config.borders.radiusLg}px`,
                    borderWidth: `${config.borders.borderWidth}px`,
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                          backgroundColor: colors.bgSurfaceSecondary,
                          color: colors.accent,
                          borderRadius: `${config.borders.radiusSm}px`,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-semibold" style={{ color: colors.textMuted }}>
                        {discipline.number}
                      </span>
                    </div>

                    <h3 
                      className="text-base font-bold"
                      style={{ fontFamily: config.typography.headingFontFamily }}
                    >
                      {discipline.title}
                    </h3>

                    <p 
                      className="text-xs leading-relaxed"
                      style={{ color: colors.textMuted, lineHeight: config.typography.bodyLineHeight }}
                    >
                      {discipline.desc}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: colors.borderSubtle }}>
                    {discipline.tags.map((t) => (
                      <span 
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: colors.bgSurfaceSecondary,
                          color: colors.textMuted,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SHOWCASE ARTWORK CARD */}
      <section 
        className="px-6 md:px-12 border-b transition-all"
        style={{
          paddingTop: `${Math.round(config.spacing.sectionPaddingY * 0.75)}px`,
          paddingBottom: `${Math.round(config.spacing.sectionPaddingY * 0.75)}px`,
          borderColor: colors.borderSubtle,
        }}
      >
        <div 
          className="mx-auto space-y-6"
          style={{ maxWidth: `${config.maxContentWidthPx}px` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest font-semibold block mb-0.5" style={{ color: colors.accent }}>
                Production Preview
              </span>
              <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: config.typography.headingFontFamily }}>
                Featured Studio Showcase
              </h2>
            </div>
            <span className="text-xs font-mono" style={{ color: colors.textMuted }}>
              Archive 2026
            </span>
          </div>

          <div 
            className="border overflow-hidden grid grid-cols-1 md:grid-cols-2"
            style={{
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderRadius: `${config.borders.radiusXl}px`,
              borderWidth: `${config.borders.borderWidth}px`,
            }}
          >
            <div 
              className="h-64 md:h-auto min-h-[260px] relative p-6 flex flex-col justify-end"
              style={{
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.bgSurfaceSecondary} 100%)`,
              }}
            >
              <div 
                className="absolute inset-4 rounded-lg border border-white/20 backdrop-blur-xs p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-white/90 text-xs font-mono">
                  <span>SPEC // 0048-A</span>
                  <span>DESTALION ATELIER</span>
                </div>
                <div className="text-white space-y-1">
                  <div className="text-xs uppercase tracking-widest opacity-80 font-mono">Experimental Vector Identity</div>
                  <div className="text-2xl font-black tracking-tight" style={{ fontFamily: config.typography.headingFontFamily }}>
                    SYNDICATE ATELIER
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider font-semibold"
                    style={{
                      backgroundColor: colors.bgSurfaceSecondary,
                      color: colors.accent,
                      borderRadius: `${config.borders.radiusSm}px`,
                    }}
                  >
                    Identity System
                  </span>
                  <span className="text-xs font-mono" style={{ color: colors.textMuted }}>
                    Release Q1 2026
                  </span>
                </div>

                <h3 
                  className="text-xl font-bold"
                  style={{ fontFamily: config.typography.headingFontFamily }}
                >
                  Aggressive Visual Synthesis
                </h3>

                <p 
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: colors.textMuted, lineHeight: config.typography.bodyLineHeight }}
                >
                  A modular editorial design language incorporating bespoke typography, deep dark canvas treatments, and razor-sharp geometric alignment.
                </p>

                <div className="space-y-2 pt-2">
                  {['Vector Source Master Package (.AI, .SVG, .PDF)', 'Custom Geometric Display Typeface', 'Commercial Production Rights Included'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: colors.accent }} />
                      <span style={{ color: colors.textPrimary }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: colors.borderSubtle }}>
                <span className="font-mono text-xs font-bold" style={{ color: colors.accent }}>
                  Full Case Study
                </span>
                <ExternalLink className="w-4 h-4 cursor-pointer hover:opacity-80" style={{ color: colors.textMuted }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STUDIO FOOTER */}
      <footer 
        className="px-6 md:px-12 py-10 transition-colors"
        style={{
          backgroundColor: colors.bgSurface,
          borderColor: colors.borderSubtle,
        }}
      >
        <div 
          className="mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{ maxWidth: `${config.maxContentWidthPx}px` }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight" style={{ fontFamily: config.typography.headingFontFamily }}>
                DESTALION STUDIO
              </span>
              <span className="text-xs font-mono" style={{ color: colors.textMuted }}>· Atelier V1</span>
            </div>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Make noise. Make meaning. Experimental multimedia design desk.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono" style={{ color: colors.textMuted }}>
            <span>Cebu / Manila — Remote Worldwide</span>
            <span>© 2026 DESTALION</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
