import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  FileCheck,
  Clock,
  Layers,
  Sparkles,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard';
import { PortfolioCard } from '../components/PortfolioCard';
import { PortfolioModal } from '../components/PortfolioModal';

export const HomeView: React.FC = () => {
  const { 
    studioProfile, 
    services, 
    portfolio, 
    setActiveView, 
    selectedPortfolioProject, 
    setSelectedPortfolioProject,
    openCaseStudy,
  } = useApp();

  const explicitFeatured = portfolio.filter(p => p.featured);
  const featuredPortfolio = explicitFeatured.length > 0 ? explicitFeatured.slice(0, 4) : portfolio.slice(0, 4);

  // Creative process stages without raw emojis or bento card footers
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

  // Core capabilities overview
  const capabilities = [
    {
      title: 'Visual Identity & Brand Systems',
      desc: 'Distinctive brand marks, typographic lockups, comprehensive visual guidelines, and vector asset libraries crafted for lasting presence.',
      tag: 'Identity',
    },
    {
      title: 'Poster Art, Cover & Merchandise',
      desc: 'Exhibition-grade poster illustrations, album covers, apparel graphics, and packaging with obsessive attention to ink and print aesthetics.',
      tag: 'Print & Merch',
    },
    {
      title: 'Digital Art & Creative Campaigns',
      desc: 'High-contrast multimedia visual storytelling, marketing assets, and bespoke illustrations tailored for modern digital ecosystems.',
      tag: 'Digital Media',
    },
  ];

  return (
    <div className="space-y-20 sm:space-y-28 pb-20 pt-6 sm:pt-10">
      
      {/* ======================================================== */}
      {/* 1. EDITORIAL ATELIER HERO SECTION */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Editorial Statement (Span 7) */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Status & Identity Indicator */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-md bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
              <span className="font-mono uppercase font-semibold text-[#18181B] dark:text-[#EDEDEC] text-[11px] tracking-wider">
                {studioProfile.studioName}
              </span>
              <span className="text-[#A1A1AA]">•</span>
              <span className="text-[#71717A] dark:text-[#A1A1AA] font-medium">
                {studioProfile.designerName}
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-6.5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight leading-[1.08]">
                Visual Systems & Bespoke Artistry for Visionary Projects.
              </h1>

              <p className="text-base sm:text-lg text-[#71717A] dark:text-[#A1A1AA] max-w-xl leading-relaxed font-normal">
                An independent design practice crafting distinctive brand identities, immersive poster artworks, and digital illustrations with uncompromising custom craftsmanship.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                id="hero-btn-start-commission"
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="px-6 py-3.5 rounded-lg bg-[#18181B] dark:bg-[#27272A] hover:bg-[#27272A] dark:hover:bg-[#3F3F46] text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Send className="w-4 h-4 text-[#EA580C] group-hover:translate-x-0.5 transition-transform" />
                <span>Start a Commission</span>
              </button>

              <button
                id="hero-btn-view-portfolio"
                type="button"
                onClick={() => setActiveView('portfolio')}
                className="px-6 py-3.5 rounded-lg bg-white dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] font-semibold text-sm transition-all border border-[#E4E2DC] dark:border-[#27272A] shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Selected Works</span>
                <ArrowRight className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
              </button>
            </div>

            {/* Studio Pillars Ribbon */}
            <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">100% Custom Artistry</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#71717A] dark:bg-[#A1A1AA]" />
                <span>Direct 1-on-1 Studio Collaboration</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#71717A] dark:bg-[#A1A1AA]" />
                <span>300 DPI Print & Vector Masters</span>
              </div>
            </div>

          </div>

          {/* Right Column: Featured Artwork Composition (Span 5) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-xl overflow-hidden bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] shadow-xs group">
              
              {/* Primary Featured Artwork Frame */}
              <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF9F6] dark:bg-[#0F0F11]">
                <img
                  src={featuredPortfolio[0]?.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'}
                  alt={featuredPortfolio[0]?.title || 'Signature Brewster Creative Artwork'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                
                {/* Artwork Meta Overlay */}
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA580C] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded border border-white/10 font-semibold">
                      Featured Piece
                    </span>
                    <span className="text-[10px] font-mono text-zinc-300">
                      {featuredPortfolio[0]?.projectType === 'concept' || !featuredPortfolio[0]?.projectType
                        ? (featuredPortfolio[0]?.client && featuredPortfolio[0]?.client !== 'Client Commission' && featuredPortfolio[0]?.client !== 'Commission Client' ? featuredPortfolio[0]?.client : 'Studio Concept')
                        : (featuredPortfolio[0]?.client || 'Studio Archive')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">
                    {featuredPortfolio[0]?.title || 'Cyberpunk Tokyo Series'}
                  </h3>
                  <p className="text-xs text-zinc-300 line-clamp-1 font-normal">
                    {featuredPortfolio[0]?.shortDesc || 'Visual system exploration with custom vector compositions.'}
                  </p>
                </div>
              </div>

              {/* Artwork Inspection Footer */}
              <div className="p-3.5 bg-white dark:bg-[#18181B] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                  Archive No. 001
                </span>
                <button
                  type="button"
                  onClick={() => featuredPortfolio[0] && openCaseStudy(featuredPortfolio[0])}
                  className="text-xs font-semibold text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CORE CAPABILITIES (Clean 3-Column Ledger) */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E4E2DC] dark:border-[#27272A] pt-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="space-y-1.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                01 / Practice
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                Design Services & Disciplines
              </h2>
            </div>
            
            <button
              type="button"
              onClick={() => setActiveView('services')}
              className="text-xs sm:text-sm text-[#EA580C] font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start md:self-auto"
            >
              <span>Explore All Packages & Rates</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Capabilities Columns with Hairline Separation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {capabilities.map((cap, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs hover:border-[#D4D2CA] dark:hover:border-[#3F3F46] transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold bg-[#FFF7ED] dark:bg-[#78350F]/30 px-2.5 py-0.5 rounded border border-[#FFEDD5] dark:border-[#92400E]">
                      {cap.tag}
                    </span>
                    <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC]">
                    {cap.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                    {cap.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E4E2DC] dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setActiveView('services')}
                    className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] hover:text-[#EA580C] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View deliverables & timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CURATED PORTFOLIO SHOWCASE */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E4E2DC] dark:border-[#27272A] pt-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="space-y-1.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                02 / Portfolio
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
                Selected Works & Case Studies
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="px-4 py-2 rounded-lg bg-white dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] text-xs sm:text-sm font-semibold transition-all border border-[#E4E2DC] dark:border-[#27272A] shadow-2xs flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <span>Explore Complete Archive ({portfolio.length})</span>
              <ArrowRight className="w-4 h-4 text-[#EA580C]" />
            </button>
          </div>

          {/* Asymmetrical Grid Presentation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {featuredPortfolio.map((project) => (
              <PortfolioCard
                key={project.id}
                project={project}
                onSelect={(p) => openCaseStudy(p)}
              />
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. THE COLLABORATIVE PROCESS (Linear Architectural Steps) */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E4E2DC] dark:border-[#27272A] pt-12">
          
          <div className="space-y-2 mb-10 max-w-xl">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold block">
              03 / Method
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
              The Commission Journey
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Transparent, deliberate, and monitored directly in your dedicated client workspace from initial inquiry to final handoff.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processStages.map((step, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 flex flex-col justify-between shadow-2xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                    <span className="font-mono font-bold text-sm text-[#EA580C]">
                      {step.step}
                    </span>
                    <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Stage {step.step}/04
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                    {step.title}
                  </h3>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

                <div className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] pt-2">
                  Client Workspace Tracked
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. STUDIO ATELIER & ARTIST PERSPECTIVE */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E4E2DC] dark:border-[#27272A] pt-12">
          
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-8 sm:p-12 shadow-2xs flex flex-col lg:flex-row items-center gap-10">
            
            <div className="relative shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden ring-1 ring-[#E4E2DC] dark:ring-[#27272A] shadow-xs">
                <img
                  src={studioProfile.avatar}
                  alt={studioProfile.designerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2.5 -right-2.5 px-3 py-0.5 rounded-md bg-[#18181B] dark:bg-[#27272A] text-white text-[10px] font-semibold font-mono uppercase tracking-wider shadow-xs">
                Studio Lead
              </div>
            </div>

            <div className="space-y-4 text-center lg:text-left flex-1">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                04 / The Designer
              </span>

              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                {studioProfile.designerName} — {studioProfile.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-2xl font-normal">
                "{studioProfile.bio}"
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-[#18181B] dark:text-[#EDEDEC] font-medium">
                <div className="flex items-center gap-1.5 bg-[#FAF9F6] dark:bg-[#232327] px-3 py-1 rounded-md border border-[#E4E2DC] dark:border-[#27272A] font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                  <span>Custom Visual Systems</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FAF9F6] dark:bg-[#232327] px-3 py-1 rounded-md border border-[#E4E2DC] dark:border-[#27272A] font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                  <span>Production Master Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FAF9F6] dark:bg-[#232327] px-3 py-1 rounded-md border border-[#E4E2DC] dark:border-[#27272A] font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                  <span>Direct 1-on-1 Communication</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. CLOSING INVITATION (High-Contrast Editorial Callout) */}
      {/* ======================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-[#18181B] dark:bg-[#18181B] text-white rounded-xl p-10 sm:p-14 shadow-md space-y-6 relative overflow-hidden border border-transparent dark:border-[#27272A]">
          
          <span className="px-3 py-0.5 rounded-md bg-white/10 text-[#EA580C] text-[10px] font-mono uppercase tracking-widest font-semibold border border-white/10 inline-block">
            Initiate Project
          </span>

          <h2 className="font-display text-3xl sm:text-4.5xl font-black text-white tracking-tight leading-tight">
            Have a project in mind?<br />
            Let's build something enduring together.
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-normal">
            Reserve your commission slot today. Submit your creative brief, align directly on scope, and follow progress in real-time.
          </p>

          <div className="pt-2">
            <button
              id="cta-btn-start-commission"
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="px-8 py-3.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-sm transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
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
