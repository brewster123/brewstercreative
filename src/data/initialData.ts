import { 
  StudioProfile, 
  ServiceItem, 
  PortfolioProject, 
  User, 
  Commission, 
  Message, 
  ProgressUpdate, 
  ProjectFile, 
  AppNotification 
} from '../types';

export const INITIAL_STUDIO_PROFILE: StudioProfile = {
  designerName: 'Brewster A. Cabando',
  studioName: 'DESTALION',
  title: 'Multimedia Artist & Brand Designer',
  bio: 'Specializing in distinctive visual identities, conceptual poster art, typographic systems, and high-impact digital illustration for innovative brands, creators, and indie studios worldwide.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  email: 'brewstercreates@gmail.com',
  location: 'Cebu City / Remote Worldwide',
  socialLinks: {
    instagram: 'instagram.com/brewster.cabando',
    behance: 'behance.net/brewstercabando',
    dribbble: 'dribbble.com/brewstercabando',
    twitter: 'x.com/brewstercabando',
    discord: 'brewster#4021',
  },
  currency: 'PHP',
  currencySymbol: '₱',
  commissionStatus: 'open',
  availableSlots: 3,
  gcashDetails: {
    accountName: 'Brewster Cabando',
    accountNumber: '0965-706-4331',
    instructions: '1. Open your GCash app and tap "Send Money" > "Express Send".\n2. Enter the studio mobile number and the deposit amount.\n3. Complete the transfer and save a screenshot of the official transaction receipt.\n4. Ensure the Reference No. and Date/Time are clearly visible.\n5. Upload the screenshot below to initiate manual verification.',
    depositPercentage: 50,
  },
};

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-logo',
    name: 'Logo Design',
    category: 'Branding',
    shortDesc: 'Memorable, scalable vector logo marks and wordmarks tailored to your unique market identity.',
    startingPrice: 3500,
    turnaround: '3–7 days',
    revisionsCount: 2,
    deliverables: [
      'Primary logo + icon mark + monochrome variants',
      'High-res PNG, JPG, and scalable SVG/EPS vector formats',
      'Color breakdown & basic typography guidelines',
      'Presentation-ready files',
    ],
    popular: true,
    iconName: 'Sparkles',
    relatedShopProductIds: ['prod-vector-badges'],
  },
  {
    id: 'srv-branding',
    name: 'Brand Identity Package',
    category: 'Branding',
    shortDesc: 'A complete holistic visual language system including logo system, color theory, typography, and collateral.',
    startingPrice: 5000,
    turnaround: '7–14 days',
    revisionsCount: 3,
    deliverables: [
      'Complete logo suite (primary, secondary, submarks)',
      'Curated typography hierarchy & font pairings',
      'Custom color palette (HEX, RGB, CMYK, Pantone)',
      'Brand guideline presentation (PDF)',
      'Social media profile avatars & banner kit',
      'Stationery / Business card design templates',
    ],
    popular: true,
    iconName: 'Layers',
    relatedShopProductIds: ['prod-branding-apex', 'prod-template-pitchdeck'],
  },
  {
    id: 'srv-posters',
    name: 'Poster & Key Visuals',
    category: 'Poster',
    shortDesc: 'High-impact print & digital key art for concerts, events, film launches, festivals, and exhibitions.',
    startingPrice: 2800,
    turnaround: '2–5 days',
    revisionsCount: 2,
    deliverables: [
      'Print-ready 300 DPI CMYK PDF format (A1/A2/A3/Custom)',
      'Digital promo asset formatted for 1080x1350 & 16:9 displays',
      'Layered source file (PSD / AI / Affinity)',
      'Mockup presentation visuals',
    ],
    iconName: 'Image',
    relatedShopProductIds: ['prod-template-poster', 'prod-print-swiss'],
  },
  {
    id: 'srv-social',
    name: 'Social Media Graphics',
    category: 'Social Media',
    shortDesc: 'Eye-catching social feed templates, story graphics, podcast covers, and campaign assets that stop the scroll.',
    startingPrice: 2200,
    turnaround: '3–5 days',
    revisionsCount: 2,
    deliverables: [
      '5 customizable feed carousel / static post templates (Figma/Canva/PSD)',
      'Story highlight icons & banner graphics',
      'Export-ready web-optimized assets (PNG/WEBP)',
      'Clean grid curation recommendations',
    ],
    iconName: 'Share2',
    relatedShopProductIds: ['prod-template-social'],
  },
  {
    id: 'srv-illustration',
    name: 'Digital Illustrations',
    category: 'Illustration',
    shortDesc: 'Custom editorial illustrations, stylized character art, merch graphics, and multimedia concepts.',
    startingPrice: 4000,
    turnaround: '5–10 days',
    revisionsCount: 3,
    deliverables: [
      'Ultra high-resolution illustration (up to 8000px)',
      'Transparent background PNG + flat backdrop',
      'Merchandise / Apparel print-ready vector / 300 DPI export',
      'Process timelapse preview (upon request)',
    ],
    iconName: 'Palette',
  },
  {
    id: 'srv-books',
    name: 'Book & Album Covers',
    category: 'Book Covers',
    shortDesc: 'Immersive visual storytelling on book jackets, ebook covers, vinyl sleeves, and single track artwork.',
    startingPrice: 3800,
    turnaround: '4–8 days',
    revisionsCount: 2,
    deliverables: [
      'Full jacket wrap (Front, Spine, Back) with barcode placement',
      'E-book / Spotify / Apple Music square cover artwork (3000x3000px)',
      '3D realistic book/vinyl mockup previews for marketing',
      'Print mechanical PDF with bleed specifications',
    ],
    iconName: 'BookOpen',
  },
  {
    id: 'srv-custom',
    name: 'Custom Graphic Design',
    category: 'Other',
    shortDesc: 'Bespoke multimedia packages, creative direction, UI/UX asset kits, apparel graphics, and packaging.',
    startingPrice: 4500,
    turnaround: '5–14 days',
    revisionsCount: 3,
    deliverables: [
      'Tailored scope defined during project discussion',
      'Full editable source files with embedded assets',
      'Multi-platform output formats and specifications',
      'Direct ongoing consultation with Brewster A. Cabando',
    ],
    iconName: 'Wand2',
  },
];

export const INITIAL_PORTFOLIO: PortfolioProject[] = [];

export const INITIAL_USERS: User[] = [];

// -----------------------------------------------------------------------
// Production note: these arrays intentionally contain NO seeded/demo
// commissions, messages, timeline updates, files, or notifications.
// Real commission data lives exclusively in Supabase (public.commissions,
// etc.) and is loaded via AppContext's refreshCommissions()/
// refreshNotifications(), which treat the database as the sole source of
// truth. These empty arrays only serve as the safe fallback shape before
// any real data has loaded (or for a logged-out visitor), so the UI shows
// a proper empty state instead of fabricated sample records.
// -----------------------------------------------------------------------

export const INITIAL_COMMISSIONS: Commission[] = [];

export const INITIAL_MESSAGES: Message[] = [];

export const INITIAL_TIMELINE: ProgressUpdate[] = [];

export const INITIAL_FILES: ProjectFile[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
