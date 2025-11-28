// ============================================================================
// FILE: src/common/interfaces/entities/sidang.entity.ts (FIXED)
// ============================================================================

import { JenisSidang } from '@prisma/client';
import { BaseEntity } from './base.entity';
import { KlienBasic } from './klien.entity';
import { UserBasic } from './user.entity';

/**
 * Jadwal Sidang Entity - Complete data
 */
export interface JadwalSidangEntity extends BaseEntity {
  perkara_id: string;
  jenis_sidang: JenisSidang;
  tanggal_sidang: Date;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  nama_pengadilan: string;
  nomor_ruang_sidang: string | null;
  nama_hakim: string | null;
  lokasi_lengkap: string | null;
  agenda_sidang: string | null;
  hasil_sidang: string | null;
  putusan: string | null;
  catatan: string | null;
  dibuat_oleh: string | null;
}

/**
 * Jadwal Sidang with Relations
 */
export interface JadwalSidangWithRelations extends JadwalSidangEntity {
  perkara: {
    id: string;
    nomor_perkara: string;
    judul: string;
    klien: KlienBasic | null;
  };
  pembuat: UserBasic | null;
}

/**
 * Create Jadwal Sidang Data
 */
export interface CreateJadwalSidangData {
  perkara_id: string;
  jenis_sidang: JenisSidang;
  tanggal_sidang: Date;
  waktu_mulai?: string | null;
  waktu_selesai?: string | null;
  nama_pengadilan: string;
  nomor_ruang_sidang?: string | null;
  nama_hakim?: string | null;
  lokasi_lengkap?: string | null;
  agenda_sidang?: string | null;
  hasil_sidang?: string | null;
  putusan?: string | null;
  catatan?: string | null;
  dibuat_oleh: string;
}

/**
 * Update Jadwal Sidang Data - Now with explicit fields
 */
export interface UpdateJadwalSidangData {
  jenis_sidang?: JenisSidang;
  tanggal_sidang?: Date;
  waktu_mulai?: string | null;
  waktu_selesai?: string | null;
  nama_pengadilan?: string;
  nomor_ruang_sidang?: string | null;
  nama_hakim?: string | null;
  lokasi_lengkap?: string | null;
  agenda_sidang?: string | null;
  hasil_sidang?: string | null;
  putusan?: string | null;
  catatan?: string | null;
}
