import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  ArrowRight, 
  Layers, 
  Eye,
  Heart
} from 'lucide-react';
import { PortfolioModal } from '../components/PortfolioModal';
import { ParallaxHero } from '../components/ParallaxHero';
import { getProjectLikes, getProjectViews } from '../lib/portfolio';

export const HomeView: React.FC = () => {
  const { 
    portfolio, 
    setActiveView, 
    selectedPortfolioProject, 
    setSelectedPortfolioProject,
    openCaseStudy,
  } = useApp();

  const explicitFeatured = portfolio.filter(p => p.featured);
  const featuredPortfolio = explicitFeatured.length > 0 ? explicitFeatured.slice(0, 3) : portfolio.slice(0, 3);

  // Creative process stages matching design specification
  const processStages = [
    {
      step: '01',
      title: 'Consultation & Brief',
      desc: 'Submit your creative parameters, dimensions, moodboard references, and deadlines through the studio intake.',
      detail: 'Online Briefing & Alignment'
    },
    {
      step: '02',
      title: 'Scope Alignment & Deposit',
      desc: 'Connect in the real-time client workspace to finalize deliverables, secure the 50% deposit, and reserve your production slot.',
      detail: '50% Secured Reservation'
    },
    {
      step: '03',
      title: 'Design Craft & Proof Review',
      desc: 'Track live milestone progression from concept development to high-resolution proofing with dedicated revision rounds.',
      detail: 'Iterative Milestone Reviews'
    },
    {
      step: '04',
      title: 'Archival Master Delivery',
      desc: 'Receive master production files (scalable vector AI/SVG, 300 DPI print-ready PDFs, layered source packages) with commercial rights.',
      detail: 'Archival Master Packages'
    },
  ];

  const defaultProjectImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80';

  return (
    <div className="bg-notebook-ruled min-h-screen pb-20 sm:pb-28">
      {/* ======================================================== */}
      {/* 1. CINEMATIC PARALLAX VINTAGE SUNBURST HERO               */}
      {/* ======================================================== */}
      <ParallaxHero />

      <div className="space-y-16 sm:space-y-24 lg:space-y-32 pt-12 sm:pt-20">
        {/* ======================================================== */}
        {/* 2. SELECTED WORKS (Folder-Tab Editorial Presentation)     */}
        {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-10 sm:space-y-14">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E4E2DC] dark:border-[#222225] pb-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-handwriting text-2xl text-[#EA580C]">curated works</span>
                <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
                  · Case Studies &amp; Concept Archives
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                Selected Works &amp; Explorations
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#222225] text-[#18181B] dark:text-[#EDEDEC] text-xs sm:text-sm font-semibold transition-all border border-[#E4E2DC] dark:border-[#333338] shadow-2xs flex items-center justify-center gap-2 cursor-pointer btn-tactile min-h-[44px]"
            >
              <span>Explore Complete Catalog ({portfolio.length})</span>
              <ArrowRight className="w-4 h-4 text-[#EA580C]" />
            </button>
          </div>

          {/* Folder Tabbed Projects Stack (Inspired by Reference Screenshot) */}
          {featuredPortfolio.length > 0 ? (
            <div className="space-y-12 sm:space-y-16">
              {featuredPortfolio.map((project, idx) => {
                const projectLikes = getProjectLikes(project);
                const projectViews = getProjectViews(project);
                const isFirst = idx === 0;
                const isSecond = idx === 1;

                // Alternate between folder color blocks (Charcoal, Amber, Terracotta)
                const folderTabBg = isFirst 
                  ? 'bg-[#2563EB] text-white' 
                  : isSecond 
                    ? 'bg-[#F59E0B] text-zinc-950 font-bold' 
                    : 'bg-[#EA580C] text-white';

                const cardBg = isFirst
                  ? 'bg-[#121214] text-white border-[#27272A]'
                  : isSecond
                    ? 'bg-[#FEF3C7] dark:bg-[#291E0A] text-zinc-900 dark:text-amber-50 border-[#FDE68A] dark:border-[#92400E]'
                    : 'bg-white dark:bg-[#18181B] text-zinc-900 dark:text-[#EDEDEC] border-[#E4E2DC] dark:border-[#27272A]';

                const isClient = project.projectType === 'client';
                const clientLabel = isClient ? (project.client || 'Client Commission') : 'Studio Concept';

                return (
                  <article 
                    key={project.id}
                    className="relative transition-all duration-300"
                  >
                    {/* Notched Folder Tab on Top */}
                    <div className="flex items-center gap-2">
                      <div className={`notched-tab px-5 py-2 text-xs font-mono font-bold tracking-wider uppercase inline-flex items-center gap-2 shadow-xs ${folderTabBg}`}>
                        <span>+ PROJECT 0{idx + 1}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider pl-2">
                        {project.category}
                      </span>
                    </div>

                    {/* Main Folder Card Body */}
                    <div className={`rounded-xl rounded-tl-none p-6 sm:p-10 lg:p-12 border shadow-md ${cardBg}`}>
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
                        
                        {/* Left Side: Metadata, Title, Description, and View Action */}
                        <div className="lg:col-span-5 space-y-5">
                          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                            <span className="opacity-80 font-semibold">{project.date}</span>
                            <span aria-hidden="true" className="opacity-40">·</span>
                            <span className={isClient ? 'text-emerald-500 font-bold' : 'text-amber-500 dark:text-amber-400 font-bold'}>
                              {clientLabel}
                            </span>
                          </div>

                          <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                            {project.title}
                          </h3>

                          <p className="text-xs sm:text-sm lg:text-base opacity-85 leading-relaxed font-normal">
                            {project.shortDesc}
                          </p>

                          <div className="pt-2 flex flex-wrap items-center gap-4">
                            <button
                              type="button"
                              onClick={() => openCaseStudy(project)}
                              className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm font-bold tracking-wider uppercase underline underline-offset-4 hover:text-[#EA580C] transition-colors cursor-pointer"
                            >
                              <span>VIEW PROJECT</span>
                              <ArrowRight className="w-4 h-4 text-[#EA580C]" />
                            </button>

                            <div className="flex items-center gap-3 text-xs font-mono opacity-70">
                              <span className="inline-flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                                <span>{projectLikes}</span>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{projectViews}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Mounted Artwork Frame with Translucent Washi Tape */}
                        <div className="lg:col-span-7">
                          <div 
                            onClick={() => openCaseStudy(project)}
                            className="relative cursor-pointer group bg-zinc-950/20 p-2 sm:p-3 rounded-lg border border-black/10 dark:border-white/10 shadow-lg"
                          >
                            {/* Washi Tape: Top-Left */}
                            <div className="absolute -top-3.5 -left-3.5 w-16 h-6 bg-[#FEF08A]/85 dark:bg-[#CA8A04]/60 -rotate-12 border border-white/60 shadow-xs z-20 pointer-events-none" />
                            {/* Washi Tape: Top-Right */}
                            <div className="absolute -top-3.5 -right-3.5 w-16 h-6 bg-[#BAE6FD]/85 dark:bg-[#0369A1]/60 rotate-15 border border-white/60 shadow-xs z-20 pointer-events-none" />

                            <div className="overflow-hidden rounded-md aspect-[16/10] bg-black">
                              <img
                                src={project.image || defaultProjectImage}
                                alt={project.title}
                                loading="eager"
                                decoding="async"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.src !== defaultProjectImage) target.src = defaultProjectImage;
                                }}
                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto">
              <Layers className="w-8 h-8 text-[#EA580C] mx-auto" />
              <h3 className="font-display text-lg font-bold">Catalog In Curation</h3>
              <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
                Studio exhibition pieces are actively being updated.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. COMMISSION JOURNEY (Spatial Notebook Progression)     */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 sm:space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E4E2DC] dark:border-[#222225] pb-6">
            <div className="space-y-2 max-w-xl">
              <span className="font-handwriting text-2xl text-[#EA580C]">the process</span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                The Commission Journey
              </h2>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Transparent, deliberate, and monitored directly in your dedicated client workspace from initial inquiry to final handoff.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processStages.map((step, i) => (
              <div
                key={i}
                className="relative bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs space-y-6 hover:shadow-xs transition-all"
              >
                {/* Washi tape on first and third cards */}
                {(i === 0 || i === 2) && (
                  <div className="absolute -top-2.5 right-6 w-12 h-4 bg-[#FDE68A]/80 dark:bg-[#78350F]/50 rotate-3 border border-white/40 pointer-events-none" />
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#222225]">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#EA580C] font-bold">
                      Stage {step.step}
                    </span>
                    <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Workspace Tracked
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC] leading-snug">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#222225] flex items-center justify-between text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  <span className="text-[#EA580C] font-semibold">{step.detail}</span>
                  <span>Milestone Stage</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. INITIATE COMMISSION (Bold Studio Callout Field)       */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-[#121214] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-14 lg:p-16 shadow-xl space-y-6 relative overflow-hidden border border-[#222225]">
          <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="font-handwriting text-2xl sm:text-3xl text-amber-300 block">
              let's collaborate
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#EDEDEC] tracking-tight leading-tight text-balance">
              Make noise. Make meaning.{' '}
              <span className="block sm:inline text-white/90">
                Let's build something enduring.
              </span>
            </h2>

            <p className="text-xs sm:text-sm sm:text-base text-[#A1A1AA] max-w-lg mx-auto leading-relaxed font-normal">
              Reserve your production slot today. Submit your creative brief, align directly on scope, and track milestone progression in real-time.
            </p>

            <div className="pt-4">
              <button
                id="cta-btn-start-commission"
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] active:bg-[#C23E0E] text-white font-semibold text-sm transition-all shadow-md inline-flex items-center justify-center gap-2.5 cursor-pointer btn-tactile min-h-[48px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
              >
                <Send className="w-4 h-4" />
                <span>Start a Commission</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Portfolio Detail Modal */}
      {selectedPortfolioProject && (
        <PortfolioModal
          project={selectedPortfolioProject}
          onClose={() => setSelectedPortfolioProject(null)}
        />
      )}

    </div>
  );
};
