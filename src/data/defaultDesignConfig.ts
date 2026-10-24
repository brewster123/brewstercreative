import { StudioDesignConfig, ThemeColors, ViewportDefinition } from '../types';

/**
 * DESTALION Canonical Design Configuration (Milestone 1)
 * Faithfully mirrors the existing stylesheet variables from src/index.css:
 * - Light Mode: Canvas #FAF9F6, Surface #FFFFFF, Accent #EA580C
 * - Dark Mode: Canvas #09090B, Surface #121214, Accent #EA580C
 * - Typography: Plus Jakarta Sans with crisp geometric tracking
 */
export const DEFAULT_DESIGN_CONFIG: StudioDesignConfig = {
  version: 1,
  id: 'config-destalion-v1',
  name: 'DESTALION Atelier Standard',
  updatedAt: '2026-10-24T00:00:00.000Z',
  themeVariant: 'default',
  maxContentWidthPx: 1280,
  light: {
    bgCanvas: '#FAF9F6',
    bgSurface: '#FFFFFF',
    bgSurfaceSecondary: '#F4F2ED',
    textPrimary: '#18181B',
    textMuted: '#71717A',
    borderSubtle: '#E4E2DC',
    accent: '#EA580C',
    accentHover: '#D94814',
  },
  dark: {
    bgCanvas: '#09090B',
    bgSurface: '#121214',
    bgSurfaceSecondary: '#18181B',
    textPrimary: '#FFFFFF',
    textMuted: '#A1A1AA',
    borderSubtle: '#222225',
    accent: '#EA580C',
    accentHover: '#D94814',
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
    headingFontFamily: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
    baseFontSizePx: 16,
    headingScale: 1.25,
    bodyLineHeight: 1.6,
    headingLetterSpacing: '-0.025em',
  },
  spacing: {
    sectionPaddingY: 64,
    containerPaddingX: 24,
    gridGap: 24,
  },
  borders: {
    radiusSm: 4,
    radiusMd: 8,
    radiusLg: 12,
    radiusXl: 16,
    borderWidth: 1,
  },
};

export const SUPPORTED_FONT_FAMILIES = [
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (DESTALION Default)', value: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif' },
  { id: 'Inter', label: 'Inter (Neo-Digital)', value: 'Inter, system-ui, -apple-system, sans-serif' },
  { id: 'Space Grotesk', label: 'Space Grotesk (Brutalist Modern)', value: 'Space Grotesk, system-ui, sans-serif' },
  { id: 'Cinzel', label: 'Cinzel (Monolithic Classical)', value: 'Cinzel, Georgia, serif' },
  { id: 'JetBrains Mono', label: 'JetBrains Mono (Technical / Code)', value: 'JetBrains Mono, monospace' },
];

export const VIEWPORT_DEFINITIONS: ViewportDefinition[] = [
  { id: 'desktop', label: 'Desktop (1440px)', width: 1440, height: 900, iconName: 'Monitor' },
  { id: 'tablet', label: 'Tablet (768px)', width: 768, height: 1024, iconName: 'Tablet' },
  { id: 'mobile', label: 'Mobile (375px)', width: 375, height: 667, iconName: 'Smartphone' },
];

/** Strict bounds & validators to prevent CSS / JS injection */
export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHexColor(value: unknown): boolean {
  return typeof value === 'string' && HEX_COLOR_REGEX.test(value.trim());
}

