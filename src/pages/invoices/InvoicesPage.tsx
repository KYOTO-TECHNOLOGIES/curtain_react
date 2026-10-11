import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { invoicesApi } from '../../api/invoices';
import { useToast } from '../../components/ui/Toast';
import type { InvoiceListItem } from '../../types';
import Modal from '../../components/ui/Modal';
import { StatusSummary, INVOICE_STATUS_CONFIGS } from '../../components/appointments/StatusSummary';
import { paymentSchema, type PaymentFormValues } from '../../lib/validationSchemas';
import { InvoicePageHeader } from '../../components/invoices/InvoicePageHeader';
import { InvoiceFilterBar } from '../../components/invoices/InvoiceFilterBar';
import { InvoiceTable } from '../../components/invoices/InvoiceTable';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

const ErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {message}
    </p>
  ) : null;

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const pagination = usePagination();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    pagination.resetPage();
  }, [statusFilter, debouncedSearch]);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    }
  });

  const { data: listRes, isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['invoices', statusFilter, debouncedSearch, pagination.currentPage, pagination.pageSize],
    queryFn: () => invoicesApi.list({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      limit: pagination.limit,
      offset: pagination.offset,
    })
  });

  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['invoices_stats', statusFilter],
    queryFn: () => invoicesApi.stats().catch(() => ({ data: null }))
  });

  const { items: invoices, totalCount: paginatedTotal } = useMemo(() => {
    const raw = listRes?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results as InvoiceListItem[], totalCount: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { items: raw, totalCount: raw.length };
    if (Array.isArray(listRes)) return { items: listRes as any, totalCount: (listRes as any).length };
    return { items: [] as InvoiceListItem[], totalCount: 0 };
  }, [listRes]);

  const stats = statsRes?.data || null;
  const loading = loadingList || loadingStats;

  const load = () => {
    refetchList();
    refetchStats();
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(invoices)) return [];
    const term = search.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter((i) =>
      (i.customer_name || '').toLowerCase().includes(term) ||
      (i.id || '').toLowerCase().includes(term) ||
      (i.quotation_id || '').toLowerCase().includes(term)
    );
  }, [invoices, search]);

  const totalCount = paginatedTotal || stats?.total || invoices.length;

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);
  };

  const openPaymentModal = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    paymentForm.reset({
      amount: '',
      method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentFormValues) => {
    if (!selectedInvoiceId) return;
    setIsSubmittingPayment(true);
    try {
      await invoicesApi.addPayment(selectedInvoiceId, {
        amount: parseFloat(data.amount),
        method: data.method,
        payment_date: data.payment_date,
        reference: data.reference,
        notes: data.notes
      });
      showToast('Payment logged successfully', 'success');
      setPaymentModalOpen(false);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to log payment', 'error');
    }
    setIsSubmittingPayment(false);
  };

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10">
      {/* Redesigned Page Header (Design Spells Aesthetic) */}
      <InvoicePageHeader
        onExport={() => showToast('Exporting invoices...', 'info')}
        onGenerateInvoice={() =>
          showToast('Invoices are auto-generated from Orders', 'success')
        }
      />

      {/* Redesigned Filter Bar Card */}
      <InvoiceFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={(status) => setStatusFilter(status)}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('');
        }}
        totalCount={totalCount}
        filteredCount={filtered.length}
        totalCollected={stats?.total_paid ? formatCurrency(stats.total_paid) : 'AED 0.00'}
        stats={stats}
        invoices={invoices}
      />

      {/* Modern Status Summary Row (Design Spells Micro-interactions) */}
      <StatusSummary
        stats={stats}
        configs={INVOICE_STATUS_CONFIGS}
        selectedStatus={statusFilter}
        onSelectStatus={(status) => setStatusFilter(status)}
        loading={loadingStats}
      />

      {/* Redesigned Table Section (Design Spells Micro-interactions) */}
      <InvoiceTable
        invoices={filtered}
        loading={loading}
        onSelectInvoice={(invoice) => navigate(`/invoices/${invoice.id}`)}
        onLogPayment={openPaymentModal}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('');
        }}
        onCopyPhone={() => showToast('Phone copied to clipboard', 'info')}
        totalCount={totalCount}
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

      {/* Log Payment Modal */}
      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Log Payment">
        <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (AED) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.01"
              {...paymentForm.register('amount')}
              className={`w-full px-4 py-2.5 rounded-xl border ${paymentForm.formState.errors.amount ? 'border-red-400 bg-red-50' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm`}
              placeholder="e.g. 500.00"
            />
            <ErrorMsg message={paymentForm.formState.errors.amount?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method <span className="text-red-500">*</span></label>
            <select
              {...paymentForm.register('method')}
              className={`w-full px-4 py-2.5 rounded-xl border ${paymentForm.formState.errors.method ? 'border-red-400 bg-red-50' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm`}
            >
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
            <ErrorMsg message={paymentForm.formState.errors.method?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              {...paymentForm.register('payment_date')}
              className={`w-full px-4 py-2.5 rounded-xl border ${paymentForm.formState.errors.payment_date ? 'border-red-400 bg-red-50' : 'border-slate-200'} outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm`}
            />
            <ErrorMsg message={paymentForm.formState.errors.payment_date?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference Number <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <input
              type="text"
              {...paymentForm.register('reference')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm"
              placeholder="e.g. TXN-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <textarea
              {...paymentForm.register('notes')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#2b5c8f]/20 focus:border-[#2b5c8f]/40 transition-all text-sm resize-none h-24"
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setPaymentModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmittingPayment} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2b5c8f] text-white font-medium text-sm hover:bg-[#1f456e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isSubmittingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmittingPayment ? 'Saving...' : 'Log Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
