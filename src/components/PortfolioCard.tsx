import React, { useState, useEffect } from 'react';
import { PortfolioProject } from '../types';
import { useApp } from '../context/AppContext';
import { 
  ArrowUpRight, 
  ArrowRight, 
  Heart, 
  Eye, 
  Share2, 
  Check, 
  Maximize2 
} from 'lucide-react';
import { isProjectLikedLocally } from '../lib/portfolio';

interface PortfolioCardProps {
  project: PortfolioProject;
  onSelect: (project: PortfolioProject) => void;
  onPreview?: (project: PortfolioProject) => void;
  variant?: 'featured' | 'standard' | 'wide' | 'compact';
  className?: string;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ 
  project, 
  onSelect,
  onPreview,
  variant = 'standard',
  className = ''
}) => {
  const { toggleProjectLikeInContext } = useApp();
  const isFeatured = variant === 'featured';
  const isWide = variant === 'wide';

  const [isLiked, setIsLiked] = useState<boolean>(() => isProjectLikedLocally(project.id));
  const [likesCount, setLikesCount] = useState<number>(() => project.likesCount ?? 0);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  useEffect(() => {
    setLikesCount(project.likesCount ?? 0);
    setIsLiked(isProjectLikedLocally(project.id));
  }, [project.id, project.likesCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await toggleProjectLikeInContext(project.id);
      if (!res.error) {
        setIsLiked(res.liked);
        setLikesCount(res.likesCount);
      } else {
        setIsLiked(!nextLiked);
        setLikesCount(project.likesCount ?? 0);
      }
    } catch {
      setIsLiked(!nextLiked);
      setLikesCount(project.likesCount ?? 0);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#case-study-${project.id}`
      : '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${project.title} — Brewster Creative`,
          text: project.shortDesc,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

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

        {/* Quiet Category & Project Type Eyebrow */}
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-white/90 dark:bg-[#18181B]/90 text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] backdrop-blur-xs shadow-2xs">
            {project.category}
          </span>

          <span className={`font-mono text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded backdrop-blur-xs shadow-2xs border ${
            project.projectType === 'concept'
              ? 'bg-purple-950/80 text-purple-200 border-purple-800/60'
              : 'bg-emerald-950/80 text-emerald-200 border-emerald-800/60'
          }`}>
            {project.projectType === 'concept' ? 'Concept' : 'Client'}
          </span>
        </div>

        {/* Top-Right Quick Actions: Preview / Share / Hover Inspect */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
          {onPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(project);
              }}
              aria-label="Quick visual preview"
              title="Quick preview"
              className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-xs shadow-xs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share case study"
            title={copiedShare ? "Link copied!" : "Share case study"}
            className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-xs shadow-xs"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="w-7 h-7 rounded-lg bg-[#18181B] dark:bg-[#27272A] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 shadow-xs">
            <ArrowUpRight className="w-4 h-4 text-[#EA580C]" />
          </div>
        </div>
      </div>

      {/* Editorial Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Metadata String */}
          <div className="flex items-center gap-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono tracking-wider uppercase font-medium">
            <span>{project.client || (project.projectType === 'concept' ? 'Studio Concept' : 'Client Work')}</span>
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

        {/* Footer Ledger: Social Engagement Counters & Case Study Link */}
        <div className="pt-3.5 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between gap-3">
          
          {/* Social Stats Strip */}
          <div className="flex items-center gap-3">
            {/* Interactive Like Button */}
            <button
              type="button"
              onClick={handleLike}
              disabled={isLiking}
              aria-label={isLiked ? "Unlike project" : "Like project"}
              className={`inline-flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer py-1 px-1.5 -ml-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 ${
                isLiked 
                  ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Views Metric */}
            <div className="inline-flex items-center gap-1 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              <Eye className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>{(project.viewsCount ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Action Link to Case Study */}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#EA580C] group-hover:translate-x-1 transition-transform shrink-0">
            <span>Case Study</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>

        </div>
      </div>
    </article>
  );
};
