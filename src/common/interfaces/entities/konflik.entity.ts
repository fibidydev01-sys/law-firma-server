// ============================================================================
// FILE: src/common/interfaces/entities/konflik.entity.ts (FIXED)
// ============================================================================

import { PerkaraBasic } from './perkara.entity';
import { UserBasic } from './user.entity';

/**
 * Pemeriksaan Konflik Entity - Complete data
 */
export interface PemeriksaanKonflikEntity {
  id: string;
  perkara_id: string | null;
  nama_klien: string;
  pihak_lawan: string;
  diperiksa_oleh: string | null;
  ada_konflik: boolean;
  detail_konflik: string | null;
  tanggal_periksa: Date;
}

/**
 * Konflik with Relations
 */
export interface KonflikWithRelations extends PemeriksaanKonflikEntity {
  perkara: PerkaraBasic | null;
  pemeriksa: UserBasic | null;
}

/**
 * Create Konflik Data
 */
export interface CreateKonflikData {
  perkara_id?: string | null;
  nama_klien: string;
  pihak_lawan: string;
  diperiksa_oleh: string;
  ada_konflik: boolean;
  detail_konflik?: string | null;
}

/**
 * Update Konflik Data - Now with explicit fields
 */
export interface UpdateKonflikData {
  perkara_id?: string | null;
  nama_klien?: string;
  pihak_lawan?: string;
  ada_konflik?: boolean;
  detail_konflik?: string | null;
}
