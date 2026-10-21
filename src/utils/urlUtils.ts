/**
 * URL validation and sanitization utility for DESTALION commission reference links.
 * Ensures only authentic web URLs (with http:// or https:// scheme and valid domain)
 * are accepted and rendered as clickable links, preventing arbitrary text from being
 * converted into malformed URLs.
 */

/**
 * Validates whether a given string is a genuine HTTP/HTTPS URL with a valid domain.
 * Rejects plain text, domain-less names, and dangerous/invalid schemes.
 */
export function isValidReferenceUrl(urlString: string | undefined | null): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  const trimmed = urlString.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);

    // Only allow http and https schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Must have a valid hostname with at least one dot (e.g. example.com, behance.net)
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return false;
    }

    // Hostname cannot start or end with a dot, nor contain spaces
    if (
      parsed.hostname.startsWith('.') ||
      parsed.hostname.endsWith('.') ||
      parsed.hostname.includes(' ')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates whether an external checkout URL is secure (HTTPS) and properly formatted.
 * Enforces HTTPS to protect user privacy and transaction security on external platforms.
 */
export function isValidCheckoutUrl(urlString: string | undefined | null): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  const trimmed = urlString.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);

    // Only allow secure https protocol for checkout destinations
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Must have a valid hostname with at least one dot
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return false;
    }

    if (
      parsed.hostname.startsWith('.') ||
      parsed.hostname.endsWith('.') ||
      parsed.hostname.includes(' ')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Determines whether a product is safely eligible for active external checkout.
 * Strict multi-condition verification:
 * 1. An external checkout URL is defined and passes HTTPS validation.
 * 2. The product lifecycle status is explicitly 'Available'.
 * 3. An approved positive monetary price is configured (> 0).
 */
export function isProductCheckoutAvailable(product?: {
  status?: string;
  price?: number;
  externalCheckoutUrl?: string;
} | null): boolean {
  if (!product) {
    return false;
  }

  // Must have an approved real price
  if (typeof product.price !== 'number' || product.price <= 0) {
    return false;
  }

  // Must have status 'Available'
  if (product.status !== 'Available') {
    return false;
  }

  // Must have a valid secure HTTPS checkout URL
  if (!isValidCheckoutUrl(product.externalCheckoutUrl)) {
    return false;
  }

  return true;
}

/**
 * Normalizes user-entered social media values (handles, domain paths, or full URLs)
 * into safe, verified HTTPS external destinations.
 * Returns null if the value is missing, empty, or unresolvable.
 */
export function normalizeSocialMediaUrl(
  platform: 'instagram' | 'behance' | 'dribbble' | 'twitter' | 'discord',
  rawInput?: string | null
): string | null {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Discord handling: user tags (like user#1234) are not web links
  if (platform === 'discord') {
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      return trimmed;
    }
    if (trimmed.includes('discord.gg/') || trimmed.includes('discord.com/')) {
      return `https://${trimmed.replace(/^https?:\/\//, '')}`;
    }
    return null;
  }

  // If already a full HTTP or HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch {
      return null;
    }
  }

  // If starts with domain e.g. "instagram.com/user", "x.com/user"
  const domainPrefixes = ['instagram.com', 'behance.net', 'dribbble.com', 'x.com', 'twitter.com'];
  for (const domain of domainPrefixes) {
    if (trimmed.toLowerCase().startsWith(domain)) {
      return `https://${trimmed}`;
    }
  }

  // Handle format with leading @ or naked handle
  const cleanHandle = trimmed.replace(/^@+/, '').trim();
  if (!cleanHandle) return null;

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'behance':
      return `https://behance.net/${cleanHandle}`;
    case 'dribbble':
      return `https://dribbble.com/${cleanHandle}`;
    case 'twitter':
      return `https://x.com/${cleanHandle}`;
    default:
      return null;
  }
}
