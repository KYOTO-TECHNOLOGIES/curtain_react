import { CalendarDays, Clock3, UserRound } from 'lucide-react';
import type { AppointmentListItem } from '../../types';
import { StatusBadge } from './StatusBadge';
import './AppointmentSummaryCard.css';

interface AppointmentSummaryCardProps {
  appointment: AppointmentListItem;
  metadataLabel?: string;
}

function formatAppointmentDate(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatAppointmentTime(value: string) {
  if (!value) return '';
  if (value.toLowerCase().includes('am') || value.toLowerCase().includes('pm')) return value;
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  if (!Number.isFinite(hour) || !minute) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2)).toUpperCase();
}

export function AppointmentSummaryCard({ appointment, metadataLabel }: AppointmentSummaryCardProps) {
  const date = formatAppointmentDate(appointment.appointment_date);
  const time = formatAppointmentTime(appointment.appointment_time);
  const appointmentId = `#${String(appointment.id).replace(/^#/, '')}`;

  return (
    <section className="appointment-summary-card" role="group" aria-label="Appointment summary">
      <dl className="appointment-summary-main">
        <div className="appointment-summary-id-wrap">
          <dt className="appointment-summary-sr-only">Appointment ID</dt>
          <dd className="appointment-summary-id">{appointmentId}</dd>
        </div>
        <div className="appointment-summary-avatar" aria-hidden="true">
          {getInitials(appointment.customer_name || '')}
        </div>
        <div className="appointment-summary-copy">
          <dt className="appointment-summary-sr-only">Appointment title</dt>
          <dd className="appointment-summary-title" title={appointment.title || 'Appointment'}>
            {appointment.title || 'Appointment'}
          </dd>
          <dt className="appointment-summary-sr-only">Customer name</dt>
          <dd className="appointment-summary-customer">
            <UserRound aria-hidden="true" />
            <span title={appointment.customer_name}>{appointment.customer_name || 'Unknown customer'}</span>
          </dd>
        </div>
      </dl>
      {(metadataLabel || date || time || appointment.status) && (
        <div className="appointment-summary-metadata" aria-label={`${metadataLabel || ''} appointment details`.trim()}>
          {metadataLabel && <span className="appointment-summary-current-label">{metadataLabel}</span>}
          {date && (
            <span className="appointment-summary-meta-item">
              <CalendarDays aria-hidden="true" />
              <time>{date}</time>
            </span>
          )}
          {time && (
            <span className="appointment-summary-meta-item">
              <Clock3 aria-hidden="true" />
              <time>{time}</time>
            </span>
          )}
          {appointment.status && <StatusBadge status={appointment.status} />}
        </div>
      )}
    </section>
  );
}

export default AppointmentSummaryCard;
