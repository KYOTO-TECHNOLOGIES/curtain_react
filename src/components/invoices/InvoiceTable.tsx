import React, { useState, useMemo } from 'react';
import { Receipt, Eye, CreditCard, CheckCircle2 } from 'lucide-react';
import type { InvoiceListItem, InvoiceStats } from '../../types';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import { StatusHeaderFilter } from '../ui/StatusHeaderFilter';
import { MobileStatusFilter } from '../ui/MobileStatusFilter';
import { StatusBadge } from '../ui/StatusBadge';
import { CustomerCell } from '../appointments/CustomerCell';
import './InvoiceTable.css';

export interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectInvoice: (invoice: InvoiceListItem) => void;
  onLogPayment: (invoiceId: string) => void;
  onClearFilters?: () => void;
  onCopyPhone?: (phone: string) => void;
  totalCount?: number;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  stats?: InvoiceStats | null;
}

const INVOICE_STATUS_ACCENT_COLORS: Record<string, string> = {
  paid: '#10B981',
  partially_paid: '#0EA5E9',
  sent: '#2F5D8F',
  overdue: '#EF4444',
  draft: '#F97316',
  cancelled: '#64748B',
};

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);
};

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  loading = false,
  error = null,
  onRetry,
  onSelectInvoice,
  onLogPayment,
  onClearFilters,
  onCopyPhone,
  totalCount,
  statusFilter,
  onStatusChange,
  stats,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };

  const sortedInvoices = useMemo(() => {
    if (!sortKey || !sortDirection) return invoices;

    return [...invoices].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'id':
          comparison = (a.id || '').localeCompare(b.id || '');
          break;
        case 'customer':
          comparison = (a.customer_name || '').localeCompare(b.customer_name || '');
          break;
        case 'amount':
          comparison = parseFloat(a.total_amount || '0') - parseFloat(b.total_amount || '0');
          break;
        case 'timeline':
          comparison = (a.due_date || a.issued_date || '').localeCompare(b.due_date || b.issued_date || '');
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [invoices, sortKey, sortDirection]);

  const statusCounts = {
    '': stats?.total ?? totalCount ?? invoices.length,
    paid: stats?.by_status?.paid ?? 0,
    partially_paid: stats?.by_status?.partially_paid ?? 0,
    sent: stats?.by_status?.sent ?? 0,
    overdue: stats?.by_status?.overdue ?? stats?.overdue ?? 0,
    draft: stats?.by_status?.draft ?? 0,
    cancelled: stats?.by_status?.cancelled ?? 0,
  };

  const columns: DataTableColumn<InvoiceListItem>[] = [
    {
      key: 'id',
      label: 'Invoice / Quote #',
      sortable: true,
      width: '145px',
      className: 'inv-col-id',
      render: (i) => (
        <div className="inv-id-container">
          <span className="inv-id-chip" title={`Invoice #${i.id}`}>
            <Receipt className="inv-id-icon" aria-hidden="true" />
            <span>#{i.id}</span>
          </span>
          <span className="inv-quote-ref" title={`Quote ${i.quotation_id || 'N/A'}`}>
            Quote: <span className="inv-quote-ref-code">{i.quotation_id || '—'}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      className: 'inv-col-customer',
      render: (i) => (
        <CustomerCell
          name={i.customer_name}
          phone={i.customer_phone}
          onCopyPhone={onCopyPhone}
        />
      ),
    },
    {
      key: 'amount',
      label: 'Total / Balance',
      sortable: true,
      width: '160px',
      className: 'inv-col-amount',
      render: (i) => {
        const balance = parseFloat(i.balance_due || '0');
        return (
          <div className="inv-amount-container">
            <span className="inv-amount-total">
              {formatCurrency(i.total_amount)}
            </span>
            {balance > 0 ? (
              <span className="inv-amount-due">
                Due: {formatCurrency(i.balance_due)}
              </span>
            ) : (
              <span className="inv-amount-paid-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                Paid in full
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'timeline',
      label: 'Timeline',
      sortable: true,
      width: '175px',
      className: 'inv-col-timeline',
      render: (i) => (
        <div className="inv-timeline-container">
          <div className="inv-timeline-row">
            <span className="inv-timeline-label">Issued:</span>
            <span className="inv-timeline-value">{i.issued_date || 'Unknown'}</span>
          </div>
          <div className="inv-timeline-row">
            <span className="inv-timeline-label">Due:</span>
            <span className="inv-timeline-value">{i.due_date || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      width: '168px',
      className: 'inv-col-status',
      headerAddonOnly: true,
      headerAddon: (
        <StatusHeaderFilter
          page="invoices"
          entityName="invoices"
          value={statusFilter}
          onChange={onStatusChange}
          counts={statusCounts}
        />
      ),
      render: (i) => (
        <StatusBadge
          status={i.status}
          label={i.status_display}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      width: '205px',
      className: 'inv-col-actions',
      render: (i) => (
        <div className="inv-actions-cell" onClick={(e) => e.stopPropagation()}>
          {i.status !== 'paid' && i.status !== 'cancelled' && (
            <button
              type="button"
              className="inv-payment-btn"
              onClick={() => onLogPayment(i.id)}
              aria-label={`Log payment for invoice #${i.id}`}
              title="Log Payment"
            >
              <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Log Payment</span>
            </button>
          )}

          <button
            type="button"
            className="inv-view-btn"
            onClick={() => onSelectInvoice(i)}
            aria-label={`View invoice #${i.id}`}
            title="View Invoice Details"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>View</span>
          </button>
        </div>
      ),
    },
  ];

  const renderSkeletonRow = (idx: number) => (
    <tr key={`inv-skeleton-${idx}`} className="apt-table-row">
      <td className="inv-col-id">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '85px', height: '26px', borderRadius: '8px' }} />
          <div className="apt-skeleton-block" style={{ width: '70px', height: '12px' }} />
        </div>
      </td>
      <td className="inv-col-customer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="apt-skeleton-block" style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="apt-skeleton-block" style={{ width: '130px', height: '14px' }} />
            <div className="apt-skeleton-block" style={{ width: '85px', height: '11px' }} />
          </div>
        </div>
      </td>
      <td className="inv-col-amount">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '100px', height: '18px' }} />
          <div className="apt-skeleton-block" style={{ width: '75px', height: '12px' }} />
        </div>
      </td>
      <td className="inv-col-timeline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '110px', height: '13px' }} />
          <div className="apt-skeleton-block" style={{ width: '95px', height: '13px' }} />
        </div>
      </td>
      <td className="inv-col-status">
        <div className="apt-skeleton-block" style={{ width: '90px', height: '24px', borderRadius: '999px' }} />
      </td>
      <td className="inv-col-actions text-right">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '90px', height: '34px', borderRadius: '10px' }} />
          <div className="apt-skeleton-block" style={{ width: '55px', height: '34px', borderRadius: '10px' }} />
        </div>
      </td>
    </tr>
  );

  const displayedCount = sortedInvoices.length;
  const grandTotal = totalCount !== undefined ? totalCount : displayedCount;

  const footer = (
    <div className="apt-footer-count">
      Showing <strong>{displayedCount}</strong> of <strong>{grandTotal}</strong> invoice{grandTotal === 1 ? '' : 's'}
    </div>
  );

  return (
    <DataTable<InvoiceListItem>
      columns={columns}
      data={sortedInvoices}
      keyExtractor={(i) => i.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={onSelectInvoice}
      rowStyle={(i) => {
        const accentColor = INVOICE_STATUS_ACCENT_COLORS[i.status] || '#94A3B8';
        return {
          ['--row-status-color' as any]: accentColor,
        };
      }}
      emptyTitle="No invoices found"
      emptyDescription="Try adjusting your search or filters to find what you're looking for."
      onClearFilters={onClearFilters}
      footer={footer}
      mobileToolbar={(
        <MobileStatusFilter
          page="invoices"
          entityName="invoices"
          value={statusFilter}
          onChange={onStatusChange}
          counts={statusCounts}
        />
      )}
      renderSkeletonRow={renderSkeletonRow}
      skeletonCount={6}
    />
  );
};

export default InvoiceTable;
