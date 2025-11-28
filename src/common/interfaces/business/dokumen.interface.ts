// ============================================================================
// FILE: src/common/interfaces/business/dokumen.interface.ts
// ============================================================================
import { KategoriDokumen } from '@prisma/client';

/**
 * Dokumen Query Filters
 */
export interface DokumenQueryFilters {
  search?: string;
  kategori?: KategoriDokumen;
  perkara_id?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Dokumen Download Response
 */
export interface DokumenDownloadResponse {
  file_path: string;
  nama_dokumen: string;
}
