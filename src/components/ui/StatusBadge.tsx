import React from 'react';
import './StatusBadge.css';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  style,
}) => {
  const normalized = (status || '').toLowerCase().trim();
  const displayLabel = label || normalized.replace(/_/g, ' ');

  const isCompleted = normalized === 'completed' || normalized === 'approved' || normalized === 'accepted' || normalized === 'paid';
  const isInProgress = normalized === 'in_progress' || normalized === 'in-progress' || normalized === 'processing' || normalized === 'partially_paid' || normalized === 'overdue';

  // Base status class
  const statusClassKey = normalized.replace(/\s+/g, '_');
  const variantClass = `status-badge-${statusClassKey}`;

  return (
    <span
      className={`status-badge ${variantClass} ${className}`}
      style={style}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      {isCompleted ? (
        <svg
          className="status-check-icon"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="2.5 6 4.8 8.5 9.5 3.5" className="status-check-path" />
        </svg>
      ) : (
        <span
          className={`status-badge-dot ${isInProgress ? 'status-badge-dot-pulse' : ''}`}
          aria-hidden="true"
        />
      )}
      <span className="status-badge-text">{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
