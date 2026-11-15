import React, { useState } from 'react';
import { ServiceItem, ShopProduct } from '../types';
import { useApp } from '../context/AppContext';
import { SHOP_PRODUCTS } from '../data/shopData';
import { ShopProductCard } from './ShopProductCard';
import { 
  ArrowRight,
  ArrowUpRight,
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
      className="group relative bg-surface border border-hairline hover:border-accent/40 rounded-3xl p-6 sm:p-8 lg:p-10 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md space-y-6 motion-reduce:transition-none"
    >
      {/* Top Category & Meta Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-hairline pb-4">
        <span className="text-xs text-accent uppercase tracking-widest font-bold">
          {service.category}
        </span>
        {service.popular && (
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#111114] bg-[#D4FF38] px-3 py-1 rounded-full">
            Core Offering
          </span>
        )}
      </div>

      {/* Main Service Title & Starting Rates */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-6">
          <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            <button
              type="button"
              onClick={handleCommissionClick}
              className="text-left text-carbon group-hover:text-accent group-hover:translate-x-1.5 motion-reduce:group-hover:translate-x-0 transition-all duration-300 flex items-center gap-3 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              <span>{service.name}</span>
              <ArrowRight className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </button>
          </h3>

          <div className="text-xs text-graphite shrink-0 self-start sm:self-baseline">
            Starting from <span className="text-lg sm:text-xl font-bold text-carbon font-display tabular-nums tracking-tight">{studioProfile.currencySymbol}{service.startingPrice.toLocaleString()}</span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-graphite-strong leading-relaxed max-w-3xl font-normal">
          {service.shortDesc}
        </p>
      </div>

      {/* Deliverables Ledger */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-graphite font-bold">
            What I Can Create &amp; Deliver
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-expanded={isExpanded}
            className="text-xs font-semibold text-graphite hover:text-accent flex items-center gap-1 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded-full px-2.5 py-1"
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
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-secondary border border-hairline text-xs text-carbon"
              >
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Specs & Action Link */}
      <div className="pt-5 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-graphite flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>Turnaround: <strong className="text-carbon">{service.turnaround}</strong></span>
          </div>
          <span className="text-hairline" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-graphite" />
            <span>{service.revisionsCount} Structured Revision Rounds</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCommissionClick();
          }}
          className="inline-flex items-center gap-2.5 pl-5 pr-2 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold uppercase tracking-wider shadow-xs transition-all self-start sm:self-auto cursor-pointer min-h-[44px] btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span>Initiate Commission</span>
          <span className="w-7 h-7 rounded-full bg-[#111114] text-white flex items-center justify-center">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Related Shop Goods if present */}
      {!hideRelatedShopProducts && relatedShopProducts.length > 0 && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="pt-5 border-t border-hairline space-y-3"
        >
          <div className="flex items-center gap-2 text-[11px] text-graphite uppercase tracking-wider font-semibold">
            <Tag className="w-3.5 h-3.5 text-accent" />
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