export function sanitizeHexColor(value: unknown, fallback: string): string {
  if (isValidHexColor(value)) {
    return (value as string).trim().toUpperCase();
  }
  return fallback;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || isNaN(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

/**
 * Validates any configuration object against DESTALION design token boundaries.
 * Enforces sanitization and returns an infallible StudioDesignConfig with errors list.
 */
export function validateDesignConfig(raw: unknown): {
  valid: boolean;
  config: StudioDesignConfig;
  errors: string[];
} {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      config: JSON.parse(JSON.stringify(DEFAULT_DESIGN_CONFIG)),
      errors: ['Input configuration was not an object; reset to canonical defaults.'],
    };
  }

  const r = raw as Record<string, any>;
  const base = DEFAULT_DESIGN_CONFIG;

  const validateThemeColors = (c: any, defaultColors: ThemeColors, themeName: string): ThemeColors => {
    const result: ThemeColors = { ...defaultColors };
    const keys: (keyof ThemeColors)[] = [
      'bgCanvas',
      'bgSurface',
      'bgSurfaceSecondary',
      'textPrimary',
      'textMuted',
      'borderSubtle',
      'accent',
      'accentHover',
    ];

    keys.forEach((k) => {
      if (c && isValidHexColor(c[k])) {
        result[k] = c[k].trim();
      } else if (c && c[k] !== undefined) {
        errors.push(`Invalid hex color for ${themeName}.${k}: "${c[k]}". Reverted to ${defaultColors[k]}.`);
      }
    });

    return result;
  };

  const lightColors = validateThemeColors(r.light, base.light, 'light');
  const darkColors = validateThemeColors(r.dark, base.dark, 'dark');

  // Typography bounds: 12-24px base, 1.1-1.6 scale, 1.2-2.2 line height
  const baseFontSizePx = clampNumber(r.typography?.baseFontSizePx, 12, 24, base.typography.baseFontSizePx);
  if (r.typography?.baseFontSizePx !== undefined && r.typography?.baseFontSizePx !== baseFontSizePx) {
    errors.push(`baseFontSizePx clamped to valid range [12, 24]: ${baseFontSizePx}`);
  }

  const headingScale = clampNumber(r.typography?.headingScale, 1.1, 1.6, base.typography.headingScale);
  const bodyLineHeight = clampNumber(r.typography?.bodyLineHeight, 1.2, 2.2, base.typography.bodyLineHeight);

  // Font family safety
  const allowedFonts = SUPPORTED_FONT_FAMILIES.map((f) => f.value);
  const rawFamily = r.typography?.fontFamily;
  const rawHeadingFamily = r.typography?.headingFontFamily;

  const fontFamily = typeof rawFamily === 'string' && allowedFonts.includes(rawFamily)
    ? rawFamily
    : base.typography.fontFamily;

  const headingFontFamily = typeof rawHeadingFamily === 'string' && allowedFonts.includes(rawHeadingFamily)
    ? rawHeadingFamily
    : base.typography.headingFontFamily;

  const headingLetterSpacing = typeof r.typography?.headingLetterSpacing === 'string' &&
    /^[-+]?[0-9]*\.?[0-9]+(em|px)$/.test(r.typography.headingLetterSpacing.trim())
      ? r.typography.headingLetterSpacing.trim()
      : base.typography.headingLetterSpacing;

  // Spacing bounds: section padding 24-160px, container padding 12-48px, grid gap 8-48px
  const sectionPaddingY = clampNumber(r.spacing?.sectionPaddingY, 24, 160, base.spacing.sectionPaddingY);
  const containerPaddingX = clampNumber(r.spacing?.containerPaddingX, 12, 48, base.spacing.containerPaddingX);
  const gridGap = clampNumber(r.spacing?.gridGap, 8, 48, base.spacing.gridGap);

  // Border bounds: radius 0-32px, border width 1-4px
  const radiusSm = clampNumber(r.borders?.radiusSm, 0, 16, base.borders.radiusSm);
  const radiusMd = clampNumber(r.borders?.radiusMd, 0, 24, base.borders.radiusMd);
  const radiusLg = clampNumber(r.borders?.radiusLg, 0, 32, base.borders.radiusLg);
  const radiusXl = clampNumber(r.borders?.radiusXl, 0, 48, base.borders.radiusXl);
  const borderWidth = clampNumber(r.borders?.borderWidth, 1, 4, base.borders.borderWidth);

  // Max width: 960-1600px
  const maxContentWidthPx = clampNumber(r.maxContentWidthPx, 960, 1600, base.maxContentWidthPx);

  const themeVariant = (['default', 'high-contrast', 'editorial-minimal'].includes(r.themeVariant)
    ? r.themeVariant
    : 'default') as 'default' | 'high-contrast' | 'editorial-minimal';

  const validated: StudioDesignConfig = {
    version: 1,
    id: typeof r.id === 'string' && r.id.length > 0 ? r.id : base.id,
    name: typeof r.name === 'string' && r.name.length > 0 ? r.name : base.name,
    updatedAt: new Date().toISOString(),
    themeVariant,
    maxContentWidthPx,
    light: lightColors,
    dark: darkColors,
    typography: {
      fontFamily,
      headingFontFamily,
      baseFontSizePx,
      headingScale,
      bodyLineHeight,
      headingLetterSpacing,
    },
    spacing: {
      sectionPaddingY,
      containerPaddingX,
      gridGap,
    },
    borders: {
      radiusSm,
      radiusMd,
      radiusLg,
      radiusXl,
      borderWidth,
    },
  };

  return {
    valid: errors.length === 0,
    config: validated,
    errors,
  };
}

