import React from 'react';
import { CommissionStatus } from '../../types';

/**
 * DESTALION — Global Design System Tokens & Base Helper Components (UI-1A)
 * Establishes a cohesive visual language:
 * - Color foundations: Gallery White Canvas, Surface White, Carbon Ink, Hairline Rules, Sky Blue & Acid Lime Accents.
 * - Single typography standard: Plus Jakarta Sans across all headings, UI, body copy, and metadata.
 * - Standardized Radii & Borders: Generous card curves and clean pill controls.
 * - Standardized Badges & Canonical 8-Stage Status Nodes.
 */

// Global Color & Design Token Classes
export const UI_TOKENS = {
  // Canvases & Surfaces
  canvas: 'bg-canvas text-carbon',
  surface: 'bg-surface border border-hairline',
  surfaceMuted: 'bg-surface-secondary border border-hairline',
  surfaceDark: 'bg-[#111114] text-white border border-[#222634]',
  
  // Dividers & Hairlines
  divider: 'border-t border-hairline',
  hairline: 'border-hairline',

  // Typographic Styles
  display: 'font-display tracking-tight text-carbon font-bold',
  subheading: 'font-sans font-semibold text-carbon',
  body: 'font-sans text-[15px] leading-relaxed text-graphite',
  metadata: 'font-mono text-[11px] tracking-wider text-graphite',
  label: 'font-sans text-xs font-semibold text-carbon tracking-normal',

  // Interactive Buttons
  btnPrimary: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#111114] dark:bg-white hover:opacity-90 text-white dark:text-[#111114] text-xs sm:text-sm font-bold transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed btn-tactile',
  btnAccent: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs sm:text-sm font-bold transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed btn-tactile',
  btnSecondary: 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-surface hover:bg-surface-secondary text-carbon border border-hairline hover:border-accent text-xs sm:text-sm font-semibold transition-all duration-200 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  btnGhost: 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary text-xs font-medium transition-all duration-200 cursor-pointer',
  btnDestructive: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-[#DC2626] dark:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-[#4C0519]/40 border border-transparent hover:border-[#FEE2E2] dark:hover:border-[#9F1239] text-xs font-semibold transition-all duration-200 cursor-pointer',

  // Form Inputs
  input: 'w-full bg-surface-secondary border border-hairline focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon placeholder-graphite/60 transition-colors outline-none',
  textarea: 'w-full bg-surface-secondary border border-hairline focus:border-accent focus:ring-1 focus:ring-accent rounded-xl p-3 text-xs sm:text-sm text-carbon placeholder-graphite/60 transition-colors outline-none resize-y',
  select: 'w-full bg-surface-secondary border border-hairline focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon transition-colors outline-none cursor-pointer',

  // Structural Containers
  panel: 'bg-surface border border-hairline rounded-3xl p-6 sm:p-8 shadow-2xs',
  panelMuted: 'bg-surface-secondary border border-hairline rounded-3xl p-6 sm:p-8',
};

/**
 * Editorial Section Eyebrow
 * Clean monospace label with a sky-blue indicator dot.
 */
export const StudioSectionHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}> = ({ eyebrow, title, description, align = 'left', className = '' }) => {
  const isCenter = align === 'center';
  return (
    <div className={`space-y-2.5 ${isCenter ? 'text-center max-w-2xl mx-auto' : ''} ${className}`}>
      {eyebrow && (
        <div className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-accent font-semibold ${isCenter ? 'justify-center' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span>{eyebrow}</span>
        </div>
      )}
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-carbon">
        {title}
      </h2>
      {description && (
        <p className="font-sans text-xs sm:text-sm text-graphite leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
};

/**
 * Restrained Canonical Status Node (UI-1A)
 * Preserves the exact 8 canonical commission stages and their backend values.
 * Renders an understated, gallery-grade indicator.
 */
export const StudioStatusBadge: React.FC<{
  status: CommissionStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ status, size = 'md', className = '' }) => {
  const s = (status || '').toLowerCase();

  let dotColor = 'bg-graphite';
  let textColor = 'text-graphite';
  let label = status;

  switch (s) {
    case 'pending':
      dotColor = 'bg-[#D97706]';
      textColor = 'text-[#92400E] dark:text-[#FBBF24]';
      label = 'Pending Review';
      break;
    case 'reviewing':
      dotColor = 'bg-accent';
      textColor = 'text-accent';
      label = 'In Discussion';
      break;
    case 'accepted':
      dotColor = 'bg-[#2563EB]';
      textColor = 'text-[#1D4ED8] dark:text-[#60A5FA]';
      label = 'Accepted';
      break;
    case 'in_progress':
      dotColor = 'bg-[#0284C7] dark:bg-[#0EA5E9]';
      textColor = 'text-[#0284C7] dark:text-[#38BDF8]';
      label = 'In Production';
      break;
    case 'for_review':
      dotColor = 'bg-accent animate-pulse';
      textColor = 'text-accent';
      label = 'Client Review';
      break;
    case 'revision':
      dotColor = 'bg-[#D97706]';
      textColor = 'text-[#B45309] dark:text-[#FBBF24]';
      label = 'Revision Requested';
      break;
    case 'final_approval':
      dotColor = 'bg-[#059669]';
      textColor = 'text-[#047857] dark:text-[#34D399]';
      label = 'Final Approval';
      break;
    case 'completed':
      dotColor = 'bg-[#047857]';
      textColor = 'text-[#065F46] dark:text-[#34D399]';
      label = 'Delivered';
      break;
    case 'cancelled':
    case 'rejected':
      dotColor = 'bg-[#DC2626]';
      textColor = 'text-[#B91C1C] dark:text-[#F87171]';
      label = 'Cancelled';
      break;
    default:
      dotColor = 'bg-[#71717A] dark:bg-[#A1A1AA]';
      textColor = 'text-[#52525B] dark:text-[#A1A1AA]';
      label = status;
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface border border-hairline font-mono font-medium ${
        isSmall ? 'text-[10px]' : 'text-[11px]'
      } ${textColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      <span className="tracking-wide uppercase">{label}</span>
    </span>
  );
};
