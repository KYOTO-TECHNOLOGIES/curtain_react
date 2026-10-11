import React from 'react';
import { Download, Plus, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import '../appointments/AppointmentHeader.css';

interface InventoryPageHeaderProps {
  activeTab: 'items' | 'suppliers' | 'reorders' | 'movements';
  lowStockCount?: number;
  onExport?: () => void;
  onReorderLowStock?: () => void;
  onAddItem?: () => void;
  onAddSupplier?: () => void;
  onNewReorder?: () => void;
  onRefresh?: () => void;
  isReorderingLowStock?: boolean;
}

export const InventoryPageHeader: React.FC<InventoryPageHeaderProps> = ({
  activeTab,
  lowStockCount = 0,
  onExport,
  onReorderLowStock,
  onAddItem,
  onAddSupplier,
  onNewReorder,
  onRefresh,
  isReorderingLowStock = false,
}) => {
  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case 'items':
        return 'Stock Items';
      case 'suppliers':
        return 'Supplier Directory';
      case 'reorders':
        return 'Reorder Requests';
      case 'movements':
        return 'Stock Audit Log';
      default:
        return 'Inventory Overview';
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Title & Breadcrumb Block */}
      <div className="flex flex-col gap-1.5">
        <h1 className="header-stagger-item header-stagger-1 text-[32px] font-bold text-slate-900 tracking-[-0.03em] leading-[1.1]">
          Inventory Management
        </h1>

        <nav
          aria-label="Breadcrumb"
          className="header-stagger-item header-stagger-2 flex items-center gap-1.5 text-[13px] text-slate-500"
        >
          <a
            href="/"
            className="cm-breadcrumb-link"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                // soft navigation
              }
            }}
          >
            Curtain Master.
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#2F5D8F]">
            {getBreadcrumbLabel()}
          </span>
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="header-stagger-item header-stagger-3 flex flex-wrap items-center gap-2.5">
        {/* Export Button */}
        <button
          type="button"
          onClick={onExport}
          className="btn-export-list"
          title="Export inventory data to CSV"
        >
          <Download className="export-icon" strokeWidth={2.2} />
          <span className="hidden sm:inline">Export List</span>
        </button>

        {/* Reorder Low Stock (visible when low stock exists) */}
        {activeTab === 'items' && lowStockCount > 0 && onReorderLowStock && (
          <button
            type="button"
            onClick={onReorderLowStock}
            disabled={isReorderingLowStock}
            className="inline-flex items-center gap-2 h-10 px-3.5 sm:px-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 font-semibold text-sm hover:bg-amber-100 hover:border-amber-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Auto-create reorder requests for all low stock items"
          >
            <AlertTriangle
              className={`w-4 h-4 text-amber-600 ${isReorderingLowStock ? 'animate-spin' : 'animate-bounce'}`}
              strokeWidth={2.2}
            />
            <span className="hidden sm:inline">
              {isReorderingLowStock ? 'Generating...' : `Reorder Low Stock (${lowStockCount})`}
            </span>
            <span className="sm:hidden">
              Reorder ({lowStockCount})
            </span>
          </button>
        )}

        {/* Tab Specific Primary Action */}
        {activeTab === 'items' && onAddItem && (
          <button
            type="button"
            onClick={onAddItem}
            className="btn-schedule-primary"
          >
            <Plus className="schedule-icon" strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Stock Item</span>
            <span className="sm:hidden">Add Item</span>
          </button>
        )}

        {activeTab === 'suppliers' && onAddSupplier && (
          <button
            type="button"
            onClick={onAddSupplier}
            className="btn-schedule-primary"
          >
            <Plus className="schedule-icon" strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Supplier</span>
            <span className="sm:hidden">Add Supplier</span>
          </button>
        )}

        {activeTab === 'reorders' && onNewReorder && (
          <button
            type="button"
            onClick={onNewReorder}
            className="btn-schedule-primary"
          >
            <Plus className="schedule-icon" strokeWidth={2.5} />
            <span className="hidden sm:inline">New Reorder</span>
            <span className="sm:hidden">New Reorder</span>
          </button>
        )}

        {activeTab === 'movements' && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="btn-export-list"
            title="Refresh movements log"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" strokeWidth={2.2} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default InventoryPageHeader;
