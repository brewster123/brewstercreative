import React, { useState } from 'react';
import { ServiceItem, ShopProduct } from '../types';
import { useApp } from '../context/AppContext';
import { SHOP_PRODUCTS } from '../data/shopData';
import { ShopProductCard } from './ShopProductCard';
import { 
  ArrowRight,
  Clock,
  RotateCcw,
  Tag,
  CheckCircle2,
  ChevronDown,
  Layers
} from 'lucide-react';

interface ServiceCardProps {
  service: ServiceItem;
  index?: number;
  featured?: boolean;
  hideRelatedShopProducts?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  index = 0,
  hideRelatedShopProducts = false 
}) => {
  const { setActiveView, setPreselectedService, setSelectedShopProduct, studioProfile } = useApp();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Cross-selling: Related Shop Products
  const relatedShopProducts: ShopProduct[] = (service.relatedShopProductIds || [])
    .map((id) => SHOP_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is ShopProduct => Boolean(p));

  const handleSelectShopProduct = (shopProduct: ShopProduct) => {
    setSelectedShopProduct(shopProduct);
    setActiveView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommissionClick = () => {
    setPreselectedService(service.name);
    setActiveView('commission-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <article
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        handleCommissionClick();
      }}
      className="group relative bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#D4D2CA] dark:hover:border-[#333338] rounded-2xl p-6 sm:p-8 lg:p-10 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs space-y-6 motion-reduce:transition-none"
    >
      {/* Subtle washi tape accent */}
      <div className="absolute -top-2.5 right-8 w-12 h-4 bg-[#FEF08A]/75 dark:bg-[#CA8A04]/40 rotate-3 border border-white/50 shadow-2xs pointer-events-none group-hover:rotate-6 transition-transform" />

      {/* Top Editorial Category & Meta Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E4E2DC] dark:border-[#222225] pb-4">
        <span className="font-mono text-xs text-[#EA580C] uppercase tracking-wider font-bold">
          {service.category}
        </span>
        {service.popular && (
          <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-[#EA580C] bg-[#FFF7ED] dark:bg-[#78350F]/30 px-2.5 py-0.5 rounded border border-[#FFEDD5] dark:border-[#92400E]">
            Core Offering
          </span>
        )}
      </div>

      {/* Main Service Title & Starting Rates */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-6">
          <h3 className="font-display text-2xl sm:text-3xl lg:text-3.5xl font-black tracking-tight">
            <button
              type="button"
              onClick={handleCommissionClick}
              className="text-left text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] group-hover:translate-x-1.5 motion-reduce:group-hover:translate-x-0 transition-all duration-300 flex items-center gap-3 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded"
            >
              <span>{service.name}</span>
              <ArrowRight className="w-5 h-5 text-[#EA580C] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </button>
          </h3>

          <div className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] shrink-0 self-start sm:self-baseline">
            Starting from <span className="text-lg sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDEC] font-display tabular-nums tracking-tight">{studioProfile.currencySymbol}{service.startingPrice.toLocaleString()}</span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A1A1AA] leading-relaxed max-w-3xl font-normal">
          {service.shortDesc}
        </p>
      </div>

      {/* Editorial Deliverables Ledger: "What I Can Create" */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-bold">
            What I Can Create &amp; Deliver:
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-expanded={isExpanded}
            className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] flex items-center gap-1 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded px-1.5 py-0.5"
          >
            <span>{isExpanded ? 'Hide scope' : 'Show scope'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {service.deliverables.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-xs text-[#18181B] dark:text-[#EDEDEC]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Specs & Action Link */}
      <div className="pt-5 border-t border-[#E4E2DC] dark:border-[#222225] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Turnaround: <strong className="text-[#18181B] dark:text-[#EDEDEC]">{service.turnaround}</strong></span>
          </div>
          <span className="text-[#A1A1AA]" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span>{service.revisionsCount} Structured Revision Rounds</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCommissionClick();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] active:bg-[#C23E0E] text-white text-xs font-semibold shadow-2xs group-hover:shadow-xs transition-all self-start sm:self-auto cursor-pointer min-h-[44px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
        >
          <span>Initiate Commission</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Related Shop Goods if present */}
      {!hideRelatedShopProducts && relatedShopProducts.length > 0 && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="pt-5 border-t border-[#E4E2DC] dark:border-[#222225] space-y-3"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
            <Tag className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Available Studio Templates &amp; Goods Connected to this Practice</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedShopProducts.map((prod) => (
              <ShopProductCard
                key={prod.id}
                product={prod}
                actionLabel="View Good"
                onSelect={(p) => handleSelectShopProduct(p)}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
