import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Sparkles, 
  Layers, 
  Download, 
  Send, 
  ArrowUpRight,
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
    <div className="bg-canvas max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-16 space-y-16 sm:space-y-20">
      
      {/* Catalog Section with Category Navigation */}
      <div className="space-y-8">
        
        {/* Simple Text Navigation Category Filter */}
        <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
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
                  className={`relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-carbon font-bold'
                      : 'text-graphite hover:text-carbon'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] font-normal tabular-nums ${isSelected ? 'text-accent font-semibold' : 'text-graphite'}`}>
                    ({count})
                  </span>
                  {isSelected && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 bg-accent rounded-full animate-in fade-in duration-200" />
                  )}
                </button>
              );
            })}
          </nav>

          <span className="text-xs text-graphite hidden sm:inline">
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
          <div className="bg-surface border border-hairline rounded-3xl p-12 sm:p-16 text-center space-y-4 max-w-xl mx-auto shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-hairline text-accent flex items-center justify-center mx-auto">
              {selectedShopCategory === 'Typography' ? (
                <Type className="w-6 h-6" />
              ) : selectedShopCategory === 'Digital Mockups' ? (
                <Layers className="w-6 h-6" />
              ) : (
                <Box className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                In Studio Production
              </span>
              <h3 className="font-display font-bold text-xl text-carbon">
                {selectedShopCategory} Releases Coming Soon
              </h3>
              <p className="text-xs text-graphite-strong max-w-md mx-auto leading-relaxed">
                New {selectedShopCategory} assets are currently being typeset and tested in the studio. Direct ordering activates with the catalog release.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedShopCategory('All')}
                className="px-5 py-2.5 rounded-full bg-[#111114] dark:bg-white text-white dark:text-[#111114] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>View All Categories</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="px-5 py-2.5 rounded-full border border-hairline text-carbon text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 hover:bg-surface-secondary"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Custom {selectedShopCategory}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Studio Production Standards & Quality Highlights */}
      <section className="pt-10 border-t border-hairline space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] uppercase tracking-widest text-accent font-bold">
            · Quality &amp; Specifications
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            Crafted for Rigorous Creative Workflows
          </h2>
          <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed">
            Every digital asset and tactile print release is calibrated to the strict aesthetic and technical criteria of DESTALION.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shopHighlights.map((highlight, idx) => {
            const Icon = highlight.icon;
            return (
              <div 
                key={idx} 
                className="p-6 rounded-3xl bg-surface-secondary border border-hairline space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-surface border border-hairline text-accent flex items-center justify-center shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold text-carbon">
                  {highlight.title}
                </h3>
                <p className="text-xs text-graphite-strong leading-relaxed">
                  {highlight.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Commission Bridge Banner */}
      <section className="pt-6">
        <div className="hero-sky-gradient text-white rounded-3xl p-8 sm:p-12 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] uppercase tracking-widest text-white/85 font-bold block">
              · Bespoke Studio Directives
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Need a custom asset crafted exclusively for your brand?
            </h3>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-normal">
              While studio templates provide immediate utility, DESTALION specializes in one-of-a-kind visual identities, brand systems, and multimedia campaigns with interactive client reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('commission-form')}
            className="pl-6 pr-2.5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-3 cursor-pointer shrink-0 btn-tactile"
          >
            <span>Initiate Custom Brief</span>
            <span className="w-8 h-8 rounded-full bg-[#111114] text-white flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </section>

    </div>
  );
};
