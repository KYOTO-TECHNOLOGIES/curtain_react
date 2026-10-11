import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { customersApi } from '../../api/customers';
import { usersApi } from '../../api/users';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import type { AppointmentListItem, CreateAppointmentRequest, User } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { StatusSummary } from '../../components/appointments/StatusSummary';
import { AppointmentHeader } from '../../components/appointments/AppointmentHeader';
import { FilterBar } from '../../components/appointments/FilterBar';
import { AppointmentTable } from '../../components/appointments/AppointmentTable';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pagination = usePagination();

  // Debounce search for backend call by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Reset page when filters change
  useEffect(() => {
    pagination.resetPage();
  }, [statusFilter, assigneeFilter, debouncedSearch]);

  const { data: listRes, isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['appointments', statusFilter, assigneeFilter, debouncedSearch, pagination.currentPage, pagination.pageSize],
    queryFn: () => appointmentsApi.list({
      status: statusFilter || undefined,
      assigned_to: assigneeFilter ? Number(assigneeFilter) : undefined,
      search: debouncedSearch || undefined,
      limit: pagination.limit,
      offset: pagination.offset,
    } as any),
  });

  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['appointments_stats', statusFilter],
    queryFn: () => appointmentsApi.stats(),
  });

  const { items: appointments, totalCount: paginatedTotal } = useMemo(() => {
    const raw = listRes?.data;
    // DRF paginated response: { count, results: [...] }
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results as AppointmentListItem[], totalCount: (raw as any).count as number };
    }
    // Fallback: plain array response
    if (Array.isArray(raw)) return { items: raw, totalCount: raw.length };
    if (Array.isArray(listRes)) return { items: listRes as any, totalCount: (listRes as any).length };
    return { items: [] as AppointmentListItem[], totalCount: 0 };
  }, [listRes]);
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
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<number | string | null>(null);

  const { data: usersRes } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list()
  });
  const users: User[] = useMemo(() => {
    const raw = usersRes?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray((raw as any)?.results)) return (raw as any).results;
    if (Array.isArray((raw as any)?.data)) return (raw as any).data;
    if (Array.isArray(usersRes)) return usersRes as any;
    return [];
  }, [usersRes]);

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
      setRecentlyUpdatedId(assignTarget.id);
      setTimeout(() => setRecentlyUpdatedId(null), 1500);
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

  const filtered: AppointmentListItem[] = appointments;
  const totalCount = paginatedTotal || stats?.total || appointments.length;

  return (
    <div className="space-y-6 animate-page-in font-sans">

      {/* Redesigned Page Header (Design Spells Aesthetic) */}
      <AppointmentHeader
        onExport={() => {
          showToast('Exporting appointments...', 'info');
        }}
        onSchedule={openCreate}
      />

      {/* Redesigned Filter Bar Card with Custom SelectMenu & Active Sync */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(status) => setStatusFilter(status)}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={(assignee) => setAssigneeFilter(assignee)}
        onClearFilters={() => {
          setSearchQuery('');
          setStatusFilter('');
          setAssigneeFilter('');
        }}
        totalCount={totalCount}
        filteredCount={appointments.length}
        stats={stats}
        users={users}
        appointments={appointments}
      />

      {/* Modern Status Summary Row (Design Spells Micro-interactions) */}
      <StatusSummary
        stats={stats}
        selectedStatus={statusFilter}
        onSelectStatus={(status) => setStatusFilter(status)}
        loading={loadingStats}
      />

      {/* Redesigned Appointment Table (Design Spells Aesthetic & Micro-interactions) */}
      <AppointmentTable
        appointments={filtered}
        loading={loading}
        totalCount={totalCount}
        onSelectAppointment={(a) => navigate(`/appointments/${a.id}`)}
        onAssign={(a) => openAssign(a)}
        onQuote={(a) => navigate(`/appointments/${a.id}`)}
        onClearFilters={() => {
          setSearchQuery('');
          setStatusFilter('');
          setAssigneeFilter('');
        }}
        onCopyPhone={(phone) => showToast(`Phone ${phone} copied to clipboard`, 'info')}
        recentlyUpdatedId={recentlyUpdatedId}
      />

      {/* Pagination */}
      <Pagination
        totalCount={totalCount}
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        onPageChange={pagination.goToPage}
        onPageSizeChange={pagination.setPageSize}
        loading={loadingList}
      />

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
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Appointment" maxWidth="max-w-md">
        <div className="space-y-6">
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
              <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center text-[#2b5c8f]">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1e293b]">Assignment Details</h3>
            </div>
            <div className="p-5 space-y-5">
              {assignTarget && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center text-[13px] font-bold border border-slate-100">
                    #{assignTarget.id}
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-slate-800">{assignTarget.title || 'Appointment'}</p>
                    <p className="text-[13px] text-slate-500 font-medium">{assignTarget.customer_name}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Assign To <span className="text-red-500">*</span></label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-[#2b5c8f] rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b5c8f]/10 transition-all"
                >
                  <option value="">Select a staff member...</option>
                  {(Array.isArray(users) ? users : []).map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={assigning || assignUserId === ''}
              className="flex items-center gap-2 px-8 py-3 bg-[#2b5c8f] text-white font-bold text-sm rounded-xl shadow-md shadow-[#2b5c8f]/20 hover:bg-[#1f456e] hover:-translate-y-0.5 transition-all disabled:opacity-70"
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              {assigning ? 'Assigning...' : 'Assign Staff'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
