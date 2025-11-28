// ============================================================================
// FILE: server/src/common/interfaces/entities/user.entity.ts
// UPDATE UserEntity interface
// ============================================================================
import { UserRole } from '@prisma/client';
import { BaseEntity } from './base.entity';

/**
 * User Entity - Complete User data WITHOUT password
 */
export interface UserEntity extends BaseEntity {
  email: string;
  nama_lengkap: string | null;
  role: UserRole;
  jabatan: string | null;
  nomor_kta: string | null;
  nomor_berita_acara: string | null;
  spesialisasi: string | null;
  avatar_url: string | null;
  telepon: string | null;
  alamat: string | null;
  is_active: boolean; // ✅ ADD THIS LINE
  tanggal_bergabung: Date;
}

/**
 * User Basic - For selection/display in lists
 */
export interface UserBasic {
  id: string;
  email: string;
  nama_lengkap: string | null;
  role: UserRole;
  avatar_url: string | null;
}

/**
 * User Public - Safe data untuk public display
 */
export interface UserPublic {
  id: string;
  nama_lengkap: string | null;
  email: string;
  jabatan: string | null;
  avatar_url: string | null;
  telepon: string | null;
}

/**
 * User with Statistics
 */
export interface UserWithStats extends UserEntity {
  _count: {
    perkara_dibuat: number;
    tugas_ditugaskan: number;
    tim_perkara: number;
    klien_dibuat: number;
    dokumen_diunggah: number;
  };
}

/**
 * Create User Data
 */
export interface CreateUserData {
  email: string;
  password: string;
  nama_lengkap: string;
  role: UserRole;
  jabatan?: string | null;
  nomor_kta?: string | null;
  nomor_berita_acara?: string | null;
  spesialisasi?: string | null;
  telepon?: string | null;
  alamat?: string | null;
}

/**
 * Update User Data
 */
export interface UpdateUserData {
  email?: string;
  password?: string;
  nama_lengkap?: string;
  role?: UserRole;
  jabatan?: string | null;
  nomor_kta?: string | null;
  nomor_berita_acara?: string | null;
  spesialisasi?: string | null;
  avatar_url?: string | null;
  telepon?: string | null;
  alamat?: string | null;
  is_active?: boolean;
}
