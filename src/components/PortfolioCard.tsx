import React from 'react';
import { PortfolioProject } from '../types';
import { Sparkles, ArrowUpRight, Eye, Calendar, Layers } from 'lucide-react';

interface PortfolioCardProps {
  project: PortfolioProject;
  onSelect: (project: PortfolioProject) => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ project, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(project)}
      className="group relative rounded-[28px] overflow-hidden bg-white border border-[#E5E5E5] hover:border-orange-500/60 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl flex flex-col justify-between"
    >
      {/* Project Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

        {/* Category Pill Tag */}
        <div className="absolute top-3.5 left-3.5">
          <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-zinc-900 text-xs font-mono-code font-bold border border-zinc-200/80 shadow-sm">
            {project.category}
          </span>
        </div>

        {/* Hover Inspect Icon */}
        <div className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-md">
          <ArrowUpRight className="w-4 h-4 text-orange-400" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono-code mb-1.5 font-medium">
            <span>{project.client}</span>
            <span>•</span>
            <span>{project.date}</span>
          </div>

          <h3 className="font-display text-lg font-bold text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-2">
            {project.title}
          </h3>

          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-4">
            {project.shortDesc}
          </p>
        </div>

        {/* Tools & Tags row */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {project.tools.slice(0, 2).map((tool, i) => (
              <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-mono-code font-medium">
                {tool}
              </span>
            ))}
            {project.tools.length > 2 && (
              <span className="text-[10px] text-zinc-400 font-mono-code">
                +{project.tools.length - 2}
              </span>
            )}
          </div>

          <span className="text-xs text-orange-600 font-bold group-hover:underline flex items-center gap-1">
            Details
          </span>
        </div>
      </div>
    </div>
  );
};