/**
 * Deep clones a design configuration for immutable state updates and undo/redo history.
 */
export function cloneDesignConfig(config: StudioDesignConfig): StudioDesignConfig {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Checks whether two design configurations are functionally identical.
 */
export function areConfigsEqual(a: StudioDesignConfig, b: StudioDesignConfig): boolean {
  return (
    a.themeVariant === b.themeVariant &&
    a.maxContentWidthPx === b.maxContentWidthPx &&
    JSON.stringify(a.light) === JSON.stringify(b.light) &&
    JSON.stringify(a.dark) === JSON.stringify(b.dark) &&
    JSON.stringify(a.typography) === JSON.stringify(b.typography) &&
    JSON.stringify(a.spacing) === JSON.stringify(b.spacing) &&
    JSON.stringify(a.borders) === JSON.stringify(b.borders)
  );
}

/**
 * Generates an isolated set of CSS custom properties strictly for the preview container.
 * This guarantees ZERO leakage to :root, AppContext, or live visitor views.
 */
export function generateScopedCssVars(config: StudioDesignConfig, mode: 'light' | 'dark'): Record<string, string> {
  const colors = mode === 'dark' ? config.dark : config.light;
  return {
    '--bg-canvas': colors.bgCanvas,
    '--bg-surface': colors.bgSurface,
    '--bg-surface-secondary': colors.bgSurfaceSecondary,
    '--text-primary': colors.textPrimary,
    '--text-muted': colors.textMuted,
    '--border-subtle': colors.borderSubtle,
    '--accent': colors.accent,
    '--accent-hover': colors.accentHover,
    '--font-sans': config.typography.fontFamily,
    '--font-display': config.typography.headingFontFamily,
    '--font-base-size': `${config.typography.baseFontSizePx}px`,
    '--heading-scale': `${config.typography.headingScale}`,
    '--body-line-height': `${config.typography.bodyLineHeight}`,
    '--heading-letter-spacing': config.typography.headingLetterSpacing,
    '--radius-sm': `${config.borders.radiusSm}px`,
    '--radius-md': `${config.borders.radiusMd}px`,
    '--radius-lg': `${config.borders.radiusLg}px`,
    '--radius-xl': `${config.borders.radiusXl}px`,
    '--border-width': `${config.borders.borderWidth}px`,
    '--max-content-width': `${config.maxContentWidthPx}px`,
    '--section-padding-y': `${config.spacing.sectionPaddingY}px`,
    '--container-padding-x': `${config.spacing.containerPaddingX}px`,
    '--grid-gap': `${config.spacing.gridGap}px`,
  };
}
