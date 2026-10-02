import React, { useState, useEffect } from 'react';
import { ShopProduct } from '../types';
import { 
  Download, 
  Box, 
  ArrowRight,
  Eye,
  Tag,
  Palette,
  Package,
  Type,
  Layers
} from 'lucide-react';

interface ShopProductCardProps {
  product: ShopProduct;
  onSelect?: (product: ShopProduct) => void;
  actionLabel?: string;
}

export const ShopProductCard: React.FC<ShopProductCardProps> = ({ 
  product, 
  onSelect,
  actionLabel 
}) => {
  const [imgError, setImgError] = useState(false);

  const rawImage = product.productImage || product.image;

  useEffect(() => {
    setImgError(false);
  }, [product.id, rawImage]);

  const hasImage = Boolean(rawImage) && !imgError;

  const renderVisualIcon = () => {
    switch (product.iconName) {
      case 'Tag':
        return <Tag className="w-8 h-8 text-[#EA580C] mb-2 opacity-80" />;
      case 'Palette':
        return <Palette className="w-8 h-8 text-[#71717A] dark:text-[#A1A1AA] mb-2 opacity-80" />;
      case 'Package':
        return <Package className="w-8 h-8 text-[#EA580C] mb-2 opacity-80" />;
      case 'Type':
        return <Type className="w-8 h-8 text-[#71717A] dark:text-[#A1A1AA] mb-2 opacity-80" />;
      case 'Layers':
      default:
        return <Layers className="w-8 h-8 text-[#EA580C] mb-2 opacity-80" />;
    }
  };

  const getStatusLabel = () => {
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

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(product);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46] rounded-xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs space-y-4"
    >
      <div className="space-y-4">
        {/* Visual / Artwork Viewport */}
        <div className="aspect-[4/3] rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          
          {/* Top Left: Medium Type */}
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2 py-0.5 rounded bg-white/90 dark:bg-[#18181B]/90 text-[#18181B] dark:text-[#EDEDEC] text-[10px] font-mono font-semibold uppercase border border-[#E4E2DC] dark:border-[#27272A] backdrop-blur-xs flex items-center gap-1">
              {product.productType === 'Digital' ? (
                <Download className="w-3 h-3 text-[#EA580C]" />
              ) : (
                <Box className="w-3 h-3 text-[#EA580C]" />
              )}
              <span>{product.productType}</span>
            </span>
          </div>

          {/* Top Right: Status */}
          <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded bg-white/90 dark:bg-[#18181B]/90 border border-[#E4E2DC] dark:border-[#27272A] backdrop-blur-xs">
            {getStatusLabel()}
          </div>

          {/* Center Product Image or Minimal Icon */}
          {hasImage && rawImage ? (
            <img 
              src={rawImage} 
              alt={product.productImageAlt || product.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              {renderVisualIcon()}
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] font-mono uppercase tracking-wider mt-1">
                {product.category}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#EA580C] font-semibold">
              {product.category}
            </span>
            <span className="font-mono font-bold text-xs text-[#18181B] dark:text-[#EDEDEC]">
              {product.priceLabel || (product.price > 0 ? `$${product.price}` : 'Price TBA')}
            </span>
          </div>

          <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] group-hover:translate-x-1 transition-all duration-300 line-clamp-1">
            {product.name}
          </h4>

          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed line-clamp-2 font-normal">
            {product.shortDescription || product.description}
          </p>
        </div>
      </div>

      {/* Footer Specs & Action */}
      <div className="pt-3.5 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between text-xs">
        <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] truncate max-w-[55%] uppercase tracking-wider">
          {product.formats || 'Vector & Master Formats'}
        </span>

        <span className="inline-flex items-center gap-1 font-semibold text-xs text-[#EA580C] group-hover:translate-x-1 transition-transform shrink-0">
          <span>{actionLabel || 'Inspect Edition'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
};
