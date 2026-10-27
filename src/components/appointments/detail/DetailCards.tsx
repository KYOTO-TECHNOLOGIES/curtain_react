import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  CircleDot,
  Clock,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  UserCheck,
  UserPlus,
  UserRound,
  Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { DatePicker } from '../../ui/DatePicker';
import SelectMenu from '../../ui/SelectMenu';
import { StatusBadge } from '../../ui/StatusBadge';
import { StaffAssignmentPicker } from '../StaffAssignmentPicker';
import type { StaffAssignmentOption } from '../StaffAssignmentPicker';
import { getRolePresentation } from '../../../pages/users/UsersPage';
import { Card, CopyButton, EditField, EditShell, Value } from './DetailPrimitives';
import { JobTypeChip, SourceChip } from './StatusStrip';
import {
  avatarPalette,
  daysFromToday,
  displayCase,
  formatDisplayDate,
  formatDisplayTime,
  getInitials,
  getSourceMeta,
  hasValue,
  overdueDays,
  relativeDayHint,
  SOURCE_OPTIONS,
} from './helpers';
import type { AppointmentFormState, UpdateField } from './types';

const JOB_TYPE_OPTIONS = [
  { value: 'measurement', label: 'Measurement' },
  { value: 'installation', label: 'Installation' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'repair', label: 'Repair' },
];

interface FormCardProps {
  form: AppointmentFormState;
  original: AppointmentFormState;
  isEditing: boolean;
  updateField: UpdateField;
}

function Tile({
  icon: Icon,
  label,
  children,
  className = '',
}: {
  icon: typeof Clock;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`ad-tile ${className}`.trim()}>
      <span className="ad-tile__icon" aria-hidden="true"><Icon /></span>
      <div className="ad-tile__body">
        <dt className="ad-label">{label}</dt>
        <dd className="ad-value">{children}</dd>
      </div>
    </div>
  );
}

const sourceSelectOptions = (current: string) => {
  const options = [{ value: '', label: 'Not specified' }, ...SOURCE_OPTIONS];
  // Keep an unknown backend value selectable instead of silently dropping it.
  if (hasValue(current) && !options.some((option) => option.value === current)) {
    options.push({ value: current, label: displayCase(current) });
  }
  return options;
};

/* ── Appointment Overview ───────────────────────────── */
export function OverviewCard({ form, original, isEditing, updateField, status }: FormCardProps & { status: string }) {
  if (isEditing) {
    return (
      <Card icon={CalendarDays} tone="brand" title="Appointment Overview">
        <div className="ad-edit-grid">
          <EditField className="ad-span-2" label="Title" value={form.title} original={original.title} onChange={(v) => updateField('title', v)} />
          <EditShell label="Appointment Date" edited={form.appointment_date !== original.appointment_date}>
            <DatePicker
              value={form.appointment_date}
              onChange={(event) => updateField('appointment_date', event.target.value)}
              className="w-full"
            />
          </EditShell>
          <EditField
            label="Start Time"
            type="time"
            value={form.appointment_time}
            original={original.appointment_time}
            onChange={(v) => updateField('appointment_time', v)}
          />
          <EditShell label="Status">
            <div className="ad-static-status"><StatusBadge status={status} /></div>
          </EditShell>
          <EditShell label="Service Type" edited={form.job_type !== original.job_type}>
            <SelectMenu
              value={form.job_type}
              options={JOB_TYPE_OPTIONS}
              onChange={(v) => updateField('job_type', v)}
              ariaLabel="Service type"
            />
          </EditShell>
          <EditShell label="Appointment Source" edited={form.source !== original.source}>
            <SelectMenu
              value={form.source}
              options={sourceSelectOptions(form.source)}
              onChange={(v) => updateField('source', v)}
              ariaLabel="Appointment source"
            />
          </EditShell>
        </div>
      </Card>
    );
  }

  const days = daysFromToday(form.appointment_date);
  const overdue = overdueDays(status, form.appointment_date) !== null;
  const sourceMeta = getSourceMeta(form.source);
  return (
    <Card icon={CalendarDays} tone="brand" title="Appointment Overview">
      <dl className="ad-tiles">
        <Tile icon={CalendarDays} label="Appointment Date">
          {hasValue(form.appointment_date) ? (
            <>
              <time className="ad-tnum" dateTime={form.appointment_date}>{formatDisplayDate(form.appointment_date)}</time>
              {days !== null && <span className={`ad-hint ${overdue ? 'is-overdue' : ''}`}>{relativeDayHint(days)}</span>}
            </>
          ) : (
            <Value>{null}</Value>
          )}
        </Tile>
        <Tile icon={CalendarClock} label="Start Time">
          <span className="ad-tnum"><Value>{formatDisplayTime(form.appointment_time) || null}</Value></span>
        </Tile>
        <Tile icon={CircleDot} label="Status">
          <StatusBadge status={status} />
        </Tile>
        <Tile icon={Wrench} label="Service Type">
          <JobTypeChip jobType={form.job_type} />
        </Tile>
        {sourceMeta && (
          <Tile className="ad-span-2" icon={sourceMeta.icon} label="Appointment Source">
            <SourceChip source={form.source} />
          </Tile>
        )}
      </dl>
    </Card>
  );
}

