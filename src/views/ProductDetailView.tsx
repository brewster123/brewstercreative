import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SHOP_PRODUCTS } from '../data/shopData';
import { ShopProductCard } from '../components/ShopProductCard';
import { 
  ArrowLeft, 
  ChevronRight, 
  Download, 
  Box, 
  Tag, 
  Palette, 
  Package, 
  Type, 
  Layers, 
  Sparkles, 
  Send, 
  ArrowRight, 
  FileCheck2, 
  Clock 
} from 'lucide-react';
import { ShopProduct } from '../types';

export const ProductDetailView: React.FC = () => {
  const { 
    selectedShopProduct, 
    setSelectedShopProduct, 
    setSelectedShopCategory, 
    setActiveView, 
    studioProfile 
  } = useApp();

  // Scroll to top upon entering view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedShopProduct]);

  // Resolve product or fallback to the first catalog item
  const product: ShopProduct = selectedShopProduct || SHOP_PRODUCTS[0];

  const handleBackToShop = () => {
    setActiveView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryBreadcrumb = () => {
    setSelectedShopCategory(product.category);
    setActiveView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderVisualIcon = () => {
    switch (product.iconName) {
      case 'Tag':
        return <Tag className="w-16 h-16 sm:w-20 sm:h-20 text-orange-500/85 mb-3" />;
      case 'Palette':
        return <Palette className="w-16 h-16 sm:w-20 sm:h-20 text-zinc-600 mb-3" />;
      case 'Package':
        return <Package className="w-16 h-16 sm:w-20 sm:h-20 text-orange-600 mb-3" />;
      case 'Type':
        return <Type className="w-16 h-16 sm:w-20 sm:h-20 text-zinc-700 mb-3" />;
      case 'Layers':
      default:
        return <Layers className="w-16 h-16 sm:w-20 sm:h-20 text-orange-500 mb-3" />;
    }
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'Available':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono-code font-bold border border-emerald-200 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Available Now
          </span>
        );
      case 'In Production':
        return (
          <span className="px-3 py-1 rounded-full bg-white/95 text-zinc-700 text-xs font-mono-code font-bold border border-zinc-200 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
            In Production
          </span>
        );
      case 'Sold Out':
        return (
          <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-xs font-mono-code font-bold border border-zinc-200 shadow-2xs">
            Sold Out
          </span>
        );
      case 'Coming Soon':
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-white/95 text-orange-600 text-xs font-mono-code font-bold border border-orange-200 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Coming Soon
          </span>
        );
    }
  };

  // Other products for "More from the Studio Shop" section
  const relatedProducts = SHOP_PRODUCTS.filter(p => p.id !== product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Navigation & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        
        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono-code flex-wrap">
          <button
            type="button"
            onClick={handleBackToShop}
            className="text-zinc-500 hover:text-orange-600 font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Shop</span>
          </button>
          
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          
          <button
            type="button"
            onClick={handleCategoryBreadcrumb}
            className="text-zinc-500 hover:text-orange-600 font-bold transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          
          <span className="text-zinc-900 font-bold truncate max-w-[200px] sm:max-w-[340px]">
            {product.name}
          </span>
        </nav>

        {/* Back to Shop Action */}
        <button
          type="button"
          onClick={handleBackToShop}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold border border-zinc-200 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Shop</span>
        </button>
      </div>

      {/* Main Product Showcase: 2-Column Bento on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Product Visual Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className={`aspect-[4/3] rounded-[32px] bg-gradient-to-br ${
            product.visualGradient || 'from-orange-100/60 via-amber-50/40 to-zinc-100'
          } border border-zinc-200 shadow-sm flex flex-col items-center justify-center p-8 sm:p-12 text-center relative overflow-hidden group`}>
            
            {/* Top Left: Product Type Pill */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5">
              <span className="px-3 py-1 rounded-full bg-white/95 text-zinc-800 text-xs font-mono-code font-bold border border-zinc-200 shadow-2xs flex items-center gap-1.5">
                {product.productType === 'Digital' ? (
                  <Download className="w-3.5 h-3.5 text-orange-500" />
                ) : (
                  <Box className="w-3.5 h-3.5 text-orange-500" />
                )}
                <span>{product.productType} Release</span>
              </span>
            </div>

            {/* Top Right: Status Badge */}
            <div className="absolute top-4 right-4">
              {getStatusBadge()}
            </div>

            {/* Center Visual Element */}
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2">
                {renderVisualIcon()}
                {product.badge && (
                  <span className="text-sm font-mono-code text-zinc-800 font-bold bg-white/80 px-3 py-1 rounded-lg border border-zinc-200/80 shadow-2xs">
                    {product.badge}
                  </span>
                )}
                <span className="text-xs text-zinc-500 font-mono-code uppercase font-semibold">
                  {product.category}
                </span>
              </div>
            )}

            {/* Bottom Meta Bar inside visual */}
            <div className="absolute bottom-4 inset-x-4 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-xs border border-zinc-200/80 flex items-center justify-between text-xs font-mono-code text-zinc-600">
              <span className="font-bold">{product.formats || 'Vector & Master Formats'}</span>
              <span className="text-zinc-500 font-semibold">{product.badge || product.category}</span>
            </div>
          </div>

          {/* Studio Craftsmanship Callout */}
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-zinc-900 block font-display">
                Studio Craft Standards
              </span>
              <p className="text-zinc-500 leading-relaxed font-medium">
                Engineered to strict studio quality standards by {studioProfile.designerName} using precise grid systems and vector craft.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Product Information & Specifications */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Header Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code uppercase font-bold tracking-wider border border-orange-200">
                {product.category}
              </span>
              {product.badge && (
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-mono-code font-bold border border-zinc-200">
                  {product.badge}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Pricing / Non-purchasable Indicator */}
            <div className="flex items-center gap-3 pt-1">
              <div className="px-3 py-1 rounded-xl bg-zinc-900 text-white font-mono-code font-bold text-sm sm:text-base shadow-2xs">
                {product.priceLabel || 'Price TBA'}
              </div>
              <span className="text-xs text-zinc-400 font-mono-code">
                • Official catalog pricing announced upon release
              </span>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-medium">
            {product.shortDescription}
          </p>

          {/* Full Studio Description */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E5E5E5] space-y-3 shadow-2xs">
            <h3 className="font-display text-sm font-bold text-zinc-900 uppercase tracking-wider text-xs">
              Design Overview & Utility
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
              {product.description}
            </p>
          </div>

          {/* Technical Specifications Grid */}
          <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-6 space-y-4 shadow-2xs">
            <h3 className="font-display font-bold text-sm text-zinc-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-orange-500" />
              <span>Asset Specifications</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
                <span className="text-zinc-400 font-mono-code text-[11px] block">Category</span>
                <span className="font-bold text-zinc-800">{product.category}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
                <span className="text-zinc-400 font-mono-code text-[11px] block">Product Medium</span>
                <span className="font-bold text-zinc-800">{product.productType} Asset</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
                <span className="text-zinc-400 font-mono-code text-[11px] block">File Formats</span>
                <span className="font-bold text-zinc-800 font-mono-code">{product.formats || 'Vector & Source'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
                <span className="text-zinc-400 font-mono-code text-[11px] block">Current Status</span>
                <span className="font-bold text-orange-600 font-mono-code">{product.status}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono-code text-zinc-400 uppercase font-bold tracking-wider">
                Tags & Descriptors
              </span>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-mono-code transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Honest Catalog Status Action Card */}
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-zinc-50 via-orange-50/20 to-zinc-50 border border-orange-200/70 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-mono-code font-bold text-orange-700 uppercase tracking-wider">
                  Catalog Drop In Preparation
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                This item is scheduled for the initial Brewster Creative catalog release. Direct checkout and file downloads will be enabled upon official storefront launch.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveView('commission-form');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Commission Custom Variant</span>
              </button>

              <button
                type="button"
                onClick={handleBackToShop}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs sm:text-sm border border-zinc-200 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Browse More Goods</span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Related Products Section ("More from the Studio Shop") */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-zinc-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-zinc-900">
                More from the Studio Shop
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Explore additional upcoming releases and design assets from Brewster Creative.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackToShop}
              className="text-xs font-mono-code text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>View All Shop Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ShopProductCard
                key={p.id}
                product={p}
                onSelect={(prod) => {
                  setSelectedShopProduct(prod);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Studio Commission Bridge Banner */}
      <div className="bg-zinc-950 text-white rounded-[32px] p-8 sm:p-12 relative overflow-hidden shadow-md">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-orange-400 text-xs font-mono-code font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-zinc-700">
            <Sparkles className="w-3.5 h-3.5" />
            Bespoke Creative Commissions
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black tracking-tight">
            Looking for something tailored specifically to your company?
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
            Every studio asset can be commissioned as a comprehensive custom brand package. Get direct collaboration, iterative interactive proofing, and tailored final delivery.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveView('commission-form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
