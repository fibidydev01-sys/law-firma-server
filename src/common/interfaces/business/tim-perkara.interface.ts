// ============================================================================
// FILE: src/common/interfaces/business/tim-perkara.interface.ts
// ============================================================================

/**
 * Tim Perkara Query Filters
 */
export interface TimPerkaraQueryFilters {
  search?: string;
  perkara_id?: string;
  user_id?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
