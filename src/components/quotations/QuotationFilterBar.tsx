import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { SelectMenu, type SelectOption } from '../ui/SelectMenu';
import { useSlashShortcut } from '../../hooks/useSlashShortcut';
import type { QuotationListItem, QuotationStats } from '../../types';
import '../appointments/FilterBar.css';

interface QuotationFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  quoteTypeFilter: string;
  onQuoteTypeChange: (type: string) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
  stats?: QuotationStats | null;
  quotations?: QuotationListItem[];
}

export const QuotationFilterBar: React.FC<QuotationFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  quoteTypeFilter,
  onQuoteTypeChange,
  onClearFilters,
  totalCount,
  filteredCount,
  stats,
  quotations = [],
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rollTrigger, setRollTrigger] = useState(0);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut '/' focuses search input
  useSlashShortcut(searchInputRef);

  // Sync from external parent changes (e.g. clear filters)
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

  // Trigger roll animation when counts change
  useEffect(() => {
    setRollTrigger((prev) => prev + 1);
  }, [totalCount, filteredCount]);

  const isFiltered = Boolean(
    localSearch.trim() || statusFilter || quoteTypeFilter
  );

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
        value: 'draft',
        label: 'Draft',
        dotColor: '#F97316',
        count: stats?.by_status?.draft ?? 0,
      },
      {
        value: 'pending',
        label: 'Pending',
        dotColor: '#8B5CF6',
        count: stats?.by_status?.pending ?? 0,
      },
      {
        value: 'sent',
        label: 'Sent',
        dotColor: '#2F5D8F',
        count: stats?.by_status?.sent ?? 0,
      },
      {
        value: 'accepted',
        label: 'Accepted',
        dotColor: '#10B981',
        count: stats?.by_status?.accepted ?? 0,
      },
      {
        value: 'cancelled',
        label: 'Cancelled',
        dotColor: '#EF4444',
        count: stats?.by_status?.cancelled ?? 0,
      },
    ];
  }, [stats, totalCount]);

  // Type Dropdown Options (B2C / B2B)
  const typeOptions: SelectOption[] = useMemo(() => {
    const total = stats?.total ?? totalCount;
    const b2cCount = quotations.filter(
      (q) => q.quote_type?.toLowerCase() === 'b2c'
    ).length;
    const b2bCount = quotations.filter(
      (q) => q.quote_type?.toLowerCase() === 'b2b'
    ).length;

    return [
      {
        value: '',
        label: 'All Types',
        count: total,
      },
      {
        value: 'b2c',
        label: 'B2C (Retail)',
        dotColor: '#2F5D8F',
        count: b2cCount,
      },
      {
        value: 'b2b',
        label: 'B2B (Business)',
        dotColor: '#8B5CF6',
        count: b2bCount,
      },
    ];
  }, [stats, totalCount, quotations]);

  const handleClear = () => {
    setIsSpinning(true);
    setLocalSearch('');
    onClearFilters();
    setTimeout(() => setIsSpinning(false), 300);
  };

  return (
    <div className="cm-filter-card">
      <div className="cm-filter-grid">
        {/* Search Field */}
        <div
          className={`cm-filter-cell cm-filter-cell-search ${
            isSearchFocused || localSearch ? 'is-active' : ''
          }`}
        >
          <label htmlFor="quotation-search" className="cm-filter-label">
            Search
          </label>
          <div className={`cm-search-control ${isSearchFocused ? 'is-focused' : ''}`}>
            <Search className="cm-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              id="quotation-search"
              type="text"
              placeholder="Search quotes..."
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
            id="quote-status-select-menu"
            value={statusFilter}
            options={statusOptions}
            onChange={onStatusChange}
            placeholder="All Status"
            ariaLabel="Filter quotations by status"
          />
        </div>

        {/* Type Dropdown */}
        <div className={`cm-filter-cell ${quoteTypeFilter ? 'is-active' : ''}`}>
          <span className="cm-filter-label">Type</span>
          <SelectMenu
            id="quote-type-select-menu"
            value={quoteTypeFilter}
            options={typeOptions}
            onChange={onQuoteTypeChange}
            placeholder="All Types"
            ariaLabel="Filter quotations by type"
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

        {/* Total Chip Block */}
        <div className="cm-filter-cell-total">
          <div
            key={rollTrigger}
            className="cm-total-number roll-animation"
          >
            {isFiltered ? `${filteredCount} of ${totalCount}` : totalCount}
          </div>
          <div className="cm-total-label-row">
            {isFiltered && <span className="cm-pulse-dot" aria-hidden="true" />}
            <span className="cm-total-label">
              {isFiltered ? 'Showing' : 'Quotations'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationFilterBar;
