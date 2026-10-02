import React from 'react';
import { ServiceItem, ShopProduct } from '../types';
import { useApp } from '../context/AppContext';
import { SHOP_PRODUCTS } from '../data/shopData';
import { ShopProductCard } from './ShopProductCard';
import { 
  ArrowRight,
  Sparkles,
  Clock,
  RotateCcw,
  Tag
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

  const formattedIndex = String(index + 1).padStart(2, '0');

  return (
    <article
      onClick={handleCommissionClick}
      className="group relative bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46] rounded-xl p-6 sm:p-8 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs space-y-6"
    >
      {/* Top Editorial Index & Meta Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E4E2DC] dark:border-[#27272A] pb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
            SERVICE {formattedIndex}
          </span>
          <span className="text-[#A1A1AA]" aria-hidden="true">/</span>
          <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
            {service.category}
          </span>
        </div>

        {service.popular && (
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#EA580C] dark:text-[#FBBF24] bg-[#FFF7ED] dark:bg-[#78350F]/30 px-2.5 py-0.5 rounded border border-[#FFEDD5] dark:border-[#92400E]">
            Core Offering
          </span>
        )}
      </div>

      {/* Main Service Title & Description */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] group-hover:translate-x-1.5 transition-all duration-300 tracking-tight flex items-center gap-2">
            <span>{service.name}</span>
            <span className="text-sm font-mono font-normal opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-[#EA580C]">
              →
            </span>
          </h3>

          <div className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] self-baseline">
            Starting from <span className="text-sm sm:text-base font-bold text-[#18181B] dark:text-[#EDEDEC] font-display">{studioProfile.currencySymbol}{service.startingPrice.toLocaleString()}</span>
          </div>
        </div>

        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-3xl font-normal">
          {service.shortDesc}
        </p>
      </div>

      {/* Editorial Deliverables Ledger: "What I Can Create" */}
      <div className="pt-2 space-y-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
          What I Can Create:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {service.deliverables.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[#18181B] dark:text-[#EDEDEC]">
              <span className="text-[#EA580C] text-sm leading-none mt-0.5" aria-hidden="true">•</span>
              <span className="font-medium leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Specs & Action Link */}
      <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Turnaround: <strong className="text-[#18181B] dark:text-[#EDEDEC]">{service.turnaround}</strong></span>
          </div>
          <span className="text-[#A1A1AA]" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span>{service.revisionsCount} Revision Rounds</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCommissionClick();
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#EA580C] group-hover:translate-x-1 transition-transform self-start sm:self-auto cursor-pointer"
        >
          <span>Initiate Commission</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Related Shop Goods if present */}
      {!hideRelatedShopProducts && relatedShopProducts.length > 0 && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-3"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
            <Tag className="w-3 h-3 text-[#EA580C]" />
            <span>Available Studio Templates & Goods Connected to this Service</span>
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
