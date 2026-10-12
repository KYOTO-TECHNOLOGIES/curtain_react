import React, { useState, useEffect, useRef } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { useSlashShortcut } from '../../hooks/useSlashShortcut';
import '../appointments/FilterBar.css';

interface OrderFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export const OrderFilterBar: React.FC<OrderFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onClearFilters,
  totalCount,
  filteredCount,
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

  // Trigger roll animation when count changes
  useEffect(() => {
    setRollTrigger((prev) => prev + 1);
  }, [totalCount, filteredCount]);

  const isFiltered = Boolean(localSearch.trim() || statusFilter);

  const handleClear = () => {
    setIsSpinning(true);
    setLocalSearch('');
    onClearFilters();
    setTimeout(() => setIsSpinning(false), 300);
  };

  return (
    <div className="cm-filter-card">
      <div className="cm-filter-grid cm-filter-grid-order-statusless">
        {/* Search Field */}
        <div
          className={`cm-filter-cell cm-filter-cell-search ${
            isSearchFocused || localSearch ? 'is-active' : ''
          }`}
        >
          <label htmlFor="order-search" className="cm-filter-label">
            Search
          </label>
          <div className={`cm-search-control ${isSearchFocused ? 'is-focused' : ''}`}>
            <Search className="cm-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              id="order-search"
              type="text"
              placeholder="Search orders, quotes, or customers..."
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
              {isFiltered ? 'Showing' : 'Total Orders'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilterBar;
