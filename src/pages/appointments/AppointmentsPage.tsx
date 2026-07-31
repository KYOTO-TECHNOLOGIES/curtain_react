import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Calendar, 
  ChevronRight, 
  Download, 
  ChevronDown, 
  FilePlus,
  UserCheck
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { customersApi } from '../../api/customers';
import { usersApi } from '../../api/users';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import type { AppointmentListItem, CreateAppointmentRequest, User } from '../../types';
import { useQuery } from '@tanstack/react-query';

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Lookup Modal state
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupType, setLookupType] = useState<'phone' | 'email'>('phone');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Form Modal state (legacy)
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [form, setForm] = useState<Partial<CreateAppointmentRequest>>({
    title: '', description: '', appointment_date: '', appointment_time: '', job_type: 'consultation', status: 'pending',
    customer_first_name: '', customer_last_name: '', customer_phone: '', location_full_address: ''
  });

  const { data: listRes, isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () => appointmentsApi.list(statusFilter ? { status: statusFilter as any } : {}),
  });

  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['appointments_stats', statusFilter],
    queryFn: () => appointmentsApi.stats(),
  });

  const appointments: AppointmentListItem[] = listRes?.data || [];
  const stats = statsRes?.data || null;
  const loading = loadingList || loadingStats;

  const load = () => {
    refetchList();
    refetchStats();
  };

  // Assign modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AppointmentListItem | null>(null);
  const [assignUserId, setAssignUserId] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);

  const { data: usersRes } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list()
  });
  const users: User[] = usersRes?.data || [];

  const openAssign = (a: AppointmentListItem) => {
    setAssignTarget(a);
    setAssignUserId(a.assigned_to ?? '');
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!assignTarget || assignUserId === '') return;
    setAssigning(true);
    try {
      await appointmentsApi.assign(assignTarget.id, Number(assignUserId));
      showToast('Appointment assigned successfully', 'success');
      setAssignOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to assign appointment', 'error');
    }
    setAssigning(false);
  };

  const openCreate = () => {
    setLookupOpen(true);
    setLookupQuery('');
    setLookupType('phone');
  };

  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setIsLookingUp(true);
    setLookupError(null);
    try {
      const params = lookupType === 'email' ? { email: lookupQuery } : { phone: lookupQuery };
      const res = await customersApi.lookup(params);
      
      setLookupOpen(false);
      navigate('/appointments/create', { 
        state: { 
          lookupResult: res.data, 
          lookupQuery,
          lookupType 
        } 
      });
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.response?.data?.found === false) {
        setLookupError('Customer not found.');
      } else {
        showToast('Error looking up customer', 'error');
      }
    }
    setIsLookingUp(false);
  };

  const handleCreateNewCustomer = () => {
    setLookupOpen(false);
    navigate('/appointments/create', { 
      state: { 
        lookupResult: { found: false }, 
        lookupQuery,
        lookupType 
      } 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await appointmentsApi.create(form as CreateAppointmentRequest);
      showToast('Appointment created successfully');
      setFormOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Operation failed', 'error');
    }
    setSaving(false);
  };

  const filtered: AppointmentListItem[] = appointments.filter((a: AppointmentListItem) =>
    (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-[#2b5c8f] text-white';
      case 'in_progress': return 'bg-[#f97316] text-white';
      case 'completed': return 'bg-[#10b981] text-white';
      case 'cancelled': return 'bg-[#ef4444] text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-page-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight">
            Appointment Management
          </h1>
          <div className="flex items-center gap-2 mt-1 text-[13px] font-medium text-slate-500">
            <span>Curtain Master.</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#2b5c8f]">Appointment List View</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" strokeWidth={2.5} /> Export List
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#2b5c8f] text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all">
            <Calendar className="w-4 h-4" strokeWidth={2.5} /> Schedule New Appointment
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="hidden">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</span>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 pr-10 outline-none focus:border-[#2b5c8f] transition-colors w-40"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned To</span>
            <div className="relative">
              <select className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 pr-10 outline-none focus:border-[#2b5c8f] transition-colors w-40">
                <option>All Staff</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-xl px-6 py-2.5 flex flex-col items-center justify-center min-w-[120px]">
          <span className="text-[15px] font-extrabold text-slate-800">Total: {stats?.total || 0}</span>
          <span className="text-[11px] font-medium text-slate-500">Appointments</span>
        </div>
      </div>

      {/* Indicators Row */}
      <div className="flex flex-wrap items-center gap-4 mt-2 mb-6">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2b5c8f]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.scheduled || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Scheduled</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.in_progress || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">In Progress</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.completed || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Completed</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-slate-800">{stats?.by_status?.cancelled || 0}</span>
            <span className="text-[13px] font-medium text-slate-500">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Date & Time</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2b5c8f] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No appointments found.
                  </td>
                </tr>
              ) : filtered.map((a: AppointmentListItem) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-extrabold text-slate-800">
                      #{a.id.toString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-[14px] font-bold text-slate-700">{a.customer_name}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{a.customer_phone}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-extrabold text-slate-800">{a.appointment_date}</span>
                      <span className="text-[12px] text-slate-400 font-semibold">{a.appointment_time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-3">
                      {a.assigned_to_name ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600">
                            {a.assigned_to_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-bold text-slate-700">{a.assigned_to_name}</span>
                        </>
                      ) : (
                        <span className="text-[13px] font-medium text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.1em] ${getStatusStyle(a.status)}`}>
                      {a.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openAssign(a)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[12px] rounded-lg transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {a.assigned_to_name ? 'Reassign' : 'Assign'}
                      </button>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#f1f0ff] text-[#2b5c8f] hover:bg-[#e4e2ff] font-bold text-[12px] rounded-lg transition-colors">
                        <FilePlus className="w-3.5 h-3.5" /> Quote
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create Appointment" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className="font-medium text-slate-800 pb-2 border-b border-slate-100">Customer Info</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name *</label>
              <input type="text" required value={form.customer_first_name} onChange={(e) => setForm({ ...form, customer_first_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name *</label>
              <input type="text" required value={form.customer_last_name} onChange={(e) => setForm({ ...form, customer_last_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone *</label>
              <input type="tel" required value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
          </div>
          
          <h4 className="font-medium text-slate-800 pb-2 border-b border-slate-100 mt-6">Appointment Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
              <input type="date" required value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Time *</label>
              <input type="time" required value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Type *</label>
              <select required value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 transition-all text-sm">
                <option value="measurement">Measurement</option>
                <option value="installation">Installation</option>
                <option value="consultation">Consultation</option>
                <option value="repair">Repair</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location Address *</label>
              <input type="text" required value={form.location_full_address} onChange={(e) => setForm({ ...form, location_full_address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Lookup Modal */}
      <Modal open={lookupOpen} onClose={() => setLookupOpen(false)} title="" maxWidth="max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#2b5c8f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
          <h2 className="text-[22px] font-extrabold text-[#1e293b] mb-1">Customer Lookup</h2>
          <p className="text-sm font-medium text-slate-500">Search by phone number or email to continue</p>
        </div>

        <form onSubmit={handleLookup} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-bold text-slate-700">
                {lookupType === 'phone' ? 'Phone Number' : 'Email Address'} <span className="text-red-500">*</span>
              </label>
              <button 
                type="button" 
                onClick={() => {
                  setLookupType(lookupType === 'phone' ? 'email' : 'phone');
                  setLookupQuery('');
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-[#2b5c8f] text-[12px] font-bold rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Switch to {lookupType === 'phone' ? 'Email' : 'Phone'}
              </button>
            </div>
            
            {lookupType === 'phone' ? (
              <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#2b5c8f] focus-within:ring-2 focus-within:ring-[#2b5c8f]/20 transition-all bg-slate-50">
                <div className="flex items-center gap-2 px-3 bg-white border-r border-slate-200">
                  <span className="text-lg">🇦🇪</span>
                  <span className="text-[14px] font-bold text-slate-700">+971</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <input 
                  type="tel"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="50 000 0000"
                  className="flex-1 px-4 py-3.5 bg-slate-50 text-slate-800 text-[15px] font-semibold outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <input 
                type="email"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-[15px] font-semibold outline-none focus:border-[#2b5c8f] focus:ring-2 focus:ring-[#2b5c8f]/20 transition-all"
                autoFocus
              />
            )}
          </div>

          {lookupError ? (
            <div className="flex flex-col gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="text-red-500 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-[13px] font-bold text-red-700 leading-relaxed">
                  {lookupError}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateNewCustomer}
                className="w-full py-2.5 bg-red-100 text-red-700 hover:bg-red-200 font-bold text-[13px] rounded-lg transition-colors"
              >
                Create New Customer
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-slate-400 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                Enter a phone number or email address to search.
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLookingUp || !lookupQuery.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2b5c8f] text-white font-bold text-[15px] rounded-xl shadow-md shadow-indigo-500/20 hover:bg-[#1f456e] transition-all disabled:opacity-70 mt-2"
          >
            {isLookingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Search Customer
          </button>
        </form>
      </Modal>
      {/* Assign Modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Appointment" maxWidth="max-w-sm">
        <div className="space-y-5">
          {assignTarget && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[13px] font-bold text-slate-700 truncate">{assignTarget.title || `Appointment #${assignTarget.id}`}</p>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">{assignTarget.customer_name}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Assign To <span className="text-red-500">*</span></label>
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm"
            >
              <option value="">Select a staff member...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={assigning || assignUserId === ''}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60"
            >
              {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
              {assigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
