import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Send, ShieldCheck, Instagram, Dribbble, Twitter, ArrowUp, Mail, MapPin } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { normalizeSocialMediaUrl } from '../utils/urlUtils';

export const Footer: React.FC = () => {
  const { studioProfile, setActiveView } = useApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#FAF9F6] dark:bg-[#09090B] border-t border-[#E4E2DC] dark:border-[#1C1C1F] text-[#71717A] dark:text-[#A1A1AA] text-sm mt-20 relative overflow-hidden transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-8 mb-10 sm:mb-12">
          
          {/* Studio Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <div>
                <span className="font-display font-bold text-lg text-[#18181B] dark:text-[#F5F5F0] tracking-tight">
                  {studioProfile.studioName}
                </span>
                <p className="text-xs text-[#EA580C] font-mono -mt-0.5 font-medium">
                  by {studioProfile.designerName}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-sm">
              {studioProfile.bio}
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-[#18181B] dark:text-[#F5F5F0]">
              <div className="flex items-center gap-1.5 text-[#71717A] dark:text-[#A1A1AA] font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>{studioProfile.location}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-[#18181B] dark:text-[#F5F5F0] text-xs uppercase tracking-wider">
              Studio Explore
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('home'); scrollToTop(); }}
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  Home & Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('portfolio'); scrollToTop(); }}
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  Selected Works (Portfolio)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('services'); scrollToTop(); }}
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  Services & Pricing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('shop'); scrollToTop(); }}
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  Studio Shop & Goods
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('commission-form'); scrollToTop(); }}
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  Commission Request Form
                </button>
              </li>
            </ul>
          </div>

          {/* Client & Portals */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-[#18181B] dark:text-[#F5F5F0] text-xs uppercase tracking-wider">
              Client Portal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('client-dashboard'); scrollToTop(); }}
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Active Commission Dashboard</span>
                  <span className="text-[10px] bg-[#FFF7ED] dark:bg-[#78350F]/40 text-[#EA580C] dark:text-[#FBBF24] border border-[#FFEDD5] dark:border-[#92400E] px-1.5 py-0.5 rounded font-semibold font-mono">Live</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('auth'); scrollToTop(); }}
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  Client Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('admin-dashboard'); scrollToTop(); }}
                  className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#059669] dark:hover:text-[#34D399] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Designer Admin Login</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-[#18181B] dark:text-[#F5F5F0] text-xs uppercase tracking-wider">
              Inquiries & Social
            </h4>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              For custom brand collaborations or direct art direction inquiries:
            </p>
            <a
              href={`mailto:${studioProfile.email}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#EA580C] hover:underline font-mono font-medium underline underline-offset-2"
            >
              <Mail className="w-3.5 h-3.5" />
              {studioProfile.email}
            </a>

            {/* Dynamic Social Links */}
            {(() => {
              const instagramUrl = normalizeSocialMediaUrl('instagram', studioProfile.socialLinks?.instagram);
              const behanceUrl = normalizeSocialMediaUrl('behance', studioProfile.socialLinks?.behance);
              const dribbbleUrl = normalizeSocialMediaUrl('dribbble', studioProfile.socialLinks?.dribbble);
              const twitterUrl = normalizeSocialMediaUrl('twitter', studioProfile.socialLinks?.twitter);

              const hasAnySocial = Boolean(instagramUrl || behanceUrl || dribbbleUrl || twitterUrl);
              if (!hasAnySocial) return null;

              return (
                <div className="flex items-center gap-2.5 pt-2">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] border border-[#E4E2DC] dark:border-[#222225] transition-colors cursor-pointer"
                      aria-label="Instagram Profile"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}

                  {behanceUrl && (
                    <a
                      href={behanceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] border border-[#E4E2DC] dark:border-[#222225] transition-colors cursor-pointer"
                      aria-label="Behance Portfolio"
                    >
                      <span className="font-display font-bold text-[12px] leading-none select-none tracking-tighter">Bē</span>
                    </a>
                  )}

                  {dribbbleUrl && (
                    <a
                      href={dribbbleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] border border-[#E4E2DC] dark:border-[#222225] transition-colors cursor-pointer"
                      aria-label="Dribbble Portfolio"
                    >
                      <Dribbble className="w-4 h-4" />
                    </a>
                  )}

                  {twitterUrl && (
                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] dark:hover:text-[#EA580C] border border-[#E4E2DC] dark:border-[#222225] transition-colors cursor-pointer"
                      aria-label="Twitter / X Profile"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })()}
          </div>

        </div>

        {/* Bottom copyright & back to top */}
        <div className="pt-8 border-t border-[#E4E2DC] dark:border-[#1C1C1F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A] dark:text-[#A1A1AA]">
          <p>
            © {new Date().getFullYear()} {studioProfile.studioName} ({studioProfile.designerName}). All rights reserved. Graphic design & multimedia art.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F5F5F0] transition-colors font-medium cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
