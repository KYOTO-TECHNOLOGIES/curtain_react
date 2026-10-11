import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { useToast } from '../../components/ui/Toast';
import type { OrderListItem } from '../../types';
import { StatusSummary, ORDER_STATUS_CONFIGS } from '../../components/appointments/StatusSummary';
import { OrderPageHeader } from '../../components/orders/OrderPageHeader';
import { OrderFilterBar } from '../../components/orders/OrderFilterBar';
import { OrderTable } from '../../components/orders/OrderTable';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  const { data: listRes, isLoading: loadingList, refetch: refetchList } = useQuery({
    queryKey: ['orders', statusFilter, debouncedSearch, pagination.currentPage, pagination.pageSize],
    queryFn: () => ordersApi.list({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      limit: pagination.limit,
      offset: pagination.offset,
    })
  });

  const { data: statsRes, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['orders_stats', statusFilter],
    queryFn: () => ordersApi.stats().catch(() => ({ data: null }))
  });

  const { items: orders, totalCount: paginatedTotal } = useMemo(() => {
    const raw = listRes?.data;
    // DRF paginated response: { count, results: [...] }
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as any).results)) {
      return { items: (raw as any).results as OrderListItem[], totalCount: (raw as any).count as number };
    }
    // Fallback: plain array
    if (Array.isArray(raw)) return { items: raw, totalCount: raw.length };
    if (Array.isArray(listRes)) return { items: listRes as any, totalCount: (listRes as any).length };
    return { items: [] as OrderListItem[], totalCount: 0 };
  }, [listRes]);

  const stats = statsRes?.data || null;
  const loading = loadingList || loadingStats;

  const load = () => {
    refetchList();
    refetchStats();
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    const term = search.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((o) =>
      (o.customer_name || '').toLowerCase().includes(term) ||
      (o.quotation_id || '').toLowerCase().includes(term) ||
      String(o.id || '').includes(term)
    );
  }, [orders, search]);

  const totalCount = paginatedTotal || stats?.total || orders.length;

  const handleGenerateInvoice = async (id: number) => {
    try {
      await ordersApi.generateInvoice(id);
      showToast('Invoice generated successfully', 'success');
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to generate invoice', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-page-in font-sans pb-10">
      {/* Redesigned Page Header (Design Spells Aesthetic) */}
      <OrderPageHeader
        onExport={() => showToast('Exporting orders...', 'info')}
        onCreateOrder={() =>
          showToast('Orders are automatically generated from accepted quotations.', 'success')
        }
      />

      {/* Redesigned Filter Bar Card */}
      <OrderFilterBar
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
        stats={stats}
        orders={orders}
      />

      {/* Modern Status Summary Row (Design Spells Micro-interactions) */}
      <StatusSummary
        stats={stats}
        configs={ORDER_STATUS_CONFIGS}
        selectedStatus={statusFilter}
        onSelectStatus={(status) => setStatusFilter(status)}
        loading={loadingStats}
      />

      {/* Redesigned Order Table (Design Spells Aesthetic & Micro-interactions) */}
      <OrderTable
        orders={filtered}
        loading={loading}
        totalCount={totalCount}
        onSelectOrder={(o) => navigate(`/orders/${o.id}`)}
        onGenerateInvoice={handleGenerateInvoice}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('');
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
    </div>
  );
}
