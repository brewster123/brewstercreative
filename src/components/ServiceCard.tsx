import React from 'react';
import { ServiceItem, ShopProduct } from '../types';
import { useApp } from '../context/AppContext';
import { SHOP_PRODUCTS } from '../data/shopData';
import { ShopProductCard } from './ShopProductCard';
import { 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Share2, 
  Palette, 
  BookOpen, 
  Wand2, 
  Check, 
  Clock, 
  RotateCcw, 
  ArrowRight,
  Tag 
} from 'lucide-react';

interface ServiceCardProps {
  service: ServiceItem;
  featured?: boolean;
  hideRelatedShopProducts?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  featured = false,
  hideRelatedShopProducts = false 
}) => {
  const { setActiveView, setPreselectedService, setSelectedShopProduct, studioProfile } = useApp();

  // Cross-selling: Related Shop Products (Phase 4D.3: Services -> Shop)
  const relatedShopProducts: ShopProduct[] = (service.relatedShopProductIds || [])
    .map((id) => SHOP_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is ShopProduct => Boolean(p));

  const handleSelectShopProduct = (shopProduct: ShopProduct) => {
    setSelectedShopProduct(shopProduct);
    setActiveView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5" />;
      case 'Share2':
        return <Share2 className="w-5 h-5" />;
      case 'Palette':
        return <Palette className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Wand2':
      default:
        return <Wand2 className="w-5 h-5" />;
    }
  };

  const handleCommissionClick = () => {
    setPreselectedService(service.name);
    setActiveView('commission-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`relative rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 ${
        service.popular
          ? 'bg-white border-2 border-[#EA580C] shadow-sm'
          : 'bg-white border border-[#E4E2DC] hover:border-[#D4D2CA] shadow-2xs'
      }`}
    >
      {/* Popular Badge — Refined Studio Node */}
      {service.popular && (
        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-md bg-[#EA580C] text-white text-[10px] font-semibold font-mono uppercase tracking-wider shadow-xs">
          Most Requested
        </div>
      )}

      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#E4E2DC] text-[#EA580C] flex items-center justify-center transition-transform shadow-2xs">
            {getIcon(service.iconName)}
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] bg-[#F4F2ED] px-2.5 py-0.5 rounded-md font-medium border border-[#E4E2DC]">
            {service.category}
          </span>
        </div>

        {/* Service Title & Desc */}
        <h3 className="font-display text-xl font-bold text-[#18181B] mb-2 group-hover:text-[#EA580C] transition-colors">
          {service.name}
        </h3>
        <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed mb-6 font-normal">
          {service.shortDesc}
        </p>

        {/* Price & Turnaround Specs Panel */}
        <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E4E2DC] mb-6 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[#71717A] font-medium">Starting at</span>
            <span className="text-xl sm:text-2xl font-bold font-display text-[#18181B]">
              {studioProfile.currencySymbol}{service.startingPrice.toLocaleString()}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E4E2DC] grid grid-cols-2 gap-2 text-xs text-[#71717A] font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>{service.turnaround}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>{service.revisionsCount} revisions</span>
            </div>
          </div>
        </div>

        {/* Deliverables Checklist */}
        <div className="space-y-2 mb-6">
          <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider font-bold block">
            Included Deliverables:
          </span>
          <ul className="space-y-2 text-xs text-zinc-700">
            {service.deliverables.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Related Shop Products Section (Phase 4D.3: Services -> Shop) */}
        {!hideRelatedShopProducts && relatedShopProducts.length > 0 && (
          <div className="pt-5 mb-6 border-t border-zinc-100 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-code font-bold uppercase tracking-wider text-orange-600 mb-0.5">
                  <Tag className="w-3 h-3" />
                  <span>Studio Storefront</span>
                </div>
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-900">
                  Related Shop Products
                </h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedShopProduct(null);
                  setActiveView('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] font-mono-code text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Browse All Goods</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {relatedShopProducts.map((prod) => (
                <ShopProductCard
                  key={prod.id}
                  product={prod}
                  actionLabel="View Product"
                  onSelect={(p) => handleSelectShopProduct(p)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action CTA Button */}
      <button
        id={`btn-commission-service-${service.id}`}
        type="button"
        onClick={handleCommissionClick}
        className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
          service.popular
            ? 'bg-[#EA580C] hover:bg-[#D94814] text-white'
            : 'bg-[#18181B] hover:bg-[#27272A] text-white border border-[#18181B]'
        }`}
      >
        <span>Commission This Service</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
