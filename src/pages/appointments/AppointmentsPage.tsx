import { useState, useEffect, useMemo } from 'react';
import { UserCheck, CalendarClock, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { CustomerLookupModal } from '../../components/appointments/CustomerLookupModal';
import { AssignAppointmentModal } from '../../components/appointments/AssignAppointmentModal';
import { RescheduleAppointmentModal } from '../../components/appointments/RescheduleAppointmentModal';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { DatePicker } from '../../components/ui/DatePicker';

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
  const [assignConfirmOpen, setAssignConfirmOpen] = useState(false);

  // Reschedule modal state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentListItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleConfirmOpen, setRescheduleConfirmOpen] = useState(false);

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

  // Show confirm dialog before assigning
  const handleAssignConfirm = () => {
    if (!assignTarget || assignUserId === '') return;
    setAssignConfirmOpen(true);
  };

  const handleAssign = async () => {
    if (!assignTarget || assignUserId === '') return;
    setAssigning(true);
    try {
      await appointmentsApi.assign(assignTarget.id, Number(assignUserId));
      showToast('Appointment assigned successfully', 'success');
      setRecentlyUpdatedId(assignTarget.id);
      setTimeout(() => setRecentlyUpdatedId(null), 1500);
      setAssignConfirmOpen(false);
      setAssignOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to assign appointment', 'error');
    }
    setAssigning(false);
  };

  // Open Reschedule modal
  const openReschedule = (a: AppointmentListItem) => {
    setRescheduleTarget(a);
    setRescheduleDate(a.appointment_date || '');
    setRescheduleTime(a.appointment_time ? a.appointment_time.slice(0, 5) : '');
    setRescheduleOpen(true);
  };

  // Show confirm dialog before rescheduling
  const handleRescheduleConfirm = () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;
    setRescheduleConfirmOpen(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    try {
      await appointmentsApi.reschedule(rescheduleTarget.id, {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime,
      });
      showToast('Appointment rescheduled successfully', 'success');
      setRecentlyUpdatedId(rescheduleTarget.id);
      setTimeout(() => setRecentlyUpdatedId(null), 1500);
      setRescheduleConfirmOpen(false);
      setRescheduleOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to reschedule appointment', 'error');
    }
    setRescheduling(false);
  };

  const openCreate = () => {
    setLookupOpen(true);
    setLookupQuery('');
    setLookupType('phone');
  };

  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = async (
    e: React.FormEvent,
    payload?: { type: 'phone' | 'email'; query: string; fullPhone?: string }
  ) => {
    e.preventDefault();
    const activeQuery = payload?.query || lookupQuery;
    const activeType = payload?.type || lookupType;
    if (!activeQuery.trim()) return;

    setIsLookingUp(true);
    setLookupError(null);
    try {
      const params = activeType === 'email' ? { email: activeQuery.trim().toLowerCase() } : { phone: activeQuery.trim() };
      let res;
      try {
        res = await customersApi.lookup(params);
      } catch (innerErr: any) {
        // Fallback: If phone lookup with dial code (+97150...) returned 404, try without dial code or vice versa
        if (activeType === 'phone' && (innerErr?.response?.status === 404 || innerErr?.response?.data?.found === false)) {
          const altPhone = activeQuery.startsWith('+')
            ? activeQuery.replace(/^\+\d{1,4}/, '')
            : `+971${activeQuery.replace(/^0/, '')}`;
          if (altPhone !== activeQuery) {
            res = await customersApi.lookup({ phone: altPhone });
          } else {
            throw innerErr;
          }
        } else {
          throw innerErr;
        }
      }

      setLookupOpen(false);
      navigate('/appointments/create', {
        state: {
          lookupResult: res.data,
          lookupQuery: activeQuery,
          lookupType: activeType
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
        statusFilter={statusFilter}
        onStatusChange={(status) => setStatusFilter(status)}
        stats={stats}
        onSelectAppointment={(a) => navigate(`/appointments/${a.id}`)}
        onAssign={(a) => openAssign(a)}
        onQuote={(a) => navigate(`/quotations/create?appointment=${a.id}`)}
        onReschedule={(a) => openReschedule(a)}
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
              <DatePicker required value={form.appointment_date || ''} onChange={(event) => setForm({ ...form, appointment_date: event.target.value })} className="w-full" />
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

      {/* Customer Lookup Modal (Design Spells Redesign) */}
      <CustomerLookupModal
        open={lookupOpen}
        onClose={() => setLookupOpen(false)}
        lookupQuery={lookupQuery}
        setLookupQuery={setLookupQuery}
        lookupType={lookupType}
        setLookupType={setLookupType}
        isLookingUp={isLookingUp}
        lookupError={lookupError}
        setLookupError={setLookupError}
        onSearch={handleLookup}
        onCreateNewCustomer={handleCreateNewCustomer}
      />
      <AssignAppointmentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        appointment={assignTarget}
        assignUserId={assignUserId}
        users={users}
        assigning={assigning}
        onAssign={handleAssignConfirm}
        onStaffChange={(event) => setAssignUserId(event.target.value === '' ? '' : Number(event.target.value))}
      />

      {/* Assign Confirmation Dialog */}
      <Modal open={assignConfirmOpen} onClose={() => setAssignConfirmOpen(false)} title="Confirm Assignment" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {assignTarget?.assigned_to_name ? 'Reassign this appointment?' : 'Assign this appointment?'}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {assignTarget?.assigned_to_name
                  ? `This will reassign appointment #${assignTarget?.id} from ${assignTarget?.assigned_to_name} to ${users.find(u => u.id === Number(assignUserId))?.full_name || 'the selected staff'}.`
                  : `This will assign appointment #${assignTarget?.id} to ${users.find(u => u.id === Number(assignUserId))?.full_name || 'the selected staff'}.`
                }
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAssignConfirmOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={assigning}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-semibold text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60"
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              {assigning ? 'Assigning...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      <RescheduleAppointmentModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        appointment={rescheduleTarget}
        date={rescheduleDate}
        time={rescheduleTime}
        isSubmitting={rescheduling}
        onDateChange={setRescheduleDate}
        onTimeChange={setRescheduleTime}
        onReschedule={handleRescheduleConfirm}
      />

      {/* Reschedule Confirmation Dialog */}
      <Modal open={rescheduleConfirmOpen} onClose={() => setRescheduleConfirmOpen(false)} title="Confirm Reschedule" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Reschedule this appointment?</p>
              <p className="text-sm text-blue-700 mt-1">
                Appointment #{rescheduleTarget?.id} will be rescheduled to{' '}
                <strong>{rescheduleDate ? new Date(`${rescheduleDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</strong>{' '}
                at <strong>{rescheduleTime}</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRescheduleConfirmOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              disabled={rescheduling}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2F5D8F] text-white font-semibold text-sm hover:bg-[#2A5483] transition-colors disabled:opacity-60"
            >
              {rescheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
              {rescheduling ? 'Rescheduling...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
