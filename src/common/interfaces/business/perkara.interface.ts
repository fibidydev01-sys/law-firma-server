// ============================================================================
// FILE: src/common/interfaces/business/perkara.interface.ts
// ============================================================================
import { JenisPerkara, StatusPerkara } from '@prisma/client';

/**
 * Perkara Query Filters
 */
export interface PerkaraQueryFilters {
  search?: string;
  jenis_perkara?: JenisPerkara;
  status?: StatusPerkara;
  klien_id?: string;
  nama_pengadilan?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Perkara Statistics
 */
export interface PerkaraStatistics {
  perkara_info: {
    nomor_perkara: string;
    judul: string;
    status: string;
  };
  statistik: {
    total_tugas: number;
    tugas_selesai: number;
    tugas_progress: string;
    total_dokumen: number;
    total_sidang: number;
  };
}
