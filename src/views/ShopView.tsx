import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Sparkles, 
  Layers, 
  Download, 
  ShieldCheck, 
  Send, 
  ArrowRight, 
  Package, 
  Palette, 
  Tag,
  Type,
  Box,
  RotateCcw
} from 'lucide-react';
import { ShopCategoryName } from '../types';
import { SHOP_CATEGORIES, UPCOMING_SHOP_RELEASES } from '../data/shopData';

export const ShopView: React.FC = () => {
  const { setActiveView, studioProfile } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<ShopCategoryName>('All');

  const currentCategory = SHOP_CATEGORIES.find(c => c.name === selectedCategory) || SHOP_CATEGORIES[0];

  const filteredReleases = UPCOMING_SHOP_RELEASES.filter(release => {
    if (selectedCategory === 'All') return true;
    return release.category === selectedCategory;
  });

  const shopHighlights = [
    {
      icon: Download,
      title: 'Instant Digital Delivery',
      desc: 'Immediate access to high-resolution master assets, source files (AI, EPS, SVG), and print-ready formats upon purchase.',
    },
    {
      icon: ShieldCheck,
      title: 'Commercial Use Ready',
      desc: 'Clear, straightforward licensing permitting commercial client usage, merchandising, and unrestricted digital publishing.',
    },
    {
      icon: Palette,
      title: 'Studio Production Standards',
      desc: 'Every asset is crafted with the exact precision, grid systems, and aesthetic rigor applied to bespoke client commissions.',
    },
    {
      icon: Layers,
      title: 'Bespoke Customization',
      desc: 'Need a shop template customized for your specific brand? Seamlessly transition any item into an active custom commission.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Shop Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code uppercase tracking-wider font-bold border border-orange-200 shadow-2xs">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Official Studio Storefront</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight">
          Brewster Creative Shop
        </h1>

        <p className="text-sm sm:text-base text-zinc-500 leading-relaxed font-medium">
          Curated digital design assets, branding kits, typography, and original artwork crafted with obsessive detail by {studioProfile.designerName}.
        </p>
      </div>

      {/* Category Navigation Pills (Phase 4A.2 Functional Categories) */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {SHOP_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Primary Storefront Announcement & Feature Bento */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-10 shadow-xs relative overflow-hidden space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-200/80">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-xs font-mono-code text-orange-600 font-bold uppercase tracking-wider">
                Store Catalog In Preparation
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
              Curated Digital Products & Creative Assets
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
              We are assembling a curated catalog of premium vector packs, brand identity starters, and editorial poster prints. The shop system is being connected directly to our client portal for seamless fulfillment and download management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Request Custom Commission</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs sm:text-sm border border-zinc-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore Portfolio</span>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Studio Shop Quality Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {shopHighlights.map((highlight, idx) => {
            const Icon = highlight.icon;
            return (
              <div 
                key={idx}
                className="p-5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 space-y-2.5 transition-all hover:bg-zinc-50 hover:border-zinc-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-orange-500 shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-zinc-900">
                  {highlight.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  {highlight.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catalog Releases Grid with Category Filtering & Empty States */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-display text-lg sm:text-xl font-bold text-zinc-900">
                {selectedCategory === 'All' ? 'Upcoming Studio Releases' : `${selectedCategory} Releases`}
              </h3>
              <span className="text-[11px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                {filteredReleases.length} {filteredReleases.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {currentCategory.description}
            </p>
          </div>
          <span className="text-xs font-mono-code text-zinc-400 bg-white px-3 py-1 rounded-full border border-zinc-200 font-bold self-start sm:self-auto">
            Phase 4 Collection
          </span>
        </div>

        {filteredReleases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredReleases.map((release) => (
              <div 
                key={release.id}
                className="bg-white border border-[#E5E5E5] rounded-[28px] p-5 space-y-4 shadow-xs relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${
                    release.iconName === 'Tag'
                      ? 'from-orange-100/60 via-amber-50/40 to-zinc-100'
                      : release.iconName === 'Palette'
                      ? 'from-zinc-100 via-stone-50 to-orange-50/50'
                      : 'from-amber-50/60 via-orange-50/30 to-zinc-100'
                  } border border-zinc-200 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group`}>
                    {release.iconName === 'Tag' && <Tag className="w-8 h-8 text-orange-500/80 mb-2" />}
                    {release.iconName === 'Palette' && <Palette className="w-8 h-8 text-zinc-600 mb-2" />}
                    {release.iconName === 'Package' && <Package className="w-8 h-8 text-orange-600 mb-2" />}
                    
                    <span className="text-xs font-mono-code text-zinc-600 font-bold">{release.badge}</span>
                    <span className="text-[10px] text-zinc-400 font-mono-code uppercase mt-1">{release.typeLabel}</span>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/90 text-orange-600 text-[10px] font-mono-code font-bold border border-orange-200 shadow-2xs">
                      {release.status}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono-code uppercase tracking-wider text-orange-600 font-bold">
                      {release.tagline}
                    </span>
                    <h4 className="font-display font-bold text-base text-zinc-900 mt-0.5">
                      {release.title}
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium mt-1">
                      {release.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="font-mono-code font-bold text-zinc-800">{release.formats}</span>
                  <span className="text-[11px] font-mono-code text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    {release.phaseTag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State for Categories in Production (e.g. Typography, Digital Mockups) */
          <div className="bg-white border border-dashed border-zinc-300 rounded-[28px] p-8 sm:p-14 text-center space-y-5 max-w-xl mx-auto shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto shadow-2xs">
              {selectedCategory === 'Typography' ? (
                <Type className="w-7 h-7" />
              ) : selectedCategory === 'Digital Mockups' ? (
                <Layers className="w-7 h-7" />
              ) : (
                <Box className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-mono-code font-bold border border-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span>In Studio Production</span>
              </div>
              <h4 className="font-display font-bold text-xl sm:text-2xl text-zinc-900">
                New {selectedCategory} Products Coming Soon
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed font-medium">
                New {selectedCategory} releases are currently in production. Check back soon for the official catalog release.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>View All Categories</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Custom {selectedCategory}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Commission Bridge Banner */}
      <div className="bg-zinc-950 text-white rounded-[32px] p-8 sm:p-12 relative overflow-hidden shadow-md">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-orange-400 text-xs font-mono-code font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-zinc-700">
            <Sparkles className="w-3.5 h-3.5" />
            Custom Commission Service
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black tracking-tight">
            Need a custom design crafted exclusively for your brand?
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
            While standard templates are ideal for quick turnarounds, Brewster Creative specializes in one-of-a-kind bespoke visual identities, logo marks, and multimedia campaigns with interactive client proof review.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Start a Custom Commission</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
