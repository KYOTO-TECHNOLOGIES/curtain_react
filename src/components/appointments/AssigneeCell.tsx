import React from 'react';
import { UserPlus } from 'lucide-react';

interface AssigneeCellProps {
  assigneeName?: string | null;
}

function getInitials(name: string): string {
  if (!name) return '??';
  const clean = name.replace(/[^\w\s]/gi, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AssigneeCell: React.FC<AssigneeCellProps> = ({ assigneeName }) => {
  if (!assigneeName) {
    return (
      <div className="apt-assignee-cell" aria-label="Not assigned to anyone">
        <div className="apt-unassigned-circle" aria-hidden="true">
          <UserPlus className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <span className="apt-unassigned-label">Unassigned</span>
      </div>
    );
  }

  const initials = getInitials(assigneeName);

  return (
    <div className="apt-assignee-cell" aria-label={`Assigned to ${assigneeName}`}>
      <div className="apt-assignee-avatar" aria-hidden="true">
        {initials}
      </div>
      <span className="apt-assignee-name" title={assigneeName}>
        {assigneeName}
      </span>
    </div>
  );
};

export default AssigneeCell;
