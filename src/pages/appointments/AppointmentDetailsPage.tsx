import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Loader2,
  MapPin,
  PencilLine,
  Phone,
  Save,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { usersApi } from '../../api/users';
import { useToast } from '../../components/ui/Toast';
import type { AppointmentDetail, User } from '../../types';

type AppointmentFormState = {
  id: number | string;
  title: string;
  description: string;
  status: string;
  job_type: string;
  appointment_date: string;
  appointment_time: string;
  end_time: string;
  assigned_to: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  customer_email: string;
  customer_company_name: string;
  location_building: string;
  location_unit: string;
  location_full_address: string;
  location_instructions: string;
};

const statusStyles: Record<string, string> = {
  pending: 'bg-slate-200 text-slate-700',
  scheduled: 'bg-[#2b5c8f] text-white',
  in_progress: 'bg-[#f97316] text-white',
  completed: 'bg-[#10b981] text-white',
  cancelled: 'bg-[#ef4444] text-white',
  rescheduled: 'bg-[#8b5cf6] text-white',
};

const formatText = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return '—';
  if (value.length <= 5) return value;
  return value.slice(0, 5);
};

const buildFormState = (appointment: AppointmentDetail): AppointmentFormState => ({
  id: appointment.id,
  title: appointment.title || '',
  description: appointment.description || '',
  status: appointment.status || 'pending',
  job_type: appointment.job_type || 'consultation',
  appointment_date: appointment.appointment_date || '',
  appointment_time: appointment.appointment_time || '',
  end_time: appointment.end_time || '',
  assigned_to: appointment.assigned_to ? String(appointment.assigned_to) : '',
  customer_first_name: (appointment as any).customer_first_name ?? appointment.customer?.first_name ?? '',
  customer_last_name: (appointment as any).customer_last_name ?? appointment.customer?.last_name ?? '',
  customer_phone: (appointment as any).customer_phone ?? appointment.customer?.phone ?? '',
  customer_email: (appointment as any).customer_email ?? appointment.customer?.email ?? '',
  customer_company_name: (appointment as any).customer_company_name ?? appointment.customer?.company_name ?? '',
  location_building: appointment.location?.building_name || '',
  location_unit: appointment.location?.unit_number || '',
  location_full_address: appointment.location?.full_address || '',
  location_instructions: appointment.location?.additional_instructions || '',
});

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  options,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  textarea?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-25 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/10"
        />
      ) : options ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/10"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/10"
        />
      )}
    </label>
  );
}

