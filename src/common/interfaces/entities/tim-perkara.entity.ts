// ============================================================================
// FILE: src/common/interfaces/entities/tim-perkara.entity.ts (FIXED)
// ============================================================================

import { StatusPerkara } from '@prisma/client';
import { KlienBasic } from './klien.entity';
import { UserPublic } from './user.entity';

/**
 * Tim Perkara Entity - Complete data
 */
export interface TimPerkaraEntity {
  id: string;
  perkara_id: string;
  user_id: string;
  peran: string | null;
  tanggal_ditugaskan: Date;
}

/**
 * Tim Perkara with Relations
 */
export interface TimPerkaraWithRelations extends TimPerkaraEntity {
  perkara: {
    id: string;
    nomor_perkara: string;
    judul: string;
    status: StatusPerkara;
    klien: KlienBasic | null;
  };
  user: UserPublic;
}

/**
 * Create Tim Perkara Data
 */
export interface CreateTimPerkaraData {
  perkara_id: string;
  user_id: string;
  peran?: string | null;
}
