import { StudioDesignDocument, StudioArtboard, StudioElement } from '../types';
import { DEFAULT_DESIGN_CONFIG, cloneDesignConfig } from './defaultDesignConfig';

export const CREATIVE_STUDIO_STORAGE_KEY = 'destalion_creative_studio_draft_v1';

export function createDefaultDesignDocument(): StudioDesignDocument {
  const heroArtboardElements: StudioElement[] = [
    {
      id: 'elem-bg-frame',
      name: 'Hero Backdrop Frame',
      type: 'frame',
      x: 0,
      y: 0,
      width: 1440,
      height: 900,
      fill: '#09090B',
      visible: true,
      locked: true,
    },
    {
      id: 'elem-badge',
      name: 'Studio Spec Badge',
      type: 'vector-badge',
      x: 96,
      y: 140,
      width: 280,
      height: 36,
      fill: '#18181B',
      stroke: '#27272A',
      strokeWidth: 1,
      borderRadius: 6,
      text: 'DESTALION ATELIER // SPEC 2026',
      fontSize: 11,
      color: '#EA580C',
      visible: true,
      locked: false,
    },
    {
      id: 'elem-headline-1',
      name: 'Main Display Headline',
      type: 'text',
      x: 96,
      y: 204,
      width: 720,
      height: 140,
      text: 'Make noise.\nMake meaning.',
      fontSize: 64,
      fontWeight: '900',
      color: '#FFFFFF',
      visible: true,
      locked: false,
    },
    {
      id: 'elem-tagline',
      name: 'Sub-headline Description',
      type: 'text',
      x: 96,
      y: 368,
      width: 580,
      height: 72,
      text: 'Aggressive brand identities, vector art direction, and high-precision digital systems for fearless ventures worldwide.',
      fontSize: 16,
      fontWeight: '400',
      color: '#A1A1AA',
      visible: true,
      locked: false,
    },
    {
      id: 'elem-cta-primary',
      name: 'Primary CTA Button',
      type: 'rectangle',
      x: 96,
      y: 470,
      width: 180,
      height: 48,
      fill: '#EA580C',
      borderRadius: 8,
      text: 'Initiate Project',
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
      visible: true,
      locked: false,
    },
    {
      id: 'elem-cta-secondary',
      name: 'Secondary Action Button',
      type: 'rectangle',
      x: 292,
      y: 470,
      width: 160,
      height: 48,
      fill: '#18181B',
      stroke: '#27272A',
      strokeWidth: 1,
      borderRadius: 8,
      text: 'View Showcase',
      fontSize: 13,
      fontWeight: '600',
      color: '#EDEDEC',
      visible: true,
      locked: false,
    },
    {
      id: 'elem-visual-card',
      name: 'Featured Artwork Plate',
      type: 'rectangle',
      x: 840,
      y: 160,
      width: 504,
      height: 580,
      fill: '#121214',
      stroke: '#222225',
      strokeWidth: 1,
      borderRadius: 16,
      visible: true,
      locked: false,
    },
  ];

  const mobileArtboardElements: StudioElement[] = [
    {
      id: 'elem-mobile-bg',
      name: 'Mobile Canvas',
      type: 'frame',
      x: 0,
      y: 0,
      width: 375,
      height: 812,
      fill: '#09090B',
      visible: true,
      locked: true,
    },
    {
      id: 'elem-mobile-headline',
      name: 'Mobile Headline',
      type: 'text',
      x: 24,
      y: 100,
      width: 327,
      height: 100,
      text: 'Make noise.\nMake meaning.',
      fontSize: 36,
      fontWeight: '900',
      color: '#FFFFFF',
      visible: true,
      locked: false,
    },
    {
      id: 'elem-mobile-cta',
      name: 'Mobile Primary CTA',
      type: 'rectangle',
      x: 24,
      y: 280,
      width: 327,
      height: 46,
      fill: '#EA580C',
      borderRadius: 8,
      text: 'Commission Studio',
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
      visible: true,
      locked: false,
    },
  ];

  const artboards: StudioArtboard[] = [
    {
      id: 'artboard-desktop-hero',
      name: 'Desktop Landing 1440×900',
      width: 1440,
      height: 900,
      backgroundColor: '#09090B',
      elements: heroArtboardElements,
    },
    {
      id: 'artboard-mobile-hero',
      name: 'Mobile Screen 375×812',
      width: 375,
      height: 812,
      backgroundColor: '#09090B',
      elements: mobileArtboardElements,
    },
  ];

  return {
    id: 'destalion-doc-master',
    title: 'DESTALION Master Website & Design System',
    version: 1,
    createdAt: '2026-10-24T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    activeArtboardId: 'artboard-desktop-hero',
    artboards,
    designConfig: cloneDesignConfig(DEFAULT_DESIGN_CONFIG),
  };
}

export function cloneStudioDocument(doc: StudioDesignDocument): StudioDesignDocument {
  return JSON.parse(JSON.stringify(doc));
}

export function loadSavedStudioDocument(): StudioDesignDocument {
  if (typeof window === 'undefined') return createDefaultDesignDocument();
  try {
    const raw = localStorage.getItem(CREATIVE_STUDIO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && Array.isArray(parsed.artboards) && parsed.artboards.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[CreativeStudio] Failed to parse saved draft, falling back to default master document.');
  }
  return createDefaultDesignDocument();
}

export function saveStudioDocument(doc: StudioDesignDocument): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // Strictly ensure only safe document structure is stored
    const safePayload = {
      id: doc.id,
      title: doc.title,
      version: doc.version,
      createdAt: doc.createdAt,
      updatedAt: new Date().toISOString(),
      activeArtboardId: doc.activeArtboardId,
      artboards: doc.artboards,
      designConfig: doc.designConfig,
    };
    localStorage.setItem(CREATIVE_STUDIO_STORAGE_KEY, JSON.stringify(safePayload));
    return true;
  } catch (e) {
    console.error('[CreativeStudio] Failed to save document to localStorage:', e);
    return false;
  }
}
