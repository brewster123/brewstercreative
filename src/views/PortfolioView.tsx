import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PortfolioCard } from '../components/PortfolioCard';
import { PortfolioModal } from '../components/PortfolioModal';
import { Sparkles, Search, Filter, Layers, Send, ShieldCheck } from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const { 
    portfolio, 
    selectedPortfolioProject, 
    setSelectedPortfolioProject,
    setActiveView,
    currentUser
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    const matchesCategory = selectedCategory === 'All' || project.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      project.tools.some(tool => tool.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Portfolio Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code uppercase tracking-wider font-bold border border-orange-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Showcase of Selected Works</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight">
          Visual Identity & Multimedia Gallery
        </h1>

        <p className="text-sm sm:text-base text-zinc-500 leading-relaxed font-normal">
          Explore previous graphic design commissions, logo systems, poster artworks, book covers, and custom creative campaigns.
        </p>
      </div>

      {/* Admin Notice & Quick Edit Button */}
      {currentUser?.role === 'admin' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-emerald-950 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Studio Admin View (Brewster A. Cabando): You can add new projects, update existing artwork, or delete items.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('admin-dashboard')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl whitespace-nowrap shadow-xs transition-colors"
          >
            Manage Portfolio in Admin Portal →
          </button>
        </div>
      )}

      {/* Filter Bar & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-[#E5E5E5] p-4 rounded-[24px] shadow-xs">
        
        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border border-zinc-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-portfolio-search"
            type="text"
            placeholder="Search projects, tools, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-16 text-center space-y-3 shadow-xs">
          <Layers className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="font-display text-lg font-black text-zinc-800">
            No projects found matching your criteria
          </h3>
          <p className="text-xs text-zinc-500 font-medium">
            Try adjusting your search query or selecting a different category filter.
          </p>
          <button
            type="button"
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-2 px-4 py-2 rounded-full bg-zinc-100 text-xs text-orange-600 font-bold hover:bg-zinc-200 border border-zinc-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <PortfolioCard
              key={project.id}
              project={project}
              onSelect={(p) => setSelectedPortfolioProject(p)}
            />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-black text-zinc-900">
            Ready to bring your own vision to life?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            Let's design a tailor-made visual package for your upcoming brand or release.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveView('commission-form')}
          className="px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Commission a Project</span>
        </button>
      </div>

      {/* Deep Dive Project Modal */}
      {selectedPortfolioProject && (
        <PortfolioModal
          project={selectedPortfolioProject}
          onClose={() => setSelectedPortfolioProject(null)}
        />
      )}

    </div>
  );
};
