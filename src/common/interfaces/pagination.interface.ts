// ============================================================================
// FILE: src/common/interfaces/pagination.interface.ts
// ============================================================================

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated Result
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
