import { ShopCategory, UpcomingShopRelease } from '../types';

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: 'all',
    name: 'All',
    description: 'Explore all digital design assets, branding kits, prints, and studio resources.',
  },
  {
    id: 'branding-kits',
    name: 'Branding Kits',
    description: 'Comprehensive identity starter systems, logo marks, brand guides, and social assets.',
  },
  {
    id: 'vector-packs',
    name: 'Vector Packs',
    description: 'Scalable vector icons, vintage emblems, badges, and technical graphic elements.',
  },
  {
    id: 'print-posters',
    name: 'Print & Posters',
    description: 'High-resolution 300 DPI editorial poster art, Swiss layout templates, and physical prints.',
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Display typefaces, custom lettering packs, ligature sets, and font specimen layouts.',
  },
  {
    id: 'digital-mockups',
    name: 'Digital Mockups',
    description: 'Photorealistic device mockups, studio stationery scenes, and presentation stages.',
  },
];

export const UPCOMING_SHOP_RELEASES: UpcomingShopRelease[] = [
  {
    id: 'release-branding-apex',
    title: 'Apex Minimalist Brand Identity System',
    category: 'Branding Kits',
    categoryId: 'branding-kits',
    badge: 'Vector Kit v1',
    typeLabel: 'Branding & Identity',
    status: 'Coming Soon',
    description: 'Comprehensive brand starter with responsive logo marks, style guide layout, typography scale, and social headers.',
    formats: 'AI • EPS • SVG • PDF',
    phaseTag: 'Phase 4A.2',
    tagline: 'Branding Kit',
    iconName: 'Tag',
  },
  {
    id: 'release-print-swiss',
    title: 'Brutalist Swiss Poster Art Collection',
    category: 'Print & Posters',
    categoryId: 'print-posters',
    badge: 'Print Series',
    typeLabel: 'Editorial & Poster',
    status: 'In Production',
    description: 'High-res 300 DPI vector poster templates exploring modernist typography, asymmetrical grids, and experimental forms.',
    formats: 'Vector & 300DPI Print',
    phaseTag: 'Phase 4A.2',
    tagline: 'Print & Posters',
    iconName: 'Palette',
  },
  {
    id: 'release-vector-badges',
    title: 'Retro Badges & Heritage Insignia Pack',
    category: 'Vector Packs',
    categoryId: 'vector-packs',
    badge: 'Vector Pack',
    typeLabel: 'Icons & Badges',
    status: 'Coming Soon',
    description: 'Over 40 customizable vintage geometric badges, crests, and emblems with editable typography layers.',
    formats: 'SVG • EPS • PNG',
    phaseTag: 'Phase 4A.2',
    tagline: 'Vector Pack',
    iconName: 'Package',
  },
];
