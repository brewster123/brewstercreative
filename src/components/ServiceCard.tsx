import React from 'react';
import { ServiceItem } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Share2, 
  Palette, 
  BookOpen, 
  Wand2, 
  Check, 
  Clock, 
  RotateCcw, 
  ArrowRight 
} from 'lucide-react';

interface ServiceCardProps {
  service: ServiceItem;
  featured?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, featured = false }) => {
  const { setActiveView, setPreselectedService, studioProfile } = useApp();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5" />;
      case 'Share2':
        return <Share2 className="w-5 h-5" />;
      case 'Palette':
        return <Palette className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Wand2':
      default:
        return <Wand2 className="w-5 h-5" />;
    }
  };

  const handleCommissionClick = () => {
    setPreselectedService(service.name);
    setActiveView('commission-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`relative rounded-[28px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1.5 ${
        service.popular
          ? 'bg-white border-2 border-orange-500 shadow-xl shadow-orange-500/10 ring-4 ring-orange-500/5'
          : 'bg-white border border-[#E5E5E5] hover:border-zinc-300 shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Popular Badge */}
      {service.popular && (
        <div className="absolute -top-3.5 left-7 px-3.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-bold font-mono-code uppercase tracking-wider shadow-md">
          ⭐ Most Requested
        </div>
      )}

      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            {getIcon(service.iconName)}
          </div>
          <span className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full font-medium border border-zinc-200/60">
            {service.category}
          </span>
        </div>

        {/* Service Title & Desc */}
        <h3 className="font-display text-xl font-bold text-zinc-900 mb-2 group-hover:text-orange-600 transition-colors">
          {service.name}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed mb-6">
          {service.shortDesc}
        </p>

        {/* Price & Turnaround Specs Bento Box */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 mb-6 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-500 font-medium">Starting at</span>
            <span className="text-xl sm:text-2xl font-black font-display text-zinc-900">
              {studioProfile.currencySymbol}{service.startingPrice.toLocaleString()}
            </span>
          </div>

          <div className="pt-2 border-t border-zinc-200 grid grid-cols-2 gap-2 text-xs text-zinc-600 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>{service.turnaround}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>{service.revisionsCount} revisions</span>
            </div>
          </div>
        </div>

        {/* Deliverables Checklist */}
        <div className="space-y-2 mb-6">
          <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider font-bold block">
            Included Deliverables:
          </span>
          <ul className="space-y-2 text-xs text-zinc-700">
            {service.deliverables.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action CTA Button */}
      <button
        id={`btn-commission-service-${service.id}`}
        type="button"
        onClick={handleCommissionClick}
        className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
          service.popular
            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
            : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900'
        }`}
      >
        <span>Commission This</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