/* ── Customer Information ───────────────────────────── */
export function CustomerCard({
  form,
  original,
  isEditing,
  updateField,
  customerId,
}: FormCardProps & { customerId?: number | string | null }) {
  if (isEditing) {
    return (
      <Card icon={UserRound} tone="violet" title="Customer Information">
        <div className="ad-edit-grid ad-edit-grid--aside">
          <EditField label="First Name" value={form.customer_first_name} original={original.customer_first_name} onChange={(v) => updateField('customer_first_name', v)} />
          <EditField label="Last Name" value={form.customer_last_name} original={original.customer_last_name} onChange={(v) => updateField('customer_last_name', v)} />
          <EditField className="ad-span-2" label="Phone" type="tel" value={form.customer_phone} original={original.customer_phone} onChange={(v) => updateField('customer_phone', v)} />
          <EditField className="ad-span-2" label="Email" type="email" value={form.customer_email} original={original.customer_email} onChange={(v) => updateField('customer_email', v)} />
        </div>
      </Card>
    );
  }

  const fullName = [form.customer_first_name, form.customer_last_name].filter(hasValue).join(' ');
  const palette = avatarPalette(String(customerId ?? fullName ?? 'customer'));
  const initials = fullName ? getInitials(fullName) : '?';
  const hasCustomerLink = customerId !== undefined && customerId !== null && customerId !== '';

  return (
    <Card icon={UserRound} tone="violet" title="Customer Information">
      <div className="ad-identity">
        <span
          className="ad-avatar ad-avatar--lg"
          aria-hidden="true"
          style={{ background: palette.tint, color: palette.ink, boxShadow: `inset 0 0 0 1px ${palette.ring}` }}
        >
          {initials}
        </span>
        {hasCustomerLink ? (
          <Link to={`/customers/${customerId}`} className="ad-link ad-identity__name" title={fullName}>
            <span className="ad-ellipsis">{fullName}</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ) : (
          <span className="ad-identity__name ad-ellipsis" title={fullName}>{fullName}</span>
        )}
      </div>

      <dl className="ad-rows">
        <div className="ad-pair">
          <div>
            <dt className="ad-label">First Name</dt>
            <dd className="ad-value"><Value>{form.customer_first_name}</Value></dd>
          </div>
          <div>
            <dt className="ad-label">Last Name</dt>
            <dd className="ad-value"><Value>{form.customer_last_name}</Value></dd>
          </div>
        </div>

        <div className="ad-row">
          <span className="ad-row__icon" aria-hidden="true"><Phone /></span>
          <div className="ad-row__body">
            <dt className="ad-label">Phone</dt>
            <dd className="ad-value ad-tnum">
              {hasValue(form.customer_phone) ? (
                <a className="ad-link" href={`tel:${form.customer_phone}`}>{form.customer_phone}</a>
              ) : (
                <Value>{null}</Value>
              )}
            </dd>
          </div>
          {hasValue(form.customer_phone) && <CopyButton value={form.customer_phone} label="Copy phone number" />}
        </div>

        {hasValue(form.customer_email) && (
          <div className="ad-row">
            <span className="ad-row__icon" aria-hidden="true"><Mail /></span>
            <div className="ad-row__body">
              <dt className="ad-label">Email</dt>
              <dd className="ad-value ad-wrap">
                <a className="ad-link" href={`mailto:${form.customer_email}`}>{form.customer_email}</a>
              </dd>
            </div>
            <CopyButton value={form.customer_email} label="Copy email address" />
          </div>
        )}
      </dl>
    </Card>
  );
}

