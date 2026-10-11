import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronRight,
  User,
  MapPin,
  FileText,
  Phone,
  Mail,
  MessageSquare,
  Globe,
  Users,
  Footprints,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { usersApi } from '../../api/users';
import { useToast } from '../../components/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import type { Customer } from '../../types';
import { FormInput } from '../../components/ui/FormInput';

// ── Zod Schema ─────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────
const sources = [
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



// ── Component ──────────────────────────────────────────────────────────────
export default function CreateAppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const editAppointment = (location.state as { editAppointment?: any } | null)?.editAppointment;
  const isEditingAppointment = Boolean(editAppointment);

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  const { data: usersRes } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list()
  });
  const users = usersRes?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      firstName: '', lastName: '', phone: '', email: '',
      building: '', room: '', address: '',
      source: 'whatsapp', assignedTo: '',
      jobType: 'installation', date: new Date().toISOString().split('T')[0],
      time: '09:00 AM', notes: ''
    }
  });

  const selectedSource = watch('source');
  const selectedTime = watch('time');

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
      const hasErrors = step1Fields.some(field => errors[field]);
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
        status: editAppointment ? editAppointment.status : 'pending',
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
        await appointmentsApi.create(payload);
        showToast('Appointment created successfully', 'success');
        navigate('/appointments');
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

  const steps = [
    { num: 1, label: 'Customer & Location' },
    { num: 2, label: 'Schedule & Confirm' },
  ];

  return (
    <div className="space-y-6 animate-page-in font-sans">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">
            Schedule Appointment
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[13px] font-medium text-slate-500">
            <span className="hover:text-[#2b5c8f] cursor-pointer" onClick={() => navigate('/appointments')}>Appointments</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#2b5c8f]">New Appointment</span>
          </div>
        </div>
      </div>

      {/* ── Stepper ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-5">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0 transition-all ${step >= s.num
                    ? 'bg-[#2b5c8f] text-white shadow-md shadow-[#2b5c8f]/20'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-[13px] font-bold whitespace-nowrap ${step >= s.num ? 'text-slate-800' : 'text-slate-400'
                  }`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s.num ? 'bg-[#2b5c8f]' : 'bg-slate-200'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)}>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-page-in">

            {/* Customer Info Card */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center text-[#2b5c8f]">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Customer Information</h2>
                {existingCustomer ? (
                  <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[11px] font-bold uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Existing
                  </span>
                ) : (
                  <span className="ml-auto px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-full text-[11px] font-bold uppercase tracking-wide">
                    New Customer
                  </span>
                )}
              </div>
              <div className="p-6 space-y-4">
                {existingCustomer && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-100 mb-2">
                    <div className="w-12 h-12 rounded-full bg-[#eef2ff] text-[#2b5c8f] flex items-center justify-center text-[16px] font-extrabold">
                      {existingCustomer.first_name[0]}{existingCustomer.last_name[0]}
                    </div>
                    <div>
                      <p className="text-[16px] font-extrabold text-slate-800">{existingCustomer.first_name} {existingCustomer.last_name}</p>
                      <p className="text-[13px] text-slate-500 font-medium">{existingCustomer.phone || existingCustomer.email}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="First Name" icon={User} required error={errors.firstName?.message} {...register('firstName')} placeholder="First name" />
                  <FormInput label="Last Name" icon={User} required error={errors.lastName?.message} {...register('lastName')} placeholder="Last name" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                  <div className={`flex border ${errors.phone ? 'border-red-300' : 'border-slate-200'} rounded-xl overflow-hidden focus-within:border-[#2b5c8f] focus-within:ring-2 focus-within:ring-[#2b5c8f]/10 transition-all bg-slate-50/50`}>
                    <div className="flex items-center gap-1.5 px-3 bg-slate-50/80 border-r border-slate-200">
                      <span className="text-base">🇦🇪</span>
                      <span className="text-[13px] font-bold text-slate-700">+971</span>
                    </div>
                    <input type="tel" {...register('phone')} placeholder="50 000 0000" className="flex-1 px-4 py-3 bg-transparent text-slate-800 text-[14px] font-semibold outline-none" />
                  </div>
                  {errors.phone && <p className="text-[12px] text-red-500 font-medium mt-1">{errors.phone.message}</p>}
                </div>
                <FormInput label="Email Address" icon={Mail} error={errors.email?.message} type="email" {...register('email')} placeholder="customer@example.com" />
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] flex items-center justify-center text-[#10b981]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Location Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <FormInput label="Building / Area / Street" required error={errors.building?.message} {...register('building')} placeholder="e.g. Marina Heights, JBR" />
                <FormInput label="Apartment / Unit Number" {...register('room')} placeholder="e.g. Apt 12B" />
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Full Address</label>
                  <textarea rows={3} {...register('address')} placeholder="Full address for navigation..." className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all resize-none" />
                </div>
              </div>
            </div>

            {/* Source Card — full width */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#fef3c7] flex items-center justify-center text-[#d97706]">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Appointment Source</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {sources.map(src => (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setValue('source', src.id)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all ${selectedSource === src.id
                          ? 'bg-[#2b5c8f] border-[#2b5c8f] text-white shadow-md shadow-[#2b5c8f]/15'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <src.icon className="w-4 h-4 shrink-0" />
                      <span className="text-[13px] font-bold">{src.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-page-in">

            {/* Job Type & Assignee */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#fef3c7] flex items-center justify-center text-[#d97706]">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Job Details</h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Job Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    {jobTypes.map(jt => {
                      const selected = watch('jobType') === jt.value;
                      return (
                        <button key={jt.value} type="button" onClick={() => setValue('jobType', jt.value)}
                          className={`px-4 py-3 rounded-xl border text-[13px] font-bold transition-all ${selected
                              ? 'bg-[#2b5c8f] border-[#2b5c8f] text-white shadow-md shadow-[#2b5c8f]/15'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}>
                          {jt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Assign To</label>
                  <select
                    {...register('assignedTo')}
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all"
                  >
                    <option value="">— Unassigned —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Source</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-[#2b5c8f]" />
                    <span className="text-[14px] font-bold text-slate-800 capitalize">{selectedSource.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Slot */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center text-[#2b5c8f]">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Booking Slot</h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Appointment Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2b5c8f]" />
                    <input type="date" {...register('date')} className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">
                    <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Select Time Slot <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {timeSlots.map(slot => (
                      <button key={slot} type="button" onClick={() => setValue('time', slot)}
                        className={`py-2.5 rounded-xl text-[11px] font-bold transition-all border ${selectedTime === slot
                            ? 'bg-[#2b5c8f] text-white border-[#2b5c8f] shadow-md shadow-[#2b5c8f]/15'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-[#2b5c8f]'
                          }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes — full width */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-[#6b7280]">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Requirements & Notes</h2>
              </div>
              <div className="p-6">
                <textarea rows={4} {...register('notes')} placeholder="e.g. customer requires room darkening fabric, specific measurement areas, preferred installation time..." className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-700 outline-none focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* ── Action Bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
          <button type="button" onClick={handleBack}
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
            ← {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-[#2b5c8f] text-white font-bold text-sm rounded-xl shadow-md shadow-[#2b5c8f]/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all disabled:opacity-70">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
            {step === 1 ? 'Continue to Scheduling' : 'Confirm Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
