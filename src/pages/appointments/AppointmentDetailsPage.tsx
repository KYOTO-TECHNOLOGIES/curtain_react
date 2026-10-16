import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  PencilLine,
  Save,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { usersApi } from '../../api/users';
import { useToast } from '../../components/ui/Toast';
import { DatePicker } from '../../components/ui/DatePicker';
import { StaffAssignmentPicker } from '../../components/appointments/StaffAssignmentPicker';
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
  quoted: 'bg-[#00897b] text-white',
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  textarea?: boolean;
  disabled?: boolean;
}) {
  const baseInputClass = `w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium outline-none transition ${
    disabled
      ? 'bg-slate-50 border-slate-200 text-slate-800 cursor-default select-text'
      : 'bg-white border-slate-200 text-slate-800 focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/10'
  }`;

  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          disabled={disabled}
          readOnly={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder || (disabled ? '—' : '')}
          rows={3}
          className={`min-h-[88px] ${baseInputClass} resize-y`}
        />
      ) : options ? (
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className={`${baseInputClass} ${disabled ? 'appearance-none' : ''}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'date' ? (
        <DatePicker
          value={value}
          disabled={disabled}
          readOnly={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder || (disabled ? '—' : '')}
          className={baseInputClass}
        />
      ) : (
        <input
          type={type}
          value={value}
          disabled={disabled}
          readOnly={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder || (disabled ? '—' : '')}
          className={baseInputClass}
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

          <div className="space-y-4">
            <FormField
              label="Title"
              value={formState.title}
              disabled={!isEditing}
              onChange={(value) => updateField('title', value)}
              placeholder="Appointment title"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Appointment Date"
                value={formState.appointment_date}
                type="date"
                disabled={!isEditing}
                onChange={(value) => updateField('appointment_date', value)}
              />
              <FormField
                label="Status"
                value={formState.status}
                disabled={!isEditing}
                onChange={(value) => updateField('status', value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'quoted', label: 'Quoted' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'rescheduled', label: 'Rescheduled' },
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Start Time"
                value={formState.appointment_time}
                type="time"
                disabled={!isEditing}
                onChange={(value) => updateField('appointment_time', value)}
              />
              <FormField
                label="End Time"
                value={formState.end_time}
                type="time"
                disabled={!isEditing}
                onChange={(value) => updateField('end_time', value)}
              />
            </div>
            <FormField
              label="Service Type"
              value={formState.job_type}
              disabled={!isEditing}
              onChange={(value) => updateField('job_type', value)}
              options={[
                { value: 'measurement', label: 'Measurement' },
                { value: 'installation', label: 'Installation' },
                { value: 'consultation', label: 'Consultation' },
                { value: 'repair', label: 'Repair' },
              ]}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Customer Information</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="First Name"
                value={formState.customer_first_name}
                disabled={!isEditing}
                onChange={(value) => updateField('customer_first_name', value)}
              />
              <FormField
                label="Last Name"
                value={formState.customer_last_name}
                disabled={!isEditing}
                onChange={(value) => updateField('customer_last_name', value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Phone"
                value={formState.customer_phone}
                disabled={!isEditing}
                onChange={(value) => updateField('customer_phone', value)}
                type="tel"
              />
              <FormField
                label="Email"
                value={formState.customer_email}
                disabled={!isEditing}
                onChange={(value) => updateField('customer_email', value)}
                type="email"
              />
            </div>
            <FormField
              label="Company Name"
              value={formState.customer_company_name}
              disabled={!isEditing}
              onChange={(value) => updateField('customer_company_name', value)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Address Details</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Building"
              value={formState.location_building}
              disabled={!isEditing}
              onChange={(value) => updateField('location_building', value)}
            />
            <FormField
              label="Unit"
              value={formState.location_unit}
              disabled={!isEditing}
              onChange={(value) => updateField('location_unit', value)}
            />
            <div className="md:col-span-2">
              <FormField
                label="Full Address"
                value={formState.location_full_address}
                disabled={!isEditing}
                onChange={(value) => updateField('location_full_address', value)}
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Instructions"
                value={formState.location_instructions}
                disabled={!isEditing}
                onChange={(value) => updateField('location_instructions', value)}
                textarea
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Assignee</h2>
          </div>

          <StaffAssignmentPicker
            id="appointment-details-assignee"
            label="Assigned To"
            value={formState.assigned_to}
            disabled={!isEditing}
            options={(Array.isArray(users) ? users : []).map((user) => ({
              value: String(user.id),
              name: user.full_name,
              email: user.email,
              role: typeof user.role === 'object' ? user.role?.name : undefined,
            }))}
            onChange={(event) => updateField('assigned_to', event.target.value)}
            allowUnassigned
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#2b5c8f]" />
            <h2 className="text-lg font-extrabold text-slate-800">Notes & Services</h2>
          </div>

          <div className="space-y-4">
            <FormField
              label="Service Type"
              value={formState.job_type}
              disabled={!isEditing}
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
              disabled={!isEditing}
              onChange={(value) => updateField('description', value)}
              textarea
            />
          </div>
        </section>
      </div>
    </div>
  );
}
