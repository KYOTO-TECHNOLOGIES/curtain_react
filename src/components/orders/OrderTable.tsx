import React, { useState, useMemo } from 'react';
import { Package, Eye, Clock, Receipt, FileText } from 'lucide-react';
import type { OrderListItem, OrderStats } from '../../types';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import { StatusHeaderFilter } from '../ui/StatusHeaderFilter';
import { MobileStatusFilter } from '../ui/MobileStatusFilter';
import { StatusBadge } from '../ui/StatusBadge';
import { CustomerCell } from '../appointments/CustomerCell';
import './OrderTable.css';

export interface OrderTableProps {
  orders: OrderListItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectOrder: (order: OrderListItem) => void;
  onGenerateInvoice: (orderId: number) => void;
  onClearFilters?: () => void;
  onCopyPhone?: (phone: string) => void;
  totalCount?: number;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  stats?: OrderStats | null;
}

const ORDER_STATUS_ACCENT_COLORS: Record<string, string> = {
  pending_production: '#F97316',
  in_production: '#0EA5E9',
  shipped: '#8B5CF6',
  installed: '#10B981',
  closed: '#64748B',
  cancelled: '#EF4444',
};

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  loading = false,
  error = null,
  onRetry,
  onSelectOrder,
  onGenerateInvoice,
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

  const sortedOrders = useMemo(() => {
    if (!sortKey || !sortDirection) return orders;

    return [...orders].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'id':
          comparison = Number(a.id) - Number(b.id);
          break;
        case 'customer':
          comparison = (a.customer_name || '').localeCompare(b.customer_name || '');
          break;
        case 'quote':
          comparison = (a.quotation_id || '').localeCompare(b.quotation_id || '');
          break;
        case 'production':
          comparison = (a.estimated_production_days || 0) - (b.estimated_production_days || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [orders, sortKey, sortDirection]);

  const statusCounts = {
    '': stats?.total ?? totalCount ?? orders.length,
    pending_production: stats?.by_status?.pending_production ?? stats?.pending_production ?? 0,
    in_production: stats?.by_status?.in_production ?? stats?.in_production ?? 0,
    shipped: stats?.by_status?.shipped ?? stats?.shipped ?? 0,
    installed: stats?.by_status?.installed ?? stats?.installed ?? 0,
    closed: stats?.by_status?.closed ?? stats?.closed ?? 0,
    cancelled: stats?.by_status?.cancelled ?? 0,
  };

  const columns: DataTableColumn<OrderListItem>[] = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      size: 'fit',
      className: 'ord-col-id',
      render: (o) => (
        <span className="order-id-chip" title={`Order #${o.id}`}>
          <Package className="order-id-icon" aria-hidden="true" />
          <span>#{o.id}</span>
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      size: 'flex',
      className: 'ord-col-customer',
      render: (o) => (
        <CustomerCell
          name={o.customer_name}
          phone={o.customer_phone}
          onCopyPhone={onCopyPhone}
        />
      ),
    },
    {
      key: 'quote',
      label: 'Quote #',
      sortable: true,
      size: 'fit',
      className: 'ord-col-quote',
      render: (o) => (
        <span className="order-quote-chip" title={`Quote ${o.quotation_id || o.quotation}`}>
          <FileText className="w-3 h-3 text-slate-400" aria-hidden="true" />
          <span>{o.quotation_id || o.quotation || '—'}</span>
        </span>
      ),
    },
    {
      key: 'production',
      label: 'Est. Production',
      sortable: true,
      size: 'fit',
      className: 'ord-col-prod',
      render: (o) => (
        <div className="order-prod-cell">
          <Clock className="order-prod-icon" aria-hidden="true" />
          <span className="order-prod-days">
            {o.estimated_production_days ? `${o.estimated_production_days} days` : '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      size: 'fit',
      className: 'ord-col-status',
      headerAddonOnly: true,
      headerAddon: (
        <StatusHeaderFilter
          page="orders"
          entityName="orders"
          value={statusFilter}
          onChange={onStatusChange}
          counts={statusCounts}
        />
      ),
      render: (o) => <StatusBadge status={o.order_status} />,
    },
    {
      key: 'invoice',
      label: 'Invoice',
      sortable: false,
      size: 'fit',
      className: 'ord-col-invoice',
      render: (o) =>
        o.invoice_id ? (
          <span className="order-invoice-pill" title={`Invoice ${o.invoice_id}`}>
            <Receipt className="w-3 h-3 text-emerald-600" aria-hidden="true" />
            <span>#{o.invoice_id}</span>
          </span>
        ) : (
          <span className="order-no-invoice">Uninvoiced</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      size: 'fit',
      className: 'ord-col-actions',
      render: (o) => (
        <div className="order-actions-cell" onClick={(e) => e.stopPropagation()}>
          {!o.invoice_id && (
            <button
              type="button"
              className="order-inv-btn"
              onClick={() => onGenerateInvoice(o.id)}
              aria-label={`Generate invoice for order #${o.id}`}
              title="Generate Invoice"
            >
              <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="order-btn-label">Invoice</span>
            </button>
          )}

          <button
            type="button"
            className="order-view-btn"
            onClick={() => onSelectOrder(o)}
            aria-label={`View order #${o.id}`}
            title="View Order Details"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="order-btn-label">View</span>
          </button>
        </div>
      ),
    },
  ];

  const renderSkeletonRow = (idx: number) => (
    <tr key={`ord-skeleton-${idx}`} className="apt-table-row">
      <td className="ord-col-id dt-col-fit">
        <div className="apt-skeleton-block" style={{ width: '80px', height: '26px', borderRadius: '8px' }} />
      </td>
      <td className="ord-col-customer dt-col-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="apt-skeleton-block" style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="apt-skeleton-block" style={{ width: '130px', height: '14px' }} />
            <div className="apt-skeleton-block" style={{ width: '85px', height: '11px' }} />
          </div>
        </div>
      </td>
      <td className="ord-col-quote dt-col-fit">
        <div className="apt-skeleton-block" style={{ width: '85px', height: '22px', borderRadius: '6px' }} />
      </td>
      <td className="ord-col-prod dt-col-fit">
        <div className="apt-skeleton-block" style={{ width: '75px', height: '15px' }} />
      </td>
      <td className="ord-col-status dt-col-fit">
        <div className="apt-skeleton-block" style={{ width: '90px', height: '24px', borderRadius: '999px' }} />
      </td>
      <td className="ord-col-invoice dt-col-fit">
        <div className="apt-skeleton-block" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
      </td>
      <td className="ord-col-actions dt-col-fit dt-col-actions text-right">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <div className="apt-skeleton-block" style={{ width: '65px', height: '34px', borderRadius: '10px' }} />
          <div className="apt-skeleton-block" style={{ width: '55px', height: '34px', borderRadius: '10px' }} />
        </div>
      </td>
    </tr>
  );

  const displayedCount = sortedOrders.length;
  const grandTotal = totalCount !== undefined ? totalCount : displayedCount;

  const footer = (
    <div className="apt-footer-count">
      Showing <strong>{displayedCount}</strong> of <strong>{grandTotal}</strong> order{grandTotal === 1 ? '' : 's'}
    </div>
  );

  return (
    <DataTable<OrderListItem>
      columns={columns}
      data={sortedOrders}
      keyExtractor={(o) => o.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={onSelectOrder}
      rowStyle={(o) => {
        const accentColor = ORDER_STATUS_ACCENT_COLORS[o.order_status] || '#94A3B8';
        return {
          ['--row-status-color' as any]: accentColor,
        };
      }}
      emptyTitle="No orders found"
      emptyDescription="Try adjusting your search or filters to find what you're looking for."
      onClearFilters={onClearFilters}
      footer={footer}
      mobileToolbar={(
        <MobileStatusFilter
          page="orders"
          entityName="orders"
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

export default OrderTable;
