import React from 'react';
import { PortfolioProject } from '../types';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface PortfolioCardProps {
  project: PortfolioProject;
  onSelect: (project: PortfolioProject) => void;
  variant?: 'featured' | 'standard' | 'wide' | 'compact';
  className?: string;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ 
  project, 
  onSelect,
  variant = 'standard',
  className = ''
}) => {
  const isFeatured = variant === 'featured';
  const isWide = variant === 'wide';

  return (
    <article
      onClick={() => onSelect(project)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(project);
        }
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46] transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs focus-visible:outline-2 focus-visible:outline-[#EA580C] ${className}`}
    >
      {/* Artwork Viewport — High-Fidelity Breathing Room */}
      <div 
        className={`relative overflow-hidden bg-[#FAF9F6] dark:bg-[#0F0F11] ${
          isFeatured ? 'aspect-[16/10] sm:aspect-[16/9]' : isWide ? 'aspect-[16/9]' : 'aspect-[4/3]'
        }`}
      >
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-300" />

        {/* Quiet Category Eyebrow */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-white/90 dark:bg-[#18181B]/90 text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] backdrop-blur-xs shadow-2xs">
            {project.category}
          </span>
        </div>

        {/* Hover Inspect Indicator */}
        <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-[#18181B] dark:bg-[#27272A] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 shadow-xs z-10">
          <ArrowUpRight className="w-4 h-4 text-[#EA580C]" />
        </div>
      </div>

      {/* Editorial Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Metadata String without Pill Box */}
          <div className="flex items-center gap-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono tracking-wider uppercase font-medium">
            <span>{project.client}</span>
            <span aria-hidden="true" className="text-[#A1A1AA]">•</span>
            <span>{project.date}</span>
          </div>

          <h3 className="font-display text-lg sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] group-hover:translate-x-1 transition-all duration-300 leading-snug">
            {project.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed font-normal">
            {project.shortDesc}
          </p>
        </div>

        {/* Footer Ledger: Tools & Action Link */}
        <div className="pt-3.5 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {project.tools.slice(0, isFeatured ? 3 : 2).map((tool, i) => (
              <span 
                key={i} 
                className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] px-2 py-0.5 rounded bg-[#F4F2ED] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A]"
              >
                {tool}
              </span>
            ))}
            {project.tools.length > (isFeatured ? 3 : 2) && (
              <span className="text-[10px] text-[#A1A1AA] font-mono">
                +{project.tools.length - (isFeatured ? 3 : 2)}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#EA580C] group-hover:translate-x-1 transition-transform shrink-0">
            <span>Case Study</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
