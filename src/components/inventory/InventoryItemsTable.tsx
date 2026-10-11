import React, { useState, useMemo } from 'react';
import {
  Warehouse,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Truck,
  MapPin,
  Copy,
  Check,
} from 'lucide-react';
import type { InventoryItem } from '../../types';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import './InventoryTable.css';

interface InventoryItemsTableProps {
  items: InventoryItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAdjustStock: (item: InventoryItem) => void;
  onReorder: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  onClearFilters?: () => void;
  totalCount?: number;
}

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  fabric: { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1', label: 'Fabric' },
  track: { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', label: 'Track' },
  motor: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Motor' },
  accessory: { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Accessory' },
  other: { bg: '#F1F5F9', text: '#475569', dot: '#64748B', label: 'Other' },
};

function formatQty(qty: number | string): string {
  const num = typeof qty === 'string' ? parseFloat(qty || '0') : qty;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatAED(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

export const InventoryItemsTable: React.FC<InventoryItemsTableProps> = ({
  items,
  loading = false,
  error = null,
  onRetry,
  onAdjustStock,
  onReorder,
  onEditItem,
  onDeleteItem,
  onClearFilters,
  totalCount,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

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

  const sortedItems = useMemo(() => {
    if (!sortKey || !sortDirection) return items;

    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'sku':
          comparison = a.sku.localeCompare(b.sku, undefined, { numeric: true });
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'stock': {
          const qtyA = parseFloat(a.quantity_on_hand || '0');
          const qtyB = parseFloat(b.quantity_on_hand || '0');
          comparison = qtyA - qtyB;
          break;
        }
        case 'value': {
          const valA = parseFloat(a.stock_value || '0');
          const valB = parseFloat(b.stock_value || '0');
          comparison = valA - valB;
          break;
        }
        case 'supplier': {
          const sA = a.supplier_name || '';
          const sB = b.supplier_name || '';
          comparison = sA.localeCompare(sB);
          break;
        }
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortKey, sortDirection]);

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      key: 'sku',
      label: 'Item & SKU',
      sortable: true,
      width: '260px',
      render: (item) => {
        const isCopied = copiedSku === item.sku;
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="p-2.5 rounded-xl bg-[#2F5D8F]/10 flex-shrink-0 text-[#2F5D8F]">
              <Warehouse className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inv-sku-chip" title={item.sku}>
                  <span>{item.sku}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopySku(item.sku, e)}
                    className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Copy SKU"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </span>
                {item.location && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[80px]">{item.location}</span>
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-slate-900 mt-1 truncate max-w-[210px]" title={item.name}>
                {item.name}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      width: '130px',
      render: (item) => {
        const config = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.other;
        return (
          <span
            className="inv-category-pill"
            style={{ backgroundColor: config.bg, color: config.text }}
          >
            <span
              className="inv-cat-dot"
              style={{ backgroundColor: config.dot }}
              aria-hidden="true"
            />
            <span>{config.label}</span>
          </span>
        );
      },
    },
    {
      key: 'stock',
      label: 'Stock Health',
      sortable: true,
      width: '210px',
      render: (item) => {
        const onHand = parseFloat(item.quantity_on_hand || '0');
        const reorderLevel = parseFloat(item.reorder_level || '0');
        const isOut = onHand <= 0;
        const isLow = item.is_low_stock || onHand <= reorderLevel;

        // Health percentage bar: if reorderLevel is 0, base on onHand
        const denom = reorderLevel > 0 ? reorderLevel * 2 : Math.max(onHand, 10);
        const percent = Math.min(Math.max((onHand / denom) * 100, 4), 100);

        return (
          <div className="inv-health-cell">
            <div className="inv-health-header">
              <div>
                <span className={`inv-qty-primary ${isOut ? 'is-out' : isLow ? 'is-low' : ''}`}>
                  {formatQty(onHand)}
                </span>
                <span className="inv-qty-unit">{item.unit}</span>
              </div>
              <span className="inv-reorder-threshold" title={`Reorder threshold: ${formatQty(reorderLevel)} ${item.unit}`}>
                Min: {formatQty(reorderLevel)}
              </span>
            </div>

            <div className="inv-progress-track">
              <div
                className={`inv-progress-bar ${isOut ? 'is-out' : isLow ? 'is-low' : 'is-healthy'}`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10.5px] mt-0.5">
              {isOut ? (
                <span className="font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  Out of Stock
                </span>
              ) : isLow ? (
                <span className="font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  Low Stock Alert
                </span>
              ) : (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Optimal Level
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'value',
      label: 'Cost & Value',
      sortable: true,
      width: '160px',
      render: (item) => {
        const val = parseFloat(item.stock_value || '0');
        const unitCost = parseFloat(item.unit_cost || '0');
        return (
          <div className="inv-currency-cell">
            <span className="inv-currency-val">{formatAED(val)}</span>
            <span className="inv-currency-sub" title="Unit Cost">
              {formatAED(unitCost)} / {item.unit}
            </span>
          </div>
        );
      },
    },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: true,
      width: '170px',
      render: (item) => {
        if (!item.supplier_name) {
          return <span className="text-slate-400 text-xs">—</span>;
        }
        const initials = item.supplier_name.slice(0, 2).toUpperCase();
        return (
          <div className="inv-supplier-chip" title={item.supplier_name}>
            <span className="inv-supplier-avatar">{initials}</span>
            <span className="truncate max-w-[125px]">{item.supplier_name}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '180px',
      align: 'right',
      render: (item) => (
        <div className="inv-action-group" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onAdjustStock(item)}
            className="inv-action-btn-pill inv-action-btn-adjust"
            title="Adjust stock quantity"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </button>
          <button
            type="button"
            onClick={() => onReorder(item)}
            className="inv-action-btn-pill inv-action-btn-reorder"
            title="Create reorder request"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Reorder</span>
          </button>
          <button
            type="button"
            onClick={() => onEditItem(item)}
            className="inv-icon-btn"
            title="Edit item details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteItem(item)}
            className="inv-icon-btn is-delete"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sortedItems}
      keyExtractor={(item) => item.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={(item) => onAdjustStock(item)}
      emptyTitle="No inventory items found"
      emptyDescription="Try clearing filters or search to view textile stocks, or create a new item."
      onClearFilters={onClearFilters}
      rowStyle={(item) => ({
        // Dynamic left accent bar on hover
        '--row-status-color':
          parseFloat(item.quantity_on_hand || '0') <= 0
            ? '#EF4444'
            : item.is_low_stock
            ? '#F59E0B'
            : '#10B981',
      } as React.CSSProperties)}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="apt-footer-count">
            Showing <strong>{sortedItems.length}</strong> of <strong>{totalCount ?? sortedItems.length}</strong> items
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click row to adjust stock level
          </span>
        </div>
      }
    />
  );
};

export default InventoryItemsTable;
