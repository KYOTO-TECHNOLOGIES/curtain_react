import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  size?: 'fit' | 'flex' | 'cap';
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
  emptyContent?: React.ReactNode;
  onClearFilters?: () => void;
  footer?: React.ReactNode;
  mobileToolbar?: React.ReactNode;
  renderSkeletonRow?: (index: number) => React.ReactNode;
  skeletonCount?: number;
  className?: string;
  tableClassName?: string;
  scrollClassName?: string;
  animateRows?: boolean;
  animateDataChanges?: boolean;
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
  emptyContent,
  onClearFilters,
  footer,
  mobileToolbar,
  renderSkeletonRow,
  skeletonCount = 6,
  className = '',
  tableClassName = '',
  scrollClassName = '',
  animateRows = true,
  animateDataChanges = false,
}: DataTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousDataRef = useRef(data);
  const hasLoadedInitialDataRef = useRef(data.length > 0);
  const dataChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitRowsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrollPosition, setScrollPosition] = useState({ hasScrolled: false, atEnd: true });
  const [dataChangeActive, setDataChangeActive] = useState(false);
  const [exitingRows, setExitingRows] = useState<T[]>([]);

  const updateScrollPosition = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const nextPosition = {
      hasScrolled: element.scrollLeft > 0,
      atEnd: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
    };
    setScrollPosition((current) => (
      current.hasScrolled === nextPosition.hasScrolled && current.atEnd === nextPosition.atEnd
        ? current
        : nextPosition
    ));
  }, []);

  useEffect(() => {
    updateScrollPosition();
    window.addEventListener('resize', updateScrollPosition);
    return () => window.removeEventListener('resize', updateScrollPosition);
  }, [columns, data, updateScrollPosition]);

  useEffect(() => {
    if (!animateDataChanges) {
      previousDataRef.current = data;
      return;
    }

    const previousData = previousDataRef.current;
    if (previousData === data) return;
    previousDataRef.current = data;

    if (!hasLoadedInitialDataRef.current) {
      hasLoadedInitialDataRef.current = data.length > 0;
      return;
    }

    const currentKeys = new Set(data.map(keyExtractor));
    const removedRows = previousData.filter((row) => !currentKeys.has(keyExtractor(row)));
    setExitingRows(removedRows);
    setDataChangeActive(true);

    if (dataChangeTimerRef.current) clearTimeout(dataChangeTimerRef.current);
    if (exitRowsTimerRef.current) clearTimeout(exitRowsTimerRef.current);
    dataChangeTimerRef.current = setTimeout(() => setDataChangeActive(false), 160);
    exitRowsTimerRef.current = setTimeout(() => setExitingRows([]), 120);
  }, [animateDataChanges, data, keyExtractor]);

  useEffect(() => () => {
    if (dataChangeTimerRef.current) clearTimeout(dataChangeTimerRef.current);
    if (exitRowsTimerRef.current) clearTimeout(exitRowsTimerRef.current);
  }, []);

  return (
    <div className={`apt-table-card ${className}`}>
      {mobileToolbar && <div className="apt-table-mobile-toolbar">{mobileToolbar}</div>}
      <div
        ref={scrollRef}
        className={['apt-table-scroll', scrollClassName, scrollPosition.hasScrolled && 'is-scrolled', scrollPosition.atEnd && 'is-at-end'].filter(Boolean).join(' ')}
        onScroll={updateScrollPosition}
      >
        <table className={['apt-table', tableClassName].filter(Boolean).join(' ')}>
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
                    } dt-col-${col.size || 'fit'}${col.key === 'actions' ? ' dt-col-actions' : ''}`}
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
                    {columns.map((column, cIdx) => (
                      <td
                        key={`skel-col-${cIdx}`}
                        className={`dt-col-${column.size || 'fit'}${column.key === 'actions' ? ' dt-col-actions' : ''}`}
                      >
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
                <td colSpan={columns.length} className={emptyContent ? 'apt-table-empty-custom' : undefined}>
                  {emptyContent || (
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
                  )}
                </td>
              </tr>
            ) : (
              // Data Rows
              [...data, ...exitingRows.filter((row) => !data.some((item) => keyExtractor(item) === keyExtractor(row)))].map((row, index) => {
                const key = keyExtractor(row);
                const isExiting = !data.some((item) => keyExtractor(item) === key);
                const customClasses = rowClassName ? rowClassName(row, index) : '';
                const customStyles = rowStyle ? rowStyle(row, index) : undefined;

                return (
                  <tr
                    key={key}
                    aria-hidden={isExiting || undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                    className={`${animateRows && !isExiting ? 'apt-row-enter' : ''} ${animateDataChanges && !isExiting && dataChangeActive ? 'apt-row-data-change' : ''} ${isExiting ? 'apt-row-exit' : ''} ${customClasses}`}
                    style={{
                      animationDelay: animateRows ? `${Math.min(index, 12) * 30}ms` : undefined,
                      ...customStyles,
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${col.className || ''} ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        } dt-col-${col.size || 'fit'}${col.key === 'actions' ? ' dt-col-actions' : ''}`}
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
