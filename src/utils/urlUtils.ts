/**
 * URL validation and sanitization utility for Brewster Creative commission reference links.
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
