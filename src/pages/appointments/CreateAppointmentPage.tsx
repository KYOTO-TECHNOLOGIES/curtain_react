import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  User, 
  MapPin, 
  FileText, 
  Phone, 
  Mail, 
  MessageSquare, 
  Globe, 
  Users,
  Footprints,
  Share2,
  Loader2
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { useToast } from '../../components/ui/Toast';

// ── Zod Schema ─────────────────────────────────────────────────────────────
const appointmentSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(8, 'Phone number is required'),
  customerEmail: z.string().email('Invalid email address').or(z.literal('')),
  source: z.string().min(1, 'Source is required'),
  building: z.string().min(2, 'Building name is required'),
  room: z.string().min(1, 'Room number is required'),
  address: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function CreateAppointmentPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      source: 'whatsapp',
      building: '',
      room: '',
      address: '',
      notes: '',
      date: '2026-06-09',
      time: '09:00 AM'
    }
  });

  const selectedSource = watch('source');
  const selectedTime = watch('time');
  const selectedDate = watch('date');

  const sources = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'phone', label: 'Phone Call', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'walk_in', label: 'Walk-in', icon: Footprints },
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'referral', label: 'Referral', icon: Users },
  ];

  const timeSlots = [
    '09:00 AM', '10:30 AM', '12:00 PM',
    '01:30 PM', '03:00 PM', '04:30 PM'
  ];

  const days = [
    { day: 'TODAY', date: '9', fullDate: '2026-06-09' },
    { day: 'WED', date: '10', fullDate: '2026-06-10' },
    { day: 'THU', date: '11', fullDate: '2026-06-11' },
    { day: 'FRI', date: '12', fullDate: '2026-06-12' },
  ];

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);
    try {
      const [firstName, ...lastNameParts] = data.customerName.split(' ');
      const lastName = lastNameParts.join(' ') || 'Customer';

      await appointmentsApi.create({
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || undefined,
        customer_address: data.address,
        customer_source: data.source,
        title: 'Measurement / Installation',
        description: data.notes,
        appointment_date: data.date,
        appointment_time: data.time.split(' ')[0] + ':00', // Basic time parsing assuming HH:MM AM/PM
        job_type: 'measurement',
        status: 'pending',
        location_building: data.building,
        location_unit: data.room,
        location_full_address: data.address,
      });

      showToast('Appointment created successfully', 'success');
      navigate('/appointments');
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Failed to create appointment', 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#2b5c8f] uppercase tracking-wider mb-2">
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/appointments')}>APPOINTMENTS</span>
          <span className="text-slate-400">&gt;</span>
          <span>NEW APPOINTMENT</span>
        </div>
        <h1 className="text-[32px] font-extrabold text-[#1e293b] tracking-tight leading-tight">
          Schedule New Appointment
        </h1>
        <p className="text-[15px] font-medium text-slate-500 mt-1">
          Register a new measurement or installation visit for a client.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8 items-start mt-6">
        
        {/* Left Column - Main Form */}
        <div className="flex-1 space-y-6 w-full">
          
          {/* Customer Info Block */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#2b5c8f] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-[18px] font-extrabold text-[#1e293b]">Customer Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">
                  Customer Name <span className="text-[#ef4444]">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Abdullah Ahmed"
                  {...register('customerName')}
                  className={`w-full px-4 py-3 bg-white border ${errors.customerName ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:border-[#2b5c8f] font-medium text-sm placeholder:text-slate-400 transition-colors`}
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">
                  Customer Phone <span className="text-[#ef4444]">*</span>
                </label>
                <input 
                  type="tel" 
                  placeholder="+971 50 123 4567"
                  {...register('customerPhone')}
                  className={`w-full px-4 py-3 bg-white border ${errors.customerPhone ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:border-[#2b5c8f] font-medium text-sm placeholder:text-slate-400 transition-colors`}
                />
                {errors.customerPhone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.customerPhone.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-[14px] font-bold text-slate-700 mb-2">Customer Email</label>
                <input 
                  type="email" 
                  placeholder="customer@example.com"
                  {...register('customerEmail')}
                  className={`w-full px-4 py-3 bg-white border ${errors.customerEmail ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:border-[#2b5c8f] font-medium text-sm placeholder:text-slate-400 transition-colors`}
                />
                {errors.customerEmail && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.customerEmail.message}</p>}
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-[14px] font-bold text-slate-700 mb-3">
                Appointment Source <span className="text-[#ef4444]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {sources.map(src => (
                  <button 
                    key={src.id}
                    type="button"
                    onClick={() => setValue('source', src.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      selectedSource === src.id 
                        ? 'border-[#2b5c8f] bg-[#eef2ff]' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      selectedSource === src.id ? 'bg-[#2b5c8f] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <src.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[12px] font-bold ${
                      selectedSource === src.id ? 'text-[#2b5c8f]' : 'text-slate-600'
                    }`}>
                      {src.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.source && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.source.message}</p>}
            </div>
          </div>

          {/* Location Details Block */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#2b5c8f] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-[18px] font-extrabold text-[#1e293b]">Location Details</h2>
              </div>
              <button type="button" className="flex items-center gap-1.5 text-[#2b5c8f] text-[13px] font-bold hover:underline">
                <Share2 className="w-4 h-4" /> Share Location
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">
                  Building/Villa/House Name <span className="text-[#ef4444]">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Marina Heights"
                  {...register('building')}
                  className={`w-full px-4 py-3 bg-white border ${errors.building ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:border-[#2b5c8f] font-medium text-sm placeholder:text-slate-400 transition-colors`}
                />
                {errors.building && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.building.message}</p>}
              </div>
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">
                  Room/Flat/Apartment Number <span className="text-[#ef4444]">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Flat 1204"
                  {...register('room')}
                  className={`w-full px-4 py-3 bg-white border ${errors.room ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:border-[#2b5c8f] font-medium text-sm placeholder:text-slate-400 transition-colors`}
                />
                {errors.room && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.room.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-[14px] font-bold text-slate-700 mb-2">Customer Address</label>
                <textarea 
                  rows={3}
                  placeholder="Full street address and landmarks..."
                  {...register('address')}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2b5c8f] font-medium text-sm placeholder:text-slate-400 transition-colors resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Requirements Block */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#2b5c8f] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-[18px] font-extrabold text-[#1e293b]">Requirement & Notes</h2>
            </div>
            <textarea 
              rows={4}
              placeholder="Describe the requirements (e.g., motorized curtains for living room, blackouts for bedroom)..."
              {...register('notes')}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2b5c8f] font-medium text-sm placeholder:text-slate-400 transition-colors resize-none"
            ></textarea>

            <div className="flex items-center justify-end gap-6 mt-8">
              <button type="button" onClick={() => navigate('/appointments')} className="text-[14px] font-bold text-slate-600 hover:text-slate-900 transition-colors">
                Cancel Request
              </button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3.5 bg-[#2b5c8f] text-white font-bold text-[14px] rounded-xl shadow-md shadow-indigo-500/20 hover:bg-[#4338ca] hover:-translate-y-0.5 transition-all disabled:opacity-70">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column - Booking Slot (Sticky) */}
        <div className="w-full lg:w-[340px] shrink-0 sticky top-6">
          <div className="bg-[#2b5c8f] rounded-[24px] p-7 shadow-xl shadow-indigo-500/20 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-[18px] font-extrabold text-white">Booking Slot</h2>
            </div>

            <div className="mb-6">
              <label className="block text-[12px] font-bold text-indigo-200 uppercase tracking-wider mb-2">
                Appointment Date <span className="text-white">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2b5c8f]" />
                <input 
                  type="text" 
                  value={selectedDate}
                  readOnly
                  className="w-full pl-11 pr-4 py-3.5 bg-white text-[#2b5c8f] font-extrabold text-[15px] rounded-xl outline-none shadow-sm cursor-pointer"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
              {errors.date && <p className="text-red-300 text-xs mt-1.5 font-medium">{errors.date.message}</p>}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-8">
              {days.map((d, i) => {
                const isActive = selectedDate === d.fullDate;
                return (
                  <button 
                    key={i}
                    type="button"
                    onClick={() => setValue('date', d.fullDate)}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-colors ${
                      isActive 
                        ? 'bg-white text-[#2b5c8f] border-white' 
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <span className={`text-[10px] font-bold tracking-wider mb-1 ${isActive ? 'text-[#2b5c8f]' : 'text-indigo-200'}`}>{d.day}</span>
                    <span className="text-[18px] font-black leading-none">{d.date}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Available Time Slots</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Open</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((slot) => {
                  const isActive = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setValue('time', slot)}
                      className={`py-3.5 rounded-xl font-bold text-[14px] transition-all ${
                        isActive
                          ? 'bg-white text-[#2b5c8f] shadow-md scale-105'
                          : 'bg-indigo-600/50 text-indigo-100 hover:bg-indigo-600 border border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{slot.split(' ')[0]}</span>
                        <span className={`text-[10px] ${isActive ? 'text-[#2b5c8f]/70' : 'text-indigo-300'}`}>
                          {slot.split(' ')[1]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.time && <p className="text-red-300 text-xs mt-1.5 font-medium">{errors.time.message}</p>}
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/20 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <User className="w-4 h-4 text-indigo-100" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-indigo-200 uppercase tracking-wider mb-0.5">Availability</span>
                <p className="text-[13px] font-medium text-white leading-tight">
                  <strong className="font-extrabold">James D.</strong> free - 85% team capacity at {selectedTime}
                </p>
              </div>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}
