import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Send, ShieldCheck, Instagram, Dribbble, Twitter, ArrowUp, Mail, MapPin } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  const { studioProfile, setActiveView } = useApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-zinc-200/90 text-zinc-600 text-sm mt-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          
          {/* Studio Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <div>
                <span className="font-display font-bold text-lg text-zinc-900 tracking-tight">
                  {studioProfile.studioName}
                </span>
                <p className="text-xs text-orange-600 font-mono-code -mt-0.5 font-medium">
                  by {studioProfile.designerName}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-sm">
              {studioProfile.bio}
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-zinc-700">
              <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{studioProfile.availableSlots} Commission Slots Open</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>{studioProfile.location}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-zinc-900 text-xs uppercase tracking-wider">
              Studio Explore
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('home'); scrollToTop(); }}
                  className="text-zinc-600 hover:text-orange-600 transition-colors"
                >
                  Home & Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('portfolio'); scrollToTop(); }}
                  className="text-zinc-600 hover:text-orange-600 transition-colors"
                >
                  Selected Works (Portfolio)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('services'); scrollToTop(); }}
                  className="text-zinc-600 hover:text-orange-600 transition-colors"
                >
                  Services & Pricing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('commission-form'); scrollToTop(); }}
                  className="text-zinc-600 hover:text-orange-600 transition-colors"
                >
                  Commission Request Form
                </button>
              </li>
            </ul>
          </div>

          {/* Client & Portals */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-zinc-900 text-xs uppercase tracking-wider">
              Client Portal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('client-dashboard'); scrollToTop(); }}
                  className="text-zinc-600 hover:text-orange-600 transition-colors flex items-center gap-1.5"
                >
                  <span>Active Commission Dashboard</span>
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-semibold">Live</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('auth'); scrollToTop(); }}
                  className="text-zinc-600 hover:text-orange-600 transition-colors"
                >
                  Client Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveView('admin-dashboard'); scrollToTop(); }}
                  className="text-zinc-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Designer Admin Login</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-zinc-900 text-xs uppercase tracking-wider">
              Inquiries & Social
            </h4>
            <p className="text-xs text-zinc-500">
              For custom brand collaborations or direct art direction inquiries:
            </p>
            <a
              href={`mailto:${studioProfile.email}`}
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-mono-code font-medium underline underline-offset-2"
            >
              <Mail className="w-3.5 h-3.5" />
              {studioProfile.email}
            </a>

            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 text-zinc-700 border border-zinc-200 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://dribbble.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 text-zinc-700 border border-zinc-200 transition-colors"
                aria-label="Dribbble"
              >
                <Dribbble className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 text-zinc-700 border border-zinc-200 transition-colors"
                aria-label="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright & back to top */}
        <div className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} {studioProfile.studioName} ({studioProfile.designerName}). All rights reserved. Graphic design & multimedia art.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono-code text-zinc-400 font-medium">Bento Suite Architecture</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 transition-colors font-medium"
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
