import { useState, useEffect, useMemo, type ChangeEvent, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  FileText,
  Footprints,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User,
  Users,
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { usersApi } from '../../api/users';
import { useToast } from '../../components/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import type { Customer } from '../../types';
import { isAssignableStaff } from '../../types';
import { CountrySelect } from '../../components/appointments/CountrySelect';
import { StaffAssignmentPicker } from '../../components/appointments/StaffAssignmentPicker';
import { DatePicker } from '../../components/ui/DatePicker';
import { COUNTRIES, DEFAULT_COUNTRY } from '../../components/appointments/countryData';
import './CreateAppointmentPage.css';

const appointmentSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  phone: z.string().min(8, 'Required'),
  email: z.string().email('Invalid email').or(z.literal('')),
  building: z.string().min(2, 'Required'),
  room: z.string().optional(),
  address: z.string().optional(),
  source: z.string().min(1, 'Required'),
  assignedTo: z.string().optional(),
  jobType: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  time: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

type FormCardProps = {
  title: string;
  icon: typeof User;
  tone: 'brand' | 'emerald' | 'amber';
  rightSlot?: ReactNode;
  className?: string;
  children: ReactNode;
};

type FieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: ReactNode;
};

type PhoneFieldProps = {
  error?: string;
  selectedCountry: (typeof COUNTRIES)[number];
  onSelectCountry: (country: (typeof COUNTRIES)[number]) => void;
  fieldId?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  name?: string;
};

const sourceOptions = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'phone', label: 'Phone Call', icon: Phone },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'walk_in', label: 'Walk-in', icon: Footprints },
  { id: 'website', label: 'Website', icon: Globe },
  { id: 'referral', label: 'Referral', icon: Users },
];

const timeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM'
];

const jobTypes = [
  { value: 'installation', label: 'Installation' },
  { value: 'measurement', label: 'Measurement' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'repair', label: 'Repair' },
];

const steps = [
  { num: 1, label: 'Customer & Location' },
  { num: 2, label: 'Schedule & Confirm' },
];

