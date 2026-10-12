import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { SelectMenu, type SelectOption } from '../ui/SelectMenu';
import { useSlashShortcut } from '../../hooks/useSlashShortcut';
import type { InventoryItem, InventoryStats, Supplier } from '../../types';
import '../appointments/FilterBar.css';

interface InventoryFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  stockStatusFilter: string;
  onStockStatusChange: (status: string) => void;
  supplierFilter: string;
  onSupplierChange: (supplierId: string) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
  stats?: InventoryStats | null;
  suppliers: Supplier[];
  items?: InventoryItem[];
}

export const InventoryFilterBar: React.FC<InventoryFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  stockStatusFilter,
  onStockStatusChange,
  supplierFilter,
  onSupplierChange,
  onClearFilters,
  totalCount,
  filteredCount,
  stats,
  suppliers,
  items = [],
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rollTrigger, setRollTrigger] = useState(0);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut '/' focuses search input
  useSlashShortcut(searchInputRef);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, searchQuery]);

  // Trigger roll animation when count changes
  useEffect(() => {
    setRollTrigger((prev) => prev + 1);
  }, [totalCount, filteredCount]);

  const isFiltered = Boolean(
    localSearch.trim() || categoryFilter || stockStatusFilter || supplierFilter
  );

  // 2. Stock Status Options
  const stockStatusOptions: SelectOption[] = useMemo(() => {
    const lowStockCount = stats?.low_stock_count ?? items.filter((i) => i.is_low_stock).length;
    const outOfStockCount = items.filter((i) => parseFloat(i.quantity_on_hand || '0') <= 0).length;
    const optimalCount = Math.max(0, (stats?.total_items ?? items.length) - lowStockCount);

    return [
      {
        value: '',
        label: 'All Stock Levels',
        count: stats?.total_items ?? totalCount,
      },
      {
        value: 'low',
        label: 'Low Stock Alert',
        dotColor: '#F59E0B',
        count: lowStockCount,
      },
      {
        value: 'in_stock',
        label: 'Optimal Stock',
        dotColor: '#10B981',
        count: optimalCount,
      },
      {
        value: 'out_of_stock',
        label: 'Out of Stock',
        dotColor: '#EF4444',
        count: outOfStockCount,
      },
    ];
  }, [stats, totalCount, items]);

  // 3. Supplier Dropdown Options
  const supplierOptions: SelectOption[] = useMemo(() => {
    const allRow: SelectOption = {
      value: '',
      label: 'All Suppliers',
      count: stats?.total_items ?? totalCount,
    };

    const supRows: SelectOption[] = suppliers.map((s) => {
      const itemsCount = items.filter((i) => i.supplier === s.id).length;
      return {
        value: String(s.id),
        label: s.name,
        avatarText: s.name.slice(0, 2).toUpperCase(),
        count: s.items_count ?? itemsCount,
      };
    });

    return [allRow, ...supRows];
  }, [suppliers, items, stats, totalCount]);

  const handleClear = () => {
    setIsSpinning(true);
    setLocalSearch('');
    onClearFilters();
    setTimeout(() => setIsSpinning(false), 300);
  };

  return (
    <div className="cm-filter-card">
      <div className="cm-filter-grid cm-filter-grid-inventory">
        {/* Search Field */}
        <div className={`cm-filter-cell cm-filter-cell-search ${isSearchFocused || localSearch ? 'is-active' : ''}`}>
          <label htmlFor="inventory-search" className="cm-filter-label">
            Search Item
          </label>
          <div className={`cm-search-control ${isSearchFocused ? 'is-focused' : ''}`}>
            <Search className="cm-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              id="inventory-search"
              type="text"
              className="cm-search-input"
              placeholder="Search by SKU, item, location..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {!isSearchFocused && !localSearch && (
              <kbd className="cm-kbd-chip hidden sm:inline-flex" aria-hidden="true" title="Press '/' to search">
                /
              </kbd>
            )}
            <button
              type="button"
              className={`cm-search-clear-btn ${localSearch ? 'is-visible' : 'is-hidden'}`}
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
              title="Clear search"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stock Status Dropdown */}
        <div className={`cm-filter-cell ${stockStatusFilter ? 'is-active' : ''}`}>
          <label className="cm-filter-label">Stock Status</label>
          <SelectMenu
            id="inv-filter-stock-status"
            value={stockStatusFilter}
            options={stockStatusOptions}
            onChange={onStockStatusChange}
            placeholder="All Stock Levels"
            ariaLabel="Filter by Stock Status"
          />
        </div>

        {/* Supplier Dropdown */}
        <div className={`cm-filter-cell ${supplierFilter ? 'is-active' : ''}`}>
          <label className="cm-filter-label">Supplier</label>
          <SelectMenu
            id="inv-filter-supplier"
            value={supplierFilter}
            options={supplierOptions}
            onChange={onSupplierChange}
            placeholder="All Suppliers"
            ariaLabel="Filter by Supplier"
          />
        </div>

        {/* Clear Filters Button */}
        {isFiltered ? (
          <div className="cm-filter-cell flex items-end">
            <button
              type="button"
              className={`cm-clear-filters-btn ${isSpinning ? 'is-spinning' : ''}`}
              onClick={handleClear}
              title="Reset all filters"
              aria-label="Reset all filters"
            >
              <RotateCcw className="clear-icon" aria-hidden="true" />
              <span>Clear Filters</span>
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Flexible spacer */}
        <div className="cm-filter-spacer" />

        {/* Item Counter with Rolling Numbers */}
        <div className="cm-filter-cell-total" aria-live="polite">
          <div key={rollTrigger} className="cm-total-number roll-animation">
            {filteredCount === totalCount ? (
              filteredCount
            ) : (
              <span>
                {filteredCount}
                <span className="text-slate-400 font-normal text-sm mx-1">/</span>
                <span className="text-slate-500 font-medium text-lg">{totalCount}</span>
              </span>
            )}
          </div>
          <div className="cm-total-label-row">
            <span className="cm-pulse-dot" />
            <span className="cm-total-label">Inventory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryFilterBar;
