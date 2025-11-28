// ============================================================================
// FILE: server/src/common/interfaces/entities/catatan.entity.ts (FIXED)
// ============================================================================

import { Prisma } from '@prisma/client';
import { BaseEntity } from './base.entity';
import { UserBasic } from './user.entity';

/**
 * Catatan Perkara Entity - Complete data
 */
export interface CatatanPerkaraEntity extends BaseEntity {
  perkara_id: string;
  user_id: string | null;
  catatan: string;
  dapat_ditagih: boolean;
  jam_kerja: Prisma.Decimal | null;
}

/**
 * Catatan with Relations
 */
export interface CatatanWithRelations extends BaseEntity {
  perkara_id: string;
  user_id: string | null;
  catatan: string;
  dapat_ditagih: boolean;
  jam_kerja: Prisma.Decimal | null;
  perkara: {
    id: string;
    nomor_perkara: string;
    judul: string;
  };
  user: UserBasic | null;
}

/**
 * Create Catatan Data
 */
export interface CreateCatatanData {
  perkara_id: string;
  user_id: string;
  catatan: string;
  dapat_ditagih?: boolean;
  jam_kerja?: number | null;
}

/**
 * Update Catatan Data
 */
export interface UpdateCatatanData {
  catatan?: string;
  dapat_ditagih?: boolean;
  jam_kerja?: number | null;
}