function PageHeader() {
  const navigate = useNavigate();

  return (
    <header className="appointment-page__header" style={{ animationDelay: '0ms' }}>
      <div>
        <h1 className="appointment-page__title">Schedule Appointment</h1>
        <nav className="appointment-page__breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="appointment-page__crumb" onClick={() => navigate('/appointments')}>
            Appointments
          </button>
          <ChevronRight className="appointment-page__separator" />
          <span className="appointment-page__current">New Appointment</span>
        </nav>
      </div>
    </header>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="appointment-stepper" style={{ animationDelay: '60ms' }}>
      <div className="appointment-stepper__row">
        {steps.map((item, index) => {
          const isActive = step === item.num;
          const isComplete = step > item.num;
          const isLast = index === steps.length - 1;

          return (
            <div key={item.num} className="appointment-stepper__item">
              <div className="appointment-stepper__step-wrap">
                <div
                  className={`appointment-stepper__badge ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''} ${step < item.num ? 'is-upcoming' : ''}`}
                >
                  {isComplete ? <Check className="appointment-stepper__check" /> : item.num}
                </div>
                <span className={`appointment-stepper__label ${isActive ? 'is-active' : ''} ${step < item.num ? 'is-upcoming' : ''}`}>
                  {item.label}
                </span>
              </div>
              {!isLast && (
                <div className="appointment-stepper__connector-wrap">
                  <div className="appointment-stepper__connector-track" />
                  <div
                    className="appointment-stepper__connector-fill"
                    style={{ width: step === 1 ? '50%' : '100%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="appointment-stepper__mobile-caption">Step 1 of 2 • Customer & Location</div>
    </div>
  );
}

function FormCard({ title, icon: Icon, tone, rightSlot, className = '', children }: FormCardProps) {
  return (
    <section className={`appointment-card ${className}`}>
      <div className="appointment-card__header">
        <div className={`appointment-card__icon appointment-card__icon--${tone}`}>
          <Icon className="appointment-card__icon-svg" />
        </div>
        <h2 className="appointment-card__title">{title}</h2>
        {rightSlot}
      </div>
      <div className="appointment-card__body">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, required, optional, error, children }: FieldProps) {
  return (
    <div className={`appointment-field ${error ? 'is-invalid' : ''}`}>
      <div className="appointment-field__header">
        <label htmlFor={htmlFor} className="appointment-field__label">
          {label}
          {required && <span className="appointment-field__asterisk">*</span>}
        </label>
        {optional && <span className="appointment-field__optional">Optional</span>}
      </div>
      {children}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="appointment-field__error">
          <span className="appointment-field__error-icon">!</span>
          {error}
        </p>
      )}
    </div>
  );
}

function PhoneField({
  error,
  selectedCountry,
  onSelectCountry,
  fieldId = 'phone',
  value,
  onChange,
  onBlur,
  name,
}: PhoneFieldProps) {
  return (
    <div className={`appointment-field ${error ? 'is-invalid' : ''}`}>
      <div className="appointment-field__header">
        <label htmlFor={fieldId} className="appointment-field__label">
          Phone Number
          <span className="appointment-field__asterisk">*</span>
        </label>
      </div>

      <div className="appointment-phone-field phone-field" data-invalid={Boolean(error)}>
        <div className="appointment-phone-field__country">
          <CountrySelect selectedCountry={selectedCountry} onSelectCountry={onSelectCountry} />
        </div>
        <input
          id={fieldId}
          type="tel"
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          inputMode="tel"
          autoComplete="tel-national"
          autoCapitalize="none"
          placeholder="50 000 0000"
          className="appointment-phone-field__input"
        />
      </div>

      {error && (
        <p className="appointment-field__error">
          <span className="appointment-field__error-icon">!</span>
          {error}
        </p>
      )}
    </div>
  );
}

function SourcePicker({ selectedSource, onChange }: { selectedSource: string; onChange: (value: string) => void }) {
  const sourceKeys = sourceOptions.map((option) => option.id);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = sourceKeys.indexOf(selectedSource);
    const nextIndex = currentIndex === -1 ? 0 : currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const targetIndex = (nextIndex + 1) % sourceKeys.length;
      onChange(sourceKeys[targetIndex]);
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const targetIndex = (nextIndex - 1 + sourceKeys.length) % sourceKeys.length;
      onChange(sourceKeys[targetIndex]);
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onChange(sourceKeys[nextIndex]);
    }
  };

  return (
    <div
      className="appointment-source-picker"
      role="radiogroup"
      aria-label="Appointment source"
      onKeyDown={handleKeyDown}
    >
      {sourceOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedSource === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={`appointment-source-tile ${isSelected ? 'is-selected' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <span className={`appointment-source-tile__icon ${isSelected ? 'is-selected' : ''}`}>
              <Icon className="appointment-source-tile__svg" />
            </span>
            <span className="appointment-source-tile__label">{option.label}</span>
            {isSelected && (
              <span className="appointment-source-tile__check">
                <Check className="appointment-source-tile__check-icon" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StickyFooter({
  step,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  step: 1 | 2;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <footer className="appointment-footer" style={{ animationDelay: '280ms' }}>
      <div className="appointment-footer__inner">
        <button type="button" className="appointment-footer__cancel" onClick={onCancel}>
          <ArrowLeft className="appointment-footer__cancel-icon" />
          Cancel
        </button>

        <div className="appointment-footer__center">
          <span className="appointment-footer__step-label">Step {step} of 2</span>
          <div className="appointment-footer__progress" aria-hidden="true">
            <span className={`appointment-footer__progress-segment ${step >= 1 ? 'is-on' : ''}`} />
            <span className={`appointment-footer__progress-segment ${step >= 2 ? 'is-on' : ''}`} />
          </div>
        </div>

        <button type="button" className="appointment-footer__primary" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="appointment-footer__spinner" aria-hidden="true" />
              <span className="appointment-footer__button-label">Processing</span>
            </>
          ) : (
            <>
              <CalendarIcon className="appointment-footer__primary-icon" />
              <span className="appointment-footer__button-label">Continue to Scheduling</span>
              <ArrowRight className="appointment-footer__primary-arrow" />
            </>
          )}
        </button>
      </div>
    </footer>
  );
}

export default function CreateAppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const editAppointment = (location.state as { editAppointment?: any } | null)?.editAppointment;
  const isEditingAppointment = Boolean(editAppointment);

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);

  const { data: usersRes } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  const users = useMemo(() => {
    const raw = usersRes?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray((raw as any)?.results)) return (raw as any).results;
    if (Array.isArray((raw as any)?.data)) return (raw as any).data;
    if (Array.isArray(usersRes)) return usersRes as any;
    return [];
  }, [usersRes]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      building: '',
      room: '',
      address: '',
      source: 'whatsapp',
      assignedTo: '',
      jobType: 'installation',
      date: new Date().toISOString().split('T')[0],
      time: '09:00 AM',
      notes: '',
    },
  });

  const selectedSource = watch('source');
  const selectedTime = watch('time');
  const phoneInputProps = register('phone');
  const assignedToRegistration = register('assignedTo');

  useEffect(() => {
    if (editAppointment) {
      const customer = editAppointment.customer;
      setExistingCustomer(customer || null);
      setValue('firstName', customer?.first_name || editAppointment.customer_first_name || '');
      setValue('lastName', customer?.last_name || editAppointment.customer_last_name || '');
      setValue('phone', customer?.phone || editAppointment.customer_phone || '');
      setValue('email', customer?.email || editAppointment.customer_email || '');
      setValue('building', editAppointment.location?.building_name || editAppointment.location_building || '');
      setValue('room', editAppointment.location?.unit_number || editAppointment.location_unit || '');
      setValue('address', editAppointment.location?.full_address || editAppointment.location_full_address || '');
      setValue('source', editAppointment.customer_source || 'whatsapp');
      setValue('jobType', editAppointment.job_type || 'installation');
      setValue('date', editAppointment.appointment_date || new Date().toISOString().split('T')[0]);
      setValue('time', editAppointment.appointment_time ? editAppointment.appointment_time.slice(0, 5) : '09:00 AM');
      setValue('notes', editAppointment.description || '');
      setValue('assignedTo', editAppointment.assigned_to ? String(editAppointment.assigned_to) : '');
      setStep(2);
      return;
    }

    if (location.state) {
      const { lookupResult, lookupQuery, lookupType } = location.state;
      if (lookupResult?.found && lookupResult.customer) {
        const c = lookupResult.customer;
        setExistingCustomer(c);
        setValue('firstName', c.first_name);
        setValue('lastName', c.last_name);
        setValue('phone', c.phone || '');
        setValue('email', c.email || '');
        setValue('address', c.address_line_1 || '');
      } else {
        if (lookupType === 'email') setValue('email', lookupQuery);
        else setValue('phone', lookupQuery);
      }
    }
  }, [location.state, editAppointment, setValue]);

  const onSubmit = async (data: AppointmentFormValues) => {
    if (step === 1) {
      const step1Fields = ['firstName', 'lastName', 'phone', 'building', 'source'] as const;
      const hasErrors = step1Fields.some((field) => errors[field]);
      if (!hasErrors) setStep(2);
      return;
    }

    const assigneeId = data.assignedTo && data.assignedTo !== '' ? Number(data.assignedTo) : undefined;

    setIsSubmitting(true);
    try {
      const payload = {
        customer: existingCustomer?.id,
        customer_first_name: data.firstName,
        customer_last_name: data.lastName,
        customer_phone: data.phone,
        customer_email: data.email || undefined,
        customer_address: data.address,
        customer_source: data.source,
        title: `${data.jobType.charAt(0).toUpperCase() + data.jobType.slice(1)} Appointment`,
        description: data.notes,
        appointment_date: data.date,
        appointment_time: data.time.split(' ')[0] + ':00',
        job_type: data.jobType as any,
        ...(editAppointment
          ? (() => {
              const dateChanged = (editAppointment.appointment_date || '').slice(0, 10) !== data.date;
              const timeChanged = (editAppointment.appointment_time || '').slice(0, 5) !== data.time.split(' ')[0];
              return editAppointment.status !== 'cancelled' && (dateChanged || timeChanged)
                ? { status: 'rescheduled' as const }
                : {};
            })()
          : { status: 'scheduled' as const }),
        assigned_to: assigneeId,
        assignee: assigneeId,
        assignee_id: assigneeId,
        location_building: data.building,
        location_unit: data.room,
        location_full_address: data.address,
      };

      if (isEditingAppointment && editAppointment?.id) {
        await appointmentsApi.update(editAppointment.id, payload);
        showToast('Appointment updated successfully', 'success');
        navigate(`/appointments/${editAppointment.id}`);
      } else {
        const createRes = await appointmentsApi.create(payload);
        showToast('Appointment created successfully', 'success');
        navigate('/appointments', {
          state: {
            resetPage: true,
            newlyCreatedId: createRes?.data?.id,
          },
        });
      }
    } catch (error: any) {
      console.error('Create Appointment Error:', error?.response?.data);
      const errorMsg = error?.response?.data
        ? typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data)
        : 'Failed to create appointment';
      showToast(errorMsg, 'error');
    }
    setIsSubmitting(false);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else navigate(-1);
  };

  const handleSourceChange = (value: string) => setValue('source', value);

  return (
    <div className="appointment-page">
      <div className="appointment-page__shell">
        <PageHeader />
        <Stepper step={step} />

        <form className="appointment-form" onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <>
              <div className="appointment-form-grid">
                <FormCard
                  title="Customer Information"
                  icon={User}
                  tone="brand"
                  rightSlot={
                    existingCustomer ? (
                      <span className="appointment-status-pill appointment-status-pill--existing">
                        <span className="appointment-status-pill__dot" />
                        Existing customer
                      </span>
                    ) : null
                  }
                >
                  {existingCustomer && (
                    <div className="appointment-identity-strip">
                      <div className="appointment-identity-strip__avatar">
                        {existingCustomer.first_name?.[0] || 'C'}
                        {existingCustomer.last_name?.[0] || 'U'}
                      </div>
                      <div className="appointment-identity-strip__body">
                        <div className="appointment-identity-strip__name">
                          {existingCustomer.first_name} {existingCustomer.last_name}
                        </div>
                        <div className="appointment-identity-strip__meta">
                          {existingCustomer.phone || existingCustomer.email}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="appointment-field-grid appointment-field-grid--two" style={{ marginTop: existingCustomer ? '18px' : '0' }}>
                    <Field label="First Name" htmlFor="firstName" required error={errors.firstName?.message}>
                      <input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        autoCapitalize="words"
                        inputMode="text"
                        placeholder="Midlaj"
                        className="appointment-input"
                        {...register('firstName')}
                      />
                    </Field>
                    <Field label="Last Name" htmlFor="lastName" required error={errors.lastName?.message}>
                      <input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        autoCapitalize="words"
                        inputMode="text"
                        placeholder="Midhu"
                        className="appointment-input"
                        {...register('lastName')}
                      />
                    </Field>
                  </div>

                  <PhoneField
                    fieldId="phone"
                    error={errors.phone?.message}
                    selectedCountry={selectedCountry}
                    onSelectCountry={setSelectedCountry}
                    value={watch('phone')}
                    onChange={(event) => setValue('phone', event.target.value, { shouldValidate: true })}
                    onBlur={phoneInputProps.onBlur}
                    name={phoneInputProps.name}
                  />

                  <Field label="Email Address" htmlFor="email" optional error={errors.email?.message}>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      placeholder="midhumidali77@gmail.com"
                      className="appointment-input"
                      {...register('email')}
                    />
                  </Field>
                </FormCard>

                <FormCard title="Location Details" icon={MapPin} tone="emerald">
                  <Field label="Building / Area / Street" htmlFor="building" required error={errors.building?.message}>
                    <div className="appointment-input-shell">
                      <MapPin className="appointment-input-shell__icon" />
                      <input
                        id="building"
                        type="text"
                        autoComplete="street-address"
                        autoCapitalize="words"
                        inputMode="text"
                        placeholder="e.g. Marina Heights, JBR"
                        className="appointment-input appointment-input--with-icon"
                        {...register('building')}
                      />
                    </div>
                  </Field>

                  <Field label="Apartment / Unit Number" htmlFor="room" optional error={errors.room?.message}>
                    <div className="appointment-input-shell">
                      <Building2 className="appointment-input-shell__icon" />
                      <input
                        id="room"
                        type="text"
                        autoComplete="street-address"
                        autoCapitalize="words"
                        inputMode="text"
                        placeholder="e.g. Apt 12B"
                        className="appointment-input appointment-input--with-icon"
                        {...register('room')}
                      />
                    </div>
                  </Field>

                  <Field label="Full Address" htmlFor="address" optional error={errors.address?.message}>
                    <textarea
                      id="address"
                      autoComplete="street-address"
                      autoCapitalize="words"
                      placeholder="45 Innovation Park\nSuite 302"
                      className="appointment-textarea"
                      {...register('address')}
                    />
                  </Field>
                </FormCard>
              </div>

              <FormCard title="Appointment Source" icon={FileText} tone="amber" className="appointment-source-card">
                <SourcePicker selectedSource={selectedSource} onChange={handleSourceChange} />
              </FormCard>
            </>
          )}

          {step === 2 && (
            <div className="appointment-form-grid">
              <div className="appointment-card appointment-card--flat">
                <div className="appointment-card__header">
                  <div className="appointment-card__icon appointment-card__icon--amber">
                    <FileText className="appointment-card__icon-svg" />
                  </div>
                  <h2 className="appointment-card__title">Job Details</h2>
                </div>
                <div className="appointment-card__body">
                  <div className="appointment-field">
                    <div className="appointment-field__header">
                      <label className="appointment-field__label">
                        Job Type
                        <span className="appointment-field__asterisk">*</span>
                      </label>
                    </div>
                    <div className="appointment-job-types">
                      {jobTypes.map((job) => {
                        const isSelected = watch('jobType') === job.value;
                        return (
                          <button
                            key={job.value}
                            type="button"
                            className={`appointment-job-type ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setValue('jobType', job.value)}
                          >
                            {job.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <StaffAssignmentPicker
                    id="assignedTo"
                    label="Assign To"
                    name={assignedToRegistration.name}
                    value={watch('assignedTo') || ''}
                    options={(Array.isArray(users) ? users.filter(isAssignableStaff) : []).map((user) => ({
                      value: String(user.id),
                      name: user.full_name,
                      email: user.email,
                      role: typeof user.role === 'object' ? user.role?.name : undefined,
                    }))}
                    inputRef={assignedToRegistration.ref}
                    onChange={(event) =>
                      setValue('assignedTo', event.target.value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
                    }
                    onBlur={() => { /* touched state is set on change */ }}
                    allowUnassigned
                  />

                  <div className="appointment-highlight-box">
                    <div className="appointment-highlight-box__row">
                      <span className="appointment-highlight-box__label">Source</span>
                      <span className="appointment-highlight-box__value">{selectedSource.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="appointment-card appointment-card--flat">
                <div className="appointment-card__header">
                  <div className="appointment-card__icon appointment-card__icon--brand">
                    <CalendarIcon className="appointment-card__icon-svg" />
                  </div>
                  <h2 className="appointment-card__title">Booking Slot</h2>
                </div>
                <div className="appointment-card__body">
                  <Field label="Appointment Date" htmlFor="date" required error={errors.date?.message}>
                    <DatePicker
                      id="date"
                      required
                      value={watch('date') || ''}
                      className="w-full"
                      aria-invalid={Boolean(errors.date)}
                      aria-describedby={errors.date ? 'date-error' : undefined}
                      {...register('date')}
                    />
                  </Field>

                  <div className="appointment-field">
                    <div className="appointment-field__header">
                      <label className="appointment-field__label">
                        Select Time Slot
                        <span className="appointment-field__asterisk">*</span>
                      </label>
                    </div>
                    <div className="appointment-time-grid">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`appointment-time-slot ${selectedTime === slot ? 'is-selected' : ''}`}
                          onClick={() => setValue('time', slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="appointment-card appointment-card--notes appointment-card--flat" style={{ gridColumn: '1 / -1' }}>
                <div className="appointment-card__header">
                  <div className="appointment-card__icon appointment-card__icon--neutral">
                    <FileText className="appointment-card__icon-svg" />
                  </div>
                  <h2 className="appointment-card__title">Requirements & Notes</h2>
                </div>
                <div className="appointment-card__body">
                  <textarea className="appointment-textarea" placeholder="e.g. customer requires room darkening fabric, specific measurement areas, preferred installation time..." {...register('notes')} />
                </div>
              </div>
            </div>
          )}

          <StickyFooter
            step={step}
            isSubmitting={isSubmitting}
            onCancel={handleBack}
            onSubmit={() => handleSubmit(onSubmit)()}
          />
        </form>
      </div>
    </div>
  );
}