/* ── Address Details ────────────────────────────────── */
export function AddressCard({ form, original, isEditing, updateField }: FormCardProps) {
  const joined = [form.location_building, form.location_unit, form.location_full_address].filter(hasValue).join(', ');

  if (isEditing) {
    return (
      <Card icon={MapPin} tone="emerald" title="Address Details">
        <div className="ad-edit-grid">
          <EditField label="Building" value={form.location_building} original={original.location_building} onChange={(v) => updateField('location_building', v)} />
          <EditField label="Unit" value={form.location_unit} original={original.location_unit} onChange={(v) => updateField('location_unit', v)} />
          <EditField className="ad-span-2" label="Full Address" value={form.location_full_address} original={original.location_full_address} onChange={(v) => updateField('location_full_address', v)} />
        </div>
      </Card>
    );
  }

  return (
    <Card
      icon={MapPin}
      tone="emerald"
      title="Address Details"
      right={hasValue(joined) ? <CopyButton value={joined} label="Copy address" /> : undefined}
    >
      <dl className="ad-dl-grid">
        {hasValue(form.location_building) && (
          <div>
            <dt className="ad-label">Building</dt>
            <dd className="ad-value ad-wrap">{form.location_building}</dd>
          </div>
        )}
        {hasValue(form.location_unit) && (
          <div>
            <dt className="ad-label">Unit</dt>
            <dd className="ad-value ad-wrap">{form.location_unit}</dd>
          </div>
        )}
        {hasValue(form.location_full_address) && (
          <div className="ad-span-2">
            <dt className="ad-label">Full Address</dt>
            <dd className="ad-value ad-wrap ad-value--prose">{form.location_full_address}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

/* ── Assignee ───────────────────────────────────────── */
interface AssigneeCardProps {
  isEditing: boolean;
  assignedTo: string;
  originalAssignedTo: string;
  users: Array<{ id: number | string; full_name?: string; email?: string; role?: any }>;
  fallbackName?: string;
  fallbackEmail?: string;
  options: StaffAssignmentOption[];
  onChange: (value: string) => void;
}

export function AssigneeCard({
  isEditing,
  assignedTo,
  originalAssignedTo,
  users,
  fallbackName,
  fallbackEmail,
  options,
  onChange,
}: AssigneeCardProps) {
  if (isEditing) {
    return (
      <Card icon={UserCheck} tone="teal" title="Assignee">
        <div className="ad-assignee-edit">
          {assignedTo !== originalAssignedTo && <span className="ad-edited ad-edited--float">Edited</span>}
          <StaffAssignmentPicker
            id="appointment-details-assignee"
            label="Assigned To"
            value={assignedTo}
            options={options}
            onChange={(event) => onChange(event.target.value)}
            allowUnassigned
          />
        </div>
      </Card>
    );
  }

  const user = users.find((u) => String(u.id) === String(assignedTo));
  const name = user?.full_name || fallbackName || '';
  const email = user?.email || fallbackEmail || '';
  const roleName = typeof user?.role === 'object' ? user?.role?.name : typeof user?.role === 'string' ? user.role : '';
  const role = roleName ? getRolePresentation(roleName) : null;
  const palette = avatarPalette(String(user?.id ?? name));

  return (
    <Card icon={UserCheck} tone="teal" title="Assignee">
      <dl>
        <dt className="ad-label">Assigned To</dt>
        <dd className="ad-assignee">
          {hasValue(assignedTo) && hasValue(name) ? (
            <>
              <span
                className="ad-avatar ad-avatar--md"
                aria-hidden="true"
                style={{ background: palette.tint, color: palette.ink, boxShadow: `inset 0 0 0 1px ${palette.ring}` }}
              >
                {getInitials(name)}
              </span>
              <span className="ad-assignee__copy">
                <span className="ad-assignee__name ad-ellipsis" title={name}>{name}</span>
                {email && <span className="ad-assignee__email ad-ellipsis" title={email}>{email}</span>}
              </span>
              {role && (
                <span
                  className="ad-role"
                  style={{ background: role.tint, color: role.ink, borderColor: role.ring }}
                >
                  <role.Icon aria-hidden="true" />
                  {displayCase(roleName)}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="ad-unassigned-icon" aria-hidden="true"><UserPlus /></span>
              <span className="ad-assignee__name ad-assignee__name--muted">Unassigned</span>
            </>
          )}
        </dd>
      </dl>
    </Card>
  );
}

/* ── Notes ──────────────────────────────────────────── */
export function NotesCard({ form, original, isEditing, updateField }: FormCardProps) {
  return (
    <Card icon={StickyNote} tone="amber" title="Notes">
      {isEditing ? (
        <EditField
          textarea
          label="Notes"
          value={form.description}
          original={original.description}
          onChange={(v) => updateField('description', v)}
        />
      ) : (
        <dl>
          <dt className="ad-sr">Notes</dt>
          <dd className="ad-note">{form.description}</dd>
        </dl>
      )}
    </Card>
  );
}
