// ============================================================================
// FILE: src/common/interfaces/business/log-aktivitas.interface.ts
// ============================================================================

/**
 * Log Aktivitas Query Filters
 */
export interface LogAktivitasQueryFilters {
  search?: string;
  aksi?: string;
  jenis_entitas?: string;
  user_id?: string;
  tanggal_dari?: string;
  tanggal_sampai?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
