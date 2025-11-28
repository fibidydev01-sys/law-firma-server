// ============================================================================
// FILE: src/common/interfaces/business/tugas.interface.ts
// ============================================================================
import { StatusTugas, PrioritasTugas } from '@prisma/client';

/**
 * Tugas Query Filters
 */
export interface TugasQueryFilters {
  search?: string;
  status?: StatusTugas;
  prioritas?: PrioritasTugas;
  perkara_id?: string;
  ditugaskan_ke?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
