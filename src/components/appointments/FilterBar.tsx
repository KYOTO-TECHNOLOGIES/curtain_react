import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { SelectMenu, type SelectOption } from '../ui/SelectMenu';
import { useSlashShortcut } from '../../hooks/useSlashShortcut';
import type { AppointmentListItem, AppointmentStats, User } from '../../types';
import './FilterBar.css';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  assigneeFilter: string;
  onAssigneeChange: (assignee: string) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
  stats?: AppointmentStats | null;
  users: User[];
  appointments?: AppointmentListItem[];
}

// Helper to extract initials (e.g. "James Sales" -> "JS")
const getInitials = (name?: string): string => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  assigneeFilter,
  onAssigneeChange,
  onClearFilters,
  totalCount,
  filteredCount,
  stats,
  users,
  appointments = [],
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

  // Trigger roll animation when total or filtered count changes
  useEffect(() => {
    setRollTrigger((prev) => prev + 1);
  }, [totalCount, filteredCount]);

  const isFiltered = Boolean(
    localSearch.trim() || statusFilter || assigneeFilter
  );

  // 2. Staff Dropdown Options
  const staffOptions: SelectOption[] = useMemo(() => {
    const allRow: SelectOption = {
      value: '',
      label: 'All Staff',
      count: stats?.total ?? totalCount,
    };

    const staffRows: SelectOption[] = (Array.isArray(users) ? users : []).map((u) => {
      const userAppointmentsCount = appointments.filter(
        (a) => a.assigned_to === u.id || String(a.assigned_to) === String(u.id)
      ).length;

      const displayName = u.full_name || u.email;

      return {
        value: String(u.id),
        label: displayName,
        avatarText: getInitials(displayName),
        count: userAppointmentsCount,
      };
    });

    return [allRow, ...staffRows];
  }, [users, appointments, stats, totalCount]);

  const handleClear = () => {
    setIsSpinning(true);
    setLocalSearch('');
    onClearFilters();
    setTimeout(() => setIsSpinning(false), 300);
  };

  return (
    <div className="cm-filter-card">
      <div className="cm-filter-grid cm-filter-grid-appointments">
        {/* Search Field */}
        <div className={`cm-filter-cell cm-filter-cell-search ${isSearchFocused || localSearch ? 'is-active' : ''}`}>
          <label htmlFor="appointment-search" className="cm-filter-label">
            Search
          </label>
          <div className={`cm-search-control ${isSearchFocused ? 'is-focused' : ''}`}>
            <Search className="cm-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              id="appointment-search"
              type="text"
              placeholder="Search by title or customer..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="cm-search-input"
            />

            {/* '/' keyboard shortcut hint (hidden when focused or mobile) */}
            {!isSearchFocused && !localSearch && (
              <kbd className="cm-kbd-chip hidden sm:inline-flex" aria-hidden="true">
                /
              </kbd>
            )}

            {/* Clear 'X' button animated */}
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

        {/* Assigned To Dropdown */}
        <div className={`cm-filter-cell ${assigneeFilter ? 'is-active' : ''}`}>
          <span className="cm-filter-label">Assigned To</span>
          <SelectMenu
            id="assigned-to-select-menu"
            value={assigneeFilter}
            options={staffOptions}
            onChange={onAssigneeChange}
            placeholder="All Staff"
            ariaLabel="Filter appointments by assigned staff"
          />
        </div>

        {/* Clear filters ghost button (conditional) */}
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
          <div /> // empty placeholder maintaining grid flow
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
              {isFiltered ? 'Showing' : 'Appointments'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
