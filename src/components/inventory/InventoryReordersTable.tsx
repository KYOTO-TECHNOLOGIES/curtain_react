import React, { useState, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCw,
} from 'lucide-react';
import type { ReorderRequest, ReorderStatus } from '../../types';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import './InventoryTable.css';

interface InventoryReordersTableProps {
  reorders: ReorderRequest[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onUpdateStatus: (reorder: ReorderRequest, status: ReorderStatus) => void;
  onClearFilters?: () => void;
}

const REORDER_STATUS_MAP: Record<
  ReorderStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: 'Pending Approval', bg: '#FEF3C7', text: '#92400E', icon: Clock },
  ordered: { label: 'PO Placed / Ordered', bg: '#E0F2FE', text: '#0369A1', icon: RotateCw },
  received: { label: 'Stock Received', bg: '#E8F8F2', text: '#065F46', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B', icon: XCircle },
};

function formatQty(qty: number | string): string {
  const num = typeof qty === 'string' ? parseFloat(qty || '0') : qty;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export const InventoryReordersTable: React.FC<InventoryReordersTableProps> = ({
  reorders,
  loading = false,
  error = null,
  onRetry,
  onUpdateStatus,
  onClearFilters,
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

  const sortedReorders = useMemo(() => {
    if (!sortKey || !sortDirection) return reorders;

    return [...reorders].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'item':
          comparison = (a.item_sku || '').localeCompare(b.item_sku || '');
          break;
        case 'quantity':
          comparison = parseFloat(a.quantity || '0') - parseFloat(b.quantity || '0');
          break;
        case 'supplier':
          comparison = (a.supplier_name || '').localeCompare(b.supplier_name || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'date': {
          const tA = new Date(a.created_at || '').getTime();
          const tB = new Date(b.created_at || '').getTime();
          comparison = (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
          break;
        }
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [reorders, sortKey, sortDirection]);

  const columns: DataTableColumn<ReorderRequest>[] = [
    {
      key: 'item',
      label: 'Stock Item',
      sortable: true,
      className: 'inv-col-item',
      render: (r) => (
        <div className="flex items-center gap-3 py-1">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 flex-shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inv-sku-chip">{r.item_sku}</span>
              <span className="text-[11px] font-semibold text-slate-400">
                #{r.id}
              </span>
            </div>
            <p className="text-[13px] font-bold text-slate-900 mt-1 truncate max-w-[200px]" title={r.item_name}>
              {r.item_name}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Order Qty',
      sortable: true,
      width: '130px',
      render: (r) => (
        <div>
          <span className="text-base font-extrabold text-slate-900 font-mono">
            {formatQty(r.quantity)}
          </span>
        </div>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: true,
      width: '180px',
      render: (r) => (
        <span className="text-[13px] font-semibold text-slate-700 truncate block">
          {r.supplier_name || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '180px',
      render: (r) => {
        const config = REORDER_STATUS_MAP[r.status] || REORDER_STATUS_MAP.pending;
        const Icon = config.icon;
        return (
          <span
            className="inv-status-chip"
            style={{ backgroundColor: config.bg, color: config.text }}
          >
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span>{config.label}</span>
          </span>
        );
      },
    },
    {
      key: 'date',
      label: 'Timestamps',
      sortable: true,
      width: '160px',
      render: (r) => (
        <div className="flex flex-col text-xs gap-0.5">
          <span className="font-semibold text-slate-700">
            Created: {formatDate(r.created_at)}
          </span>
          {r.ordered_at && (
            <span className="text-slate-500">
              Ordered: {formatDate(r.ordered_at)}
            </span>
          )}
          {r.received_at && (
            <span className="text-emerald-700 font-semibold">
              Received: {formatDate(r.received_at)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Update Status',
      width: '210px',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {r.status === 'pending' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(r, 'ordered')}
              className="px-2.5 py-1 text-xs font-bold text-white bg-[#2F5D8F] rounded-lg hover:bg-[#254A73] transition-colors shadow-sm"
            >
              Place Order
            </button>
          )}

          {r.status === 'ordered' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(r, 'received')}
              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Mark Received
            </button>
          )}

          {(r.status === 'pending' || r.status === 'ordered') && (
            <button
              type="button"
              onClick={() => onUpdateStatus(r, 'cancelled')}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}

          {(r.status === 'received' || r.status === 'cancelled') && (
            <span className="text-xs font-medium text-slate-400 italic">
              Completed
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sortedReorders}
      keyExtractor={(r) => r.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      emptyTitle="No reorder requests found"
      emptyDescription="Create a reorder request when items run low or place orders from low stock."
      onClearFilters={onClearFilters}
      rowStyle={(r) => ({
        '--row-status-color':
          r.status === 'received'
            ? '#10B981'
            : r.status === 'ordered'
            ? '#0EA5E9'
            : r.status === 'cancelled'
            ? '#EF4444'
            : '#F59E0B',
      } as React.CSSProperties)}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="apt-footer-count">
            Total <strong>{sortedReorders.length}</strong> reorder requests
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Update procurement pipeline status in 1-click
          </span>
        </div>
      }
    />
  );
};

export default InventoryReordersTable;
