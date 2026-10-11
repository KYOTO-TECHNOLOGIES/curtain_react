import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { SelectMenu, type SelectOption } from '../ui/SelectMenu';
import { useSlashShortcut } from '../../hooks/useSlashShortcut';
import type { InvoiceStats, InvoiceListItem } from '../../types';
import '../appointments/FilterBar.css';

interface InvoiceFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
  totalCollected: string;
  stats?: InvoiceStats | null;
  invoices?: InvoiceListItem[];
}

export const InvoiceFilterBar: React.FC<InvoiceFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  totalCount,
  filteredCount,
  totalCollected,
  stats,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rollTrigger, setRollTrigger] = useState(0);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut '/' focuses search input
  useSlashShortcut(searchInputRef);

  // Sync from external parent changes
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

  // Trigger roll animation when total or collected changes
  useEffect(() => {
    setRollTrigger((prev) => prev + 1);
  }, [totalCount, filteredCount, totalCollected]);

  const isFiltered = Boolean(localSearch.trim() || statusFilter);

  // Status Dropdown Options
  const statusOptions: SelectOption[] = useMemo(() => {
    const total = stats?.total ?? totalCount;
    return [
      {
        value: '',
        label: 'All Status',
        isDotCluster: true,
        count: total,
      },
      {
        value: 'paid',
        label: 'Paid',
        dotColor: '#10B981',
        count: stats?.by_status?.paid ?? 0,
      },
      {
        value: 'partially_paid',
        label: 'Partially Paid',
        dotColor: '#0EA5E9',
        count: stats?.by_status?.partially_paid ?? 0,
      },
      {
        value: 'sent',
        label: 'Sent',
        dotColor: '#2F5D8F',
        count: stats?.by_status?.sent ?? 0,
      },
      {
        value: 'overdue',
        label: 'Overdue',
        dotColor: '#EF4444',
        count: stats?.by_status?.overdue ?? stats?.overdue ?? 0,
      },
      {
        value: 'draft',
        label: 'Draft',
        dotColor: '#F97316',
        count: stats?.by_status?.draft ?? 0,
      },
      {
        value: 'cancelled',
        label: 'Cancelled',
        dotColor: '#64748B',
        count: stats?.by_status?.cancelled ?? 0,
      },
    ];
  }, [stats, totalCount]);

  const handleClear = () => {
    setIsSpinning(true);
    setLocalSearch('');
    onClearFilters();
    setTimeout(() => setIsSpinning(false), 300);
  };

  return (
    <div className="cm-filter-card">
      <div
        className="cm-filter-grid"
        style={{
          gridTemplateColumns: 'minmax(240px, 1.8fr) 220px auto 1fr auto',
        }}
      >
        {/* Search Field */}
        <div
          className={`cm-filter-cell cm-filter-cell-search ${
            isSearchFocused || localSearch ? 'is-active' : ''
          }`}
        >
          <label htmlFor="invoice-search" className="cm-filter-label">
            Search
          </label>
          <div className={`cm-search-control ${isSearchFocused ? 'is-focused' : ''}`}>
            <Search className="cm-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              id="invoice-search"
              type="text"
              placeholder="Search invoices, quotes, or customers..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="cm-search-input"
            />

            {/* '/' keyboard shortcut hint */}
            {!isSearchFocused && !localSearch && (
              <kbd className="cm-kbd-chip hidden sm:inline-flex" aria-hidden="true">
                /
              </kbd>
            )}

            {/* Clear 'X' button */}
            <button
              type="button"
              aria-label="Clear search input"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
              className={`cm-search-clear-btn ${localSearch ? 'is-visible' : 'is-hidden'}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className={`cm-filter-cell ${statusFilter ? 'is-active' : ''}`}>
          <span className="cm-filter-label">Status</span>
          <SelectMenu
            id="invoice-status-select-menu"
            value={statusFilter}
            options={statusOptions}
            onChange={onStatusChange}
            placeholder="All Status"
            ariaLabel="Filter invoices by status"
          />
        </div>

        {/* Clear filters ghost button */}
        {isFiltered ? (
          <div className="cm-filter-cell flex items-end">
            <button
              type="button"
              onClick={handleClear}
              className={`cm-clear-filters-btn ${isSpinning ? 'is-spinning' : ''}`}
              title="Reset all filters"
            >
              <RotateCcw className="clear-icon" />
              <span>Clear filters</span>
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Flexible spacer */}
        <div className="cm-filter-spacer" />

        {/* Total Collected / Showing Chip Block */}
        <div className="cm-filter-cell-total">
          <div
            key={rollTrigger}
            className="cm-total-number roll-animation"
          >
            {isFiltered
              ? `${filteredCount} of ${totalCount}`
              : totalCollected || 'AED 0.00'}
          </div>
          <div className="cm-total-label-row">
            {isFiltered && <span className="cm-pulse-dot" aria-hidden="true" />}
            <span
              className={`cm-total-label ${
                !isFiltered ? 'text-emerald-500 font-semibold' : ''
              }`}
            >
              {isFiltered ? 'Showing Invoices' : 'Total Collected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilterBar;
