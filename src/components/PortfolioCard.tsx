import React, { useState, useEffect, useRef } from 'react';
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
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    };
  }, []);

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

    if (navigator.clipboard?.writeText && shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (!isMountedRef.current) return;
        setCopiedShare(true);
        if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
        shareTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setCopiedShare(false);
        }, 2000);
      } catch {
        // Clipboard unavailable in restricted browser contexts
      }
    }
  };

  const defaultProjectImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80';
  const resolvedImage = (project.image && typeof project.image === 'string' && project.image.trim()) 
    ? project.image.trim() 
    : defaultProjectImage;

  return (
    <article
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        onSelect(project);
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-surface border border-hairline hover:border-accent/40 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md motion-reduce:transition-none ${className}`}
    >
      {/* Artwork Viewport — High-Fidelity Breathing Room */}
      <div 
        className={`relative overflow-hidden bg-surface-secondary w-full min-h-[190px] ${
          isFeatured ? 'aspect-[16/10] sm:aspect-[16/9]' : isWide ? 'aspect-[16/9]' : 'aspect-[4/3]'
        }`}
      >
        <img
          src={resolvedImage}
          alt={project.title || 'Portfolio artwork'}
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== defaultProjectImage) {
              target.src = defaultProjectImage;
            }
          }}
          className="w-full h-full object-cover block transition-transform duration-500 ease-out group-hover:scale-103 motion-reduce:transform-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />

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
              className="w-8 h-8 rounded-full bg-black/65 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent transition-all duration-200 cursor-pointer backdrop-blur-xs shadow-xs"
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
            className="w-8 h-8 rounded-full bg-black/65 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent transition-all duration-200 cursor-pointer backdrop-blur-xs shadow-xs"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <div className="w-8 h-8 rounded-full bg-[#D4FF38] text-[#111114] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 motion-reduce:transform-none shadow-xs">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Editorial Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Editorial Unboxed Metadata String */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wider font-semibold">
            <span className="text-accent">{project.category}</span>
            <span aria-hidden="true" className="text-graphite">·</span>
            <span className={project.projectType === 'client' ? 'text-emerald-600 dark:text-emerald-400' : 'text-graphite'}>
              {project.projectType === 'client'
                ? (project.client || 'Client Commission')
                : (project.client && project.client !== 'Client Commission' && project.client !== 'Commission Client' ? project.client : 'Studio Concept')}
            </span>
            <span aria-hidden="true" className="text-graphite">·</span>
            <span className="text-graphite">{project.date}</span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug">
            <button
              type="button"
              onClick={() => onSelect(project)}
              className="text-left text-carbon group-hover:text-accent group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 transition-all duration-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded cursor-pointer"
            >
              {project.title}
            </button>
          </h3>

          <p className="text-xs sm:text-sm text-graphite-strong line-clamp-2 leading-relaxed font-normal">
            {project.shortDesc}
          </p>
        </div>

        {/* Footer Ledger: Social Engagement Counters & Case Study Link */}
        <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
          
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
              className={`inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer py-1.5 px-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 min-h-[36px] focus:outline-hidden focus-visible:ring-1 focus-visible:ring-accent tabular-nums ${
                isLiked 
                  ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                  : 'text-graphite hover:text-carbon'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
              <span>{likesCount.toLocaleString()}</span>
            </button>

            {/* Views Metric */}
            <div className="inline-flex items-center gap-1.5 text-xs text-graphite tabular-nums">
              <Eye className="w-4 h-4 text-graphite" />
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 transition-all shrink-0 cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-accent rounded-full px-2 py-1.5 min-h-[36px]"
          >
            <span>Inspect Case Study</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
