import React, { useState, useMemo } from 'react';
import { FileText, Eye } from 'lucide-react';
import type { QuotationListItem } from '../../types';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';
import { CustomerCell } from '../appointments/CustomerCell';
import './QuotationTable.css';

export interface QuotationTableProps {
  quotations: QuotationListItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectQuotation: (quotation: QuotationListItem) => void;
  onClearFilters?: () => void;
  onCopyPhone?: (phone: string) => void;
  totalCount?: number;
}

const QUOTATION_STATUS_ACCENT_COLORS: Record<string, string> = {
  accepted: '#10B981',
  sent: '#2F5D8F',
  pending: '#8B5CF6',
  draft: '#F97316',
  cancelled: '#EF4444',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day.toString().padStart(2, '0')} ${months[month]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: string | number): string {
  const val = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(isNaN(val) ? 0 : val);
}

export const QuotationTable: React.FC<QuotationTableProps> = ({
  quotations,
  loading = false,
  error = null,
  onRetry,
  onSelectQuotation,
  onClearFilters,
  onCopyPhone,
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

  const sortedQuotations = useMemo(() => {
    if (!sortKey || !sortDirection) return quotations;

    return [...quotations].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'id':
          comparison = (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
          break;
        case 'customer':
          comparison = (a.customer_name || '').localeCompare(b.customer_name || '');
          break;
        case 'amount':
          comparison = parseFloat(a.total || '0') - parseFloat(b.total || '0');
          break;
        case 'dates': {
          const tA = new Date(a.created_at || a.issued_date || '').getTime();
          const tB = new Date(b.created_at || b.issued_date || '').getTime();
          comparison = (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
          break;
        }
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [quotations, sortKey, sortDirection]);

  const columns: DataTableColumn<QuotationListItem>[] = [
    {
      key: 'id',
      label: 'Quote #',
      sortable: true,
      width: '135px',
      className: 'qt-col-id',
      render: (q) => (
        <span className="quote-id-chip" title={`Quotation ${q.id}`}>
          <FileText className="quote-id-icon" aria-hidden="true" />
          <span>{q.id}</span>
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      className: 'qt-col-customer',
      render: (q) => (
        <CustomerCell
          name={q.customer_name}
          phone={q.customer_phone}
          onCopyPhone={onCopyPhone}
        />
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      width: '145px',
      className: 'qt-col-amount',
      render: (q) => (
        <div className="quote-amount-cell">
          <span className="quote-amount-val">{formatCurrency(q.total)}</span>
          {q.quote_type && (
            <span className="quote-type-pill">{q.quote_type.toUpperCase()}</span>
          )}
        </div>
      ),
    },
    {
      key: 'dates',
      label: 'Dates',
      sortable: true,
      width: '185px',
      className: 'qt-col-dates',
      render: (q) => (
        <div className="quote-dates-cell">
          <div className="quote-date-row">
            <span className="quote-date-label">Created:</span>
            <span className="quote-date-value">
              {formatDate(q.created_at || q.issued_date)}
            </span>
          </div>
          <div className="quote-date-row">
            <span className="quote-date-label">Valid Till:</span>
            <span className="quote-date-value-muted">
              {q.valid_until ? formatDate(q.valid_until) : 'N/A'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '135px',
      className: 'qt-col-status',
      render: (q) => <StatusBadge status={q.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      width: '145px',
      className: 'qt-col-actions',
      render: (q) => (
        <div className="quote-actions-cell" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="quote-view-btn"
            onClick={() => onSelectQuotation(q)}
            aria-label={`View details of quotation ${q.id}`}
            title="View Details"
          >
            <Eye className="quote-view-icon" aria-hidden="true" />
            <span className="quote-view-label">View Details</span>
          </button>
        </div>
      ),
    },
  ];

  const renderSkeletonRow = (idx: number) => (
    <tr key={`qt-skeleton-${idx}`} className="apt-table-row">
      <td className="qt-col-id">
        <div className="apt-skeleton-block" style={{ width: '85px', height: '26px', borderRadius: '8px' }} />
      </td>
      <td className="qt-col-customer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="apt-skeleton-block" style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="apt-skeleton-block" style={{ width: '130px', height: '14px' }} />
            <div className="apt-skeleton-block" style={{ width: '85px', height: '11px' }} />
          </div>
        </div>
      </td>
      <td className="qt-col-amount">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '90px', height: '16px' }} />
          <div className="apt-skeleton-block" style={{ width: '40px', height: '12px', borderRadius: '4px' }} />
        </div>
      </td>
      <td className="qt-col-dates">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '120px', height: '13px' }} />
          <div className="apt-skeleton-block" style={{ width: '110px', height: '13px' }} />
        </div>
      </td>
      <td className="qt-col-status">
        <div className="apt-skeleton-block" style={{ width: '84px', height: '24px', borderRadius: '999px' }} />
      </td>
      <td className="qt-col-actions text-right">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div className="apt-skeleton-block" style={{ width: '100px', height: '34px', borderRadius: '10px' }} />
        </div>
      </td>
    </tr>
  );

  const displayedCount = sortedQuotations.length;
  const grandTotal = totalCount !== undefined ? totalCount : displayedCount;

  const footer = (
    <div className="apt-footer-count">
      Showing <strong>{displayedCount}</strong> of <strong>{grandTotal}</strong> quotation{grandTotal === 1 ? '' : 's'}
    </div>
  );

  return (
    <DataTable<QuotationListItem>
      columns={columns}
      data={sortedQuotations}
      keyExtractor={(q) => q.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={onSelectQuotation}
      rowStyle={(q) => {
        const accentColor = QUOTATION_STATUS_ACCENT_COLORS[q.status] || '#94A3B8';
        return {
          ['--row-status-color' as any]: accentColor,
        };
      }}
      emptyTitle="No quotations found"
      emptyDescription="Try adjusting your search or filters to find what you're looking for."
      onClearFilters={onClearFilters}
      footer={footer}
      renderSkeletonRow={renderSkeletonRow}
      skeletonCount={6}
    />
  );
};

export default QuotationTable;
