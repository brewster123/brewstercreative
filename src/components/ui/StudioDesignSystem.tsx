import React from 'react';
import { CommissionStatus } from '../../types';

/**
 * Brewster Creative — Global Design System Tokens & Base Helper Components (UI-1A)
 * Establishes a cohesive visual language:
 * - Color foundations: Warm Alabaster Canvas, Surface White, Carbon Ink, Hairline Rules, Terracotta Accent.
 * - Single typography standard: Plus Jakarta Sans across all headings, UI, body copy, and metadata.
 * - Standardized Radii & Borders: 6px/8px/12px, zero structural bubble pills.
 * - Standardized Badges & Canonical 8-Stage Status Nodes.
 */

// Global Color & Design Token Classes
export const UI_TOKENS = {
  // Canvases & Surfaces
  canvas: 'bg-[#FAF9F6] dark:bg-[#0F0F11] text-[#18181B] dark:text-[#EDEDEC]',
  surface: 'bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A]',
  surfaceMuted: 'bg-[#F4F2ED] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A]',
  surfaceDark: 'bg-[#181816] text-white border border-[#27272A]',
  
  // Dividers & Hairlines
  divider: 'border-t border-[#E4E2DC] dark:border-[#27272A]',
  hairline: 'border-[#E4E2DC] dark:border-[#27272A]',

  // Typographic Styles
  display: 'font-display tracking-tight text-[#18181B] dark:text-[#EDEDEC] font-bold',
  subheading: 'font-sans font-semibold text-[#18181B] dark:text-[#EDEDEC]',
  body: 'font-sans text-[15px] leading-relaxed text-[#71717A] dark:text-[#A1A1AA]',
  metadata: 'font-mono text-[11px] tracking-wider text-[#71717A] dark:text-[#A1A1AA]',
  label: 'font-sans text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] tracking-normal',

  // Interactive Buttons
  btnPrimary: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#18181B] dark:bg-[#27272A] hover:bg-[#27272A] dark:hover:bg-[#3F3F46] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  btnAccent: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  btnSecondary: 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46] text-xs sm:text-sm font-semibold transition-all duration-200 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  btnGhost: 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-xs font-medium transition-all duration-200 cursor-pointer',
  btnDestructive: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[#DC2626] dark:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-[#4C0519]/40 border border-transparent hover:border-[#FEE2E2] dark:hover:border-[#9F1239] text-xs font-semibold transition-all duration-200 cursor-pointer',

  // Form Inputs
  input: 'w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] transition-colors outline-none',
  textarea: 'w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] transition-colors outline-none resize-y',
  select: 'w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] transition-colors outline-none cursor-pointer',

  // Structural Containers (Ending 32px bento bubble corners)
  panel: 'bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 shadow-2xs',
  panelMuted: 'bg-[#F4F2ED] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8',
};

/**
 * Editorial Section Eyebrow (De-Pilled alternative to glowing orange pills)
 * Clean monospace label with a quiet dash indicator.
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
        <div className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold ${isCenter ? 'justify-center' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
          <span>{eyebrow}</span>
        </div>
      )}
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#18181B] dark:text-[#EDEDEC]">
        {title}
      </h2>
      {description && (
        <p className="font-sans text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
};

/**
 * Restrained Canonical Status Node (UI-1A)
 * Preserves the exact 8 canonical commission stages and their backend values.
 * Renders an understated, gallery-grade indicator rather than an oversized candy pill.
 */
export const StudioStatusBadge: React.FC<{
  status: CommissionStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ status, size = 'md', className = '' }) => {
  const s = (status || '').toLowerCase();

  let dotColor = 'bg-[#71717A] dark:bg-[#A1A1AA]';
  let textColor = 'text-[#71717A] dark:text-[#A1A1AA]';
  let label = status;

  switch (s) {
    case 'pending':
      dotColor = 'bg-[#D97706]';
      textColor = 'text-[#92400E] dark:text-[#FBBF24]';
      label = 'Pending Review';
      break;
    case 'reviewing':
      dotColor = 'bg-[#EA580C]';
      textColor = 'text-[#C2410C] dark:text-[#FB923C]';
      label = 'In Discussion';
      break;
    case 'accepted':
      dotColor = 'bg-[#2563EB]';
      textColor = 'text-[#1D4ED8] dark:text-[#60A5FA]';
      label = 'Accepted';
      break;
    case 'in_progress':
      dotColor = 'bg-[#4F46E5]';
      textColor = 'text-[#4338CA] dark:text-[#818CF8]';
      label = 'In Production';
      break;
    case 'for_review':
      dotColor = 'bg-[#EA580C] animate-pulse';
      textColor = 'text-[#EA580C] dark:text-[#FB923C]';
      label = 'Client Review';
      break;
    case 'revision':
      dotColor = 'bg-[#C2410C]';
      textColor = 'text-[#9A3412] dark:text-[#F87171]';
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] font-mono font-medium ${
        isSmall ? 'text-[10px]' : 'text-[11px]'
      } ${textColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      <span className="tracking-wide uppercase">{label}</span>
    </span>
  );
};
