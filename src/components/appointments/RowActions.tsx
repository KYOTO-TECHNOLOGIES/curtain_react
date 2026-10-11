import React from 'react';
import { UserCheck, UserPlus, FilePlus } from 'lucide-react';

interface RowActionsProps {
  appointmentId: number | string;
  isAssigned: boolean;
  onAssign: (e: React.MouseEvent) => void;
  onQuote: (e: React.MouseEvent) => void;
}

export const RowActions: React.FC<RowActionsProps> = ({
  appointmentId,
  isAssigned,
  onAssign,
  onQuote,
}) => {
  const assignLabel = isAssigned ? 'Reassign' : 'Assign';

  return (
    <div
      className="apt-actions-cell"
      onClick={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label={`Actions for appointment #${appointmentId}`}
    >
      {/* Primary action: Assign / Reassign */}
      <button
        type="button"
        className="apt-action-btn"
        onClick={onAssign}
        aria-label={`${assignLabel} appointment #${appointmentId}`}
        title={`${assignLabel} appointment`}
      >
        {isAssigned ? (
          <UserCheck className="apt-action-icon" aria-hidden="true" />
        ) : (
          <UserPlus className="apt-action-icon" aria-hidden="true" />
        )}
        <span className="apt-action-label">{assignLabel}</span>
      </button>

      {/* Secondary action: Quote */}
      <button
        type="button"
        className="apt-action-btn apt-action-btn-quote"
        onClick={onQuote}
        aria-label={`Generate quote for appointment #${appointmentId}`}
        title="Generate Quote"
      >
        <FilePlus className="apt-action-icon" aria-hidden="true" />
        <span className="apt-action-label">Quote</span>
      </button>
    </div>
  );
};

export default RowActions;
