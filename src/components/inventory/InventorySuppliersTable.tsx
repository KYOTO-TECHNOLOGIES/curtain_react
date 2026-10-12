import React, { useState, useMemo } from 'react';
import {
  Building2,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Package,
} from 'lucide-react';
import type { Supplier } from '../../types';
import { DataTable, type DataTableColumn, type SortDirection } from '../ui/DataTable';
import './InventoryTable.css';

interface InventorySuppliersTableProps {
  suppliers: Supplier[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplier: Supplier) => void;
  onClearFilters?: () => void;
  totalCount?: number;
}

export const InventorySuppliersTable: React.FC<InventorySuppliersTableProps> = ({
  suppliers,
  loading = false,
  error = null,
  onRetry,
  onEditSupplier,
  onDeleteSupplier,
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

  const sortedSuppliers = useMemo(() => {
    if (!sortKey || !sortDirection) return suppliers;

    return [...suppliers].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'contact_person':
          comparison = (a.contact_person || '').localeCompare(b.contact_person || '');
          break;
        case 'items_count':
          comparison = (a.items_count || 0) - (b.items_count || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [suppliers, sortKey, sortDirection]);

  const columns: DataTableColumn<Supplier>[] = [
    {
      key: 'name',
      label: 'Supplier Company',
      sortable: true,
      className: 'inv-col-supplier',
      render: (s) => (
        <div className="flex items-center gap-3 py-1">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-slate-900 truncate" title={s.name}>
              {s.name}
            </p>
            {s.address && (
              <p className="text-xs text-slate-400 truncate max-w-[200px]" title={s.address}>
                {s.address}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact_person',
      label: 'Contact Person',
      sortable: true,
      width: '180px',
      render: (s) => (
        <div>
          <span className="text-[13px] font-semibold text-slate-800">
            {s.contact_person || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'contact_methods',
      label: 'Contact Info',
      width: '220px',
      render: (s) => (
        <div className="flex flex-col gap-1 text-xs">
          {s.email && (
            <a
              href={`mailto:${s.email}`}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#2F5D8F] transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{s.email}</span>
            </a>
          )}
          {s.phone && (
            <a
              href={`tel:${s.phone}`}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#2F5D8F] transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{s.phone}</span>
            </a>
          )}
          {!s.email && !s.phone && <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: 'items_count',
      label: 'Catalog Items',
      sortable: true,
      width: '140px',
      render: (s) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
          <Package className="w-3.5 h-3.5 text-slate-500" />
          <span>{s.items_count ?? 0} items</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      align: 'right',
      render: (s) => (
        <div className="inv-action-group" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEditSupplier(s)}
            className="inv-icon-btn"
            title="Edit supplier"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSupplier(s)}
            className="inv-icon-btn is-delete"
            title="Delete supplier"
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
      data={sortedSuppliers}
      keyExtractor={(s) => s.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={(s) => onEditSupplier(s)}
      emptyTitle="No suppliers found"
      emptyDescription="Manage your textile mills and hardware vendors here."
      onClearFilters={onClearFilters}
      rowStyle={() => ({
        '--row-status-color': '#0EA5E9',
      } as React.CSSProperties)}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="apt-footer-count">
            Total <strong>{sortedSuppliers.length}</strong> active suppliers
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click row to view or edit supplier details
          </span>
        </div>
      }
    />
  );
};

export default InventorySuppliersTable;
