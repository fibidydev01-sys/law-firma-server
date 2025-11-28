// ============================================================================
// FILE: src/common/interfaces/business/sidang.interface.ts
// ============================================================================
import { JenisSidang } from '@prisma/client';

/**
 * Sidang Query Filters
 */
export interface SidangQueryFilters {
  search?: string;
  jenis_sidang?: JenisSidang;
  perkara_id?: string;
  tanggal_dari?: string;
  tanggal_sampai?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
