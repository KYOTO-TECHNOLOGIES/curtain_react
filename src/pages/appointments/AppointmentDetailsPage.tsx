import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../api/appointments';
import { usersApi } from '../../api/users';
import { useToast } from '../../components/ui/Toast';
import { DetailHeader } from '../../components/appointments/detail/DetailHeader';
import { StatusStrip } from '../../components/appointments/detail/StatusStrip';
import {
  AddressCard,
  AssigneeCard,
  CustomerCard,
  NotesCard,
  OverviewCard,
} from '../../components/appointments/detail/DetailCards';
import { DetailError, DetailSkeleton, EditBar } from '../../components/appointments/detail/DetailStates';
import { hasValue } from '../../components/appointments/detail/helpers';
import type { AppointmentFormState } from '../../components/appointments/detail/types';
import type { AppointmentDetail, User } from '../../types';
import { isAssignableStaff } from '../../types';
import './appointmentDetail.css';

const buildFormState = (appointment: AppointmentDetail): AppointmentFormState => ({
  id: appointment.id,
  title: appointment.title || '',
  description: appointment.description || '',
  status: appointment.status || 'scheduled',
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

export default function AppointmentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<AppointmentFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancelAppointment = async () => {
    if (!appointment || appointment.status === 'cancelled') return;
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      setIsCancelling(true);
      const response = await appointmentsApi.updateStatus(appointment.id, { status: 'cancelled' });
      const updated = response.data as AppointmentDetail;
      queryClient.setQueryData(['appointment-detail', String(id)], (previous: any) => ({
        ...(previous || {}),
        data: updated,
      }));
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments_stats'] });
      showToast('Appointment cancelled', 'success');
    } catch (cancelError: any) {
      showToast(cancelError?.response?.data?.detail || 'Failed to cancel appointment', 'error');
    } finally {
      setIsCancelling(false);
    }
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
        // Status is system-driven: only flip to 'rescheduled' when date/time changed.
        // Otherwise omit it so an edit never overwrites the current status.
        ...(appointment.status !== 'cancelled' &&
        (formState.appointment_date !== (appointment.appointment_date || '') ||
          formState.appointment_time.slice(0, 5) !== (appointment.appointment_time || '').slice(0, 5))
          ? { status: 'rescheduled' as const }
          : {}),
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

  /* ── Presentation-only state ──────────────────────────────────────── */
  const original = useMemo(() => (appointment ? buildFormState(appointment) : null), [appointment]);
  const ready = Boolean(appointment && formState);

  // Entrance animation plays once on first load, then the class is removed.
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setEntering(false), 1100);
    return () => clearTimeout(timer);
  }, [ready]);

  // The aside is only sticky when it fits in the viewport.
  const asideRef = useRef<HTMLDivElement | null>(null);
  const [asideSticky, setAsideSticky] = useState(true);
  useEffect(() => {
    const node = asideRef.current;
    if (!node) return;
    const measure = () => {
      const topbar = parseInt(getComputedStyle(node).getPropertyValue('--topbar-h'), 10) || 72;
      setAsideSticky(node.offsetHeight <= window.innerHeight - topbar - 40);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ready, isEditing]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !appointment || !formState || !original) {
    return (
      <DetailError
        message={(error as Error)?.message || 'The appointment could not be found or the API is unavailable.'}
        onBack={() => navigate('/appointments')}
      />
    );
  }

  const staffOptions = (Array.isArray(users) ? users.filter(isAssignableStaff) : []).map((user) => ({
    value: String(user.id),
    name: user.full_name,
    email: user.email,
    role: typeof user.role === 'object' ? user.role?.name : undefined,
  }));

  const showAddress =
    isEditing ||
    hasValue(formState.location_building) ||
    hasValue(formState.location_unit) ||
    hasValue(formState.location_full_address);
  const showAssignee = isEditing || hasValue(formState.assigned_to);
  const showNotes = isEditing || hasValue(formState.description);
  const cardProps = { form: formState, original, isEditing, updateField };

  return (
    <div className={`ad-page ${entering ? 'is-entering' : ''}`}>
      <DetailHeader
        appointmentId={appointment.id}
        title={isEditing ? 'Edit Appointment' : formState.title || 'Appointment Details'}
        isEditing={isEditing}
        isCancelled={appointment.status === 'cancelled'}
        isCancelling={isCancelling}
        onBack={() => navigate('/appointments')}
        onCancelAppointment={handleCancelAppointment}
        onEdit={() => setIsEditing(true)}
      />

      <StatusStrip
        status={appointment.status}
        jobType={isEditing ? formState.job_type : appointment.job_type}
        appointmentDate={appointment.appointment_date}
        updatedAt={appointment.updated_at}
        updatedLabel={new Date(appointment.updated_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      />

      <div className="ad-grid">
        <div className="ad-main">
          <div className="ad-slot-overview ad-reveal" style={{ '--i': 2 } as React.CSSProperties}>
            <OverviewCard {...cardProps} status={appointment.status} />
          </div>
          {showAddress && (
            <div className="ad-slot-address ad-reveal" style={{ '--i': 3 } as React.CSSProperties}>
              <AddressCard {...cardProps} />
            </div>
          )}
          {showNotes && (
            <div className="ad-slot-notes ad-reveal" style={{ '--i': 4 } as React.CSSProperties}>
              <NotesCard {...cardProps} />
            </div>
          )}
        </div>

        <div className="ad-aside" ref={asideRef} data-sticky={asideSticky}>
          <div className="ad-slot-customer ad-reveal" style={{ '--i': 2 } as React.CSSProperties}>
            <CustomerCard {...cardProps} customerId={appointment.customer?.id} />
          </div>
          {showAssignee && (
            <div className="ad-slot-assignee ad-reveal" style={{ '--i': 3 } as React.CSSProperties}>
              <AssigneeCard
                isEditing={isEditing}
                assignedTo={formState.assigned_to}
                originalAssignedTo={original.assigned_to}
                users={users as any}
                fallbackName={
                  (appointment as any).assigned_to_name ?? (appointment as any).assignee_name ?? undefined
                }
                fallbackEmail={
                  (appointment as any).assigned_to_username ?? (appointment as any).assignee_username ?? undefined
                }
                options={staffOptions}
                onChange={(value) => updateField('assigned_to', value)}
              />
            </div>
          )}
        </div>
      </div>

      {isEditing && <EditBar isSaving={isSaving} onCancel={handleCancel} onSave={handleSave} />}
    </div>
  );
}
