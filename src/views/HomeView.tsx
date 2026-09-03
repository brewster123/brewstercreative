import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Palette, 
  MessageSquare, 
  ShieldCheck, 
  Star,
  ChevronRight,
  Eye,
  Flame,
  Award
} from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard';
import { PortfolioCard } from '../components/PortfolioCard';
import { PortfolioModal } from '../components/PortfolioModal';
import { PortfolioProject } from '../types';

export const HomeView: React.FC = () => {
  const { 
    studioProfile, 
    services, 
    portfolio, 
    setActiveView, 
    selectedPortfolioProject, 
    setSelectedPortfolioProject,
    currentUser
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'All' | string>('All');

  const featuredPortfolio = portfolio.filter(p => p.featured || true).slice(0, 4);

  const workflowSteps = [
    {
      num: '01',
      title: 'Submit Your Request',
      desc: 'Fill out the guided commission form detailing your design vision, brand goals, dimensions, references, and deadline.',
      icon: '📝',
    },
    {
      num: '02',
      title: 'Discuss the Project',
      desc: 'Connect in the real-time studio portal to align on creative direction, aesthetic style, deliverables, and secure deposit.',
      icon: '💬',
    },
    {
      num: '03',
      title: 'Design & Revisions',
      desc: 'Track live progress from concept to vector polish. Inspect high-res proofs, leave direct comments, or request fine refinements.',
      icon: '🎨',
    },
    {
      num: '04',
      title: 'Final Delivery',
      desc: 'Receive master production files (vector SVGs, print 300DPI PDFs, layered packages) with full commercial licensing.',
      icon: '📦',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 pt-6 sm:pt-10">
      
      {/* 1. BENTO GRID HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Main Hero Bento Tile (Span 8) */}
          <div className="md:col-span-8 bg-white border border-[#E5E5E5] rounded-[32px] p-8 sm:p-12 lg:p-14 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-0"></div>
            
            <div className="space-y-6 relative z-10">
              {/* Studio Status Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono-code uppercase font-semibold text-zinc-700 text-[11px]">
                  {studioProfile.availableSlots} Commission Slots Open
                </span>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-600 font-medium">
                  {studioProfile.designerName}
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-6xl font-black text-zinc-900 tracking-normal leading-tight">
                Designs Made to Make Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600">
                  Ideas Stand Out.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 max-w-xl leading-relaxed">
                Crafting distinctive brand identities, immersive poster art, digital illustrations, and multimedia visuals for forward-thinking creators, founders, and indie studios.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-8 relative z-10">
              <button
                id="hero-btn-start-commission"
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                <Send className="w-4 h-4 text-orange-400 group-hover:rotate-12 transition-transform" />
                <span>Start a Commission</span>
              </button>

              <button
                id="hero-btn-view-portfolio"
                type="button"
                onClick={() => setActiveView('portfolio')}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-sm sm:text-base transition-all border border-zinc-200 flex items-center justify-center gap-2"
              >
                <span>View Portfolio</span>
                <ArrowRight className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          </div>

          {/* Right Side Bento Column (Span 4) */}
          <div className="md:col-span-4 flex flex-col gap-4 sm:gap-6">
            
            {/* Live Progress Portal Tile */}
            <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between flex-1 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono-code font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                  Client Hub
                </span>
                <span className="text-xs text-zinc-400 font-mono-code">v2.4 Live</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-xl text-zinc-900 mb-1">
                  Interactive Progress Tracker
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Real-time 8-stage milestone monitoring, high-res design proof approval, and built-in revisions manager.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>8 Stages Transparent</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('client-dashboard')}
                  className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1"
                >
                  Client Portal →
                </button>
              </div>
            </div>

            {/* Turnaround & Commercial IP Bento Tile */}
            <div className="bg-zinc-900 text-white rounded-[32px] p-6 sm:p-7 shadow-sm flex flex-col justify-between flex-1 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⚡</span>
                <span className="text-[10px] font-mono-code text-zinc-400 uppercase">Fast Delivery</span>
              </div>

              <div>
                <div className="font-display font-black text-3xl text-white">
                  3–7 Days
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Average turnaround with 100% full commercial rights & vector masters.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] font-mono-code text-orange-400 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero AI Generated Cliparts</span>
              </div>
            </div>

          </div>

        </div>

        {/* 4 Bottom Bento Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="p-5 rounded-[24px] bg-white border border-[#E5E5E5] shadow-xs">
            <span className="font-display font-black text-2xl text-zinc-900 block">100%</span>
            <span className="text-xs text-zinc-500 font-medium">Custom Artistry</span>
          </div>
          <div className="p-5 rounded-[24px] bg-white border border-[#E5E5E5] shadow-xs">
            <span className="font-display font-black text-2xl text-zinc-900 block">120+</span>
            <span className="text-xs text-zinc-500 font-medium">Completed Projects</span>
          </div>
          <div className="p-5 rounded-[24px] bg-white border border-[#E5E5E5] shadow-xs">
            <span className="font-display font-black text-2xl text-zinc-900 block">1-on-1</span>
            <span className="text-xs text-zinc-500 font-medium">Direct Studio Chat</span>
          </div>
          <div className="p-5 rounded-[24px] bg-white border border-[#E5E5E5] shadow-xs">
            <span className="font-display font-black text-2xl text-zinc-900 block">300 DPI</span>
            <span className="text-xs text-zinc-500 font-medium">Print & Vector Masters</span>
          </div>
        </div>
      </section>

      {/* 2. FEATURED SERVICES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-wider text-orange-600 mb-2 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Commission Categories</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
              Design Services Tailored to You
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('services')}
            className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1.5 group self-start md:self-auto"
          >
            <span>View All Services & Pricing</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.slice(0, 6).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION - BENTO STYLE (01 - 04) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code uppercase tracking-wider font-bold border border-orange-200/80">
              Simple 4-Step Process
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-zinc-900">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              From your initial brief to final production files, every stage is transparent, collaborative, and tracked in your client dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((step, i) => (
              <div
                key={i}
                className="bg-zinc-50 border border-zinc-200/80 rounded-[24px] p-6 relative flex flex-col justify-between hover:border-orange-500/50 hover:bg-white transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display font-black text-2xl text-zinc-900">
                      {step.num}
                    </span>
                    <span className="text-2xl">{step.icon}</span>
                  </div>

                  <h3 className="font-display font-bold text-base text-zinc-900 mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-zinc-200/70 text-[10px] font-mono-code text-zinc-400 uppercase font-semibold">
                  Step {step.num} of 04
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED PORTFOLIO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-wider text-orange-600 mb-2 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Curated Portfolio</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
              Selected Works & Case Studies
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('portfolio')}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-800 text-xs sm:text-sm font-bold transition-all border border-zinc-200 shadow-xs flex items-center gap-2 self-start md:self-auto"
          >
            <span>Explore Full Gallery ({portfolio.length})</span>
            <ArrowRight className="w-4 h-4 text-orange-500" />
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredPortfolio.map((project) => (
            <PortfolioCard
              key={project.id}
              project={project}
              onSelect={(p) => setSelectedPortfolioProject(p)}
            />
          ))}
        </div>
      </section>

      {/* 5. DESIGNER STUDIO BIO HIGHLIGHT - BENTO TILE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-8 sm:p-12 shadow-sm flex flex-col lg:flex-row items-center gap-10">
          
          <div className="relative shrink-0">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[28px] overflow-hidden ring-4 ring-orange-500/20 shadow-md">
              <img
                src={studioProfile.avatar}
                alt={studioProfile.designerName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-3 -right-3 px-3.5 py-1 rounded-full bg-zinc-900 text-white text-[11px] font-bold font-mono-code shadow-md">
              Studio Lead
            </div>
          </div>

          <div className="space-y-4 text-center lg:text-left flex-1">
            <span className="text-xs font-mono-code text-orange-600 uppercase tracking-wider font-bold">
              Meet The Designer
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
              {studioProfile.designerName} — {studioProfile.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              "{studioProfile.bio}"
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-zinc-700 font-medium">
              <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>6+ Years Freelance Mastery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>120+ Completed Client Commissions</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Direct 1-on-1 Designer Communication</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION - BENTO CARD */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-zinc-900 text-white rounded-[32px] p-10 sm:p-16 shadow-xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <span className="px-3.5 py-1 rounded-full bg-white/10 text-orange-400 text-xs font-mono-code uppercase tracking-wider font-bold border border-white/10 inline-block">
            Let's Collaborate
          </span>

          <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight">
            Have a project in mind?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400">
              Let's create something together.
            </span>
          </h2>

          <p className="text-xs sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Reserve your commission slot today. Submit your brief, discuss your project, and watch your vision come to life in our interactive studio hub.
          </p>

          <div className="pt-4">
            <button
              id="cta-btn-start-commission"
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="px-9 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-orange-500/25 hover:scale-105 inline-flex items-center gap-2"
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
