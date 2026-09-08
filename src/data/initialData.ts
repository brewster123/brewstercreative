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
  studioName: 'Brewster Creative',
  title: 'Multimedia Artist & Brand Designer',
  bio: 'Specializing in distinctive visual identities, conceptual poster art, typographic systems, and high-impact digital illustration for innovative brands, creators, and indie studios worldwide.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  email: 'brewstercreates@gmail.com',
  location: 'Manila / Remote Worldwide',
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
      'Commercial usage license',
    ],
    popular: true,
    iconName: 'Sparkles',
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

export const INITIAL_PORTFOLIO: PortfolioProject[] = [
  {
    id: 'proj-1',
    title: 'Aura Botanica Identity & Packaging',
    category: 'Branding',
    shortDesc: 'Organic apothecary brand identity featuring minimalist typography and earth-tone packaging.',
    fullDesc: 'A comprehensive brand identity project for Aura Botanica, a sustainable botanical skincare line based in Kyoto. The system emphasizes tactile elegance, utilizing blind-embossed stationery, bespoke serif logotype, and delicate gold foil packaging accents.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&auto=format&fit=crop&q=80',
    ],
    tools: ['Adobe Illustrator', 'Photoshop', 'Figma', 'Blender 3D'],
    date: 'July 2026',
    client: 'Aura Botanica Co.',
    colorPalette: ['#1C1917', '#E7E5E4', '#C2410C', '#84CC16', '#78716C'],
    tags: ['Brand Identity', 'Packaging', 'Typography', 'Luxury Minimalist'],
    featured: true,
  },
  {
    id: 'proj-2',
    title: 'Neon Odyssey: Cyberpunk Festival Poster',
    category: 'Poster',
    shortDesc: 'Retro-futuristic key visual poster with heavy halftone grain and chromatic typography.',
    fullDesc: 'Promotional key visual poster for an underground electronic audio-visual festival in Neo-Tokyo. Created with custom vector geometry, distressed risograph textures, and iridescent duotone gradients.',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=900&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80',
    ],
    tools: ['Adobe Photoshop', 'Illustrator', 'Cinema 4D'],
    date: 'May 2026',
    client: 'Odyssey Live Productions',
    colorPalette: ['#09090B', '#F43F5E', '#06B6D4', '#E2E8F0', '#8B5CF6'],
    tags: ['Poster Design', 'Key Visual', 'Risograph', 'Typography'],
    featured: true,
  },
  {
    id: 'proj-3',
    title: 'Kroma Sound Logo & Sonic Branding',
    category: 'Logo',
    shortDesc: 'Dynamic waveform geometric monogram designed for an independent audio production label.',
    fullDesc: 'Kroma Sound required an iconic, ultra-scalable mark that functions equally well as a 16px favicon, a 3D animated track bumper, or a high-end vinyl deboss.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
    ],
    tools: ['Adobe Illustrator', 'Glyphs', 'After Effects'],
    date: 'April 2026',
    client: 'Kroma Audio Labs',
    colorPalette: ['#0A0A0A', '#F97316', '#FAFAFA', '#52525B'],
    tags: ['Logo Design', 'Monogram', 'Audio', 'Vector'],
    featured: true,
  },
  {
    id: 'proj-4',
    title: 'Echoes of Solaris: Sci-Fi Novel Cover',
    category: 'Book Covers',
    shortDesc: 'Hardcover dust jacket & typography layout for a bestselling sci-fi planetary thriller.',
    fullDesc: 'Full jacket design with custom digital matte painting, metallic foil stamped title typography, and comprehensive interior chapter title ornamentations.',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&auto=format&fit=crop&q=80',
    ],
    tools: ['Photoshop', 'InDesign', 'Procreate'],
    date: 'June 2026',
    client: 'Vanguard Literary Press',
    colorPalette: ['#18181B', '#D97706', '#3B82F6', '#E4E4E7'],
    tags: ['Book Cover', 'Editorial', 'Illustration', 'Print'],
    featured: false,
  },
  {
    id: 'proj-5',
    title: 'The Solitary Drifter: Editorial Illustration',
    category: 'Illustration',
    shortDesc: 'Surrealistic landscape illustration exploring human connection in isolated digital worlds.',
    fullDesc: 'Commissioned editorial piece for a technology & culture magazine essay on digital nomadism and psychological presence in the metaverse.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80',
    ],
    tools: ['Procreate', 'Adobe Illustrator', 'Photoshop'],
    date: 'March 2026',
    client: 'Epoch Magazine',
    colorPalette: ['#172554', '#EA580C', '#FEF08A', '#F1F5F9'],
    tags: ['Illustration', 'Editorial', 'Surrealism', 'Digital Painting'],
    featured: false,
  },
  {
    id: 'proj-6',
    title: 'HyperPulse Apparel & Social Campaign',
    category: 'Social Media',
    shortDesc: '30-day visual social campaign toolkit and street apparel graphics for an athletic wear launch.',
    fullDesc: 'Comprehensive launch visuals including kinetic motion story cards, animated typographic banners, product lookbook layouts, and heat-transfer garment graphics.',
    image: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=900&auto=format&fit=crop&q=80',
    ],
    tools: ['Figma', 'Illustrator', 'After Effects', 'Photoshop'],
    date: 'February 2026',
    client: 'HyperPulse Activewear',
    colorPalette: ['#000000', '#10B981', '#E11D48', '#FFFFFF'],
    tags: ['Social Media', 'Apparel', 'Marketing', 'Templates'],
    featured: false,
  },
];

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
