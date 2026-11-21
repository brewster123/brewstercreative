import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Layers, 
  Download, 
  Send, 
  ArrowUpRight,
  Palette, 
  Type, 
  Box, 
  RotateCcw,
  Plus,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';
import { ShopProduct } from '../types';
import { SHOP_CATEGORIES } from '../data/shopData';
import { ShopProductCard } from '../components/ShopProductCard';
import { ScrollReveal } from '../components/ScrollMotion';
import {
  ShopDashboardModal,
  ShopEditorModal,
  ShopDeleteModal,
} from '../components/admin/ShopEditorModal';

export const ShopView: React.FC = () => {
  const { 
    currentUser,
    shopProducts,
    updateShopProduct,
    setActiveView, 
    selectedShopCategory,
    setSelectedShopCategory,
    setSelectedShopProduct
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const filteredProducts = shopProducts.filter(product => {
    if (selectedShopCategory === 'All') return true;
    return product.category === selectedShopCategory;
  });

  const handleProductSelect = (product: ShopProduct) => {
    setSelectedShopProduct(product);
    setActiveView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddProduct = () => {
    if (!isAdmin) return;
    setAdminError(null);
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditProduct = (product: ShopProduct) => {
    if (!isAdmin) return;
    setAdminError(null);
    setEditingProduct(product);
    setIsEditorOpen(true);
  };

  const handleRequestDeleteProduct = (product: ShopProduct) => {
    if (!isAdmin) return;
    setAdminError(null);
    setProductToDelete({ id: product.id, name: product.name });
  };

  const handleToggleFeaturedProduct = async (product: ShopProduct) => {
    if (!isAdmin) return;
    setAdminError(null);
    const res = await updateShopProduct(product.id, { featured: !product.featured });
    if (res && !res.success) {
      setAdminError(res.error || 'Failed to update featured status.');
    }
  };

  const adminCardProps = isAdmin
    ? {
        onEdit: handleOpenEditProduct,
        onDelete: handleRequestDeleteProduct,
        onToggleFeatured: handleToggleFeaturedProduct,
      }
    : {};

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
        
        {/* Category Filter Strip + Right-Aligned Studio Archive / Admin Shop Dashboard Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-3">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1" aria-label="Shop categories">
            {SHOP_CATEGORIES.map((cat) => {
              const isSelected = selectedShopCategory === cat.name;
              const count = cat.name === 'All' 
                ? shopProducts.length 
                : shopProducts.filter(p => p.category === cat.name).length;

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

          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <span className={`text-xs text-graphite ${isAdmin ? 'hidden lg:inline' : 'hidden sm:inline'}`}>
              Studio Goods Archive
            </span>

            {isAdmin && (
              <>
                <button
                  id="btn-shop-dashboard-edit"
                  type="button"
                  onClick={() => setIsDashboardOpen(true)}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-secondary hover:bg-surface border border-hairline text-carbon text-xs font-semibold transition-colors cursor-pointer shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
                  <span>Edit Shop</span>
                </button>

                <button
                  id="btn-shop-add-edition"
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="btn-tactile inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Edition</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Admin Error Notice */}
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

        {/* Product Cards Grid or Empty State */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product, idx) => (
              <ScrollReveal key={product.id} delay={(idx % 3) * 0.08} y={24}>
                <ShopProductCard 
                  product={product}
                  onSelect={handleProductSelect}
                  {...adminCardProps}
                />
              </ScrollReveal>
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
                {selectedShopCategory === 'All'
                  ? 'No Storefront Editions Published Yet'
                  : `${selectedShopCategory} Releases Coming Soon`}
              </h3>
              <p className="text-xs text-graphite-strong max-w-md mx-auto leading-relaxed">
                {isAdmin
                  ? 'Add a new storefront edition directly to populate this category with pricing, artwork, and formats.'
                  : `New ${selectedShopCategory} assets are currently being typeset and tested in the studio. Direct ordering activates with the catalog release.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="btn-tactile px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {selectedShopCategory === 'All' ? 'Edition' : selectedShopCategory}</span>
                </button>
              )}
              {selectedShopCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedShopCategory('All')}
                  className="px-5 py-2.5 rounded-full bg-[#111114] dark:bg-white text-white dark:text-[#111114] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>View All Categories</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveView('commission-form')}
                className="px-5 py-2.5 rounded-full border border-hairline text-carbon text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 hover:bg-surface-secondary"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Custom {selectedShopCategory === 'All' ? 'Asset' : selectedShopCategory}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Studio Production Standards & Quality Highlights */}
      <section className="pt-10 border-t border-hairline space-y-10">
        <ScrollReveal className="max-w-2xl space-y-2">
          <span className="text-[11px] uppercase tracking-widest text-accent font-bold">
            · Quality &amp; Specifications
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            Crafted for Rigorous Creative Workflows
          </h2>
          <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed">
            Every digital asset and tactile print release is calibrated to the strict aesthetic and technical criteria of DESTALION.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shopHighlights.map((highlight, idx) => {
            const Icon = highlight.icon;
            return (
              <ScrollReveal key={idx} delay={idx * 0.08} className="h-full">
                <div className="h-full p-6 rounded-3xl bg-surface-secondary border border-hairline space-y-3">
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
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Commission Bridge Banner */}
      <section className="pt-6">
        <ScrollReveal y={28} scale={0.98}>
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
        </ScrollReveal>
      </section>

      {/* Admin-Only Shop Catalog Dashboard & Modals */}
      {isAdmin && (
        <>
          <ShopDashboardModal
            isOpen={isDashboardOpen}
            onClose={() => setIsDashboardOpen(false)}
            onAddNew={handleOpenAddProduct}
            onEditProduct={(prod) => handleOpenEditProduct(prod)}
            onDeleteProduct={(prod) => handleRequestDeleteProduct(prod)}
          />

          <ShopEditorModal
            isOpen={isEditorOpen}
            product={editingProduct}
            defaultCategory={selectedShopCategory}
            onClose={() => {
              setIsEditorOpen(false);
              setEditingProduct(null);
            }}
          />

          <ShopDeleteModal
            product={productToDelete}
            onClose={() => setProductToDelete(null)}
          />
        </>
      )}

    </div>
  );
};
