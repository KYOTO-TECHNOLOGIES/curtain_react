import React, { useState, useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import type { StockMovement } from '../../types';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import './InventoryTable.css';

interface InventoryMovementsTableProps {
  movements: StockMovement[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClearFilters?: () => void;
}

function formatQty(qty: number | string): string {
  const num = typeof qty === 'string' ? parseFloat(qty || '0') : qty;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export const InventoryMovementsTable: React.FC<InventoryMovementsTableProps> = ({
  movements,
  loading = false,
  error = null,
  onRetry,
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

  const sortedMovements = useMemo(() => {
    if (!sortKey || !sortDirection) return movements;

    return [...movements].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'date': {
          const tA = new Date(a.created_at).getTime();
          const tB = new Date(b.created_at).getTime();
          comparison = (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
          break;
        }
        case 'item':
          comparison = (a.item_sku || '').localeCompare(b.item_sku || '');
          break;
        case 'type':
          comparison = a.movement_type.localeCompare(b.movement_type);
          break;
        case 'quantity':
          comparison = parseFloat(a.quantity || '0') - parseFloat(b.quantity || '0');
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [movements, sortKey, sortDirection]);

  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: 'date',
      label: 'Timestamp',
      sortable: true,
      width: '180px',
      render: (m) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-700 font-mono">
            {formatDateTime(m.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'item',
      label: 'Stock Item',
      sortable: true,
      width: '260px',
      render: (m) => (
        <div className="flex items-center gap-2 py-1">
          <span className="inv-sku-chip">{m.item_sku}</span>
          <span className="text-[13px] font-bold text-slate-900 truncate" title={m.item_name}>
            {m.item_name}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Movement Type',
      sortable: true,
      width: '160px',
      render: (m) => {
        if (m.movement_type === 'in') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-50 text-emerald-700">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Stock In (+)</span>
            </span>
          );
        }
        if (m.movement_type === 'out') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-50 text-rose-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Stock Out (−)</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-slate-100 text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Set Exact Qty</span>
          </span>
        );
      },
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      width: '130px',
      render: (m) => {
        const isPositive = m.movement_type === 'in';
        const isNegative = m.movement_type === 'out';
        return (
          <span
            className={`text-sm font-extrabold font-mono ${
              isPositive ? 'text-emerald-700' : isNegative ? 'text-rose-700' : 'text-slate-800'
            }`}
          >
            {isPositive ? '+' : isNegative ? '−' : ''}
            {formatQty(m.quantity)}
          </span>
        );
      },
    },
    {
      key: 'reference',
      label: 'Reference / Note',
      width: '200px',
      render: (m) => (
        <div className="flex flex-col text-xs">
          {m.reference && (
            <span className="font-bold text-slate-800 truncate" title={m.reference}>
              {m.reference}
            </span>
          )}
          {m.notes && (
            <span className="text-slate-500 truncate" title={m.notes}>
              {m.notes}
            </span>
          )}
          {!m.reference && !m.notes && <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Logged By',
      width: '150px',
      render: (m) => (
        <span className="text-xs font-semibold text-slate-600 truncate block">
          {m.created_by_name || 'System Auto'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sortedMovements}
      keyExtractor={(m) => m.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      emptyTitle="No stock movements recorded"
      emptyDescription="Stock adjustments and incoming deliveries will automatically be logged here."
      onClearFilters={onClearFilters}
      rowStyle={(m) => ({
        '--row-status-color':
          m.movement_type === 'in' ? '#10B981' : m.movement_type === 'out' ? '#EF4444' : '#64748B',
      } as React.CSSProperties)}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="apt-footer-count">
            Total <strong>{sortedMovements.length}</strong> movements logged
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Immutable audit record of all physical warehouse events
          </span>
        </div>
      }
    />
  );
};

export default InventoryMovementsTable;
