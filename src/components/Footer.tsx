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
    <footer className="bg-canvas border-t border-hairline text-graphite-strong text-sm mt-20 relative overflow-hidden transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-8 mb-10 sm:mb-12">
          
          {/* Studio Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <div>
                <span className="font-display font-bold text-lg text-carbon tracking-tight">
                  {studioProfile.studioName}
                </span>
                <p className="text-xs text-accent -mt-0.5 font-medium">
                  by {studioProfile.designerName}
                </p>
              </div>
            </div>

            <div className="text-xs uppercase tracking-widest text-carbon font-bold">
              Make noise. Make meaning.
            </div>

            <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed max-w-sm">
              {studioProfile.bio}
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-carbon">
              <div className="flex items-center gap-1.5 text-graphite-strong font-medium">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>{studioProfile.location}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-carbon text-xs uppercase tracking-wider">
              Studio Explore
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('home'); scrollToTop(); }}
                  className="text-graphite-strong hover:text-accent transition-colors cursor-pointer"
                >
                  Home &amp; Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('portfolio'); scrollToTop(); }}
                  className="text-graphite-strong hover:text-accent transition-colors cursor-pointer"
                >
                  Selected Works (Portfolio)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('services'); scrollToTop(); }}
                  className="text-graphite-strong hover:text-accent transition-colors cursor-pointer"
                >
                  Services &amp; Pricing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('shop'); scrollToTop(); }}
                  className="text-graphite-strong hover:text-accent transition-colors cursor-pointer"
                >
                  Studio Shop &amp; Goods
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('commission-form'); scrollToTop(); }}
                  className="text-graphite-strong hover:text-accent transition-colors cursor-pointer"
                >
                  Commission Request Form
                </button>
              </li>
            </ul>
          </div>

          {/* Client & Portals */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-carbon text-xs uppercase tracking-wider">
              Client Portal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('client-dashboard'); scrollToTop(); }}
                  className="text-graphite-strong hover:text-accent transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Active Commission Dashboard</span>
                  <span aria-hidden="true" className="text-graphite">·</span>
                  <span className="text-[11px] font-mono text-accent font-semibold">Live</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('auth'); scrollToTop(); }}
                  className="text-graphite-strong hover:text-accent transition-colors cursor-pointer"
                >
                  Client Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('admin-dashboard'); scrollToTop(); }}
                  className="text-graphite-strong hover:text-[#059669] dark:hover:text-[#34D399] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                  <span>Designer Admin Login</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-carbon text-xs uppercase tracking-wider">
              Inquiries &amp; Social
            </h4>
            <p className="text-xs text-graphite-strong leading-relaxed">
              For custom brand collaborations or direct art direction inquiries:
            </p>
            <a
              href={`mailto:${studioProfile.email}`}
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-mono font-medium underline underline-offset-2"
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
                      className="p-2 rounded-lg bg-surface hover:bg-surface-secondary text-graphite-strong hover:text-accent border border-hairline transition-colors cursor-pointer"
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
                      className="p-2 rounded-lg bg-surface hover:bg-surface-secondary text-graphite-strong hover:text-accent border border-hairline transition-colors cursor-pointer"
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
                      className="p-2 rounded-lg bg-surface hover:bg-surface-secondary text-graphite-strong hover:text-accent border border-hairline transition-colors cursor-pointer"
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
                      className="p-2 rounded-lg bg-surface hover:bg-surface-secondary text-graphite-strong hover:text-accent border border-hairline transition-colors cursor-pointer"
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
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-graphite">
          <p>
            © {new Date().getFullYear()} {studioProfile.studioName} ({studioProfile.designerName}). All rights reserved. Graphic design &amp; multimedia art.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1 text-graphite-strong hover:text-carbon transition-colors font-medium cursor-pointer rounded px-1.5 py-0.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Scroll back to top of page"
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
