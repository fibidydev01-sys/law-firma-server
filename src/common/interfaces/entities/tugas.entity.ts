// ============================================================================
// FILE: server/src/common/interfaces/entities/tugas.entity.ts (FIXED)
// ============================================================================

import { StatusTugas, PrioritasTugas, Prisma } from '@prisma/client';
import { BaseEntity } from './base.entity';
import { KlienBasic } from './klien.entity';
import { UserBasic } from './user.entity';

/**
 * Tugas Entity - Complete Tugas data
 */
export interface TugasEntity extends BaseEntity {
  perkara_id: string;
  judul: string;
  deskripsi: string | null;
  ditugaskan_ke: string | null;
  status: StatusTugas;
  prioritas: PrioritasTugas;
  tenggat_waktu: Date | null;
  tanggal_selesai: Date | null;
  dapat_ditagih: boolean;
  jam_kerja: Prisma.Decimal | null;
  tarif_per_jam: Prisma.Decimal | null;
  dibuat_oleh: string | null;
}

/**
 * Tugas with Relations
 */
export interface TugasWithRelations extends BaseEntity {
  perkara_id: string;
  judul: string;
  deskripsi: string | null;
  ditugaskan_ke: string | null;
  status: StatusTugas;
  prioritas: PrioritasTugas;
  tenggat_waktu: Date | null;
  tanggal_selesai: Date | null;
  dapat_ditagih: boolean;
  jam_kerja: Prisma.Decimal | null;
  tarif_per_jam: Prisma.Decimal | null;
  dibuat_oleh: string | null;
  perkara: {
    id: string;
    nomor_perkara: string;
    judul: string;
    klien: KlienBasic | null;
  };
  petugas: UserBasic | null;
  pembuat: UserBasic | null;
}

/**
 * Create Tugas Data
 */
export interface CreateTugasData {
  perkara_id: string;
  judul: string;
  deskripsi?: string | null;
  ditugaskan_ke?: string | null;
  status?: StatusTugas;
  prioritas?: PrioritasTugas;
  tenggat_waktu?: Date | null;
  dapat_ditagih?: boolean;
  jam_kerja?: number | null;
  tarif_per_jam?: number | null;
  dibuat_oleh: string;
}

/**
 * Update Tugas Data
 */
export interface UpdateTugasData {
  judul?: string;
  deskripsi?: string | null;
  ditugaskan_ke?: string | null;
  status?: StatusTugas;
  prioritas?: PrioritasTugas;
  tenggat_waktu?: Date | null;
  tanggal_selesai?: Date | null;
  dapat_ditagih?: boolean;
  jam_kerja?: number | null;
  tarif_per_jam?: number | null;
}
