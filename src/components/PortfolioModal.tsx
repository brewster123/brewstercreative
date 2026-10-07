import React, { useState } from 'react';
import { PortfolioProject, ShopProduct } from '../types';
import { useApp } from '../context/AppContext';
import { SHOP_PRODUCTS } from '../data/shopData';
import { ShopProductCard } from './ShopProductCard';
import { 
  X, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Tag,
  Maximize2
} from 'lucide-react';

interface PortfolioModalProps {
  project: PortfolioProject;
  onClose: () => void;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({ project, onClose }) => {
  const { setActiveView, setPreselectedService, setSelectedShopProduct } = useApp();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = project.gallery?.length ? project.gallery : [project.image];

  // Cross-selling: Related Shop Products
  const relatedShopProducts: ShopProduct[] = (project.relatedShopProductIds || [])
    .map((id) => SHOP_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is ShopProduct => Boolean(p));

  const handleSelectShopProduct = (shopProduct: ShopProduct) => {
    onClose();
    setSelectedShopProduct(shopProduct);
    setActiveView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommissionThisType = () => {
    onClose();
    setPreselectedService(project.category);
    setActiveView('commission-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Editorial Top Navigation Strip */}
        <div className="px-6 sm:px-8 py-4 bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-md border-b border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold">
              Archive Reference
            </span>
            <span className="text-[#A1A1AA]" aria-hidden="true">/</span>
            <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider truncate max-w-[200px] sm:max-w-xs">
              {project.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] transition-colors cursor-pointer"
            >
              <span>Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Case Study Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-12 space-y-12">
          
          {/* 1. Project Title & Metadata Header */}
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-mono text-[#71717A] dark:text-[#A1A1AA] tracking-wider uppercase">
              <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">
                {project.projectType === 'concept' || !project.projectType
                  ? (project.client && project.client !== 'Client Commission' && project.client !== 'Commission Client' ? project.client : 'Studio Concept')
                  : (project.client || 'Client Project')}
              </span>
              <span aria-hidden="true" className="text-[#A1A1AA]">·</span>
              <span>{project.category}</span>
              <span aria-hidden="true" className="text-[#A1A1AA]">·</span>
              <span>{project.date}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight leading-[1.1]">
              {project.title}
            </h1>

            <p className="text-base sm:text-lg text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
              {project.shortDesc}
            </p>
          </div>

          {/* 2. Large Hero Artwork with Subtle Hover Motion */}
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 border border-[#E4E2DC] dark:border-[#27272A] aspect-[16/10] sm:aspect-[16/9] group cursor-pointer shadow-sm">
              <img
                src={images[activeImageIndex]}
                alt={project.title}
                onClick={() => setLightboxOpen(true)}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />

              {/* Lightbox / Zoom Button */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Enlarge image"
                className="absolute top-4 right-4 p-2 rounded-lg bg-black/60 text-white hover:bg-black transition-colors opacity-0 group-hover:opacity-100 duration-200 cursor-pointer backdrop-blur-xs"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Prev / Next controls for hero image */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 text-white hover:bg-black transition-colors cursor-pointer backdrop-blur-xs"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 text-white hover:bg-black transition-colors cursor-pointer backdrop-blur-xs"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Counter label */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-black/70 text-white text-[11px] font-mono backdrop-blur-xs">
                {activeImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Row with Subtle Hover Scale */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto py-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border transition-all duration-300 cursor-pointer group ${
                      activeImageIndex === idx 
                        ? 'border-[#EA580C] ring-1 ring-[#EA580C] opacity-100 scale-[1.02]' 
                        : 'border-[#E4E2DC] dark:border-[#27272A] opacity-60 hover:opacity-100 hover:scale-[1.02]'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Project Narrative & Case Study Body (No heavy cards!) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-4 border-t border-[#E4E2DC] dark:border-[#27272A]">
            
            {/* Left 8 columns: Narrative & Design Strategy */}
            <div className="lg:col-span-8 space-y-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Concept & Creative Execution
              </h2>

              <div className="prose prose-zinc dark:prose-invert max-w-none text-[#18181B] dark:text-[#EDEDEC] text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  {project.fullDesc}
                </p>
              </div>

              {/* Additional Gallery Work if available */}
              {images.length > 1 && (
                <div className="space-y-4 pt-6">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold">
                    Gallery Plates & Detailed Studies
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((img, idx) => (
                      <div 
                        key={idx}
                        onClick={() => { setActiveImageIndex(idx); setLightboxOpen(true); }}
                        className="group relative rounded-lg overflow-hidden bg-black/5 dark:bg-black/30 border border-[#E4E2DC] dark:border-[#27272A] aspect-[4/3] cursor-pointer"
                      >
                        <img 
                          src={img} 
                          alt={`Study ${idx + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 columns: Creative Details & Production Specs (Clean Ledger) */}
            <div className="lg:col-span-4 space-y-6 lg:border-l lg:border-[#E4E2DC] dark:lg:border-[#27272A] lg:pl-8">
              
              {/* Project Client & Year */}
              <div className="space-y-1.5 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold">
                  {project.projectType === 'concept' || !project.projectType ? 'Project Origin' : 'Commission Client'}
                </span>
                <p className="text-sm font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {project.projectType === 'concept' || !project.projectType
                    ? (project.client && project.client !== 'Client Commission' && project.client !== 'Commission Client' ? project.client : 'Self-Initiated Studio Work')
                    : (project.client || 'Client Commission')}
                </p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {project.projectType === 'concept' || !project.projectType ? 'Archived' : 'Completed'}: {project.date}
                </p>
              </div>

              {/* Tools & Production Stack */}
              <div className="space-y-2 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold">
                  Tools & Mediums
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.tools.map((tool, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#F4F2ED] dark:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Color Palette System */}
              <div className="space-y-2 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold">
                  Color Harmony
                </span>
                <div className="flex items-center gap-2">
                  {(project.colorPalette || ['#18181b', '#f97316', '#fafafa']).map((hex, i) => (
                    <div key={i} className="group relative">
                      <div
                        className="w-7 h-7 rounded-full border border-black/10 dark:border-white/20 shadow-xs transition-transform hover:scale-110"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black text-[9px] font-mono text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {hex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disciplines / Tags */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold">
                  Disciplines
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* 4. Related Studio Storefront Assets */}
          {relatedShopProducts.length > 0 && (
            <div className="pt-8 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold mb-1">
                    <Tag className="w-3 h-3" />
                    <span>Studio Releases</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                    Related Design Assets & Prints
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setSelectedShopProduct(null);
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="font-mono text-xs text-[#EA580C] hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <span>Explore Shop Archive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

          {/* 5. Closing Case Study Navigation & Inquiry */}
          <div className="pt-8 border-t border-[#E4E2DC] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-display text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Inspired by this project?
              </h4>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Commission a bespoke visual identity, illustration, or design system crafted with identical attention to detail.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] transition-colors cursor-pointer"
              >
                Return to Archive
              </button>
              <button
                id="btn-modal-commission-this"
                type="button"
                onClick={handleCommissionThisType}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Commission Similar Work</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Lightbox Overlay for High-Res Artwork Examination */}
      {lightboxOpen && (
        <div 
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={images[activeImageIndex]}
            alt={project.title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
