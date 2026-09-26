import React from 'react';
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
}

export const ShopProductCard: React.FC<ShopProductCardProps> = ({ 
  product, 
  onSelect 
}) => {
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
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono-code font-bold border border-emerald-200 shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Available
          </span>
        );
      case 'In Production':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-zinc-700 text-[10px] font-mono-code font-bold border border-zinc-200 shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
            In Production
          </span>
        );
      case 'Sold Out':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-mono-code font-bold border border-zinc-200 shadow-2xs">
            Sold Out
          </span>
        );
      case 'Coming Soon':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-orange-600 text-[10px] font-mono-code font-bold border border-orange-200 shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
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
      className={`bg-white border rounded-[28px] p-5 space-y-4 shadow-xs relative overflow-hidden flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-md cursor-pointer ${
        product.featured ? 'border-orange-200/90 hover:border-orange-300' : 'border-[#E5E5E5] hover:border-zinc-300'
      }`}
    >
      <div className="space-y-3.5">
        {/* Visual / Image Area */}
        <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${
          product.visualGradient || 'from-orange-100/60 via-amber-50/40 to-zinc-100'
        } border border-zinc-200/90 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`}>
          
          {/* Top Left: Product Type */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-white/90 text-zinc-700 text-[10px] font-mono-code font-bold border border-zinc-200 shadow-2xs flex items-center gap-1">
              {product.productType === 'Digital' ? (
                <Download className="w-3 h-3 text-orange-500" />
              ) : (
                <Box className="w-3 h-3 text-orange-500" />
              )}
              <span>{product.productType}</span>
            </span>
          </div>

          {/* Top Right: Status Badge */}
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>

          {/* Center Graphic */}
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <>
              {renderVisualIcon()}
              {product.badge && (
                <span className="text-xs font-mono-code text-zinc-700 font-bold">
                  {product.badge}
                </span>
              )}
              <span className="text-[10px] text-zinc-400 font-mono-code uppercase mt-0.5 font-medium">
                {product.category}
              </span>
            </>
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

          <h4 className="font-display font-bold text-base text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-1">
            {product.name}
          </h4>

          <p className="text-xs text-zinc-500 leading-relaxed font-medium line-clamp-2">
            {product.shortDescription || product.description}
          </p>
        </div>
      </div>

      {/* Footer & Primary Action */}
      <div className="pt-3 border-t border-zinc-100 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono-code text-[11px] font-bold text-zinc-700 truncate max-w-[65%]">
            {product.formats || 'Digital Assets'}
          </span>
          <span className="text-[10px] font-mono-code text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 shrink-0">
            {product.phaseTag || 'Catalog Drop'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className="w-full py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-700 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 border border-zinc-200 group-hover:border-zinc-900 shadow-2xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>
            {product.status === 'Available' ? 'View Product' : 'Preview Details'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
