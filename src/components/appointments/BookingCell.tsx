import React from 'react';
import { Clock } from 'lucide-react';

interface BookingCellProps {
  date: string;
  time?: string;
}

function formatDate(dateStr: string): { formatted: string; relativeBadge: string | null } {
  if (!dateStr) return { formatted: '—', relativeBadge: null };

  try {
    // Parse YYYY-MM-DD or standard ISO date
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');

    let dateObj: Date;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      dateObj = new Date(year, month, day);
    } else {
      dateObj = new Date(dateStr);
    }

    if (isNaN(dateObj.getTime())) {
      return { formatted: dateStr, relativeBadge: null };
    }

    // Formatted "10 Jun 2026"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    // Relative check for today/tomorrow
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const compareDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    let relativeBadge: string | null = null;
    if (compareDate.getTime() === today.getTime()) {
      relativeBadge = 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      relativeBadge = 'Tomorrow';
    }

    return { formatted, relativeBadge };
  } catch {
    return { formatted: dateStr, relativeBadge: null };
  }
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';

  try {
    // If already in 12h format like "9:00 AM"
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }

    // Handles "09:00" or "09:00:00"
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 hour is 12 AM
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr;
  }
}

export const BookingCell: React.FC<BookingCellProps> = ({ date, time }) => {
  const { formatted, relativeBadge } = formatDate(date);
  const formattedTime = formatTime(time);

  return (
    <div className="apt-booking-cell">
      <div className="apt-booking-date-row">
        <span className="apt-booking-date">{formatted}</span>
        {relativeBadge && (
          <span className="apt-today-pill" aria-label={`Appointment is ${relativeBadge}`}>
            {relativeBadge}
          </span>
        )}
      </div>

      {formattedTime && (
        <div className="apt-booking-time-row">
          <Clock className="apt-time-icon" aria-hidden="true" />
          <span className="apt-booking-time">{formattedTime}</span>
        </div>
      )}
    </div>
  );
};

export default BookingCell;
