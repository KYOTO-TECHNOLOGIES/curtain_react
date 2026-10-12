import React, { useState, useEffect, useRef } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { useSlashShortcut } from '../../hooks/useSlashShortcut';
import '../appointments/FilterBar.css';

interface PaymentFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  methodFilter: string;
  onClearFilters: () => void;
  totalCollectedFormatted: string;
  filteredCount?: number;
}

export const PaymentFilterBar: React.FC<PaymentFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  methodFilter,
  onClearFilters,
  totalCollectedFormatted,
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

  const handleClear = () => {
    setIsSpinning(true);
    setLocalSearch('');
    onClearFilters();
    setTimeout(() => setIsSpinning(false), 300);
  };

  return (
    <div className="cm-filter-card">
      <div
        className="cm-filter-grid cm-filter-grid-payments"
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
