/**
 * Date formatting utility for Brewster Creative commission records.
 * Ensures consistent, human-readable date presentation (e.g. "September 16, 2026")
 * without unwanted timezone shifting for date-only or UTC midnight strings.
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Formats a commission deadline or submission date into "Month Day, Year" format.
 * - Leaves text values like "Flexible" or "Urgent" as-is.
 * - Parses ISO strings (e.g. "2026-09-16T00:00:00+00:00" or "2026-09-16")
 *   by calendar components to avoid timezone shifting backwards.
 * - Handles already formatted dates gracefully.
 */
export function formatCommissionDate(dateStr: string | undefined | null): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return 'Flexible';
  }

  const trimmed = dateStr.trim();
  if (!trimmed) {
    return 'Flexible';
  }

  // Check for ISO date format: YYYY-MM-DD (with optional time and timezone)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIndex = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);

    if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day) && !isNaN(year)) {
      return `${MONTH_NAMES[monthIndex]} ${day}, ${year}`;
    }
  }

  // If already matches "Month Day, Year" (e.g. "September 5, 2026")
  const alreadyFormattedMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (alreadyFormattedMatch) {
    return `${alreadyFormattedMatch[1]} ${alreadyFormattedMatch[2]}, ${alreadyFormattedMatch[3]}`;
  }

  // Fallback check: if Date parser understands it
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && !/^[A-Za-z\s]+$/.test(trimmed)) {
    // If it has a timestamp with specific hours
    return parsed.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Return text values (e.g. "Flexible", "Ongoing", etc.) as-is
  return trimmed;
}
