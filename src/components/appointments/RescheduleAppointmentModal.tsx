import { CalendarClock, Clock3, Loader2 } from 'lucide-react';
import type { AppointmentListItem } from '../../types';
import Modal from '../ui/Modal';
import { DatePicker } from '../ui/DatePicker';
import { AppointmentSummaryCard } from './AppointmentSummaryCard';
import './RescheduleAppointmentModal.css';

interface RescheduleAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  appointment: AppointmentListItem | null;
  date: string;
  time: string;
  isSubmitting: boolean;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onReschedule: () => void;
}

export function RescheduleAppointmentModal({
  open,
  onClose,
  appointment,
  date,
  time,
  isSubmitting,
  onDateChange,
  onTimeChange,
  onReschedule,
}: RescheduleAppointmentModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reschedule Appointment"
      subtitle="Pick a new date and time for this appointment"
      variant="reschedule"
      isBusy={isSubmitting}
      footer={(
        <div className="reschedule-modal-actions">
          <button
            type="button"
            className="reschedule-modal-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="reschedule-modal-submit"
            onClick={onReschedule}
            disabled={isSubmitting || !date || !time}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? <Loader2 className="reschedule-modal-spinner" aria-hidden="true" />
              : <CalendarClock aria-hidden="true" />}
            <span>{isSubmitting ? 'Rescheduling…' : 'Reschedule'}</span>
          </button>
        </div>
      )}
    >
      {appointment && (
        <>
          <AppointmentSummaryCard appointment={appointment} metadataLabel="Current" />
          <div className="reschedule-modal-fields">
            <div className="reschedule-modal-field">
              <label htmlFor="appointment-reschedule-date">New date</label>
              <DatePicker
                id="appointment-reschedule-date"
                className="reschedule-date-picker"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                disabled={isSubmitting}
                aria-label="New date"
              />
            </div>
            <div className="reschedule-modal-field">
              <label htmlFor="appointment-reschedule-time">New time</label>
              <div className="reschedule-modal-time-control">
                <Clock3 aria-hidden="true" />
                <input
                  id="appointment-reschedule-time"
                  type="time"
                  value={time}
                  onChange={(event) => onTimeChange(event.target.value)}
                  disabled={isSubmitting}
                  aria-label="New time"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

export default RescheduleAppointmentModal;
