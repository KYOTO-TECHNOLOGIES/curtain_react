import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, ChevronRight, PencilLine, X } from 'lucide-react';
import { CopyButton } from './DetailPrimitives';

interface DetailHeaderProps {
  appointmentId: string | number;
  title: string;
  isEditing: boolean;
  isCancelled: boolean;
  isCancelling: boolean;
  onBack: () => void;
  onCancelAppointment: () => void;
  onEdit: () => void;
}

export function DetailHeader({
  appointmentId,
  title,
  isEditing,
  isCancelled,
  isCancelling,
  onBack,
  onCancelAppointment,
  onEdit,
}: DetailHeaderProps) {
  const idText = String(appointmentId);
  return (
    <header className="ad-header ad-reveal" style={{ '--i': 0 } as React.CSSProperties}>
      <nav aria-label="Breadcrumb" className="ad-crumbs">
        <Link to="/appointments" className="ad-crumbs__link">Appointments</Link>
        <ChevronRight className="ad-crumbs__sep" aria-hidden="true" />
        <span className="ad-crumbs__current" aria-current="page">{idText}</span>
      </nav>

      <div className="ad-header__row">
        <div className="ad-header__lead">
          <span className="ad-header__badge" aria-hidden="true">
            <CalendarCheck />
          </span>
          <div className="ad-header__text">
            <h1 className="ad-h1" title={title}>{title}</h1>
            <span className="ad-idchip">
              <span>{idText}</span>
              <CopyButton value={idText} label="Copy appointment ID" />
            </span>
          </div>
        </div>

        <div className="ad-actions">
          <button type="button" className="ad-btn ad-btn--ghost ad-btn--back" onClick={onBack} aria-label="Back to Appointments">
            <ArrowLeft aria-hidden="true" />
            <span className="ad-btn__label">Back to Appointments</span>
          </button>

          {!isEditing && (
            <>
              {!isCancelled && (
                <button
                  type="button"
                  className="ad-btn ad-btn--danger"
                  onClick={onCancelAppointment}
                  disabled={isCancelling}
                >
                  <X aria-hidden="true" />
                  <span>{isCancelling ? 'Cancelling...' : 'Cancel Appointment'}</span>
                </button>
              )}
              {!isCancelled && (
                <button type="button" className="ad-btn ad-btn--primary" onClick={onEdit}>
                  <PencilLine aria-hidden="true" />
                  <span>Edit Appointment</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
