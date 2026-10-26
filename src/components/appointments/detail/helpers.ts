import { Briefcase, Ruler, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getInitials, stableHash, userPalette } from '../../../pages/users/UsersPage';

export { getInitials, stableHash, userPalette };

export const hasValue = (value: string | number | null | undefined) =>
  value !== null && value !== undefined && String(value).trim() !== '';

/** "in_progress" -> "In Progress" (display only). */
export const displayCase = (value: string | null | undefined) =>
  (value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const jobTypeIcon = (jobType: string | null | undefined): LucideIcon => {
  const key = (jobType || '').toLowerCase();
  if (key === 'installation') return Wrench;
  if (key === 'measurement') return Ruler;
  return Briefcase;
};

/** Parses "YYYY-MM-DD" (or an ISO string) as a LOCAL calendar date. */
export const parseLocalDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDisplayDate = (value: string | null | undefined) => {
  const date = parseLocalDate(value);
  return date ? dateFormatter.format(date) : '';
};

/** Whole days from today (local) to the date; negative = in the past. */
export const daysFromToday = (value: string | null | undefined): number | null => {
  const date = parseLocalDate(value);
  if (!date) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
};

export const relativeDayHint = (days: number | null) => {
  if (days === null) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;
};

/** Pending/active appointment whose date has passed (display-only hint). */
export const overdueDays = (status: string | null | undefined, date: string | null | undefined): number | null => {
  const key = (status || '').toLowerCase();
  if (key !== 'scheduled' && key !== 'rescheduled') return null;
  const days = daysFromToday(date);
  return days !== null && days < 0 ? Math.abs(days) : null;
};

/** "11:00:00" / "11:00" -> "11:00 AM" (same clock time, display only). */
export const formatDisplayTime = (value: string | null | undefined) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, '0')}:${match[2]} ${suffix}`;
};

export const formatUpdatedDate = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Stable avatar colors hashed from an id or name. */
export const avatarPalette = (key: string) => userPalette[stableHash(key) % userPalette.length];
