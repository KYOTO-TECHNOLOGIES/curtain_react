import { useState, useCallback } from 'react';

const DEFAULT_PAGE_SIZE = 10;

interface UsePaginationOptions {
  /** Initial page size (default: 10) */
  initialPageSize?: number;
}

interface UsePaginationReturn {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Calculated offset for the API call */
  offset: number;
  /** The limit (same as pageSize, for API calls) */
  limit: number;
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Update the page size and reset to page 1 */
  setPageSize: (size: number) => void;
  /** Reset to page 1 (e.g. when filters change) */
  resetPage: () => void;
}

/**
 * Custom hook to manage pagination state and compute limit/offset
 * for Django REST Framework LimitOffset pagination.
 */
export function usePagination(options?: UsePaginationOptions): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(options?.initialPageSize ?? DEFAULT_PAGE_SIZE);

  const offset = (currentPage - 1) * pageSize;
  const limit = pageSize;

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    offset,
    limit,
    goToPage,
    setPageSize,
    resetPage,
  };
}
