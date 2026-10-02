import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Sparkles, 
  Layers, 
  Download, 
  Send, 
  ArrowRight, 
  Palette, 
  Type, 
  Box, 
  RotateCcw 
} from 'lucide-react';
import { ShopProduct } from '../types';
import { SHOP_CATEGORIES, SHOP_PRODUCTS } from '../data/shopData';
import { ShopProductCard } from '../components/ShopProductCard';

export const ShopView: React.FC = () => {
  const { 
    setActiveView, 
    studioProfile,
    selectedShopCategory,
    setSelectedShopCategory,
    setSelectedShopProduct
  } = useApp();

  const currentCategory = SHOP_CATEGORIES.find(c => c.name === selectedShopCategory) || SHOP_CATEGORIES[0];

  const filteredProducts = SHOP_PRODUCTS.filter(product => {
    if (selectedShopCategory === 'All') return true;
    return product.category === selectedShopCategory;
  });

  const handleProductSelect = (product: ShopProduct) => {
    setSelectedShopProduct(product);
    setActiveView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shopHighlights = [
    {
      icon: Download,
      title: 'Digital Master Delivery',
      desc: 'Source files in scalable vector formats (AI, EPS, SVG), layered PSDs, and press-ready PDFs upon release.',
    },
    {
      icon: Sparkles,
      title: 'Curated Design Systems',
      desc: 'Structured asset kits, display typography, and vector resources calibrated for professional production workflows.',
    },
    {
      icon: Palette,
      title: 'Studio Craftsmanship',
      desc: 'Each release is crafted with identical mathematical rigor, typographic hierarchy, and attention to detail as bespoke commissions.',
    },
    {
      icon: Layers,
      title: 'Bespoke Adaptation',
      desc: 'Require an asset customized for your specific brand marks or color space? Seamlessly transition any item into a commissioned brief.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20">
      
      {/* Editorial Shop Header */}
      <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-8 sm:pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
              <span>Studio Storefront & Editions</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-5.5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight leading-[1.08]">
              Editions, Prints & Design Assets
            </h1>

            <p className="text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
              An ongoing release of digital design systems, display typography, screen-print posters, and vector libraries created by {studioProfile.designerName}.
            </p>
          </div>

          <div className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] self-start md:self-end">
            <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{filteredProducts.length}</span> Curated Editions
          </div>
        </div>

        {/* Storefront Preparation Notice Strip */}
        <div className="mt-8 p-4 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse shrink-0" />
            <p className="text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-medium">
              <span className="font-bold text-[#18181B] dark:text-[#EDEDEC] font-mono uppercase tracking-wider text-[11px] mr-1.5">
                Catalog in Preparation:
              </span>
              Direct purchasing activates upon launch. In the interim, all goods can be commissioned as customized variants.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveView('commission-form')}
              className="px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Commission Variant</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('portfolio')}
              className="px-3.5 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] font-semibold text-xs border border-[#E4E2DC] dark:border-[#27272A] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Exhibitions</span>
              <ArrowRight className="w-3 h-3 text-[#A1A1AA]" />
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Section with Category Navigation */}
      <div className="space-y-8">
        
        {/* Simple Text Navigation Category Filter */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E4E2DC] dark:border-[#27272A] pb-3">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1" aria-label="Shop categories">
            {SHOP_CATEGORIES.map((cat) => {
              const isSelected = selectedShopCategory === cat.name;
              const count = cat.name === 'All' 
                ? SHOP_PRODUCTS.length 
                : SHOP_PRODUCTS.filter(p => p.category === cat.name).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedShopCategory(cat.name)}
                  className={`relative px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-[#18181B] dark:text-[#EDEDEC] font-bold'
                      : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] font-mono font-normal ${isSelected ? 'text-[#EA580C]' : 'text-[#A1A1AA]'}`}>
                    ({count})
                  </span>
                  {isSelected && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#EA580C] rounded-full animate-in fade-in duration-200" />
                  )}
                </button>
              );
            })}
          </nav>

          <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] hidden sm:inline">
            Studio Goods Archive
          </span>
        </div>

        {/* Product Cards Grid or Empty State */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ShopProductCard 
                key={product.id}
                product={product}
                onSelect={handleProductSelect}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-12 sm:p-16 text-center space-y-4 max-w-xl mx-auto shadow-2xs">
            <div className="w-12 h-12 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-[#EA580C] flex items-center justify-center mx-auto">
              {selectedShopCategory === 'Typography' ? (
                <Type className="w-6 h-6" />
              ) : selectedShopCategory === 'Digital Mockups' ? (
                <Layers className="w-6 h-6" />
              ) : (
                <Box className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold">
                In Studio Production
              </span>
              <h3 className="font-display font-bold text-xl text-[#18181B] dark:text-[#EDEDEC]">
                {selectedShopCategory} Releases Coming Soon
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
                New {selectedShopCategory} assets are currently being typeset and tested in the studio. Direct ordering activates with the catalog release.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedShopCategory('All')}
                className="px-4 py-2 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>View All Categories</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 hover:bg-[#F4F2ED] dark:hover:bg-[#232327]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Custom {selectedShopCategory}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Studio Production Standards & Quality Highlights */}
      <section className="pt-10 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
            Quality & Specifications
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
            Crafted for Rigorous Creative Workflows
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            Every digital asset and tactile print release is calibrated to the strict aesthetic and technical criteria of Brewster Creative.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {shopHighlights.map((highlight, idx) => {
            const Icon = highlight.icon;
            return (
              <div 
                key={idx} 
                className="space-y-3 pb-6 border-b border-[#E4E2DC] dark:border-[#27272A] sm:border-b-0"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-[#EA580C] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {highlight.title}
                </h3>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  {highlight.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Commission Bridge Banner */}
      <section className="pt-6">
        <div className="bg-[#18181B] dark:bg-[#18181B] text-white rounded-xl p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-transparent dark:border-[#27272A]">
          <div className="space-y-2 max-w-xl">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
              Bespoke Studio Directives
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Need a custom asset crafted exclusively for your brand?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              While studio templates provide immediate utility, Brewster specializes in one-of-a-kind visual identities, brand systems, and multimedia campaigns with interactive client reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('commission-form')}
            className="px-6 py-3.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Initiate Custom Brief</span>
          </button>
        </div>
      </section>

    </div>
  );
};
