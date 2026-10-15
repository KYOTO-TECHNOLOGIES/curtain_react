import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { RowsPerPageSelect } from './RowsPerPageSelect';
import './Pagination.css';

export interface PaginationProps {
  /** Total number of items across all pages */
  totalCount: number;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Whether data is currently loading */
  loading?: boolean;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

export function Pagination({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  loading = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  if (totalCount === 0) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="pagination-wrapper">
      {/* Info section */}
      <div className="pagination-info">
        Showing{' '}
        <span className="pagination-info-highlight">{startItem}–{endItem}</span>
        {' '}of{' '}
        <span className="pagination-info-highlight">{totalCount.toLocaleString()}</span>
        {' '}results
      </div>

      {/* Page navigation */}
      <div className="pagination-controls">
        {/* First page */}
        <button
          className="pagination-btn pagination-btn--arrow"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || loading}
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft />
        </button>

        {/* Previous page */}
        <button
          className="pagination-btn pagination-btn--arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft />
        </button>

        {/* Page numbers */}
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              ···
            </span>
          ) : (
            <button
              key={page}
              className={`pagination-btn ${page === currentPage ? 'pagination-btn--active' : ''}`}
              onClick={() => onPageChange(page)}
              disabled={loading}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next page */}
        <button
          className="pagination-btn pagination-btn--arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight />
        </button>

        {/* Last page */}
        <button
          className="pagination-btn pagination-btn--arrow"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || loading}
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight />
        </button>
      </div>

      {/* Page size selector */}
      {onPageSizeChange && (
        <RowsPerPageSelect
          value={pageSize}
          options={pageSizeOptions}
          total={totalCount}
          disabled={loading}
          onChange={(size) => {
            onPageSizeChange(size);
            onPageChange(1);
          }}
        />
      )}
    </div>
  );
}
