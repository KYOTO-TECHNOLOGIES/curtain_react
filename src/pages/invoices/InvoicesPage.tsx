import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoicesApi } from '../../api/invoices';
import { useToast } from '../../components/ui/Toast';
import type { InvoiceListItem } from '../../types';
import { StatusSummary, INVOICE_STATUS_CONFIGS } from '../../components/appointments/StatusSummary';
import { paymentSchema, type PaymentFormValues } from '../../lib/validationSchemas';
import { InvoicePageHeader } from '../../components/invoices/InvoicePageHeader';
import { InvoiceFilterBar } from '../../components/invoices/InvoiceFilterBar';
import { InvoiceTable } from '../../components/invoices/InvoiceTable';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { LogPaymentModal } from '../../components/invoices/LogPaymentModal';

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
    if (Array.isArray(listRes)) return { items: listRes as InvoiceListItem[], totalCount: listRes.length };
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
  const selectedPaymentInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId);

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
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('');
        }}
        totalCount={totalCount}
        filteredCount={filtered.length}
        totalCollected={stats?.total_paid ? formatCurrency(stats.total_paid) : 'AED 0.00'}
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
        totalCount={totalCount}
        statusFilter={statusFilter}
        onStatusChange={(status) => setStatusFilter(status)}
        stats={stats}
        onSelectInvoice={(invoice) => navigate(`/invoices/${invoice.id}`)}
        onLogPayment={openPaymentModal}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('');
        }}
        onCopyPhone={() => showToast('Phone copied to clipboard', 'info')}
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
      <LogPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}
        form={paymentForm}
        isSubmitting={isSubmittingPayment}
        context={selectedInvoiceId ? `Invoice #${selectedInvoiceId}` : undefined}
        invoiceTotal={selectedPaymentInvoice?.total_amount}
        paidToDate={selectedPaymentInvoice?.amount_paid}
        outstandingBalance={selectedPaymentInvoice?.balance_due}
      />
    </div>
  );
}
