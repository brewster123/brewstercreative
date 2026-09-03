import React, { useState } from 'react';
import { PortfolioProject } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Calendar, 
  User, 
  Wrench, 
  Layers, 
  Sparkles, 
  Send, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PortfolioModalProps {
  project: PortfolioProject;
  onClose: () => void;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({ project, onClose }) => {
  const { setActiveView, setPreselectedService } = useApp();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = project.gallery?.length ? project.gallery : [project.image];

  const handleCommissionThisType = () => {
    onClose();
    setPreselectedService(project.category);
    setActiveView('commission-form');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code font-bold border border-orange-200">
              {project.category}
            </span>
            <span className="text-xs text-zinc-500 font-mono-code hidden sm:inline font-medium">
              Client: {project.client}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          
          {/* Main Gallery Image Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-100 aspect-[16/10] border border-zinc-200 shadow-xs group">
            <img
              src={images[activeImageIndex]}
              alt={project.title}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-mono-code">
              {activeImageIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails row if multiple */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    activeImageIndex === idx ? 'border-orange-500 scale-105 shadow-xs' : 'border-zinc-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Project Title & Overview */}
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900 mb-3">
              {project.title}
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-medium">
              {project.fullDesc}
            </p>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
            
            {/* Client & Date */}
            <div className="p-4 rounded-[20px] bg-zinc-50 border border-zinc-200/80">
              <span className="text-[11px] font-mono-code text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                Client & Date
              </span>
              <p className="text-sm font-black text-zinc-900">{project.client}</p>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">{project.date}</p>
            </div>

            {/* Tools & Software */}
            <div className="p-4 rounded-[20px] bg-zinc-50 border border-zinc-200/80">
              <span className="text-[11px] font-mono-code text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                Tools & Software
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {project.tools.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-zinc-200 text-[11px] text-zinc-700 font-mono-code font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="p-4 rounded-[20px] bg-zinc-50 border border-zinc-200/80">
              <span className="text-[11px] font-mono-code text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                Palette System
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                {(project.colorPalette || ['#18181b', '#f97316', '#fafafa']).map((hex, i) => (
                  <div key={i} className="group relative">
                    <div
                      className="w-6 h-6 rounded-full border border-zinc-300 shadow-xs"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    ></div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-zinc-900 text-[9px] font-mono-code text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-400 font-mono-code font-bold">Disciplines:</span>
            {project.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs border border-zinc-200 font-medium">
                #{tag}
              </span>
            ))}
          </div>

        </div>

        {/* Modal Footer CTA */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 text-center sm:text-left font-medium">
            Inspired by this project? Commission a custom design tailored to your vision.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors"
            >
              Close
            </button>
            <button
              id="btn-modal-commission-this"
              type="button"
              onClick={handleCommissionThisType}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Commission Similar Work</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
