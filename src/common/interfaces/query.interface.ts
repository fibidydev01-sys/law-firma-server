// ============================================================================
// FILE: src/common/interfaces/query.interface.ts
// ============================================================================

/**
 * Base Query Filters
 */
export interface QueryFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Date Range Filter
 */
export interface DateRangeFilter {
  tanggal_dari?: string | Date;
  tanggal_sampai?: string | Date;
}

/**
 * Prisma Where Clause Builder
 */
export interface PrismaWhereClause {
  OR?: Array<Record<string, unknown>>;
  AND?: Array<Record<string, unknown>>;
  NOT?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Prisma Order By Clause
 */
export interface PrismaOrderBy {
  [key: string]: 'asc' | 'desc';
}

/**
 * Generic Query Options
 */
export interface QueryOptions<T = unknown> {
  where?: Partial<T>;
  orderBy?: PrismaOrderBy;
  skip?: number;
  take?: number;
  include?: Record<string, boolean | Record<string, unknown>>;
  select?: Record<string, boolean>;
}
