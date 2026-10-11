import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Receipt, 
  Eye, 
  Landmark, 
  Banknote, 
  FileCheck,
  ArrowDownLeft
} from 'lucide-react';
import type { Payment, PaymentMethod } from '../../types';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import './PaymentTable.css';

export interface PaymentTableProps {
  payments: Payment[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectPayment: (payment: Payment) => void;
  onViewInvoice: (invoiceId: string) => void;
  onClearFilters?: () => void;
  totalCount?: number;
}

const PAYMENT_METHOD_ACCENT_COLORS: Record<string, string> = {
  bank_transfer: '#2F5D8F',
  card: '#10B981',
  cash: '#F59E0B',
  cheque: '#8B5CF6',
};

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(num || 0);
};

const renderMethodBadge = (method: PaymentMethod | string) => {
  switch (method) {
    case 'bank_transfer':
      return (
        <span className="pay-method-badge pay-method-bank_transfer">
          <Landmark className="pay-method-icon" aria-hidden="true" />
          <span>Bank Transfer</span>
        </span>
      );
    case 'card':
      return (
        <span className="pay-method-badge pay-method-card">
          <CreditCard className="pay-method-icon" aria-hidden="true" />
          <span>Card</span>
        </span>
      );
    case 'cash':
      return (
        <span className="pay-method-badge pay-method-cash">
          <Banknote className="pay-method-icon" aria-hidden="true" />
          <span>Cash</span>
        </span>
      );
    case 'cheque':
      return (
        <span className="pay-method-badge pay-method-cheque">
          <FileCheck className="pay-method-icon" aria-hidden="true" />
          <span>Cheque</span>
        </span>
      );
    default:
      return (
        <span className="pay-method-badge pay-method-bank_transfer">
          <Receipt className="pay-method-icon" aria-hidden="true" />
          <span>{(method || '').replace('_', ' ')}</span>
        </span>
      );
  }
};

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  loading = false,
  error = null,
  onRetry,
  onSelectPayment,
  onViewInvoice,
  onClearFilters,
  totalCount,
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

  const sortedPayments = useMemo(() => {
    if (!sortKey || !sortDirection) return payments;

    return [...payments].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'id':
          comparison = Number(a.id) - Number(b.id);
          break;
        case 'invoice': {
          const invA = a.invoice_number || a.invoice || '';
          const invB = b.invoice_number || b.invoice || '';
          comparison = invA.localeCompare(invB);
          break;
        }
        case 'amount':
          comparison = parseFloat(a.amount || '0') - parseFloat(b.amount || '0');
          break;
        case 'method':
          comparison = (a.method || '').localeCompare(b.method || '');
          break;
        case 'date':
          comparison = (a.payment_date || '').localeCompare(b.payment_date || '');
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [payments, sortKey, sortDirection]);

  const columns: DataTableColumn<Payment>[] = [
    {
      key: 'id',
      label: 'Payment ID',
      sortable: true,
      width: '125px',
      className: 'pay-col-id',
      render: (p) => (
        <span className="pay-id-chip" title={`Payment #${p.id}`}>
          <CreditCard className="pay-id-icon" aria-hidden="true" />
          <span>#{p.id}</span>
        </span>
      ),
    },
    {
      key: 'invoice',
      label: 'Invoice / Ref',
      sortable: true,
      width: '165px',
      className: 'pay-col-invoice',
      render: (p) => {
        const invId = p.invoice_number || p.invoice || 'N/A';
        return (
          <div className="pay-inv-container">
            <button
              type="button"
              className="pay-inv-chip"
              onClick={(e) => {
                e.stopPropagation();
                onViewInvoice(invId);
              }}
              title={`View invoice #${invId}`}
            >
              <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
              <span>#{invId}</span>
            </button>
            <span className="pay-ref-text" title={`Reference: ${p.reference || 'N/A'}`}>
              Ref: <span className="pay-ref-val">{p.reference || '—'}</span>
            </span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount Paid',
      sortable: true,
      width: '155px',
      className: 'pay-col-amount',
      render: (p) => (
        <div className="pay-amount-cell">
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          <span className="pay-amount-val">
            {formatCurrency(p.amount)}
          </span>
        </div>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      sortable: true,
      width: '155px',
      className: 'pay-col-method',
      render: (p) => renderMethodBadge(p.method),
    },
    {
      key: 'date',
      label: 'Details',
      sortable: true,
      className: 'pay-col-details',
      render: (p) => (
        <div className="pay-details-container">
          <div className="pay-details-row">
            <span className="pay-details-label">Date:</span>
            <span className="pay-details-value">{p.payment_date || '—'}</span>
          </div>
          <div className="pay-details-row">
            <span className="pay-details-label">By:</span>
            <span className="pay-details-value">{p.created_by_name || 'System'}</span>
          </div>
          {p.notes && (
            <span className="pay-notes-tooltip" title={p.notes}>
              Note: {p.notes}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      width: '160px',
      className: 'pay-col-actions',
      render: (p) => (
        <div className="pay-actions-cell" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="pay-view-btn"
            onClick={() => onViewInvoice(p.invoice_number || p.invoice)}
            aria-label={`View invoice for payment #${p.id}`}
            title="View Invoice"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>View Invoice</span>
          </button>
        </div>
      ),
    },
  ];

  const renderSkeletonRow = (idx: number) => (
    <tr key={`pay-skeleton-${idx}`} className="apt-table-row">
      <td className="pay-col-id">
        <div className="apt-skeleton-block" style={{ width: '75px', height: '26px', borderRadius: '8px' }} />
      </td>
      <td className="pay-col-invoice">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '85px', height: '22px', borderRadius: '6px' }} />
          <div className="apt-skeleton-block" style={{ width: '70px', height: '12px' }} />
        </div>
      </td>
      <td className="pay-col-amount">
        <div className="apt-skeleton-block" style={{ width: '105px', height: '18px' }} />
      </td>
      <td className="pay-col-method">
        <div className="apt-skeleton-block" style={{ width: '95px', height: '24px', borderRadius: '999px' }} />
      </td>
      <td className="pay-col-details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '110px', height: '13px' }} />
          <div className="apt-skeleton-block" style={{ width: '90px', height: '13px' }} />
        </div>
      </td>
      <td className="pay-col-actions text-right">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div className="apt-skeleton-block" style={{ width: '105px', height: '34px', borderRadius: '10px' }} />
        </div>
      </td>
    </tr>
  );

  const displayedCount = sortedPayments.length;
  const grandTotal = totalCount !== undefined ? totalCount : displayedCount;

  const footer = (
    <div className="apt-footer-count">
      Showing <strong>{displayedCount}</strong> of <strong>{grandTotal}</strong> payment{grandTotal === 1 ? '' : 's'}
    </div>
  );

  return (
    <DataTable<Payment>
      columns={columns}
      data={sortedPayments}
      keyExtractor={(p) => p.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={(p) => onSelectPayment(p)}
      rowStyle={(p) => {
        const accentColor = PAYMENT_METHOD_ACCENT_COLORS[p.method] || '#94A3B8';
        return {
          ['--row-status-color' as any]: accentColor,
        };
      }}
      emptyTitle="No payments found"
      emptyDescription="Try adjusting your search query or method filter."
      onClearFilters={onClearFilters}
      footer={footer}
      renderSkeletonRow={renderSkeletonRow}
      skeletonCount={6}
    />
  );
};

export default PaymentTable;
