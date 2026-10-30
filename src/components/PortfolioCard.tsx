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
import { 
  isProjectLikedLocally, 
  getProjectLikes, 
  getProjectViews 
} from '../lib/portfolio';

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
  const [likesCount, setLikesCount] = useState<number>(() => getProjectLikes(project));
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  useEffect(() => {
    setLikesCount(getProjectLikes(project));
    setIsLiked(isProjectLikedLocally(project.id));
  }, [project.id, project.likesCount, project.likes_count]);

  const viewsCount = getProjectViews(project);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    const nextLiked = !prevLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await toggleProjectLikeInContext(project.id);
      if (!res.error) {
        setIsLiked(res.liked);
        setLikesCount(res.likesCount);
      } else {
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
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
          title: `${project.title} — DESTALION`,
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
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        onSelect(project);
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#D4D2CA] dark:hover:border-[#333338] transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs motion-reduce:transition-none ${className}`}
    >
      {/* Artwork Viewport — High-Fidelity Breathing Room */}
      <div 
        className={`relative overflow-hidden bg-[#FAF9F6] dark:bg-[#09090B] ${
          isFeatured ? 'aspect-[16/10] sm:aspect-[16/9]' : isWide ? 'aspect-[16/9]' : 'aspect-[4/3]'
        }`}
      >
        <img
          src={project.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80'}
          alt={project.title || 'Portfolio artwork'}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103 motion-reduce:transform-none"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-300" />

        {/* Quiet Category & Project Type Eyebrow — Clean Unboxed Metadata */}
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs border border-white/10 text-white font-mono text-[10px] uppercase tracking-wider font-semibold">
          <span>{project.category}</span>
          <span aria-hidden="true" className="text-zinc-400">·</span>
          <span className={project.projectType === 'client' ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
            {project.projectType === 'client' ? 'Commission' : 'Concept'}
          </span>
        </div>

        {/* Top-Right Quick Actions: Preview / Share / Hover Inspect */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
          {onPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPreview(project);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Quick visual preview"
              title="Quick preview"
              className="w-8 h-8 rounded-lg bg-black/65 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] transition-all duration-200 cursor-pointer backdrop-blur-xs shadow-xs"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Share case study"
            title={copiedShare ? "Link copied!" : "Share case study"}
            className="w-8 h-8 rounded-lg bg-black/65 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] transition-all duration-200 cursor-pointer backdrop-blur-xs shadow-xs"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <div className="w-8 h-8 rounded-lg bg-[#18181B] dark:bg-[#27272A] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 motion-reduce:transform-none shadow-xs">
            <ArrowUpRight className="w-4 h-4 text-[#EA580C]" />
          </div>
        </div>
      </div>

      {/* Editorial Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Metadata String */}
          <div className="flex items-center gap-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono tracking-wider uppercase font-semibold">
            <span>
              {project.projectType === 'concept' || !project.projectType
                ? (project.client && project.client !== 'Client Commission' && project.client !== 'Commission Client' ? project.client : 'Studio Concept')
                : (project.client || 'Client Commission')}
            </span>
            <span aria-hidden="true" className="text-[#A1A1AA]">•</span>
            <span>{project.date}</span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug">
            <button
              type="button"
              onClick={() => onSelect(project)}
              className="text-left text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 transition-all duration-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded cursor-pointer"
            >
              {project.title}
            </button>
          </h3>

          <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed font-normal">
            {project.shortDesc}
          </p>
        </div>

        {/* Footer Ledger: Social Engagement Counters & Case Study Link */}
        <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#222225] flex items-center justify-between gap-3">
          
          {/* Social Stats Strip */}
          <div className="flex items-center gap-3.5">
            {/* Interactive Like Button */}
            <button
              type="button"
              onClick={handleLike}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLike(e as any);
                }
              }}
              aria-disabled={isLiking}
              aria-label={isLiked ? "Unlike project" : "Like project"}
              className={`inline-flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer py-1.5 px-2 -ml-2 rounded hover:bg-black/5 dark:hover:bg-white/5 min-h-[36px] focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#EA580C] ${
                isLiked 
                  ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
              <span>{likesCount.toLocaleString()}</span>
            </button>

            {/* Views Metric */}
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              <Eye className="w-4 h-4 text-[#A1A1AA]" />
              <span>{viewsCount.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Link to Case Study */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(project);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C] hover:text-[#D94814] group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 transition-all shrink-0 cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#EA580C] rounded px-2 py-1.5 min-h-[36px]"
          >
            <span>Inspect Case Study</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
