import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PortfolioCard } from '../components/PortfolioCard';
import { PortfolioModal } from '../components/PortfolioModal';
import {
  PortfolioEditorModal,
  PortfolioDeleteModal,
  PORTFOLIO_CATEGORIES,
} from '../components/admin/PortfolioEditorModal';
import { PortfolioProject, ProjectType } from '../types';
import { Search, Layers, Send, Sparkles, ArrowUpRight, Plus, AlertCircle } from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const { 
    currentUser,
    portfolio, 
    openCaseStudy,
    setActiveView,
    updatePortfolioProject
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'client' | 'concept'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickPreviewProject, setQuickPreviewProject] = useState<PortfolioProject | null>(null);

  // Admin-only direct portfolio management state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [editorDefaultCategory, setEditorDefaultCategory] = useState<PortfolioProject['category']>('Branding');
  const [editorDefaultType, setEditorDefaultType] = useState<ProjectType>('concept');
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const categories = [
    'All',
    ...PORTFOLIO_CATEGORIES,
  ];

  const handleOpenAddWork = (overrides?: {
    category?: PortfolioProject['category'];
    projectType?: ProjectType;
  }) => {
    if (!isAdmin) return;
    setAdminError(null);
    const activeCat =
      overrides?.category ||
      (PORTFOLIO_CATEGORIES.includes(selectedCategory as PortfolioProject['category'])
        ? (selectedCategory as PortfolioProject['category'])
        : 'Branding');
    const activeType: ProjectType =
      overrides?.projectType || (typeFilter === 'client' ? 'client' : 'concept');

    setEditingProject(null);
    setEditorDefaultCategory(activeCat);
    setEditorDefaultType(activeType);
    setIsEditorOpen(true);
  };

  const handleOpenEditWork = (project: PortfolioProject) => {
    if (!isAdmin) return;
    setAdminError(null);
    setEditingProject(project);
    setIsEditorOpen(true);
  };

  const handleRequestDeleteWork = (project: PortfolioProject) => {
    if (!isAdmin) return;
    setAdminError(null);
    setProjectToDelete({ id: project.id, title: project.title });
  };

  const handleToggleFeaturedWork = async (project: PortfolioProject) => {
    if (!isAdmin) return;
    setAdminError(null);
    const res = await updatePortfolioProject(project.id, { featured: !project.featured });
    if (res && !res.success) {
      setAdminError(res.error || 'Failed to update featured status.');
    }
  };

  const filteredProjects = portfolio.filter((project) => {
    // 1. Category Filter
    const matchesCategory = 
      selectedCategory === 'All' || 
      project.category.toLowerCase() === selectedCategory.toLowerCase();

    // 2. Project Type Filter ('client' vs 'concept')
    const projectType = project.projectType || 'concept';
    const matchesType = 
      typeFilter === 'all' || 
      projectType === typeFilter;

    // 3. Keyword Search Filter
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      project.title.toLowerCase().includes(query) ||
      project.shortDesc.toLowerCase().includes(query) ||
      (project.client || '').toLowerCase().includes(query) ||
      (project.tags && project.tags.some(t => t.toLowerCase().includes(query))) ||
      (project.tools && project.tools.some(tool => tool.toLowerCase().includes(query)));

    return matchesCategory && matchesType && matchesSearch;
  });

  const adminCardProps = isAdmin
    ? {
        onEdit: handleOpenEditWork,
        onDelete: handleRequestDeleteWork,
        onToggleFeatured: handleToggleFeaturedWork,
      }
    : {};

  return (
    <div className="bg-canvas min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-16 space-y-10 sm:space-y-14">
      
      {/* Filter Control Ribbon: Project Type Toggles + Category Navigation + Search */}
      <div className="space-y-4 border-b border-hairline pb-5">
        
        {/* Row 1: Project Type Tabs, Search & Admin Add Work Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Classification Toggles */}
          <div className="inline-flex p-1 rounded-full bg-surface-secondary border border-hairline self-start">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                typeFilter === 'all'
                  ? 'bg-surface text-carbon shadow-2xs font-bold'
                  : 'text-graphite hover:text-carbon'
              }`}
            >
              All Works
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('client')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                typeFilter === 'client'
                  ? 'bg-[#E0F2FE] dark:bg-[#0C4A6E]/50 text-[#0369A1] dark:text-[#38BDF8] shadow-2xs font-bold'
                  : 'text-graphite hover:text-carbon'
              }`}
            >
              Client Work
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('concept')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                typeFilter === 'concept'
                  ? 'bg-[#D4FF38] text-[#111114] shadow-2xs font-bold'
                  : 'text-graphite hover:text-carbon'
              }`}
            >
              Concept Explorations
            </button>
          </div>

          {/* Search Input + Admin-Only Direct Add Button */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-portfolio-search"
                type="text"
                placeholder="Search archive, tools, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-hairline rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-carbon placeholder-graphite focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors"
              />
            </div>

            {isAdmin && (
              <button
                id="btn-portfolio-add-work"
                type="button"
                onClick={() => handleOpenAddWork()}
                className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Plus className="w-4 h-4" />
                <span>Add Work</span>
              </button>
            )}
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
                className={`relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'text-carbon font-bold'
                    : 'text-graphite hover:text-carbon'
                }`}
              >
                <span>{cat}</span>
                {isSelected && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-accent rounded-full animate-in fade-in duration-200 motion-reduce:animate-none" />
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Admin Action Error Feedback (Admin Only) */}
      {isAdmin && adminError && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{adminError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminError(null)}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Art-Directed Gallery Grid with Visual Rhythm */}
      {filteredProjects.length === 0 ? (
        isAdmin && portfolio.length === 0 ? (
          <div className="bg-surface border border-hairline rounded-3xl p-12 sm:p-16 text-center space-y-5 shadow-2xs max-w-xl mx-auto animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-hairline flex items-center justify-center mx-auto text-accent">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-bold text-carbon">
                No portfolio works yet
              </h3>
              <p className="text-xs sm:text-sm text-graphite leading-relaxed max-w-md mx-auto">
                Publish your first portfolio work or case study directly here. Only your studio admin account can add, edit, feature, or remove works.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddWork()}
              className="btn-tactile inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Work</span>
            </button>
          </div>
        ) : typeFilter === 'client' ? (
          <div className="bg-surface border border-hairline rounded-3xl p-12 sm:p-16 text-center space-y-5 shadow-2xs max-w-xl mx-auto animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-hairline flex items-center justify-center mx-auto text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-carbon">
                No Client Commission Archives Yet
              </h3>
              <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed max-w-md mx-auto">
                DESTALION is currently building its studio archive through self-initiated creative explorations and is accepting select commissions for 2026.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleOpenAddWork({ projectType: 'client' })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Client Work</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 pl-5 pr-2 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request a Commission</span>
                  <span className="w-6 h-6 rounded-full bg-[#111114] text-white flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                <span>View Concept Explorations</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-hairline rounded-3xl p-16 text-center space-y-4 shadow-2xs max-w-xl mx-auto">
            <Layers className="w-8 h-8 text-graphite mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-carbon">
                No archived works found
              </h3>
              <p className="text-xs text-graphite leading-relaxed">
                No matching pieces were found matching your current filter criteria.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => { 
                  setSelectedCategory('All'); 
                  setTypeFilter('all');
                  setSearchQuery(''); 
                }}
                className="px-5 py-2 rounded-full bg-surface-secondary hover:bg-hairline/50 text-xs font-semibold text-carbon border border-hairline transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenAddWork()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Work</span>
                </button>
              )}
            </div>
          </div>
        )
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
                    {...adminCardProps}
                  />
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                  <PortfolioCard
                    project={filteredProjects[1]}
                    variant="compact"
                    onSelect={(p) => openCaseStudy(p)}
                    onPreview={(p) => setQuickPreviewProject(p)}
                    {...adminCardProps}
                  />
                  {filteredProjects[2] && (
                    <PortfolioCard
                      project={filteredProjects[2]}
                      variant="compact"
                      onSelect={(p) => openCaseStudy(p)}
                      onPreview={(p) => setQuickPreviewProject(p)}
                      {...adminCardProps}
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
                    {...adminCardProps}
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
                      {...adminCardProps}
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
                  {...adminCardProps}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editorial Closing Invitation */}
      <section className="pt-10 border-t border-hairline">
        <div className="hero-sky-gradient text-white rounded-3xl p-8 sm:p-12 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] uppercase tracking-widest text-white/85 font-bold block">
              · Bespoke Inquiries
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Have a visionary project in mind?
            </h3>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-normal">
              Every commission begins with an open dialogue about your aesthetic ambitions, target deliverables, and deadlines.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('commission-form')}
            className="pl-6 pr-2.5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-3 cursor-pointer shrink-0 btn-tactile"
          >
            <span>Initiate Project Consultation</span>
            <span className="w-8 h-8 rounded-full bg-[#111114] text-white flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
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

      {/* Admin-Only Direct Portfolio Work Editor & Delete Confirmation Modals */}
      {isAdmin && (
        <>
          <PortfolioEditorModal
            isOpen={isEditorOpen}
            project={editingProject}
            defaultCategory={editorDefaultCategory}
            defaultProjectType={editorDefaultType}
            onClose={() => setIsEditorOpen(false)}
          />
          <PortfolioDeleteModal
            project={projectToDelete}
            onClose={() => setProjectToDelete(null)}
          />
        </>
      )}

    </div>
  );
};

