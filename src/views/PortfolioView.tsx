import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PortfolioCard } from '../components/PortfolioCard';
import { PortfolioModal } from '../components/PortfolioModal';
import { PortfolioProject } from '../types';
import { Search, Layers, Send, Sparkles } from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const { 
    portfolio, 
    openCaseStudy,
    setActiveView
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'client' | 'concept'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickPreviewProject, setQuickPreviewProject] = useState<PortfolioProject | null>(null);

  const categories = [
    'All',
    'Branding',
    'Logo',
    'Poster',
    'Illustration',
    'Social Media',
    'Book Covers',
    'Other',
  ];

  const filteredProjects = portfolio.filter((project) => {
    // 1. Category Filter
    const matchesCategory = 
      selectedCategory === 'All' || 
      project.category.toLowerCase() === selectedCategory.toLowerCase();

    // 2. Project Type Filter ('client' vs 'concept')
    const projectType = project.projectType || 'client';
    const matchesType = 
      typeFilter === 'all' || 
      projectType === typeFilter;

    // 3. Keyword Search Filter
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      project.title.toLowerCase().includes(query) ||
      project.shortDesc.toLowerCase().includes(query) ||
      project.client.toLowerCase().includes(query) ||
      (project.tags && project.tags.some(t => t.toLowerCase().includes(query))) ||
      (project.tools && project.tools.some(tool => tool.toLowerCase().includes(query)));

    return matchesCategory && matchesType && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 sm:space-y-14">
      
      {/* Editorial Exhibition Header */}
      <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-8 sm:pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
              <span>Exhibition Archive & Case Studies</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-5.5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight leading-[1.08]">
              Selected Visual Systems & Bespoke Artworks
            </h1>

            <p className="text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
              An ongoing catalog of commissioned brand marks, typographic systems, screen-print posters, digital illustrations, and experimental studio R&D.
            </p>
          </div>

          <div className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] self-start md:self-end">
            <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{filteredProjects.length}</span> Works Documented
          </div>
        </div>
      </div>

      {/* Filter Control Ribbon: Project Type Toggles + Category Navigation + Search */}
      <div className="space-y-4 border-b border-[#E4E2DC] dark:border-[#27272A] pb-5">
        
        {/* Row 1: Project Type Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Classification Toggles */}
          <div className="inline-flex p-1 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] self-start">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] shadow-2xs font-bold'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              All Works
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('client')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'client'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold border border-emerald-200 dark:border-emerald-800/40'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              Client Work
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('concept')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'concept'
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-2xs font-bold border border-purple-200 dark:border-purple-800/40'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              Concept Explorations
            </button>
          </div>

          {/* Minimal Search Input */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-portfolio-search"
              type="text"
              placeholder="Search archive, tools, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
            />
          </div>

        </div>

        {/* Row 2: Category Navigation Strip */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1" aria-label="Portfolio categories">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                id={`filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'text-[#18181B] dark:text-[#EDEDEC] font-bold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
              >
                <span>{cat}</span>
                {isSelected && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#EA580C] rounded-full animate-in fade-in duration-200" />
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Art-Directed Gallery Grid with Visual Rhythm */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-16 text-center space-y-4 shadow-2xs max-w-xl mx-auto">
          <Layers className="w-8 h-8 text-[#A1A1AA] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
              No archived works found
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              No matching pieces were found matching your current filter criteria.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { 
              setSelectedCategory('All'); 
              setTypeFilter('all');
              setSearchQuery(''); 
            }}
            className="px-4 py-2 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-12">
          {/* Asymmetric Exhibition Flow: Leading Piece is Featured if on All / no search */}
          {selectedCategory === 'All' && typeFilter === 'all' && !searchQuery && filteredProjects.length >= 3 ? (
            <>
              {/* Primary Anchor: Large Featured Project + Two Smaller Projects */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8">
                  <PortfolioCard
                    project={filteredProjects[0]}
                    variant="featured"
                    onSelect={(p) => openCaseStudy(p)}
                    onPreview={(p) => setQuickPreviewProject(p)}
                  />
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                  <PortfolioCard
                    project={filteredProjects[1]}
                    variant="compact"
                    onSelect={(p) => openCaseStudy(p)}
                    onPreview={(p) => setQuickPreviewProject(p)}
                  />
                  {filteredProjects[2] && (
                    <PortfolioCard
                      project={filteredProjects[2]}
                      variant="compact"
                      onSelect={(p) => openCaseStudy(p)}
                      onPreview={(p) => setQuickPreviewProject(p)}
                    />
                  )}
                </div>
              </div>

              {/* Middle Section: Wide Panoramic Project if 4th exists */}
              {filteredProjects.length > 3 && (
                <div className="pt-2">
                  <PortfolioCard
                    project={filteredProjects[3]}
                    variant="wide"
                    onSelect={(p) => openCaseStudy(p)}
                    onPreview={(p) => setQuickPreviewProject(p)}
                  />
                </div>
              )}

              {/* Subsequent Works in Alternating Rhythm */}
              {filteredProjects.length > 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
                  {filteredProjects.slice(4).map((project) => (
                    <PortfolioCard
                      key={project.id}
                      project={project}
                      variant="standard"
                      onSelect={(p) => openCaseStudy(p)}
                      onPreview={(p) => setQuickPreviewProject(p)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Filtered or Searched Grid: Clean 2-3 Column Editorial Gallery */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProjects.map((project, index) => (
                <PortfolioCard
                  key={project.id}
                  project={project}
                  variant={index === 0 && filteredProjects.length > 1 ? 'featured' : 'standard'}
                  className={index === 0 && filteredProjects.length > 1 ? 'md:col-span-2' : ''}
                  onSelect={(p) => openCaseStudy(p)}
                  onPreview={(p) => setQuickPreviewProject(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editorial Closing Invitation */}
      <section className="pt-10 border-t border-[#E4E2DC] dark:border-[#27272A]">
        <div className="bg-[#18181B] dark:bg-[#18181B] text-white rounded-xl p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-transparent dark:border-[#27272A]">
          <div className="space-y-2 max-w-xl">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
              Bespoke Inquiries
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Have a visionary project in mind?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              Every commission begins with an open dialogue about your aesthetic ambitions, target deliverables, and deadlines.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('commission-form')}
            className="px-6 py-3.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Initiate Project Consultation</span>
          </button>
        </div>
      </section>

      {/* Quick Visual Preview Modal (Lightweight lightbox option) */}
      {quickPreviewProject && (
        <PortfolioModal
          project={quickPreviewProject}
          onClose={() => setQuickPreviewProject(null)}
        />
      )}

    </div>
  );
};
