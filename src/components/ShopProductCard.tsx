import React, { useState, useEffect } from 'react';
import { ShopProduct } from '../types';
import { useApp } from '../context/AppContext';
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
  const { studioProfile } = useApp();
  const [imgError, setImgError] = useState(false);
  const currencySymbol = studioProfile?.currencySymbol || '₱';

  const rawImage = product.productImage || product.image;

  useEffect(() => {
    setImgError(false);
  }, [product.id, rawImage]);

  const hasImage = Boolean(rawImage) && !imgError;

  const renderVisualIcon = () => {
    switch (product.iconName) {
      case 'Tag':
        return <Tag className="w-8 h-8 text-accent mb-2 opacity-80" />;
      case 'Palette':
        return <Palette className="w-8 h-8 text-graphite mb-2 opacity-80" />;
      case 'Package':
        return <Package className="w-8 h-8 text-accent mb-2 opacity-80" />;
      case 'Type':
        return <Type className="w-8 h-8 text-graphite mb-2 opacity-80" />;
      case 'Layers':
      default:
        return <Layers className="w-8 h-8 text-accent mb-2 opacity-80" />;
    }
  };

  const getStatusLabel = () => {
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

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(product);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group relative bg-surface border border-hairline hover:border-accent/40 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md space-y-4 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas motion-reduce:transition-none"
    >
      <div className="space-y-4">
        {/* Visual / Artwork Viewport */}
        <div className="aspect-[4/3] rounded-2xl bg-surface-secondary border border-hairline flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          
          {/* Top Left: Medium Type */}
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-surface/90 text-carbon text-[10px] font-semibold uppercase border border-hairline backdrop-blur-xs flex items-center gap-1">
              {product.productType === 'Digital' ? (
                <Download className="w-3 h-3 text-accent" />
              ) : (
                <Box className="w-3 h-3 text-accent" />
              )}
              <span>{product.productType}</span>
            </span>
          </div>

          {/* Top Right: Status */}
          <div className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full bg-surface/90 border border-hairline backdrop-blur-xs">
            {getStatusLabel()}
          </div>

          {/* Center Product Image or Minimal Icon */}
          {hasImage && rawImage ? (
            <img 
              src={rawImage} 
              alt={product.productImageAlt || product.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103 motion-reduce:transform-none"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              {renderVisualIcon()}
              <span className="text-[10px] text-graphite uppercase tracking-wider mt-1">
                {product.category}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
              {product.category}
            </span>
            <span className="font-bold text-xs text-carbon tabular-nums">
              {product.priceLabel || (product.price > 0 ? `${currencySymbol}${product.price.toLocaleString()}` : 'Price TBA')}
            </span>
          </div>

          <h4 className="font-display font-bold text-base text-carbon group-hover:text-accent group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 transition-all duration-300 line-clamp-1">
            {product.name}
          </h4>

          <p className="text-xs text-graphite-strong leading-relaxed line-clamp-2 font-normal">
            {product.shortDescription || product.description}
          </p>
        </div>
      </div>

      {/* Footer Specs & Action */}
      <div className="pt-3.5 border-t border-hairline flex items-center justify-between text-xs">
        <span className="text-[10px] text-graphite truncate max-w-[55%] uppercase tracking-wider">
          {product.formats || 'Vector & Master Formats'}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-xs text-accent group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 transition-transform shrink-0">
          <span>{actionLabel || 'Inspect Edition'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
};
