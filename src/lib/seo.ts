import { PortfolioProject } from '../types';

const DEFAULT_TITLE = 'DESTALION — Experimental Multimedia Design Studio';
const DEFAULT_DESCRIPTION =
  'DESTALION is an experimental multimedia design studio specializing in distinctive visual identities, typographic systems, and high-impact digital releases.';
const DEFAULT_OG_IMAGE_PATH = '/og-default.jpg';

function upsertMetaTag(
  selectorAttr: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector(
    `meta[${selectorAttr}="${attrValue}"]`
  ) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(selectorAttr, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonicalLink(href: string): void {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function resolveShareableImageUrl(imageUrl?: string | null, origin?: string): string {
  const baseOrigin =
    origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const trimmed = typeof imageUrl === 'string' ? imageUrl.trim() : '';

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return baseOrigin ? `${baseOrigin}${trimmed}` : trimmed;
  }

  return baseOrigin ? `${baseOrigin}${DEFAULT_OG_IMAGE_PATH}` : DEFAULT_OG_IMAGE_PATH;
}

export function syncDocumentSeoForProject(project?: PortfolioProject | null): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const origin = window.location.origin;

  if (!project) {
    const pageUrl = `${origin}${window.location.pathname || '/'}`;
    const defaultImg = resolveShareableImageUrl(DEFAULT_OG_IMAGE_PATH, origin);
    document.title = DEFAULT_TITLE;
    upsertCanonicalLink(pageUrl);
    upsertMetaTag('name', 'description', DEFAULT_DESCRIPTION);
    upsertMetaTag('property', 'og:type', 'website');
    upsertMetaTag('property', 'og:title', DEFAULT_TITLE);
    upsertMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
    upsertMetaTag('property', 'og:url', pageUrl);
    upsertMetaTag('property', 'og:image', defaultImg);
    upsertMetaTag('property', 'og:image:alt', 'DESTALION Studio Showcase');
    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', DEFAULT_TITLE);
    upsertMetaTag('name', 'twitter:description', DEFAULT_DESCRIPTION);
    upsertMetaTag('name', 'twitter:image', defaultImg);
    return;
  }

  const title = `${project.title} — DESTALION Case Study`;
  const rawDesc = (project.shortDesc || project.fullDesc || DEFAULT_DESCRIPTION).trim();
  const description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
  const shareUrl = `${origin}/case-study/${encodeURIComponent(project.id)}`;
  const imageUrl = resolveShareableImageUrl(project.image, origin);

  document.title = title;
  upsertCanonicalLink(shareUrl);
  upsertMetaTag('name', 'description', description);
  upsertMetaTag('property', 'og:type', 'article');
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:url', shareUrl);
  upsertMetaTag('property', 'og:image', imageUrl);
  upsertMetaTag('property', 'og:image:alt', project.title);
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', imageUrl);
}
