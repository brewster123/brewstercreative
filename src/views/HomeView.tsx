import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  Layers,
  Sparkles,
  Compass,
  Sliders,
  Palette
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
      detail: 'Online Briefing & Alignment'
    },
    {
      step: '02',
      title: 'Scope Alignment & Deposit',
      desc: 'Connect in the real-time client workspace to finalize deliverables, secure the 50% project deposit, and reserve your studio production slot.',
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
      desc: 'Receive master production files (scalable vector AI/SVG, 300 DPI print-ready PDFs, layered source packages) with full commercial rights.',
      detail: 'Archival Master Packages'
    },
  ];

  // Core capabilities overview with editorial broadsheet structure
  const capabilities = [
    {
      tag: 'IDENTITY SYSTEMS',
      num: '01',
      title: 'Visual Identity & Brand Systems',
      desc: 'Distinctive brand marks, typographic lockups, comprehensive visual guidelines, and vector asset libraries crafted for lasting presence.',
      deliverables: ['Custom Vector Marks', 'Typography Guidelines', 'Color Specifications', 'Master Asset Kits'],
      icon: Compass
    },
    {
      tag: 'PRINT & MERCHANDISE',
      num: '02',
      title: 'Poster Art, Covers & Merchandise',
      desc: 'Exhibition-grade poster illustrations, album covers, apparel graphics, and packaging with obsessive attention to ink and print aesthetics.',
      deliverables: ['300 DPI Print Masters', 'Silk-Screen Separations', 'Packaging Dielines', 'Merch Vector Specs'],
      icon: Palette
    },
    {
      tag: 'DIGITAL MEDIA',
      num: '03',
      title: 'Digital Art & Creative Campaigns',
      desc: 'High-contrast multimedia visual storytelling, marketing assets, and bespoke illustrations tailored for modern digital ecosystems.',
      deliverables: ['Multi-Ratio Exports', 'Campaign Key Art', 'Social Toolkits', 'Vector Art Archives'],
      icon: Sliders
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 lg:space-y-32 pb-20 sm:pb-24 pt-3 sm:pt-6 lg:pt-10">
      
      {/* ======================================================== */}
      {/* 1. HERO SECTION (Editorial Studio Atelier Presentation)   */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Expressive Typography, Tagline, CTAs & Studio Status */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* Studio Status Eyebrow with Active Commission Indicator */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#FAF9F6] dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EA580C] opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EA580C]" />
              </span>
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold">
                Studio Commission Slots Open · 1-on-1 Collaboration
              </span>
            </div>

            {/* Oversized Expressive Headline & Tagline Placement */}
            <div className="space-y-4 sm:space-y-5">
              <h1 className="font-display text-4xl min-[380px]:text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tighter leading-[1.02] sm:leading-[0.98] text-balance">
                Visual Systems &amp;{' '}
                <span className="block sm:inline">Bespoke Artistry </span>
                <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-[#18181B] via-[#EA580C] to-[#18181B] dark:from-[#EDEDEC] dark:via-[#EA580C] dark:to-[#EDEDEC]">
                  for Visionary Projects.
                </span>
              </h1>

              {/* High-Impact Tagline Placement */}
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#EA580C]" aria-hidden="true" />
                <p className="font-mono text-sm sm:text-base font-bold text-[#EA580C] uppercase tracking-widest">
                  Make noise. Make meaning.
                </p>
              </div>

              <p className="text-sm sm:text-base lg:text-lg text-[#52525B] dark:text-[#A1A1AA] max-w-xl leading-relaxed font-normal">
                DESTALION is an independent experimental multimedia design studio crafting distinctive brand marks, screen-print posters, and bespoke digital illustrations with obsessive craftsmanship.
              </p>
            </div>

            {/* Primary & Secondary Action Triggers */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                id="hero-btn-start-commission"
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="w-full sm:w-auto min-h-[44px] h-12 px-6 sm:px-7 rounded-lg bg-[#EA580C] hover:bg-[#D94814] active:bg-[#C23E0E] text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer group btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] dark:focus-visible:ring-offset-[#09090B] motion-reduce:transition-none"
              >
                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none" />
                <span>Start a Commission</span>
              </button>

              <button
                id="hero-btn-view-portfolio"
                type="button"
                onClick={() => setActiveView('portfolio')}
                className="w-full sm:w-auto min-h-[44px] h-12 px-6 sm:px-7 rounded-lg bg-white dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#18181B] text-[#18181B] dark:text-[#EDEDEC] font-semibold text-sm transition-all border border-[#E4E2DC] dark:border-[#222225] shadow-2xs flex items-center justify-center gap-2 cursor-pointer btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] dark:focus-visible:ring-offset-[#09090B] motion-reduce:transition-none"
              >
                <span>Explore Selected Works</span>
                <ArrowRight className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
              </button>
            </div>

            {/* Studio Guarantees Ledger */}
            <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">100% Original Craft</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]/50 shrink-0" />
                <span>Direct Studio Lead Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]/50 shrink-0" />
                <span>Scalable Vectors &amp; 300 DPI Masters</span>
              </div>
            </div>

          </div>

          {/* Right Column: Featured Exhibition Frame */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            {featuredPiece ? (
              <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] shadow-xs group">
                {/* Artwork Viewport */}
                <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5] overflow-hidden bg-[#FAF9F6] dark:bg-[#09090B]">
                  <img
                    src={featuredPiece.image}
                    alt={featuredPiece.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103 motion-reduce:transform-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  
                  {/* Top Floating Badge */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded border border-white/10 font-bold">
                      Curated Exhibition Piece
                    </span>
                  </div>

                  {/* Artwork Meta Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
                      <span>{featuredPiece.category || 'Visual System'}</span>
                      <span className={featuredPiece.projectType === 'client' ? 'text-emerald-300 font-semibold' : 'text-amber-300 font-semibold'}>
                        {featuredPiece.projectType === 'client' ? 'Client Commission' : 'Studio Concept'}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-xl sm:text-2xl text-white leading-tight">
                      {featuredPiece.title}
                    </h3>

                    {featuredPiece.shortDesc && (
                      <p className="text-xs text-zinc-300 line-clamp-2 font-normal leading-relaxed">
                        {featuredPiece.shortDesc}
                      </p>
                    )}
                  </div>
                </div>

                {/* Exhibition Footer Inspection */}
                <div className="p-4 bg-white dark:bg-[#121214] flex items-center justify-between text-xs border-t border-[#E4E2DC] dark:border-[#222225]">
                  <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
                    Studio Archive · Case Study
                  </span>
                  <button
                    type="button"
                    onClick={() => openCaseStudy(featuredPiece)}
                    className="text-xs font-semibold text-[#EA580C] hover:text-[#D94814] flex items-center gap-1.5 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded px-1.5 py-1 group/btn"
                  >
                    <span>Inspect Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] shadow-xs flex flex-col justify-between">
                {/* Standby Visual Frame */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#FAF9F6] via-white to-[#F4F3EF] dark:from-[#0E0E10] dark:via-[#121214] dark:to-[#18181B] flex flex-col items-center justify-center p-8 text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                  
                  <div className="relative z-10 space-y-4 max-w-xs">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1A1A1E] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#EA580C] shadow-xs">
                      <Layers className="w-7 h-7" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] font-bold block">
                        Studio Archive · Standby
                      </span>
                      <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-white">
                        Curating Studio Exhibition
                      </h3>
                      <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                        New commissioned identities and studio case studies will be featured here upon release.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveView('commission-form')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer min-h-[44px]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Commission Work</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-[#121214] flex items-center justify-between text-xs border-t border-[#E4E2DC] dark:border-[#222225]">
                  <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
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
      {/* 2. STUDIO MANIFESTO TICKER RIBBON (Editorial Identity)    */}
      {/* ======================================================== */}
      <section className="border-y border-[#E4E2DC] dark:border-[#222225] bg-white dark:bg-[#121214] py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 overflow-x-auto no-scrollbar font-mono text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap uppercase tracking-widest font-semibold">
            <span className="text-[#EA580C] font-bold">MAKE NOISE. MAKE MEANING.</span>
            <span className="text-[#A1A1AA]" aria-hidden="true">·</span>
            <span>BESPOKE VISUAL SYSTEMS</span>
            <span className="text-[#A1A1AA]" aria-hidden="true">·</span>
            <span>OBSESSIVE VECTOR PRECISION</span>
            <span className="text-[#A1A1AA]" aria-hidden="true">·</span>
            <span>300 DPI ARCHIVAL MASTERS</span>
            <span className="text-[#A1A1AA]" aria-hidden="true">·</span>
            <span>DIRECT 1-ON-1 ART DIRECTION</span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. DESIGN SERVICES & DISCIPLINES (Editorial Broadsheet)    */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 sm:space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E4E2DC] dark:border-[#222225] pb-6">
            <div className="space-y-2 max-w-xl">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold block">
                01. DISCIPLINES &amp; CRAFT
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                Design Services &amp; Disciplines
              </h2>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                Structured practices from single-release key visuals to comprehensive multi-touchpoint brand identities.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setActiveView('services')}
              className="text-xs sm:text-sm text-[#EA580C] hover:text-[#D94814] font-semibold hover:underline flex items-center gap-1.5 cursor-pointer self-start sm:self-auto btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded px-1.5 py-1 min-h-[44px]"
            >
              <span>Explore All Packages &amp; Rates</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Editorial Broadsheet List Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <article 
                  key={i}
                  className="group bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#D4D2CA] dark:hover:border-[#333338] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-300 space-y-6 motion-reduce:transition-none"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-[#E4E2DC] dark:border-[#222225]">
                      <span className="font-mono text-xs uppercase tracking-wider text-[#EA580C] font-bold">
                        {cap.tag}
                      </span>
                      <span className="font-mono text-sm text-[#71717A] dark:text-[#A1A1AA] font-semibold">
                        /{cap.num}
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-center justify-center text-[#EA580C] shadow-2xs group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>

                    <h3 className="font-display font-black text-xl sm:text-2xl text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] transition-colors">
                      {cap.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                      {cap.desc}
                    </p>

                    {/* Deliverable Tags */}
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {cap.deliverables.map((item, idx) => (
                        <span 
                          key={idx}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-[#52525B] dark:text-[#A1A1AA]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#E4E2DC] dark:border-[#222225]">
                    <button
                      type="button"
                      onClick={() => setActiveView('services')}
                      className="w-full text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] hover:text-[#EA580C] dark:hover:text-[#EA580C] flex items-center justify-between transition-colors cursor-pointer btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded p-1 min-h-[44px]"
                    >
                      <span>View deliverables &amp; timeline</span>
                      <ArrowRight className="w-4 h-4 text-[#EA580C]" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. SELECTED WORKS & CASE STUDIES (Asymmetrical Flow)     */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 sm:space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E4E2DC] dark:border-[#222225] pb-6">
            <div className="space-y-2 max-w-xl">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold block">
                02. SELECTED WORKS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                Selected Works &amp; Case Studies
              </h2>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                Curated identity systems, editorial artworks, and commission archives from the DESTALION catalog.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#18181B] text-[#18181B] dark:text-[#EDEDEC] text-xs sm:text-sm font-semibold transition-all border border-[#E4E2DC] dark:border-[#222225] shadow-2xs flex items-center justify-center sm:justify-start gap-2 cursor-pointer btn-tactile min-h-[44px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] motion-reduce:transition-none"
            >
              <span>Explore Complete Archive ({portfolio.length})</span>
              <ArrowRight className="w-4 h-4 text-[#EA580C]" />
            </button>
          </div>

          {/* Exhibition Grid */}
          {featuredPortfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
              {featuredPortfolio.map((project, idx) => (
                <PortfolioCard
                  key={project.id}
                  project={project}
                  variant={idx === 0 ? 'featured' : 'standard'}
                  onSelect={(p) => openCaseStudy(p)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-2xl p-8 sm:p-14 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-center justify-center mx-auto text-[#EA580C]">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  No Selected Works Archived Yet
                </h3>
                <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-md mx-auto font-normal">
                  Exhibition archives and studio case studies are currently being curated. Explore all disciplines or initiate a bespoke commission.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#EA580C] hover:bg-[#D94814] active:bg-[#C23E0E] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-2 min-h-[44px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                >
                  <Send className="w-4 h-4" />
                  <span>Start a Commission</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. THE COMMISSION JOURNEY (Linear Progressive Timeline)  */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 sm:space-y-12">
          
          <div className="space-y-2 border-b border-[#E4E2DC] dark:border-[#222225] pb-6 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold block">
              03. PRODUCTION TIMELINE
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
              The Commission Journey
            </h2>
            <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Transparent, deliberate, and monitored directly in your dedicated client workspace from initial inquiry to final handoff.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processStages.map((step, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs space-y-6 hover:border-[#D4D2CA] dark:hover:border-[#333338] hover:shadow-xs transition-all duration-200 motion-reduce:transition-none"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#222225]">
                    <span className="font-mono font-black text-2xl text-[#EA580C]">
                      {step.step}
                    </span>
                    <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
                      Stage {step.step}/04
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
                  <span>Live Tracked</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. THE DESIGNER (Editorial Monograph Spread)             */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xs flex flex-col lg:flex-row items-center lg:items-start gap-8 sm:gap-12">
          
          <div className="relative shrink-0">
            <div className="w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-2xl overflow-hidden ring-1 ring-[#E4E2DC] dark:ring-[#222225] shadow-xs">
              <img
                src={studioProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt={studioProfile.designerName || 'Studio Lead'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-md bg-[#18181B] dark:bg-[#18181B] text-[#EDEDEC] text-[10px] font-bold font-mono uppercase tracking-wider shadow-xs border border-white/10 dark:border-[#222225]">
              Studio Director
            </div>
          </div>

          <div className="space-y-5 text-center lg:text-left flex-1">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold block">
                04. THE ATELIER LEAD
              </span>

              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                {studioProfile.designerName}
              </h3>
              <p className="font-mono text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                {studioProfile.title} · Manila, Philippines
              </p>
            </div>

            <blockquote className="text-sm sm:text-base lg:text-lg text-[#52525B] dark:text-[#D4D4D8] leading-relaxed font-normal italic border-l-0 lg:border-l-2 border-[#EA580C] lg:pl-4">
              "{studioProfile.bio}"
            </blockquote>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 text-xs text-[#18181B] dark:text-[#EDEDEC] font-medium">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FAF9F6] dark:bg-[#18181B] px-3.5 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#222225] font-mono text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Custom Vector Systems</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FAF9F6] dark:bg-[#18181B] px-3.5 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#222225] font-mono text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>300 DPI Production Masters</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FAF9F6] dark:bg-[#18181B] px-3.5 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#222225] font-mono text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Direct 1-on-1 Dialogue</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. INITIATE PROJECT (Expressive Editorial Studio Callout) */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-[#121214] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-14 lg:p-16 shadow-xl space-y-6 relative overflow-hidden border border-[#222225]">
          <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-[#EA580C] font-bold block">
              INITIATE COMMISSION
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#EDEDEC] tracking-tight leading-tight text-balance">
              Make noise. Make meaning.{' '}
              <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-300 to-white">
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
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] active:bg-[#C23E0E] text-white font-semibold text-sm transition-all shadow-md inline-flex items-center justify-center gap-2.5 cursor-pointer btn-tactile min-h-[48px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121214] motion-reduce:transition-none"
              >
                <Send className="w-4 h-4" />
                <span>Start a Commission</span>
              </button>
            </div>
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