export default function AppointmentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<AppointmentFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointment-detail', id],
    queryFn: () => appointmentsApi.get(String(id)),
    enabled: Boolean(id),
    retry: false,
  });

  const { data: usersRes } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  const users: User[] = useMemo(() => {
    const raw = usersRes?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray((raw as any)?.results)) return (raw as any).results;
    if (Array.isArray((raw as any)?.data)) return (raw as any).data;
    if (Array.isArray(usersRes)) return usersRes as any;
    return [];
  }, [usersRes]);

  const appointment = data?.data as AppointmentDetail | undefined;

  useEffect(() => {
    if (appointment) {
      setFormState(buildFormState(appointment));
    }
  }, [appointment]);

  const assigneeOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...(Array.isArray(users) ? users : []).map((user) => ({ value: String(user.id), label: user.full_name || user.email })),
    ],
    [users],
  );

  const updateField = <K extends keyof AppointmentFormState>(field: K, value: AppointmentFormState[K]) => {
    setFormState((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleCancel = () => {
    if (appointment) {
      setFormState(buildFormState(appointment));
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!appointment || !formState) return;

    const customerFirstName = formState.customer_first_name.trim();
    const customerLastName = formState.customer_last_name.trim();
    const customerPhone = formState.customer_phone.trim();

    if (!customerFirstName || !customerLastName || !customerPhone) {
      showToast('Customer first name, last name, and phone are required.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        customer: appointment.customer?.id,
        title: formState.title,
        description: formState.description,
        appointment_date: formState.appointment_date,
        appointment_time: formState.appointment_time,
        end_time: formState.end_time || undefined,
        job_type: formState.job_type as any,
        status: formState.status as any,
        assigned_to: formState.assigned_to ? Number(formState.assigned_to) : undefined,
        assignee: formState.assigned_to ? Number(formState.assigned_to) : undefined,
        assignee_id: formState.assigned_to ? Number(formState.assigned_to) : undefined,
        customer_first_name: customerFirstName,
        customer_last_name: customerLastName,
        customer_phone: customerPhone,
        customer_email: formState.customer_email.trim() || undefined,
        customer_company_name: formState.customer_company_name.trim() || undefined,
        customer_address: formState.location_full_address || undefined,
        location_building: formState.location_building,
        location_unit: formState.location_unit,
        location_full_address: formState.location_full_address,
        location_instructions: formState.location_instructions,
      };

      const response = await appointmentsApi.update(appointment.id, payload);
      const updatedAppointment = response.data as AppointmentDetail;

      queryClient.setQueryData(['appointment-detail', String(id)], (previous: any) => ({
        ...(previous || {}),
        data: updatedAppointment,
      }));
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments_stats'] });

      setFormState(buildFormState(updatedAppointment));
      setIsEditing(false);
      showToast('Appointment updated successfully', 'success');
    } catch (saveError: any) {
      const message = saveError?.response?.data?.detail || saveError?.response?.data || 'Failed to update appointment';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const customerName = formState
    ? `${formState.customer_first_name} ${formState.customer_last_name}`.trim() || '—'
    : appointment
      ? `${appointment.customer?.first_name || ''} ${appointment.customer?.last_name || ''}`.trim() || '—'
      : '—';

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">Loading appointment details...</span>
        </div>
      </div>
    );
  }

  if (isError || !appointment || !formState) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <h2 className="text-lg font-bold text-red-700">Unable to load appointment</h2>
            <p className="mt-1 text-sm text-red-600">
              {(error as Error)?.message || 'The appointment could not be found or the API is unavailable.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-in font-sans">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span>Appointments</span>
            <span>•</span>
            <span className="text-[#2b5c8f]">#{appointment.id}</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">
            {isEditing ? 'Edit Appointment' : (formState.title || 'Appointment Details')}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </button>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2b5c8f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-[#1f456e]"
            >
              <PencilLine className="h-4 w-4" />
              Edit Appointment
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2b5c8f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-[#1f456e] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusStyles[isEditing ? formState.status : appointment.status] || 'bg-slate-200 text-slate-700'}`}>
              {isEditing ? formState.status.replace('_', ' ') : appointment.status.replace('_', ' ')}
            </span>
            <span className="text-sm font-medium text-slate-500">Job type: {formatText(isEditing ? formState.job_type : appointment.job_type)}</span>
          </div>
          <div className="text-sm text-slate-500">Updated {formatDate(appointment.updated_at)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Appointment Overview</h2>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <FormField
                label="Title"
                value={formState.title}
                onChange={(value) => updateField('title', value)}
                placeholder="Appointment title"
              />
              <FormField
                label="Appointment Date"
                value={formState.appointment_date}
                type="date"
                onChange={(value) => updateField('appointment_date', value)}
              />
              <FormField
                label="Start Time"
                value={formState.appointment_time}
                type="time"
                onChange={(value) => updateField('appointment_time', value)}
              />
              <FormField
                label="End Time"
                value={formState.end_time}
                type="time"
                onChange={(value) => updateField('end_time', value)}
              />
              <FormField
                label="Status"
                value={formState.status}
                onChange={(value) => updateField('status', value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'rescheduled', label: 'Rescheduled' },
                ]}
              />
              <FormField
                label="Service Type"
                value={formState.job_type}
                onChange={(value) => updateField('job_type', value)}
                options={[
                  { value: 'measurement', label: 'Measurement' },
                  { value: 'installation', label: 'Installation' },
                  { value: 'consultation', label: 'Consultation' },
                  { value: 'repair', label: 'Repair' },
                ]}
              />
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <span className="font-semibold text-slate-500">Date</span>
                <span className="font-bold text-slate-800">{formatDate(appointment.appointment_date)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <span className="font-semibold text-slate-500">Time</span>
                <span className="font-bold text-slate-800">{formatTime(appointment.appointment_time)} - {formatTime(appointment.end_time)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <span className="font-semibold text-slate-500">Job Type</span>
                <span className="font-bold text-slate-800">{formatText(appointment.job_type)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <span className="font-semibold text-slate-500">Created</span>
                <span className="font-bold text-slate-800">{formatDate(appointment.created_at)}</span>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Customer Information</h2>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="First Name"
                  value={formState.customer_first_name}
                  onChange={(value) => updateField('customer_first_name', value)}
                />
                <FormField
                  label="Last Name"
                  value={formState.customer_last_name}
                  onChange={(value) => updateField('customer_last_name', value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Phone"
                  value={formState.customer_phone}
                  onChange={(value) => updateField('customer_phone', value)}
                  type="tel"
                />
                <FormField
                  label="Email"
                  value={formState.customer_email}
                  onChange={(value) => updateField('customer_email', value)}
                  type="email"
                />
              </div>
              <FormField
                label="Company"
                value={formState.customer_company_name}
                onChange={(value) => updateField('customer_company_name', value)}
              />
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer name</p>
                <p className="mt-1 text-base font-extrabold text-slate-800">{customerName}</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="font-semibold text-slate-700">{appointment.customer?.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="font-semibold text-slate-700">{appointment.customer?.company_name || '—'}</span>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Address Details</h2>
          </div>

          {isEditing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Building"
                value={formState.location_building}
                onChange={(value) => updateField('location_building', value)}
              />
              <FormField
                label="Unit"
                value={formState.location_unit}
                onChange={(value) => updateField('location_unit', value)}
              />
              <div className="md:col-span-2">
                <FormField
                  label="Full Address"
                  value={formState.location_full_address}
                  onChange={(value) => updateField('location_full_address', value)}
                />
              </div>
              <div className="md:col-span-2">
                <FormField
                  label="Instructions"
                  value={formState.location_instructions}
                  onChange={(value) => updateField('location_instructions', value)}
                  textarea
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Building</p>
                <p className="mt-1 text-base font-bold text-slate-800">{appointment.location?.building_name || '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unit</p>
                <p className="mt-1 text-base font-bold text-slate-800">{appointment.location?.unit_number || '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Address</p>
                <p className="mt-1 text-base font-bold text-slate-800">{appointment.location?.full_address || '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Instructions</p>
                <p className="mt-1 text-base font-medium text-slate-700">{appointment.location?.additional_instructions || 'No special instructions provided.'}</p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Assignee</h2>
          </div>

          {isEditing ? (
            <FormField
              label="Assigned To"
              value={formState.assigned_to}
              onChange={(value) => updateField('assigned_to', value)}
              options={assigneeOptions}
            />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned to</p>
                <p className="mt-1 text-base font-bold text-slate-800">{appointment.assignee_name || appointment.assigned_to_name || 'Unassigned'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</p>
                <p className="mt-1 text-base font-medium text-slate-700">{typeof appointment.assignee === 'object' && appointment.assignee !== null ? appointment.assignee.email || '—' : appointment.assigned_to_username || '—'}</p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Notes & Services</h2>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <FormField
                label="Service Type"
                value={formState.job_type}
                onChange={(value) => updateField('job_type', value)}
                options={[
                  { value: 'measurement', label: 'Measurement' },
                  { value: 'installation', label: 'Installation' },
                  { value: 'consultation', label: 'Consultation' },
                  { value: 'repair', label: 'Repair' },
                ]}
              />
              <FormField
                label="Notes"
                value={formState.description}
                onChange={(value) => updateField('description', value)}
                textarea
              />
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {appointment.description || 'No additional notes were supplied for this appointment.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
