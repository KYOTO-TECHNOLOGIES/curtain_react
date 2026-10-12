import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments';
import type { Payment } from '../../types';
import { PaymentPageHeader } from '../../components/payments/PaymentPageHeader';
import { PaymentFilterBar } from '../../components/payments/PaymentFilterBar';
import { PaymentTable } from '../../components/payments/PaymentTable';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
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
  }, [methodFilter, debouncedSearch]);

  const { data: listRes, isLoading: loadingList } = useQuery({
    queryKey: ['payments', methodFilter, debouncedSearch, pagination.currentPage, pagination.pageSize],
    queryFn: () => paymentsApi.list({
      ...(methodFilter ? { method: methodFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      limit: pagination.limit,
      offset: pagination.offset,
    })
  });

  const { items: payments, totalCount } = useMemo(() => {
    const raw = listRes?.data;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results as Payment[], totalCount: (raw as any).count as number };
    }
    if (Array.isArray(raw)) return { items: raw, totalCount: raw.length };
    if (Array.isArray(listRes)) return { items: listRes as any, totalCount: (listRes as any).length };
    return { items: [] as Payment[], totalCount: 0 };
  }, [listRes]);

  const methodCounts = useMemo(() => {
    const countByMethod = (method: string) =>
      payments.filter((payment: Payment) => payment.method?.toLowerCase() === method.toLowerCase()).length;
    return {
      '': payments.length,
      bank_transfer: countByMethod('bank_transfer'),
      card: countByMethod('card'),
      cash: countByMethod('cash'),
      cheque: countByMethod('cheque'),
    };
  }, [payments]);

  const loading = loadingList;

  const filtered = useMemo(() => {
    if (!Array.isArray(payments)) return [];
    const term = search.trim().toLowerCase();
    if (!term) return payments;
    return payments.filter((p) =>
      (p.invoice || '').toLowerCase().includes(term) ||
      (p.invoice_number || '').toLowerCase().includes(term) ||
      (p.reference || '').toLowerCase().includes(term) ||
      (p.created_by_name || '').toLowerCase().includes(term)
    );
  }, [payments, search]);
  
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);
  };

  const totalCollected = filtered.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10">
      {/* Redesigned Page Header (Design Spells Aesthetic) */}
      <PaymentPageHeader
        onExport={() => alert('Exporting payment ledger...')}
        onLogPayment={() => navigate('/invoices')}
      />

      {/* Redesigned Filter Bar Card */}
      <PaymentFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        methodFilter={methodFilter}
        onClearFilters={() => {
          setSearch('');
          setMethodFilter('');
        }}
        totalCollectedFormatted={formatCurrency(totalCollected)}
        filteredCount={filtered.length}
      />

      {/* Redesigned Table Section (Design Spells Micro-interactions) */}
      <PaymentTable
        payments={filtered}
        loading={loading}
        onSelectPayment={(p) => {
          const invId = p.invoice_number || p.invoice;
          if (invId) navigate(`/invoices/${invId}`);
        }}
        onViewInvoice={(invoiceId) => navigate(`/invoices/${invoiceId}`)}
        methodFilter={methodFilter}
        onMethodChange={(method) => setMethodFilter(method)}
        methodCounts={methodCounts}
        onClearFilters={() => {
          setSearch('');
          setMethodFilter('');
        }}
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
    </div>
  );
}
