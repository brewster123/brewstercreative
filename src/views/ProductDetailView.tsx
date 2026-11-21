import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShopProductCard } from '../components/ShopProductCard';
import { ShopEditorModal } from '../components/admin/ShopEditorModal';
import { 
  ArrowLeft, 
  ChevronRight, 
  Download, 
  Box, 
  Sparkles, 
  ArrowRight, 
  ArrowUpRight,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { ShopProduct, PortfolioProject, ServiceItem } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import { isProductCheckoutAvailable } from '../utils/urlUtils';

export const ProductDetailView: React.FC = () => {
  const { 
    currentUser,
    shopProducts,
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

  const isAdmin = currentUser?.role === 'admin';
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Scroll to top upon entering view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedShopProduct?.id]);

  // Resolve live product from reactive catalog or fallback to first available item
  const product: ShopProduct | undefined =
    (selectedShopProduct && shopProducts.find((p) => p.id === selectedShopProduct.id)) ||
    selectedShopProduct ||
    shopProducts[0];

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const rawImage = product?.productImage || product?.image;

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  }, [product?.id, product?.variants]);

  useEffect(() => {
    setImgError(false);
  }, [product?.id, rawImage]);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-carbon">No Edition Selected</h2>
        <button
          type="button"
          onClick={() => setActiveView('shop')}
          className="px-5 py-2.5 rounded-full bg-surface-secondary border border-hairline text-xs font-semibold text-carbon hover:bg-surface cursor-pointer"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const isCheckoutAvailable = isProductCheckoutAvailable(product);
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId) || (product.variants?.[0] ?? null);
  const currencySymbol = studioProfile?.currencySymbol || '₱';
  const displayPriceLabel = selectedVariant?.priceLabel || product.priceLabel || (product.price > 0 ? `${currencySymbol}${product.price.toLocaleString()}` : 'Price TBA');
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
          <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Available</span>
          </span>
        );
      case 'In Production':
        return (
          <span className="text-[10px] uppercase tracking-wider text-graphite font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-graphite" />
            <span>In Production</span>
          </span>
        );
      case 'Sold Out':
        return (
          <span className="text-[10px] uppercase tracking-wider text-graphite font-semibold">
            Sold Out
          </span>
        );
      case 'Coming Soon':
      default:
        return (
          <span className="text-[10px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Coming Soon</span>
          </span>
        );
    }
  };

  const relatedProducts = shopProducts.filter(p => p.id !== product.id);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs flex-wrap">
          <button
            type="button"
            onClick={handleBackToShop}
            className="text-graphite hover:text-carbon transition-colors cursor-pointer"
          >
            <span>Storefront</span>
          </button>
          
          <ChevronRight className="w-3.5 h-3.5 text-graphite shrink-0" />
          
          <button
            type="button"
            onClick={handleCategoryBreadcrumb}
            className="text-graphite hover:text-carbon transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          
          <ChevronRight className="w-3.5 h-3.5 text-graphite shrink-0" />
          
          <span className="text-carbon font-semibold truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="btn-tactile inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Edition</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleBackToShop}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-graphite hover:text-carbon hover:bg-surface-secondary transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>

      {/* Main Product Showcase: 2-Column Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Product Visual Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[4/3] rounded-3xl bg-surface-secondary border border-hairline flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group shadow-xs">
            
            {/* Top Left: Medium Type */}
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 rounded-full bg-surface/90 text-carbon text-[10px] font-semibold uppercase border border-hairline backdrop-blur-xs flex items-center gap-1.5">
                {product.productType === 'Digital' ? (
                  <Download className="w-3 h-3 text-accent" />
                ) : (
                  <Box className="w-3 h-3 text-accent" />
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
            <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-surface/90 border border-hairline backdrop-blur-xs">
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
                <span className="text-xs text-graphite uppercase tracking-wider">
                  {product.category}
                </span>
              </div>
            )}

            {/* Bottom Meta Bar inside visual */}
            <div className="absolute bottom-4 inset-x-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xs border border-white/10 flex items-center justify-between text-xs text-white/90 z-10">
              <span className="font-semibold truncate max-w-[55%]">{product.formats || 'Vector & Master Formats'}</span>
              <span className="text-white/70 truncate max-w-[42%] text-right">
                {product.productImageCredit ? `Photo: ${product.productImageCredit}` : (product.badge || product.category)}
              </span>
            </div>
          </div>

          {/* Studio Craftsmanship Note */}
          <div className="p-5 rounded-3xl bg-surface border border-hairline flex items-start gap-3.5">
            <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-carbon block font-display">
                Studio Craft Standards
              </span>
              <p className="text-graphite-strong leading-relaxed">
                Engineered to strict studio quality standards by {studioProfile.designerName} using precise grid systems and vector craft.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Specifications */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Header Metadata */}
          <div className="space-y-3 pb-6 border-b border-hairline">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold">
              <span>{product.category}</span>
              {product.isTemplate && <span>· Template Edition</span>}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-carbon tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 pt-1">
              <span className="text-2xl font-bold text-carbon tabular-nums">
                {displayPriceLabel}
              </span>
              <span className="text-xs text-graphite">
                Catalog pricing upon storefront release
              </span>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-sm sm:text-base text-graphite-strong leading-relaxed font-normal">
            {product.shortDescription || product.description}
          </p>

          {/* Variant Selector */}
          {hasVariants && product.variants && (
            <div className="space-y-3 pt-2">
              <label className="text-xs uppercase tracking-wider text-graphite font-semibold block">
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
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'border-accent bg-[#E0F2FE]/60 dark:bg-[#0C4A6E]/30 ring-1 ring-accent'
                          : 'border-hairline hover:border-accent/40 bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-carbon'}`}>
                          {variant.name}
                        </span>
                        {variant.priceLabel && (
                          <span className="text-[10px] text-graphite tabular-nums">
                            {variant.priceLabel}
                          </span>
                        )}
                      </div>
                      {variant.description && (
                        <p className="text-[11px] text-graphite line-clamp-1 leading-normal">
                          {variant.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical Specifications Grid */}
          <div className="space-y-3 pt-2">
            <span className="text-xs uppercase tracking-wider text-graphite font-semibold block">
              Asset Specifications
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface border border-hairline space-y-1">
                <span className="text-graphite text-[10px] uppercase block">Medium</span>
                <span className="font-bold text-carbon">
                  {product.isTemplate ? 'Digital Template' : `${product.productType} Asset`}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface border border-hairline space-y-1">
                <span className="text-graphite text-[10px] uppercase block">Master Formats</span>
                <span className="font-bold text-carbon">{product.formats || 'Vector & Source'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface border border-hairline space-y-1">
                <span className="text-graphite text-[10px] uppercase block">Status</span>
                <span className="font-bold text-accent">{product.status}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface border border-hairline space-y-1">
                <span className="text-graphite text-[10px] uppercase block">Delivery</span>
                <span className="font-bold text-carbon">Digital / Master Export</span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="p-6 rounded-3xl bg-surface border border-hairline space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-accent font-semibold block">
                Catalog Preparation Notice
              </span>
              <p className="text-xs text-graphite-strong leading-relaxed">
                Direct storefront checkout will open upon launch. If you would like this exact aesthetic customized for your brand mark or collateral, you can initiate a bespoke commission directly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isCheckoutAvailable && product.externalCheckoutUrl && (
                <a
                  href={product.externalCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-[#111114] dark:bg-white text-white dark:text-[#111114] font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4FF38] dark:text-[#0284C7]" />
                  <span>{product.externalCheckoutLabel || 'Purchase via External Store'}</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleCommissionCustomVariant}
                className="pl-5 pr-2 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs uppercase tracking-wider shadow-xs flex items-center gap-2.5 transition-all cursor-pointer btn-tactile"
              >
                <span>Commission Custom Variant</span>
                <span className="w-7 h-7 rounded-full bg-[#111114] text-white flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={handleBackToShop}
                className="px-5 py-2.5 rounded-full border border-hairline text-carbon font-semibold text-xs hover:bg-surface-secondary flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Storefront Archive</span>
                <ArrowRight className="w-3.5 h-3.5 text-graphite" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Related Services Section */}
      {relatedServices.length > 0 && (
        <section className="pt-10 border-t border-hairline space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block mb-1">
                Custom Practices
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                Need Something Custom?
              </h3>
              <p className="text-xs text-graphite-strong">
                Commission DESTALION for a bespoke identity system, typography, or custom deliverables inspired by {product.name}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveView('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
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
        <section className="pt-10 border-t border-hairline space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block mb-1">
                Exhibition Studies
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                Related Portfolio Work
              </h3>
              <p className="text-xs text-graphite-strong">
                Client commissions and design systems connected to this release.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveView('portfolio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore Exhibition Archive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {relatedPortfolioProjects.map((proj) => (
              <div
                key={proj.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectPortfolioProject(proj)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectPortfolioProject(proj);
                  }
                }}
                className="group relative bg-surface border border-hairline hover:border-accent/40 rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-secondary">
                  <img
                    src={(proj.image && proj.image.trim()) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80'}
                    alt={proj.title || 'Related Project Artwork'}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface/90 text-carbon text-[10px] uppercase font-semibold border border-hairline backdrop-blur-xs">
                      {proj.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-graphite uppercase">
                      {proj.client} · {proj.date}
                    </span>
                    <h4 className="font-display text-base font-bold text-carbon group-hover:text-accent group-hover:translate-x-1 transition-all duration-300 line-clamp-1">
                      {proj.title}
                    </h4>
                  </div>

                  <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs">
                    <span className="text-[10px] text-graphite">
                      {proj.tools[0]}
                    </span>
                    <span className="font-semibold text-accent flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
        <section className="pt-10 border-t border-hairline space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block mb-1">
                Storefront Releases
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                More from the Studio Storefront
              </h3>
            </div>
            <button
              type="button"
              onClick={handleBackToShop}
              className="text-xs text-accent hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
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

      {isAdmin && (
        <ShopEditorModal
          isOpen={isEditorOpen}
          product={product}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
};
