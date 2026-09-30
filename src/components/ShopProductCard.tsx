import React, { useState, useEffect } from 'react';
import { ShopProduct } from '../types';
import { 
  Tag, 
  Palette, 
  Package, 
  Type, 
  Layers, 
  Download, 
  Box, 
  ArrowRight,
  Eye
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
        return <Tag className="w-8 h-8 text-orange-500/80 mb-2 transition-transform duration-300 group-hover:scale-110" />;
      case 'Palette':
        return <Palette className="w-8 h-8 text-zinc-600 mb-2 transition-transform duration-300 group-hover:scale-110" />;
      case 'Package':
        return <Package className="w-8 h-8 text-orange-600 mb-2 transition-transform duration-300 group-hover:scale-110" />;
      case 'Type':
        return <Type className="w-8 h-8 text-zinc-700 mb-2 transition-transform duration-300 group-hover:scale-110" />;
      case 'Layers':
      default:
        return <Layers className="w-8 h-8 text-orange-500 mb-2 transition-transform duration-300 group-hover:scale-110" />;
    }
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'Available':
        return (
          <span className="px-2 py-0.5 rounded-md bg-white text-[#059669] text-[10px] font-mono font-medium border border-[#E4E2DC] shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            Available
          </span>
        );
      case 'In Production':
        return (
          <span className="px-2 py-0.5 rounded-md bg-white text-[#71717A] text-[10px] font-mono font-medium border border-[#E4E2DC] shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#71717A] animate-pulse" />
            In Production
          </span>
        );
      case 'Sold Out':
        return (
          <span className="px-2 py-0.5 rounded-md bg-[#F4F2ED] text-[#71717A] text-[10px] font-mono font-medium border border-[#E4E2DC]">
            Sold Out
          </span>
        );
      case 'Coming Soon':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-white text-[#EA580C] text-[10px] font-mono font-medium border border-[#E4E2DC] shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
            Coming Soon
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
    <div
      onClick={handleCardClick}
      className={`bg-white border rounded-xl p-5 space-y-4 shadow-2xs relative overflow-hidden flex flex-col justify-between h-full transition-all duration-300 group hover:-translate-y-1 hover:shadow-xs cursor-pointer ${
        product.featured ? 'border-[#EA580C]/40 hover:border-[#EA580C]' : 'border-[#E4E2DC] hover:border-[#D4D2CA]'
      }`}
    >
      <div className="space-y-3.5">
        {/* Visual / Image Area */}
        <div className={`aspect-[4/3] rounded-lg bg-[#FAF9F6] border border-[#E4E2DC] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`}>
          
          {/* Top Left: Clean Primary Product Type & Complementary Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10 max-w-[65%]">
            <span className="px-2 py-0.5 rounded-md bg-white/95 text-[#18181B] text-[10px] font-mono font-semibold uppercase border border-[#E4E2DC] shadow-2xs flex items-center gap-1 backdrop-blur-xs">
              {product.productType === 'Digital' ? (
                <Download className="w-3 h-3 text-[#EA580C]" />
              ) : (
                <Box className="w-3 h-3 text-[#EA580C]" />
              )}
              <span>{product.productType}</span>
            </span>
            {product.isTemplate ? (
              <span className="px-2 py-0.5 rounded-md bg-white/95 text-[#EA580C] text-[10px] font-mono font-semibold uppercase border border-[#E4E2DC] shadow-2xs backdrop-blur-xs">
                Template
              </span>
            ) : product.variants && product.variants.length > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-white/95 text-[#71717A] text-[10px] font-mono font-medium uppercase border border-[#E4E2DC] shadow-2xs backdrop-blur-xs">
                Multi-Format
              </span>
            ) : null}
          </div>

          {/* Top Right: Status Badge */}
          <div className="absolute top-2.5 right-2.5 z-10">
            {getStatusBadge()}
          </div>

          {/* Center Graphic / Real Product Image */}
          {hasImage && rawImage ? (
            <img 
              src={rawImage} 
              alt={product.productImageAlt || product.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              {renderVisualIcon()}
              {product.badge && (
                <span className="text-xs font-mono-code text-zinc-800 font-bold mt-1">
                  {product.badge}
                </span>
              )}
              <span className="text-[10px] text-zinc-400 font-mono-code uppercase tracking-wider mt-0.5 font-medium">
                {product.category}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono-code uppercase tracking-wider text-orange-600 font-bold">
              {product.category}
            </span>
            <span className="font-mono-code font-bold text-xs text-zinc-900 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200/80">
              {product.priceLabel || (product.price > 0 ? `$${product.price}` : 'Price TBA')}
            </span>
          </div>

          <h4 className="font-display font-bold text-base text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[3rem] flex items-center">
            {product.name}
          </h4>

          <p className="text-xs text-zinc-500 leading-relaxed font-medium line-clamp-2 min-h-[2rem]">
            {product.shortDescription || product.description}
          </p>
        </div>
      </div>

      {/* Footer & Primary Action */}
      <div className="pt-3 border-t border-[#E4E2DC] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[10px] font-semibold text-[#71717A] truncate max-w-[65%] uppercase tracking-wider">
            {product.formats || 'Digital Assets'}
          </span>
          <span className="text-[10px] font-mono text-[#EA580C] font-semibold bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FFEDD5] shrink-0">
            {product.isTemplate ? 'Template' : (product.badge || 'Studio Asset')}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className="w-full py-2 rounded-lg bg-[#FAF9F6] hover:bg-[#18181B] hover:text-white text-[#18181B] text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 border border-[#E4E2DC] hover:border-[#18181B] shadow-2xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>
            {actionLabel || 'View Product'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
