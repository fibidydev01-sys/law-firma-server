// ============================================================================
// FILE: src/common/interfaces/business/konflik.interface.ts
// ============================================================================

/**
 * Konflik Query Filters
 */
export interface KonflikQueryFilters {
  search?: string;
  ada_konflik?: boolean;
  perkara_id?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
