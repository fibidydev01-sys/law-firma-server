// ============================================================================
// FILE: src/common/interfaces/business/catatan.interface.ts
// ============================================================================

/**
 * Catatan Query Filters
 */
export interface CatatanQueryFilters {
  search?: string;
  perkara_id?: string;
  user_id?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
