/**
 * Display-only formatting helpers for the Quotation Detail page.
 * These are pure functions — they never modify the underlying data.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Turn snake_case / underscore-separated strings into sentence case.
 * "left_to_right" → "Left to right"
 */
export function sentenceCase(s?: string | null): string {
  if (!s) return '';
  const t = String(s).replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Format an ISO date string as "8 Sep 2026".
 */
export function formatDate(date?: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date).split('T')[0];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Legacy alias kept for backward compat (unused files may import it). */
export const formatDateISO = formatDate;

/**
 * Format area in m² with 2 decimals and a proper superscript marker.
 * Returns parts: { value: "9.30", unit: "m²" }
 */
export function formatAreaM2(widthCm: number | string | undefined, heightCm: number | string | undefined): string {
  const w = Number(widthCm) || 0;
  const h = Number(heightCm) || 0;
  const area = (w * h) / 10000;
  return `${area.toFixed(2)} m²`;
}

/**
 * Format dimensions: "300 × 310 cm"
 */
export function formatDimensions(widthCm: number | string | undefined, heightCm: number | string | undefined): string {
  if (widthCm == null || heightCm == null) return '';
  return `${Number(widthCm)} × ${Number(heightCm)} cm`;
}

/**
 * Format a monetary value: "0.00" — never returns NaN.
 */
export function formatMoney(v?: string | number | null): string {
  if (v == null || v === '') return '0.00';
  const n = Number(v);
  return Number.isNaN(n) ? '0.00' : n.toFixed(2);
}

/**
 * Get initials from a name: "Midlaj Midhu" → "MM"
 */
export function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Return a relative validity hint for "Valid Until" dates.
 * Only shows for statuses that aren't terminal (Accepted/Cancelled).
 */
export function getValidityHint(validUntil?: string | null, status?: string): {
  text: string;
  variant: 'ok' | 'warn' | 'expired';
} | null {
  if (!validUntil) return null;
  if (status === 'accepted' || status === 'cancelled') return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const until = new Date(validUntil);
  until.setHours(0, 0, 0, 0);

  const diffMs = until.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`, variant: 'expired' };
  }
  if (diffDays <= 7) {
    return { text: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, variant: 'warn' };
  }
  return { text: `Valid for ${diffDays} more day${diffDays !== 1 ? 's' : ''}`, variant: 'ok' };
}
