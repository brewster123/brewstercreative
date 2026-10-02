import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SHOP_PRODUCTS } from '../data/shopData';
import { ShopProductCard } from '../components/ShopProductCard';
import { 
  ArrowLeft, 
  ChevronRight, 
  Download, 
  Box, 
  Sparkles, 
  Send, 
  ArrowRight, 
  FileCheck2, 
  Clock,
  ExternalLink,
  Layers,
  Wand2
} from 'lucide-react';
import { ShopProduct, PortfolioProject, ServiceItem } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import { isProductCheckoutAvailable } from '../utils/urlUtils';

export const ProductDetailView: React.FC = () => {
  const { 
    selectedShopProduct, 
    setSelectedShopProduct, 
    setSelectedShopCategory, 
    setActiveView, 
    studioProfile,
    portfolio,
    setSelectedPortfolioProject,
    services,
    setPreselectedService
  } = useApp();

  // Scroll to top upon entering view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedShopProduct]);

  // Resolve product or fallback to the first catalog item
  const product: ShopProduct = selectedShopProduct || SHOP_PRODUCTS[0];
  const isCheckoutAvailable = isProductCheckoutAvailable(product);

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  }, [product.id, product.variants]);

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId) || (product.variants?.[0] ?? null);
  const displayPriceLabel = selectedVariant?.priceLabel || product.priceLabel || (product.price > 0 ? `$${product.price}` : 'Price TBA');

  const [imgError, setImgError] = useState(false);
  const rawImage = product.productImage || product.image;

  useEffect(() => {
    setImgError(false);
  }, [product.id, rawImage]);

  const hasImage = Boolean(rawImage) && !imgError;
  const imageAlt = product.productImageAlt || `${product.name} - ${product.category}`;

  const handleBackToShop = () => {
    setActiveView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryBreadcrumb = () => {
    setSelectedShopCategory(product.category);
    setActiveView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'Available':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Available</span>
          </span>
        );
      case 'In Production':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#71717A] animate-pulse" />
            <span>In Production</span>
          </span>
        );
      case 'Sold Out':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold">
            Sold Out
          </span>
        );
      case 'Coming Soon':
      default:
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
            <span>Coming Soon</span>
          </span>
        );
    }
  };

  const relatedProducts = SHOP_PRODUCTS.filter(p => p.id !== product.id);

  const relatedPortfolioProjects: PortfolioProject[] = (product.relatedPortfolioIds || [])
    .map((id) => portfolio.find((p) => p.id === id))
    .filter((p): p is PortfolioProject => Boolean(p));

  const relatedServices: ServiceItem[] = (product.relatedServiceIds || [])
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is ServiceItem => Boolean(s));

  const handleCommissionCustomVariant = () => {
    if (relatedServices.length > 0) {
      setPreselectedService(relatedServices[0].name);
    } else {
      setPreselectedService(product.category);
    }
    setActiveView('commission-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPortfolioProject = (proj: PortfolioProject) => {
    setSelectedPortfolioProject(proj);
    setActiveView('portfolio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20">
      
      {/* Editorial Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <button
            type="button"
            onClick={handleBackToShop}
            className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
          >
            <span>Storefront</span>
          </button>
          
          <ChevronRight className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
          
          <button
            type="button"
            onClick={handleCategoryBreadcrumb}
            className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          
          <ChevronRight className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
          
          <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        <button
          type="button"
          onClick={handleBackToShop}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </button>
      </div>

      {/* Main Product Showcase: 2-Column Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Product Visual Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[4/3] rounded-xl bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group shadow-xs">
            
            {/* Top Left: Medium Type */}
            <div className="absolute top-4 left-4 z-10">
              <span className="px-2.5 py-1 rounded bg-white/90 dark:bg-[#18181B]/90 text-[#18181B] dark:text-[#EDEDEC] text-[10px] font-mono font-semibold uppercase border border-[#E4E2DC] dark:border-[#27272A] backdrop-blur-xs flex items-center gap-1.5">
                {product.productType === 'Digital' ? (
                  <Download className="w-3 h-3 text-[#EA580C]" />
                ) : (
                  <Box className="w-3 h-3 text-[#EA580C]" />
                )}
                <span>
                  {product.isTemplate 
                    ? 'Digital Template' 
                    : product.isDownloadable 
                    ? 'Digital Asset' 
                    : `${product.productType} Release`}
                </span>
              </span>
            </div>

            {/* Top Right: Status Badge */}
            <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded bg-white/90 dark:bg-[#18181B]/90 border border-[#E4E2DC] dark:border-[#27272A] backdrop-blur-xs">
              {getStatusBadge()}
            </div>

            {/* Artwork / Image Viewport */}
            {hasImage && rawImage ? (
              <img 
                src={rawImage} 
                alt={imageAlt} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono uppercase tracking-wider">
                  {product.category}
                </span>
              </div>
            )}

            {/* Bottom Meta Bar inside visual */}
            <div className="absolute bottom-4 inset-x-4 px-3.5 py-2 rounded-lg bg-black/60 backdrop-blur-xs border border-white/10 flex items-center justify-between text-xs font-mono text-white/90 z-10">
              <span className="font-semibold truncate max-w-[55%]">{product.formats || 'Vector & Master Formats'}</span>
              <span className="text-white/70 truncate max-w-[42%] text-right">
                {product.productImageCredit ? `Photo: ${product.productImageCredit}` : (product.badge || product.category)}
              </span>
            </div>
          </div>

          {/* Studio Craftsmanship Note */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-start gap-3.5">
            <Sparkles className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#18181B] dark:text-[#EDEDEC] block font-display">
                Studio Craft Standards
              </span>
              <p className="text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Engineered to strict studio quality standards by {studioProfile.designerName} using precise grid systems and vector craft.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Specifications */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Header Metadata */}
          <div className="space-y-3 pb-6 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold">
              <span>{product.category}</span>
              {product.isTemplate && <span>· Template Edition</span>}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 pt-1">
              <span className="font-mono text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                {displayPriceLabel}
              </span>
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                Catalog pricing upon storefront release
              </span>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
            {product.shortDescription || product.description}
          </p>

          {/* Variant Selector */}
          {hasVariants && product.variants && (
            <div className="space-y-3 pt-2">
              <label className="font-mono text-xs uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                {product.variantLabel || 'Available Formats / Editions'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'border-[#EA580C] bg-[#FFF7ED] dark:bg-[#78350F]/20 ring-1 ring-[#EA580C]'
                          : 'border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] bg-white dark:bg-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold font-mono ${isSelected ? 'text-[#EA580C]' : 'text-[#18181B] dark:text-[#EDEDEC]'}`}>
                          {variant.name}
                        </span>
                        {variant.priceLabel && (
                          <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                            {variant.priceLabel}
                          </span>
                        )}
                      </div>
                      {variant.description && (
                        <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] line-clamp-1 leading-normal">
                          {variant.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical Specifications Grid (Clean Ledger) */}
          <div className="space-y-3 pt-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
              Asset Specifications
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Medium</span>
                <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {product.isTemplate ? 'Digital Template' : `${product.productType} Asset`}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Master Formats</span>
                <span className="font-bold text-[#18181B] dark:text-[#EDEDEC] font-mono">{product.formats || 'Vector & Source'}</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Status</span>
                <span className="font-bold text-[#EA580C] font-mono">{product.status}</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Delivery</span>
                <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">Digital / Master Export</span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold block">
                Catalog Preparation Notice
              </span>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Direct storefront checkout will open upon launch. If you would like this exact aesthetic customized for your brand mark or collateral, you can initiate a bespoke commission directly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isCheckoutAvailable && product.externalCheckoutUrl && (
                <a
                  href={product.externalCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>{product.externalCheckoutLabel || 'Purchase via External Store'}</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleCommissionCustomVariant}
                className="px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Commission Custom Variant</span>
              </button>

              <button
                type="button"
                onClick={handleBackToShop}
                className="px-4 py-2.5 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC] font-semibold text-xs hover:bg-[#F4F2ED] dark:hover:bg-[#232327] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Storefront Archive</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA]" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Related Services Section */}
      {relatedServices.length > 0 && (
        <section className="pt-10 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
                Custom Practices
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Need Something Custom?
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Commission Brewster for a bespoke identity system, typography, or custom deliverables inspired by {product.name}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveView('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-mono text-[#EA580C] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore All Practices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {relatedServices.map((srv, idx) => (
              <ServiceCard
                key={srv.id}
                service={srv}
                index={idx}
                hideRelatedShopProducts={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Related Portfolio Work Section */}
      {relatedPortfolioProjects.length > 0 && (
        <section className="pt-10 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
                Exhibition Studies
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Related Portfolio Work
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Client commissions and design systems connected to this release.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveView('portfolio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-mono text-[#EA580C] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore Exhibition Archive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedPortfolioProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleSelectPortfolioProject(proj)}
                className="group relative bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#FAF9F6] dark:bg-[#0F0F11]">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded bg-white/90 dark:bg-[#18181B]/90 text-[#18181B] dark:text-[#EDEDEC] text-[10px] font-mono uppercase font-semibold border border-[#E4E2DC] dark:border-[#27272A] backdrop-blur-xs">
                      {proj.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">
                      {proj.client} · {proj.date}
                    </span>
                    <h4 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] group-hover:translate-x-1 transition-all duration-300 line-clamp-1">
                      {proj.title}
                    </h4>
                  </div>

                  <div className="pt-3 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      {proj.tools[0]}
                    </span>
                    <span className="font-semibold text-[#EA580C] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Case Study</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* More from the Studio Shop */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
                Storefront Releases
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                More from the Studio Storefront
              </h3>
            </div>
            <button
              type="button"
              onClick={handleBackToShop}
              className="text-xs font-mono text-[#EA580C] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore All Goods</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedProducts.slice(0, 3).map((p) => (
              <ShopProductCard
                key={p.id}
                product={p}
                actionLabel="Inspect Good"
                onSelect={(prod) => {
                  setSelectedShopProduct(prod);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
