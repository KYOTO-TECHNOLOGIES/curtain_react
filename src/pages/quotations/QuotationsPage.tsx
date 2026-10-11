import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quotationsApi } from '../../api/quotations';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { StatusSummary, QUOTATION_STATUS_CONFIGS } from '../../components/appointments/StatusSummary';
import { QuotationPageHeader } from '../../components/quotations/QuotationPageHeader';
import { QuotationFilterBar } from '../../components/quotations/QuotationFilterBar';
import { QuotationTable } from '../../components/quotations/QuotationTable';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

export default function QuotationsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quoteTypeFilter, setQuoteTypeFilter] = useState('');
  const pagination = usePagination();

  // Debounce search by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer: '',
    appointment: '',
    work_type: 1,
    quote_type: 'b2c',
    valid_until: '',
    discount_percentage: 0
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await quotationsApi.create({
        ...form,
        customer: Number(form.customer),
        appointment: form.appointment ? Number(form.appointment) : undefined,
        status: 'draft',
        areas_data: [] // Simplified scaffold
      });
      showToast('Quotation drafted successfully', 'success');
      setFormOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to create quotation', 'error');
    }
    setSaving(false);
  };

  // Reset page when filters change
  useEffect(() => {
    pagination.resetPage();
  }, [statusFilter, quoteTypeFilter, debouncedSearch]);

  const { data: listRes, isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['quotations', statusFilter, quoteTypeFilter, debouncedSearch, pagination.currentPage, pagination.pageSize],
    queryFn: () => quotationsApi.list({
      status: statusFilter || undefined,
      quote_type: quoteTypeFilter || undefined,
      search: debouncedSearch || undefined,
      limit: pagination.limit,
      offset: pagination.offset,
    })
  });

  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['quotations_stats'],
    queryFn: () => quotationsApi.stats().catch(() => ({ data: null }))
  });

  const { items: quotations, totalCount: paginatedTotal } = useMemo(() => {
    const raw = listRes?.data;
    // DRF paginated response: { count, results: [...] }
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results, totalCount: (raw as any).count as number };
    }
    // Fallback: plain array
    if (Array.isArray(raw)) return { items: raw, totalCount: raw.length };
    if (Array.isArray(listRes)) return { items: listRes as any, totalCount: (listRes as any).length };
    return { items: [], totalCount: 0 };
  }, [listRes]);
  const stats = statsRes?.data || null;
  const loading = loadingList || loadingStats;

  const load = () => {
    refetchList();
    refetchStats();
  };

  const filtered = quotations;
  const totalCount = paginatedTotal || stats?.total || filtered.length;

  return (
    <div className="space-y-6 animate-page-in font-sans">

      {/* Redesigned Page Header (Design Spells Aesthetic) */}
      <QuotationPageHeader
        onExport={() => showToast('Exporting quotations...', 'info')}
        onNewQuotation={() => navigate('/quotations/create')}
      />

      {/* Redesigned Filter Bar Card */}
      <QuotationFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(status) => setStatusFilter(status)}
        quoteTypeFilter={quoteTypeFilter}
        onQuoteTypeChange={(type) => setQuoteTypeFilter(type)}
        onClearFilters={() => {
          setSearchQuery('');
          setStatusFilter('');
          setQuoteTypeFilter('');
        }}
        totalCount={totalCount}
        filteredCount={filtered.length}
        stats={stats}
        quotations={quotations}
      />

      {/* Modern Status Summary Row (Design Spells Micro-interactions) */}
      <StatusSummary
        stats={stats}
        configs={QUOTATION_STATUS_CONFIGS}
        selectedStatus={statusFilter}
        onSelectStatus={(status) => setStatusFilter(status)}
        loading={loadingStats}
      />

      {/* Redesigned Quotation Table (Design Spells Aesthetic & Micro-interactions) */}
      <QuotationTable
        quotations={filtered}
        loading={loading}
        totalCount={totalCount}
        onSelectQuotation={(q) => navigate(`/quotations/${q.id}`)}
        onClearFilters={() => {
          setSearchQuery('');
          setStatusFilter('');
          setQuoteTypeFilter('');
        }}
        onCopyPhone={(phone) => showToast(`Phone ${phone} copied to clipboard`, 'info')}
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
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create Draft Quotation" maxWidth="max-w-xl">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer ID *</label>
              <input type="number" required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="e.g. 1" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Appointment ID (Optional)</label>
              <input type="number" value={form.appointment} onChange={(e) => setForm({ ...form, appointment: e.target.value })} placeholder="e.g. 1" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quote Type *</label>
              <select required value={form.quote_type} onChange={(e) => setForm({ ...form, quote_type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 transition-all text-sm">
                <option value="b2c">B2C (Retail)</option>
                <option value="b2b">B2B (Business)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Type ID *</label>
              <input type="number" required value={form.work_type} onChange={(e) => setForm({ ...form, work_type: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valid Until *</label>
              <input type="date" required value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount %</label>
              <input type="number" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm" />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
            <p className="text-[13px] text-slate-500 font-medium">
              Note: This will create a <strong className="text-slate-700">Draft</strong> quotation. You can add areas and specific item calculations later from the Quotation Detail view.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
