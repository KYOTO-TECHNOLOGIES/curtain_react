import React from 'react';
import { ChevronDown, AlertCircle, CalendarX } from 'lucide-react';
import './DataTable.css';

export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  headerAddon?: React.ReactNode;
  headerAddonOnly?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string;
  rowStyle?: (row: T, index: number) => React.CSSProperties;
  emptyTitle?: string;
  emptyDescription?: string;
  onClearFilters?: () => void;
  footer?: React.ReactNode;
  mobileToolbar?: React.ReactNode;
  renderSkeletonRow?: (index: number) => React.ReactNode;
  skeletonCount?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  onRetry,
  sortKey = null,
  sortDirection = null,
  onSort,
  onRowClick,
  rowClassName,
  rowStyle,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  onClearFilters,
  footer,
  mobileToolbar,
  renderSkeletonRow,
  skeletonCount = 6,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`apt-table-card ${className}`}>
      {mobileToolbar && <div className="apt-table-mobile-toolbar">{mobileToolbar}</div>}
      <div className="apt-table-scroll">
        <table className="apt-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSortActive = sortKey === col.key;
                const ariaSortVal = isSortActive
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : sortDirection === 'desc'
                    ? 'descending'
                    : 'none'
                  : 'none';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`${col.className || ''} ${col.headerClassName || ''} ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={col.sortable ? ariaSortVal : undefined}
                  >
                    {col.headerAddonOnly ? col.headerAddon : (
                      <span className={col.headerAddon ? 'apt-table-heading-group' : undefined}>
                        {col.sortable && onSort ? (
                      <button
                        type="button"
                        className="apt-sort-btn"
                        onClick={() => onSort(col.key)}
                        aria-label={`Sort by ${col.label}${
                          isSortActive ? ` (${sortDirection === 'asc' ? 'ascending' : 'descending'})` : ''
                        }`}
                        aria-sort={ariaSortVal}
                      >
                        <span>{col.label}</span>
                        <ChevronDown
                          className="apt-sort-chevron"
                          style={{
                            opacity: isSortActive ? 1 : undefined,
                            transform: isSortActive && sortDirection === 'desc' ? 'rotate(180deg)' : undefined,
                            color: isSortActive ? 'var(--apt-brand)' : undefined,
                          }}
                        />
                      </button>
                        ) : (
                          <span>{col.label}</span>
                        )}
                        {col.headerAddon}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Loading Skeleton State
              renderSkeletonRow ? (
                Array.from({ length: skeletonCount }).map((_, idx) => (
                  <React.Fragment key={`skeleton-${idx}`}>
                    {renderSkeletonRow(idx)}
                  </React.Fragment>
                ))
              ) : (
                Array.from({ length: skeletonCount }).map((_, idx) => (
                  <tr key={`default-skeleton-${idx}`}>
                    {columns.map((_, cIdx) => (
                      <td key={`skel-col-${cIdx}`}>
                        <div
                          className="apt-skeleton-block"
                          style={{
                            height: '18px',
                            width: cIdx === 0 ? '60px' : cIdx === 1 ? '70%' : '50%',
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )
            ) : error ? (
              // Error State
              <tr>
                <td colSpan={columns.length}>
                  <div className="apt-empty-state" role="alert">
                    <div className="apt-empty-icon-badge text-rose-500 bg-rose-50">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="apt-empty-title">{error}</div>
                    <div className="apt-empty-hint">An error occurred while loading data.</div>
                    {onRetry && (
                      <button
                        type="button"
                        className="apt-empty-clear-btn"
                        onClick={onRetry}
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length}>
                  <div className="apt-empty-state">
                    <div className="apt-empty-icon-badge">
                      <CalendarX className="w-6 h-6" />
                    </div>
                    <div className="apt-empty-title">{emptyTitle}</div>
                    <div className="apt-empty-hint">{emptyDescription}</div>
                    {onClearFilters && (
                      <button
                        type="button"
                        className="apt-empty-clear-btn"
                        onClick={onClearFilters}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, index) => {
                const key = keyExtractor(row);
                const customClasses = rowClassName ? rowClassName(row, index) : '';
                const customStyles = rowStyle ? rowStyle(row, index) : undefined;

                return (
                  <tr
                    key={key}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                    className={`apt-row-enter ${customClasses}`}
                    style={{
                      animationDelay: `${Math.min(index, 12) * 30}ms`,
                      ...customStyles,
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${col.className || ''} ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {col.render
                          ? col.render(row, index)
                          : (row as any)[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footer && <div className="apt-table-footer">{footer}</div>}
    </div>
  );
}

export default DataTable;
