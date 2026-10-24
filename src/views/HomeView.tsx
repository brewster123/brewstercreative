import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { PortfolioCard } from '../components/PortfolioCard';
import { PortfolioModal } from '../components/PortfolioModal';

export const HomeView: React.FC = () => {
  const { 
    studioProfile, 
    portfolio, 
    setActiveView, 
    selectedPortfolioProject, 
    setSelectedPortfolioProject,
    openCaseStudy,
  } = useApp();

  const explicitFeatured = portfolio.filter(p => p.featured);
  const featuredPortfolio = explicitFeatured.length > 0 ? explicitFeatured.slice(0, 4) : portfolio.slice(0, 4);
  const featuredPiece = featuredPortfolio[0] || portfolio[0];

  // Creative process stages matching design specification
  const processStages = [
    {
      step: '01',
      title: 'Consultation & Brief',
      desc: 'Submit your project parameters, creative vision, target dimensions, reference moodboards, and deadline through the studio intake.',
    },
    {
      step: '02',
      title: 'Scope Alignment & Deposit',
      desc: 'Connect in the real-time client workspace to finalize deliverables, secure the 50% project deposit, and reserve your studio production slot.',
    },
    {
      step: '03',
      title: 'Design Craft & Proof Review',
      desc: 'Track live milestone progression from concept development to high-resolution proofing with dedicated revision rounds.',
    },
    {
      step: '04',
      title: 'Archival Master Delivery',
      desc: 'Receive master production files (scalable vector AI/SVG, 300 DPI print-ready PDFs, layered source packages) with full commercial rights.',
    },
  ];

  // Core capabilities overview matching screenshot
  const capabilities = [
    {
      tag: 'IDENTITY',
      num: '01',
      title: 'Visual Identity & Brand Systems',
      desc: 'Distinctive brand marks, typographic lockups, comprehensive visual guidelines, and vector asset libraries crafted for lasting presence.',
    },
    {
      tag: 'PRINT & MERCH',
      num: '02',
      title: 'Poster Art, Cover & Merchandise',
      desc: 'Exhibition-grade poster illustrations, album covers, apparel graphics, and packaging with obsessive attention to ink and print aesthetics.',
    },
    {
      tag: 'DIGITAL MEDIA',
      num: '03',
      title: 'Digital Art & Creative Campaigns',
      desc: 'High-contrast multimedia visual storytelling, marketing assets, and bespoke illustrations tailored for modern digital ecosystems.',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-20 lg:space-y-28 pb-16 sm:pb-20 pt-2 sm:pt-6 lg:pt-10">
      
      {/* ======================================================== */}
      {/* 1. HERO SECTION (Responsive Mobile, Tablet & Desktop) */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-5 min-[375px]:px-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Multiline Headline, Body, CTAs & Metadata (Span 7 on md/lg) */}
          <div className="md:col-span-7 space-y-5 sm:space-y-6 lg:space-y-7">
            
            {/* Main Headline & Supporting Copy */}
            <div className="space-y-3.5 sm:space-y-4">
              <h1 className="font-display text-[26px] min-[360px]:text-[28px] min-[400px]:text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#18181B] dark:text-white tracking-tight leading-[1.18] sm:leading-[1.12] lg:leading-[1.06] max-w-2xl">
                <span className="block sm:inline">Visual Systems &amp; </span>
                <span className="block sm:inline">Bespoke Artistry </span>
                <span className="block sm:inline"><span className="whitespace-nowrap">for Visionary</span> Projects.</span>
              </h1>

              <p className="text-[13px] min-[360px]:text-sm sm:text-base lg:text-lg text-[#52525B] dark:text-[#A1A1AA] max-w-xl leading-relaxed font-normal">
                An independent experimental multimedia design studio crafting distinctive brand identities, immersive poster artworks, and digital illustrations. Make noise. Make meaning.
              </p>
            </div>

            {/* Actions: Primary Orange + Secondary Dark (Consistent heights, touch-friendly, full-width on mobile) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <button
                id="hero-btn-start-commission"
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer group btn-tactile"
              >
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span>Start a Commission</span>
              </button>

              <button
                id="hero-btn-view-portfolio"
                type="button"
                onClick={() => setActiveView('portfolio')}
                className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-lg bg-white dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] text-[#18181B] dark:text-white font-semibold text-sm transition-all border border-[#E4E2DC] dark:border-[#222225] shadow-2xs flex items-center justify-center gap-2 cursor-pointer btn-tactile"
              >
                <span>View Selected Works</span>
                <ArrowRight className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
              </button>
            </div>

            {/* Compact Secondary Trust Row Beneath Actions */}
            <div className="pt-1.5 sm:pt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[11px] sm:text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                <span className="font-semibold text-[#18181B] dark:text-[#E4E4E7]">100% Custom Artistry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]/50 shrink-0" />
                <span>Direct 1-on-1 Studio Collaboration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]/50 shrink-0" />
                <span>300 DPI Print &amp; Vector Masters</span>
              </div>
            </div>

          </div>

          {/* Right Column: Featured Artwork Composition (Span 5, separated transition, 16:10 mobile frame) */}
          {/* Right Column: Featured Artwork Composition (or Studio Standby when portfolio empty) */}
          <div className="md:col-span-5 relative mt-3 md:mt-0">
            {featuredPiece ? (
              <div className="relative rounded-xl overflow-hidden bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] shadow-xs group">
                {/* Primary Featured Artwork Frame (Responsive: 16/10 mobile, 16/9 small tablet, 4/5 tablet & desktop) */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] md:aspect-[4/5] overflow-hidden bg-[#FAF9F6] dark:bg-[#09090B]">
                  <img
                    src={featuredPiece.image}
                    alt={featuredPiece.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  
                  {/* Artwork Meta Overlay */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 text-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10 font-bold">
                        Featured Piece
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-zinc-300">
                        {featuredPiece.projectType === 'client' ? 'Client Commission' : 'Studio Concept'}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                      {featuredPiece.title}
                    </h3>
                    {featuredPiece.shortDesc && (
                      <p className="text-[11px] sm:text-xs text-zinc-300 line-clamp-1 font-normal">
                        {featuredPiece.shortDesc}
                      </p>
                    )}
                  </div>
                </div>

                {/* Artwork Inspection Footer */}
                <div className="p-3 sm:p-3.5 bg-white dark:bg-[#121214] flex items-center justify-between text-xs border-t border-[#E4E2DC] dark:border-[#222225]">
                  <span className="font-mono text-[10px] sm:text-[11px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Archive · {featuredPiece.category || 'Visual Art'}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCaseStudy(featuredPiece)}
                    className="text-xs font-semibold text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] shadow-xs flex flex-col justify-between">
                {/* Standby Visual Frame */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] md:aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#FAF9F6] via-white to-[#F4F3EF] dark:from-[#0E0E10] dark:via-[#121214] dark:to-[#18181B] flex flex-col items-center justify-center p-6 text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                  
                  <div className="relative z-10 space-y-3 max-w-xs">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1A1A1E] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#EA580C] shadow-xs">
                      <Layers className="w-6 h-6" />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] font-bold block">
                        Studio Archive · Standby
                      </span>
                      <h3 className="font-display font-bold text-base sm:text-lg text-[#18181B] dark:text-white">
                        Curating Studio Exhibition
                      </h3>
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                        New commissioned identities and studio case studies will be featured here upon release.
                      </p>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveView('commission-form')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Commission Work</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Standby Footer */}
                <div className="p-3 sm:p-3.5 bg-white dark:bg-[#121214] flex items-center justify-between text-xs border-t border-[#E4E2DC] dark:border-[#222225]">
                  <span className="font-mono text-[10px] sm:text-[11px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Studio Exhibition
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveView('services')}
                    className="text-xs font-semibold text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Explore Disciplines</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. DESIGN SERVICES & DISCIPLINES (Clean 3-Card Grid) */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E4E2DC] dark:border-[#222225] pt-10 sm:pt-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold block">
                01. DISCIPLINES
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#18181B] dark:text-white tracking-tight">
                Design Services &amp; Disciplines
              </h2>
            </div>
            
            <button
              type="button"
              onClick={() => setActiveView('services')}
              className="text-xs sm:text-sm text-[#EA580C] font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto btn-tactile"
            >
              <span>Explore All Packages &amp; Rates</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Capabilities Columns with Hairline Separation (Tablet & Desktop Optimized) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {capabilities.map((cap, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between shadow-2xs hover:border-[#D4D2CA] dark:hover:border-[#333338] hover:shadow-xs transition-all duration-200"
              >
                <div className="space-y-3 sm:space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#EA580C] font-bold">
                      {cap.tag}
                    </span>
                    <span className="font-mono text-xs text-[#71717A] dark:text-[#71717A]">
                      {cap.num}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base sm:text-lg text-[#18181B] dark:text-white">
                    {cap.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                    {cap.desc}
                  </p>
                </div>

                <div className="pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-[#E4E2DC] dark:border-[#222225]">
                  <button
                    type="button"
                    onClick={() => setActiveView('services')}
                    className="text-xs font-semibold text-[#18181B] dark:text-white hover:text-[#EA580C] dark:hover:text-[#EA580C] flex items-center gap-1.5 transition-colors cursor-pointer btn-tactile"
                  >
                    <span>View deliverables &amp; timeline</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#EA580C]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SELECTED WORKS & CASE STUDIES */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E4E2DC] dark:border-[#222225] pt-10 sm:pt-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold block">
                02. SELECTED WORKS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#18181B] dark:text-white tracking-tight">
                Selected Works &amp; Case Studies
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-white dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] text-[#18181B] dark:text-white text-xs sm:text-sm font-semibold transition-all border border-[#E4E2DC] dark:border-[#222225] shadow-2xs flex items-center justify-center sm:justify-start gap-2 cursor-pointer btn-tactile min-h-[40px]"
            >
              <span>Explore Complete Archive ({portfolio.length})</span>
              <ArrowRight className="w-4 h-4 text-[#EA580C]" />
            </button>
          </div>

          {/* 2x2 Grid Presentation or Graceful Empty State */}
          {featuredPortfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
              {featuredPortfolio.map((project) => (
                <PortfolioCard
                  key={project.id}
                  project={project}
                  onSelect={(p) => openCaseStudy(p)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-center justify-center mx-auto text-[#EA580C]">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-[#18181B] dark:text-white">
                  No Selected Works Archived Yet
                </h3>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-md mx-auto font-normal">
                  Exhibition archives and studio case studies are currently being curated. Explore all disciplines or initiate a bespoke commission.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-2 min-h-[40px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Start a Commission</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. THE COMMISSION JOURNEY (Linear 4-Step Process) */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E4E2DC] dark:border-[#222225] pt-10 sm:pt-12">
          
          <div className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 lg:mb-10 max-w-xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold block">
              03. THE PROCESS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#18181B] dark:text-white tracking-tight">
              The Commission Journey
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Transparent, deliberate, and monitored directly in your dedicated client workspace from initial inquiry to final handoff.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {processStages.map((step, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs space-y-4 hover:border-[#D4D2CA] dark:hover:border-[#333338] hover:shadow-xs transition-all duration-200"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E4E2DC] dark:border-[#222225]">
                    <span className="font-mono font-bold text-sm text-[#EA580C]">
                      {step.step}
                    </span>
                    <span className="font-mono text-[10px] text-[#71717A] dark:text-[#71717A] uppercase tracking-wider">
                      Stage {step.step}/04
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-[#18181B] dark:text-white">
                    {step.title}
                  </h3>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

                <div className="text-[10px] font-mono text-[#71717A] dark:text-[#71717A] pt-2">
                  Client Workspace Tracked
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. THE DESIGNER (Profile & Assurance) */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E4E2DC] dark:border-[#222225] pt-10 sm:pt-12">
          
          <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-2xs flex flex-col md:flex-row items-center md:items-start lg:items-center gap-6 sm:gap-8 lg:gap-10">
            
            <div className="relative shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-xl overflow-hidden ring-1 ring-[#E4E2DC] dark:ring-[#222225] shadow-xs">
                <img
                  src={studioProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={studioProfile.designerName || 'Studio Lead'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-md bg-[#18181B] dark:bg-[#1C1C1F] text-white text-[10px] font-bold font-mono uppercase tracking-wider shadow-xs border border-white/10 dark:border-[#27272A]">
                Studio Lead
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 text-center md:text-left flex-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold block">
                04. THE DESIGNER
              </span>

              <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#18181B] dark:text-white">
                {studioProfile.designerName} — {studioProfile.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-2xl font-normal">
                "{studioProfile.bio}"
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-xs text-[#18181B] dark:text-white font-medium">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FAF9F6] dark:bg-[#1C1C1F] px-3 py-1.5 rounded-full border border-[#E4E2DC] dark:border-[#27272A] font-mono text-[10px] sm:text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Custom Visual Systems</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FAF9F6] dark:bg-[#1C1C1F] px-3 py-1.5 rounded-full border border-[#E4E2DC] dark:border-[#27272A] font-mono text-[10px] sm:text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Production Master Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FAF9F6] dark:bg-[#1C1C1F] px-3 py-1.5 rounded-full border border-[#E4E2DC] dark:border-[#27272A] font-mono text-[10px] sm:text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Direct 1-on-1 Communication</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. INITIATE PROJECT (Centered Editorial Callout) */}
      {/* ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-[#121214] text-white rounded-xl sm:rounded-2xl p-6 min-[380px]:p-8 sm:p-12 lg:p-14 shadow-lg space-y-5 sm:space-y-6 relative overflow-hidden border border-[#222225]">
          
          <span className="text-xs font-mono uppercase tracking-widest text-[#EA580C] font-bold block">
            INITIATE PROJECT
          </span>

          <h2 className="font-display text-2xl min-[380px]:text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight max-w-xl mx-auto">
            Have a project in mind?{' '}
            <span className="block sm:inline">Let's build something enduring together.</span>
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-normal">
            Reserve your commission slot today. Submit your creative brief, align directly on scope, and follow progress in real-time.
          </p>

          <div className="pt-2">
            <button
              id="cta-btn-start-commission"
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-sm transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer btn-tactile min-h-[44px]"
            >
              <Send className="w-4 h-4" />
              <span>Start a Commission</span>
            </button>
          </div>
        </div>
      </section>

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
