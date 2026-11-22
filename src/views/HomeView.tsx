import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight,
  ArrowUpRight,
  Layers,
  Eye,
  Heart,
  MapPin,
  Clock,
  Sparkles,
  PenTool,
  Palette,
  FileCheck,
  Send,
  Frame,
  BookOpen,
} from 'lucide-react';
import { ParallaxHero } from '../components/ParallaxHero';
import { ScrollReveal, ScrollParallaxLayer } from '../components/ScrollMotion';
import { ArtworkHoverWave } from '../components/ArtworkHoverWave';
import { getProjectLikes, getProjectViews } from '../lib/portfolio';
import studioBentoSky from '../assets/images/studio_bento_sky_1794752481393.jpg';
import heroSkyClouds from '../assets/images/hero_sky_clouds_1794752480825.jpg';

export const HomeView: React.FC = () => {
  const {
    portfolio,
    services,
    studioProfile,
    setActiveView,
    setPreselectedService,
    openCaseStudy,
  } = useApp();

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [avatarFailed, setAvatarFailed] = useState(false);

  const explicitFeatured = portfolio.filter((p) => p.featured);
  const featuredPortfolio = explicitFeatured.length > 0 ? explicitFeatured.slice(0, 3) : portfolio.slice(0, 3);
  const featuredServices = services.slice(0, 4);

  const designerInitials =
    (studioProfile.designerName || 'BC')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'BC';

  const commissionAvailabilityLabel =
    studioProfile.commissionStatus === 'open'
      ? 'Accepting Commissions'
      : studioProfile.commissionStatus === 'waitlist'
        ? 'Waitlist Active'
        : 'Queue Currently Full';

  const disciplines = [
    { label: 'Brand Systems', icon: Sparkles },
    { label: 'Poster & Key Art', icon: Frame },
    { label: 'Vector Marks', icon: PenTool },
    { label: 'Illustration', icon: Palette },
    { label: 'Book & Vinyl', icon: BookOpen },
    { label: 'Visual Kits', icon: Layers },
  ];

  const processStages = [
    {
      step: '01',
      title: 'Consultation & Brief',
      desc: 'Submit your creative parameters, dimensions, references, and deadlines through the studio intake.',
      detail: 'Scope Intake',
    },
    {
      step: '02',
      title: 'Scope Alignment & Deposit',
      desc: 'Connect in the client workspace to confirm deliverables, secure the 50% deposit, and lock your slot.',
      detail: '50% Reservation',
    },
    {
      step: '03',
      title: 'Craft & Proof Review',
      desc: 'Track live milestone progression from initial concepts to high-resolution proofing and revisions.',
      detail: 'Live Proofs',
    },
    {
      step: '04',
      title: 'Archival Master Delivery',
      desc: 'Download scalable vector AI/SVG, 300 DPI print-ready PDFs, and layered source packages securely.',
      detail: 'Master Files',
    },
  ];

  const handleRequestService = (serviceName: string) => {
    setPreselectedService(serviceName);
    setActiveView('commission-form');
  };

  return (
    <div className="bg-canvas min-h-screen pb-16 sm:pb-24">
      {/* 1. RADIANT SKY-BLUE HERO + 3D PERSPECTIVE ARC */}
      <ParallaxHero />

      {/* 2. STUDIO DISCIPLINES CONTINUOUS LEFTWARD MARQUEE STRIP */}
      <div
        className="marquee-container relative overflow-hidden border-b border-hairline py-7 sm:py-9 mt-6 sm:mt-8 select-none"
        aria-label="Studio design disciplines"
      >
        {/* Soft Canvas Edge Fades (Light & Dark Mode Synced) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-14 sm:w-28 bg-gradient-to-r from-canvas via-canvas/80 to-transparent z-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-14 sm:w-28 bg-gradient-to-l from-canvas via-canvas/80 to-transparent z-10"
        />

        {/* Dual Identical Track Halves for Seamless -50% Loop */}
        <div className="animate-marquee-left items-center">
          {[0, 1].map((halfIndex) => (
            <div
              key={halfIndex}
              aria-hidden={halfIndex === 1 || undefined}
              className="flex items-center shrink-0 gap-10 sm:gap-16 pr-10 sm:pr-16"
            >
              {[0, 1].map((repeatIndex) =>
                disciplines.map(({ label, icon: Icon }) => {
                  const isClone = halfIndex === 1 || repeatIndex === 1;
                  return (
                    <button
                      key={`${halfIndex}-${repeatIndex}-${label}`}
                      type="button"
                      tabIndex={isClone ? -1 : 0}
                      aria-hidden={isClone || undefined}
                      onClick={() => setActiveView('services')}
                      className="flex items-center justify-center gap-2.5 text-graphite hover:text-carbon transition-colors py-1.5 cursor-pointer group shrink-0 whitespace-nowrap focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded-lg px-2"
                    >
                      <Icon className="w-4 h-4 text-graphite group-hover:text-accent transition-colors shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap">
                        {label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-20 sm:space-y-28 pt-14 sm:pt-20">
        {/* 3. ABOUT DESTALION & ASYMMETRIC BENTO PROOF GRID */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14">
          <ScrollReveal className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-carbon leading-[1.15] text-balance">
              A multidisciplinary design studio dedicated to building{' '}
              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#38BDF8] text-white align-middle mx-1 shadow-xs">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>{' '}
              sharper{' '}
              <span className="text-[#8E939E] dark:text-[#71717A] font-medium">
                and{' '}
                <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D4FF38] text-[#111114] align-middle mx-1 shadow-xs">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>{' '}
                more enduring brands
              </span>
            </h2>
          </ScrollReveal>

          {/* 3-Column Bento Grid Matching Reference Template */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            {/* Left Photo Bento Card */}
            <ScrollReveal delay={0} className="h-full">
              <div className="relative rounded-3xl overflow-hidden min-h-[340px] h-full flex flex-col justify-between p-5 bg-[#0284C7] shadow-sm group">
                <ScrollParallaxLayer offset={22} className="absolute inset-0 pointer-events-none">
                  <img
                    src={studioBentoSky}
                    alt="DESTALION geometric visual identity study against clear azure sky"
                    className="w-full h-full object-cover scale-[1.14] group-hover:scale-[1.17] motion-reduce:transform-none transition-transform duration-500"
                  />
                </ScrollParallaxLayer>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="font-display font-bold text-sm tracking-wider uppercase text-white drop-shadow-xs">
                    {studioProfile.studioName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveView('portfolio')}
                    aria-label="Inspect portfolio archive"
                    className="w-9 h-9 rounded-xl bg-white dark:bg-white text-[#111114] hover:bg-[#D4FF38] flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative z-10 bg-surface text-carbon rounded-2xl p-5 shadow-md space-y-2 border border-hairline/40">
                  <span className="font-display text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums block">
                    {services.length}+
                  </span>
                  <p className="text-xs text-graphite-strong leading-relaxed">
                    Specialized visual craft disciplines tailored for ambitious creators and indie studios.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Middle Neutral Proof & Studio Philosophy Card */}
            <ScrollReveal delay={0.09} className="h-full">
              <div className="rounded-3xl bg-surface-secondary border border-hairline p-6 sm:p-7 flex flex-col justify-between min-h-[340px] h-full space-y-6">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-graphite-strong block">
                    Commitment to archival craft
                  </span>
                  <span className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-carbon tabular-nums block">
                    100%
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center -space-x-2">
                    {[
                      { icon: PenTool, bg: 'bg-[#0284C7] text-white' },
                      { icon: Layers, bg: 'bg-[#111114] text-white' },
                      { icon: Palette, bg: 'bg-[#D4FF38] text-[#111114]' },
                      { icon: FileCheck, bg: 'bg-white dark:bg-white text-[#111114] border border-hairline' },
                    ].map(({ icon: BadgeIcon, bg }, i) => (
                      <div
                        key={i}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-surface-secondary ${bg}`}
                      >
                        <BadgeIcon className="w-4 h-4" />
                      </div>
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-carbon leading-relaxed font-medium">
                    “{studioProfile.bio}”
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Expanded Column: Full-Height Acid Lime Milestone Card */}
            <ScrollReveal delay={0.18} className="h-full">
              <button
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="w-full h-full rounded-3xl bg-[#D4FF38] hover:bg-[#C8F528] text-[#111114] p-6 sm:p-7 flex flex-col justify-between text-left transition-colors cursor-pointer group min-h-[340px] space-y-6"
              >
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[#111114]/80">
                      Milestone Workflow
                    </span>
                    <span className="w-9 h-9 rounded-full bg-[#111114] text-white flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                  <span className="font-display text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums block">
                    8 Stages
                  </span>
                </div>

                <div className="space-y-4 w-full">
                  <p className="text-xs sm:text-sm text-[#111114]/85 leading-relaxed font-medium">
                    Structured progression from brief intake and deposit confirmation to interactive proof reviews and final exports.
                  </p>
                  <div className="pt-4 border-t border-[#111114]/15 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#111114]">
                    <span>Start a Commission</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            </ScrollReveal>
          </div>
        </section>

        {/* 4. SELECTED WORKS & CASE STUDIES */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-hairline pb-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-carbon tracking-tight">
                Exhibition Archive &amp; Case Studies
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-surface-secondary hover:bg-surface text-carbon text-xs font-semibold transition-all border border-hairline flex items-center justify-center gap-2 cursor-pointer btn-tactile min-h-[44px] tabular-nums"
            >
              <span>Explore Complete Catalog ({portfolio.length})</span>
              <ArrowRight className="w-4 h-4 text-accent" />
            </button>
          </ScrollReveal>

          {featuredPortfolio.length > 0 ? (
            <div className="space-y-6">
              {featuredPortfolio.map((project, idx) => {
                const projectLikes = getProjectLikes(project);
                const projectViews = getProjectViews(project);
                const isFirst = idx === 0;
                const isClient = project.projectType === 'client';
                const clientLabel = isClient ? project.client || 'Client Commission' : 'Studio Concept';
                const hasValidImage = Boolean(project.image && project.image.trim() && !failedImages[project.id]);

                return (
                  <ScrollReveal
                    key={project.id}
                    delay={Math.min(idx * 0.08, 0.24)}
                    y={32}
                    scale={0.985}
                  >
                    <article
                      className={`rounded-3xl p-6 sm:p-8 lg:p-10 border transition-all duration-200 ${
                        isFirst
                          ? 'bg-[#111114] dark:bg-[#12141C] text-white border-[#1F2330]'
                          : 'bg-surface-secondary text-carbon border-hairline'
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-5 space-y-4">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                            <span className={isFirst ? 'text-[#D4FF38]' : 'text-accent'}>
                              0{idx + 1} · {project.category}
                            </span>
                            <span aria-hidden="true" className="opacity-40">·</span>
                            <span className={isFirst ? 'text-white/70' : 'text-graphite'}>
                              {clientLabel} · {project.date}
                            </span>
                          </div>

                          <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-snug">
                            {project.title}
                          </h3>

                          <p className={`text-sm leading-relaxed ${isFirst ? 'text-white/75' : 'text-graphite-strong'}`}>
                            {project.shortDesc}
                          </p>

                          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                            <button
                              type="button"
                              onClick={() => openCaseStudy(project)}
                              className={`pl-4 pr-2 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2.5 transition-all cursor-pointer ${
                                isFirst
                                  ? 'bg-[#D4FF38] hover:bg-[#C6F426] text-[#111114]'
                                  : 'bg-[#111114] dark:bg-white text-white dark:text-[#111114] hover:opacity-90'
                              }`}
                            >
                              <span>View Case Study</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>

                            <div className={`flex items-center gap-3 text-xs tabular-nums ${isFirst ? 'text-white/70' : 'text-graphite'}`}>
                              <span className="inline-flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                                <span>{projectLikes.toLocaleString()}</span>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{projectViews.toLocaleString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-7">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openCaseStudy(project)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openCaseStudy(project);
                              }
                            }}
                            aria-label={`Inspect case study: ${project.title}`}
                            className="relative overflow-hidden rounded-2xl aspect-[16/10] bg-[#0B0D12] cursor-pointer group border border-white/10 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {hasValidImage ? (
                              <>
                                <ScrollParallaxLayer offset={18} className="w-full h-full">
                                  <img
                                    src={project.image}
                                    alt={project.title}
                                    loading="eager"
                                    decoding="async"
                                    onError={() => setFailedImages((prev) => ({ ...prev, [project.id]: true }))}
                                    className="w-full h-full object-cover scale-[1.1] group-hover:scale-[1.13] motion-reduce:transform-none transition-transform duration-500"
                                  />
                                </ScrollParallaxLayer>
                                <ArtworkHoverWave className="z-10" />
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                                <Layers className="w-7 h-7 text-[#38BDF8] opacity-80" />
                                <span className="font-display font-bold text-lg">{project.title}</span>
                                <span className="text-xs text-white/60">
                                  {project.category} · {project.date}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          ) : (
            <ScrollReveal>
              <div className="bg-surface-secondary border border-hairline rounded-3xl p-10 text-center space-y-3 max-w-xl mx-auto">
                <Layers className="w-8 h-8 text-accent mx-auto" />
                <h3 className="font-display text-lg font-bold text-carbon">Catalog In Curation</h3>
                <p className="text-xs sm:text-sm text-graphite-strong">
                  Studio exhibition pieces are actively being updated. Explore services or submit a custom commission brief below.
                </p>
              </div>
            </ScrollReveal>
          )}
        </section>

        {/* 5. CAPABILITIES, SERVICES & STUDIO LEAD */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-hairline pb-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-carbon tracking-tight">
                Studio Services &amp; Starting Rates
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('services')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-surface-secondary hover:bg-surface text-carbon text-xs font-semibold transition-all border border-hairline flex items-center justify-center gap-2 cursor-pointer btn-tactile min-h-[44px]"
            >
              <span>All Services &amp; Pricing ({services.length})</span>
              <ArrowRight className="w-4 h-4 text-accent" />
            </button>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Lead Designer Card */}
            <ScrollReveal className="lg:col-span-5 h-full">
              <div className="h-full bg-surface-secondary border border-hairline rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-hairline">
                    <span className="text-[11px] uppercase tracking-widest text-accent font-semibold">
                      Studio Director
                    </span>
                    <span
                      className={`text-[11px] uppercase tracking-wider font-semibold tabular-nums ${
                        studioProfile.commissionStatus === 'open'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {commissionAvailabilityLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {studioProfile.avatar && !avatarFailed ? (
                      <img
                        src={studioProfile.avatar}
                        alt={studioProfile.designerName}
                        onError={() => setAvatarFailed(true)}
                        className="w-16 h-16 rounded-2xl object-cover border border-hairline shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-surface border border-hairline flex items-center justify-center font-display font-bold text-xl text-carbon shrink-0">
                        {designerInitials}
                      </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="font-display font-bold text-xl text-carbon truncate">
                        {studioProfile.designerName}
                      </h3>
                      <p className="text-xs text-accent font-semibold truncate">
                        {studioProfile.title}
                      </p>
                      <p className="text-xs text-graphite flex items-center gap-1.5 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="truncate">{studioProfile.location}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed">
                    {studioProfile.bio}
                  </p>

                  <div className="pt-1 space-y-2">
                    <span className="text-[11px] uppercase tracking-widest text-graphite font-semibold block">
                      Proficient in:
                    </span>
                    <div
                      aria-label="Software used: Adobe Illustrator, Adobe Lightroom, Adobe Photoshop, Figma, and Affinity"
                      title="Adobe Illustrator · Adobe Lightroom · Adobe Photoshop · Figma · Affinity"
                      className="inline-flex items-center px-3 py-2 rounded-2xl bg-surface border border-hairline shadow-2xs"
                    >
                      <img
                        src="/assets/aistudio/image_a69e1370.png"
                        alt="Adobe Illustrator, Adobe Lightroom, Adobe Photoshop, Figma, and Affinity"
                        className="h-7 sm:h-8 w-auto object-contain select-none"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-graphite">
                    Direct Artist Collaboration
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveView('commission-form')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111114] dark:bg-white text-white dark:text-[#111114] text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <span>Book Slot</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* Services Index */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredServices.map((service, index) => (
                <ScrollReveal
                  key={service.id}
                  delay={index * 0.07}
                  className="h-full"
                >
                  <div className="h-full bg-surface border border-hairline hover:border-accent/40 rounded-3xl p-6 flex flex-col justify-between gap-4 transition-colors shadow-2xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                        <span className="text-accent font-bold tabular-nums">0{index + 1} · {service.category}</span>
                        <span className="text-graphite inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{service.turnaround}</span>
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-carbon">
                        {service.name}
                      </h3>
                      <p className="text-xs text-graphite-strong leading-relaxed line-clamp-2">
                        {service.shortDesc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-hairline flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-base text-carbon tabular-nums">
                        {studioProfile.currencySymbol}{service.startingPrice.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRequestService(service.name)}
                        className="px-3.5 py-1.5 rounded-full bg-surface-secondary hover:bg-[#D4FF38] hover:text-[#111114] text-carbon text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Request
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* 6. COMMISSION PROCESS STEPS */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <ScrollReveal className="border-b border-hairline pb-6">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-carbon tracking-tight">
              The Commission Journey
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {processStages.map((step, i) => (
              <ScrollReveal key={step.step} delay={i * 0.08} className="h-full">
                <div
                  className={`h-full rounded-3xl p-6 flex flex-col justify-between space-y-6 border ${
                    i === 2
                      ? 'bg-[#D4FF38] text-[#111114] border-transparent'
                      : i === 3
                        ? 'bg-[#111114] dark:bg-[#161922] text-white border-[#1F2330]'
                        : 'bg-surface-secondary text-carbon border-hairline'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                      <span className="tabular-nums opacity-75">Stage {step.step}</span>
                      <span className="opacity-75">{step.detail}</span>
                    </div>
                    <h3 className="font-display font-bold text-lg leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed opacity-85">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* 7. CLOSING RADIANT SKY CTA FIELD */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal y={32} scale={0.975}>
            <div className="relative rounded-[28px] sm:rounded-[36px] p-10 sm:p-16 lg:p-20 shadow-lg overflow-hidden hero-sky-gradient text-white">
              <ScrollParallaxLayer offset={26} className="absolute inset-0 pointer-events-none">
                <img
                  src={heroSkyClouds}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover object-bottom scale-[1.15] opacity-60 pointer-events-none"
                />
              </ScrollParallaxLayer>
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, rgba(2, 107, 181, 0.85) 0%, rgba(14, 165, 233, 0.55) 100%)',
                }}
              />

              <div className="relative z-10 space-y-5 max-w-2xl mx-auto">
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight text-balance">
                  Make noise. Make meaning.{' '}
                  <span className="block font-light text-white/90">
                    Start your next visual identity.
                  </span>
                </h2>

                <p className="text-sm sm:text-base text-white/90 max-w-lg mx-auto leading-relaxed">
                  Reserve your production slot today. Submit your brief, align directly on deliverables, and track milestone reviews in real-time.
                </p>

                <div className="pt-2">
                  <button
                    id="cta-btn-start-commission"
                    type="button"
                    onClick={() => setActiveView('commission-form')}
                    className="pl-6 pr-2 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C6F426] text-[#111114] font-bold text-xs uppercase tracking-wider transition-all shadow-lg inline-flex items-center gap-3 cursor-pointer btn-tactile min-h-[48px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#111114]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Start a Commission</span>
                    <span className="w-8 h-8 rounded-full bg-[#111114] text-white flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </div>
    </div>
  );
};
