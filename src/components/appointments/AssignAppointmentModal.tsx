import { useMemo } from 'react';
import {
  ArrowRight,
  Check,
  Info,
  UserCheck,
} from 'lucide-react';
import type { AppointmentListItem, User } from '../../types';
import { isAssignableStaff } from '../../types';
import Modal from '../ui/Modal';
import { AppointmentSummaryCard } from './AppointmentSummaryCard';
import { StaffAssignmentPicker } from './StaffAssignmentPicker';
import './AssignAppointmentModal.css';

interface AssignAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  appointment: AppointmentListItem | null;
  assignUserId: number | '';
  users: User[];
  assigning: boolean;
  onAssign: () => void;
  onStaffChange: (event: { target: { value: string } }) => void;
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CU';
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2)).toUpperCase();
}

export function AssignAppointmentModal({
  open,
  onClose,
  appointment,
  assignUserId,
  users,
  assigning,
  onAssign,
  onStaffChange,
}: AssignAppointmentModalProps) {
  const eligibleUsers = useMemo(() => (
    (Array.isArray(users) ? users : []).filter(isAssignableStaff)
  ), [users]);

  const staffOptions = useMemo(() => (
    eligibleUsers.map((user) => ({
      value: String(user.id),
      name: user.full_name,
      email: user.email,
      role: typeof user.role === 'object' ? user.role?.name : undefined,
    }))
  ), [eligibleUsers]);

  const selectedStaff = users.find((user) => String(user.id) === String(assignUserId));
  const selectedName = selectedStaff?.full_name || '';
  const currentAssignee = appointment?.assigned_to_name || '';
  const isReassigning = Boolean(currentAssignee);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Appointment"
      subtitle={isReassigning ? 'Choose a new team member' : 'Choose a team member for this appointment'}
      variant="assign"
      isBusy={assigning}
      footer={(
        <div className="assign-modal-actions">
          <button type="button" className="assign-modal-cancel" onClick={onClose} disabled={assigning}>
            Cancel
          </button>
          <button
            type="button"
            className={`assign-modal-submit ${assignUserId !== '' && !assigning ? 'is-enabled' : ''}`}
            onClick={onAssign}
            disabled={assigning || assignUserId === ''}
            aria-busy={assigning}
          >
            {assigning ? <span className="assign-modal-spinner" aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
            <span>{assigning ? 'Assigning…' : 'Assign Staff'}</span>
          </button>
        </div>
      )}
    >
      {appointment && (
        <>
          <AppointmentSummaryCard appointment={appointment} />

          <div className="assign-modal-field-group">
            {currentAssignee && (
              <div className={`assign-modal-current ${selectedName && selectedName !== currentAssignee ? 'has-change' : ''}`}>
                <span className="assign-modal-current-label">Currently assigned to</span>
                <span className="assign-modal-staff-chip">
                  <span className="assign-modal-staff-avatar" aria-hidden="true">{getInitials(currentAssignee)}</span>
                  <span title={currentAssignee}>{currentAssignee}</span>
                </span>
                {selectedName && selectedName !== currentAssignee && (
                  <>
                    <ArrowRight className="assign-modal-change-arrow" aria-hidden="true" />
                    <span className="assign-modal-staff-chip is-next">
                      <span className="assign-modal-staff-avatar" aria-hidden="true">{getInitials(selectedName)}</span>
                      <span title={selectedName}>{selectedName}</span>
                    </span>
                  </>
                )}
              </div>
            )}

            <StaffAssignmentPicker
              id="appointment-assign-staff"
              label="Assign To"
              value={String(assignUserId)}
              options={staffOptions}
              onChange={onStaffChange}
              required
              disabled={assigning}
            />

            <div className={`assign-modal-helper ${selectedName ? 'is-ready' : ''}`} aria-live="polite">
              {selectedName ? (
                <>
                  <Check aria-hidden="true" />
                  <span>Ready to assign to {selectedName}.</span>
                </>
              ) : (
                <>
                  <Info aria-hidden="true" />
                  <span>Choose who will handle this appointment.</span>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

export default AssignAppointmentModal;
