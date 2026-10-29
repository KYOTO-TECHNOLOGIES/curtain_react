import React from 'react';
import { UserPlus, FilePlus, CalendarClock, FileCheck2 } from 'lucide-react';

interface RowActionsProps {
  appointmentId: number | string;
  status?: string;
  isAssigned: boolean;
  hasQuotation?: boolean;
  onAssign: (e: React.MouseEvent) => void;
  onQuote: (e: React.MouseEvent) => void;
  onReschedule: (e: React.MouseEvent) => void;
}

export const RowActions: React.FC<RowActionsProps> = ({
  appointmentId,
  status,
  isAssigned,
  hasQuotation = false,
  onAssign,
  onQuote,
  onReschedule,
}) => {
  const assignLabel = isAssigned ? 'Reassign' : 'Assign';
  const isCancelled = status === 'cancelled';

  return (
    <div
      className="apt-actions-cell"
      onClick={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label={`Actions for appointment #${appointmentId}`}
    >
      {/* Primary action: Assign / Reassign — hidden for cancelled appointments */}
      {!isCancelled && (
        <button
          type="button"
          className="apt-action-btn apt-action-btn-assign"
          onClick={onAssign}
          aria-label={`${assignLabel} appointment #${appointmentId}`}
          title={`${assignLabel} appointment`}
        >
          <UserPlus className="apt-action-icon" aria-hidden="true" />
          <span className="apt-action-label">{assignLabel}</span>
        </button>
      )}

      {/* Reschedule action — hidden for cancelled appointments */}
      {!isCancelled && (
        <button
          type="button"
          className="apt-action-btn apt-action-btn-reschedule"
          onClick={onReschedule}
          aria-label={`Reschedule appointment #${appointmentId}`}
          title="Reschedule appointment"
        >
          <CalendarClock className="apt-action-icon" aria-hidden="true" />
          <span className="apt-action-label">Reschedule</span>
        </button>
      )}

      {/* Secondary action: Quote — hidden for cancelled appointments */}
      {!isCancelled && (
        <button
          type="button"
          className={`apt-action-btn ${hasQuotation ? 'apt-action-btn-quoted' : 'apt-action-btn-quote'}`}
          onClick={onQuote}
          aria-label={hasQuotation ? `View quotation for appointment #${appointmentId}` : `Generate quote for appointment #${appointmentId}`}
          title={hasQuotation ? 'View Quotation' : 'Generate Quote'}
        >
          {hasQuotation ? (
            <FileCheck2 className="apt-action-icon" aria-hidden="true" />
          ) : (
            <FilePlus className="apt-action-icon" aria-hidden="true" />
          )}
          <span className="apt-action-label">{hasQuotation ? 'Quoted' : 'Quote'}</span>
        </button>
      )}
    </div>
  );
};

export default RowActions;
