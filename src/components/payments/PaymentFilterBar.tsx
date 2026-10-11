import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { SelectMenu, type SelectOption } from '../ui/SelectMenu';
import { useSlashShortcut } from '../../hooks/useSlashShortcut';
import '../appointments/FilterBar.css';

interface PaymentItem {
  id: number;
  amount?: string;
  method?: string;
  [key: string]: any;
}

interface PaymentFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  methodFilter: string;
  onMethodChange: (method: string) => void;
  onClearFilters: () => void;
  totalCollectedFormatted: string;
  payments?: PaymentItem[];
  filteredCount?: number;
}

export const PaymentFilterBar: React.FC<PaymentFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  methodFilter,
  onMethodChange,
  onClearFilters,
  totalCollectedFormatted,
  payments = [],
  filteredCount = 0,
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

  // Trigger roll animation when total collected changes
  useEffect(() => {
    setRollTrigger((prev) => prev + 1);
  }, [totalCollectedFormatted, filteredCount]);

  const isFiltered = Boolean(localSearch.trim() || methodFilter);

  // Payment Method Options
  const methodOptions: SelectOption[] = useMemo(() => {
    const total = payments.length;
    const countByMethod = (m: string) =>
      payments.filter((p) => p.method?.toLowerCase() === m.toLowerCase()).length;

    return [
      {
        value: '',
        label: 'All Methods',
        isDotCluster: true,
        count: total,
      },
      {
        value: 'bank_transfer',
        label: 'Bank Transfer',
        dotColor: '#2F5D8F',
        count: countByMethod('bank_transfer'),
      },
      {
        value: 'card',
        label: 'Card',
        dotColor: '#10B981',
        count: countByMethod('card'),
      },
      {
        value: 'cash',
        label: 'Cash',
        dotColor: '#F59E0B',
        count: countByMethod('cash'),
      },
      {
        value: 'cheque',
        label: 'Cheque',
        dotColor: '#8B5CF6',
        count: countByMethod('cheque'),
      },
    ];
  }, [payments]);

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
          <label htmlFor="payment-search" className="cm-filter-label">
            Search
          </label>
          <div className={`cm-search-control ${isSearchFocused ? 'is-focused' : ''}`}>
            <Search className="cm-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              id="payment-search"
              type="text"
              placeholder="Search invoice or reference..."
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

        {/* Payment Method Dropdown */}
        <div className={`cm-filter-cell ${methodFilter ? 'is-active' : ''}`}>
          <span className="cm-filter-label">Payment Method</span>
          <SelectMenu
            id="payment-method-select-menu"
            value={methodFilter}
            options={methodOptions}
            onChange={onMethodChange}
            placeholder="All Methods"
            ariaLabel="Filter payments by method"
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

        {/* Filtered Total Chip Block */}
        <div className="cm-filter-cell-total">
          <div
            key={rollTrigger}
            className="cm-total-number roll-animation"
          >
            {totalCollectedFormatted}
          </div>
          <div className="cm-total-label-row">
            {isFiltered && <span className="cm-pulse-dot" aria-hidden="true" />}
            <span className="cm-total-label text-emerald-500 font-semibold">
              {isFiltered ? `Filtered Total (${filteredCount})` : 'Filtered Total'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFilterBar;
