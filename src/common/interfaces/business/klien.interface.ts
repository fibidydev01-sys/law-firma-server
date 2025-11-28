// ============================================================================
// FILE: src/common/interfaces/business/klien.interface.ts
// ============================================================================

/**
 * Klien Query Filters
 */
export interface KlienQueryFilters {
  search?: string;
  jenis_klien?: string;
  kota?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Klien with Relations
 */
export interface KlienWithRelations {
  id: string;
  nama: string;
  jenis_klien: string;
  email?: string | null;
  telepon?: string | null;
  _count: {
    perkara: number;
  };
}
