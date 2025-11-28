// ============================================================================
// FILE: src/common/interfaces/entities/perkara.entity.ts (FIXED)
// ============================================================================

import {
  JenisPerkara,
  StatusPerkara,
  PrioritasTugas,
  Prisma,
} from '@prisma/client';
import { BaseEntity } from './base.entity';
import { KlienBasic, KlienEntity } from './klien.entity';
import { UserBasic, UserPublic } from './user.entity';

/**
 * Perkara Entity - Complete Perkara data
 */
export interface PerkaraEntity extends BaseEntity {
  nomor_perkara: string;
  nomor_perkara_pengadilan: string | null;
  judul: string;
  deskripsi: string | null;
  klien_id: string | null;
  jenis_perkara: JenisPerkara;
  status: StatusPerkara;
  prioritas: PrioritasTugas;
  tingkat_pengadilan: string | null;
  nama_pengadilan: string | null;
  nomor_ruang_sidang: string | null;
  nama_hakim_ketua: string | null;
  nama_hakim_anggota_1: string | null;
  nama_hakim_anggota_2: string | null;
  nama_panitera: string | null;
  posisi_klien: string | null;
  pihak_lawan: string | null;
  kuasa_hukum_lawan: string | null;
  nilai_perkara: Prisma.Decimal | null;
  tanggal_register: Date | null;
  tanggal_sidang_pertama: Date | null;
  tanggal_sidang_berikutnya: Date | null;
  batas_waktu_banding: Date | null;
  batas_waktu_kasasi: Date | null;
  nilai_fee: Prisma.Decimal | null;
  status_pembayaran: string | null;
  catatan: string | null;
  dibuat_oleh: string | null;
}

/**
 * Perkara Basic - For selection/display
 */
export interface PerkaraBasic {
  id: string;
  nomor_perkara: string;
  judul: string;
  jenis_perkara: JenisPerkara;
  status: StatusPerkara;
  created_at: Date;
}

/**
 * Perkara with Klien
 */
export interface PerkaraWithKlien extends PerkaraEntity {
  klien: KlienBasic | null;
  _count: {
    tugas: number;
    dokumen: number;
    jadwal_sidang: number;
  };
}

/**
 * Perkara with Full Relations
 */
export interface PerkaraWithRelations extends PerkaraEntity {
  klien: KlienEntity | null;
  pembuat: UserPublic | null;
  tim_perkara: Array<{
    id: string;
    peran: string | null;
    tanggal_ditugaskan: Date;
    user: UserPublic;
  }>;
  tugas: Array<{
    id: string;
    judul: string;
    status: string;
    prioritas: string;
    tenggat_waktu: Date | null;
    created_at: Date;
    petugas: UserBasic | null;
  }>;
  dokumen: Array<{
    id: string;
    nama_dokumen: string;
    kategori: string;
    file_path: string | null;
    google_drive_id: string | null;
    google_drive_link: string | null;
    embed_link: string | null;
    tanggal_upload: Date;
  }>;
  jadwal_sidang: Array<{
    id: string;
    jenis_sidang: string;
    tanggal_sidang: Date;
    nama_pengadilan: string;
  }>;
  _count: {
    tugas: number;
    dokumen: number;
    jadwal_sidang: number;
    catatan_perkara: number;
  };
}

/**
 * Create Perkara Data
 */
export interface CreatePerkaraData {
  nomor_perkara: string;
  nomor_perkara_pengadilan?: string | null;
  judul: string;
  deskripsi?: string | null;
  klien_id?: string | null;
  jenis_perkara: JenisPerkara;
  status?: StatusPerkara;
  prioritas?: PrioritasTugas;
  tingkat_pengadilan?: string | null;
  nama_pengadilan?: string | null;
  nomor_ruang_sidang?: string | null;
  nama_hakim_ketua?: string | null;
  posisi_klien?: string | null;
  pihak_lawan?: string | null;
  kuasa_hukum_lawan?: string | null;
  nilai_perkara?: number | null;
  tanggal_register?: Date | null;
  tanggal_sidang_pertama?: Date | null;
  nilai_fee?: number | null;
  status_pembayaran?: string | null;
  catatan?: string | null;
  dibuat_oleh: string;
}

/**
 * Update Perkara Data - Now with explicit fields
 */
export interface UpdatePerkaraData {
  nomor_perkara_pengadilan?: string | null;
  judul?: string;
  deskripsi?: string | null;
  klien_id?: string | null;
  jenis_perkara?: JenisPerkara;
  status?: StatusPerkara;
  prioritas?: PrioritasTugas;
  tingkat_pengadilan?: string | null;
  nama_pengadilan?: string | null;
  nomor_ruang_sidang?: string | null;
  nama_hakim_ketua?: string | null;
  posisi_klien?: string | null;
  pihak_lawan?: string | null;
  kuasa_hukum_lawan?: string | null;
  nilai_perkara?: number | null;
  tanggal_register?: Date | null;
  tanggal_sidang_pertama?: Date | null;
  nilai_fee?: number | null;
  status_pembayaran?: string | null;
  catatan?: string | null;
}
