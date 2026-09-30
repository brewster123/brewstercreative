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
      className="group relative rounded-xl overflow-hidden bg-white border border-[#E4E2DC] hover:border-[#D4D2CA] transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between"
    >
      {/* Project Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#FAF9F6]">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

        {/* Category Tag */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-[#18181B] text-[10px] font-mono font-semibold uppercase tracking-wider border border-[#E4E2DC] shadow-2xs">
            {project.category}
          </span>
        </div>

        {/* Hover Inspect Icon */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#18181B] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 shadow-xs">
          <ArrowUpRight className="w-4 h-4 text-[#EA580C]" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-[#71717A] font-mono mb-1.5 font-medium tracking-wider uppercase">
            <span>{project.client}</span>
            <span>•</span>
            <span>{project.date}</span>
          </div>

          <h3 className="font-display text-lg font-bold text-[#18181B] group-hover:text-[#EA580C] transition-colors line-clamp-1 mb-2">
            {project.title}
          </h3>

          <p className="text-xs text-[#71717A] line-clamp-2 leading-relaxed mb-4 font-normal">
            {project.shortDesc}
          </p>
        </div>

        {/* Tools & Tags row */}
        <div className="pt-3 border-t border-[#E4E2DC] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {project.tools.slice(0, 2).map((tool, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#F4F2ED] text-[#71717A] font-mono font-medium border border-[#E4E2DC]">
                {tool}
              </span>
            ))}
            {project.tools.length > 2 && (
              <span className="text-[10px] text-[#A1A1AA] font-mono">
                +{project.tools.length - 2}
              </span>
            )}
          </div>

          <span className="text-xs text-[#EA580C] font-semibold group-hover:underline flex items-center gap-1">
            Details
          </span>
        </div>
      </div>
    </div>
  );
};
